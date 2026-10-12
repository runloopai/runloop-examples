/**
 * Test a web app served from a Runloop devbox with a Notte cloud browser.
 *
 * Provisions a devbox (from the pre-built blueprint, or with a runtime install
 * when `manual` is set), serves a small to-do app on a public tunnel, uploads
 * the test agent, and runs it. The agent drives a Notte cloud browser with
 * Playwright over CDP and with the Notte CLI. The report and screenshot are
 * downloaded, and the devbox is always torn down in a `finally` block.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { type Devbox, RunloopSDK } from "@runloop/api-client";
import type { Runloop } from "@runloop/api-client";

import {
  AGENT_REMOTE_PATH,
  AGENT_SCRIPT,
  APP_DIR,
  APP_HTML,
  APP_PORT,
  BLUEPRINT_NAME,
  RESULT_DIR,
  SHOTS_DIR,
  SYSTEM_SETUP_COMMANDS,
} from "./config.js";
import { provisionDevbox, uniqueName } from "./provision.js";
import { status } from "./status.js";

/**
 * The agent can run longer than the SDK's default long-poll window, so widen it.
 * In the Python half this is a `PollingConfig(timeout_seconds=600)`; the TS SDK
 * expresses the same idea as `longPoll.timeoutMs`.
 */
const AGENT_TIMEOUT_MS = 600_000;

/** Resource size accepted by the Runloop API (`launch_parameters.resource_size_request`). */
type ResourceSize = NonNullable<Runloop.LaunchParameters["resource_size_request"]>;

/** Options for {@link runNotte}. */
export interface RunNotteOptions {
  /** Install Notte at runtime instead of using the blueprint. */
  manual?: boolean;
  /** Devbox resource size. */
  size?: ResourceSize;
  /** Snapshot the devbox disk on success. */
  snapshot?: boolean;
  /** Where report.json and screenshots/ are written locally. */
  outputDir?: string;
}

/** Result of a test run. */
export interface RunNotteResult {
  devboxId: string;
  appUrl: string;
  todoAdded: boolean;
  viewerUrl: string | null;
  reportPath: string;
  screenshotPath: string;
}

/** Shape of the report the in-devbox agent writes to report.json. */
interface TestReport {
  screenshot: string;
  todo_added: boolean;
  viewer_url?: string | null;
}

/**
 * Provision a devbox, serve the app, test it with a Notte browser, and return
 * results. The devbox is torn down (shutdown) regardless of success or failure.
 *
 * @param options - Run options; see {@link RunNotteOptions}.
 * @param runloop - Optional pre-configured SDK instance (mainly for testing).
 */
export async function runNotte(
  options: RunNotteOptions = {},
  runloop?: RunloopSDK,
): Promise<RunNotteResult> {
  const { manual = false, size = "SMALL", snapshot = false, outputDir = "." } = options;

  const sdk = runloop ?? new RunloopSDK();

  const apiKey = process.env.NOTTE_API_KEY;
  if (!apiKey) {
    throw new Error("NOTTE_API_KEY is not set");
  }

  const environment_variables = { NOTTE_API_KEY: apiKey };
  const launch_parameters = { resource_size_request: size };

  // Provision from the blueprint by name, or a default devbox for the manual path.
  status(
    manual
      ? "Provisioning devbox (Notte installed at runtime)"
      : `Provisioning devbox from blueprint '${BLUEPRINT_NAME}'`,
  );
  const devboxName = uniqueName("notte-browser-test");
  const devbox: Devbox = manual
    ? await provisionDevbox(sdk, {
        name: devboxName,
        environment_variables,
        launch_parameters,
      })
    : await provisionDevbox(sdk, {
        name: devboxName,
        blueprint_name: BLUEPRINT_NAME,
        environment_variables,
        launch_parameters,
      });

  try {
    if (manual) {
      status("Installing the Notte SDK, CLI and skills in the devbox");
      for (const command of SYSTEM_SETUP_COMMANDS) {
        const install = await devbox.cmd.exec(command);
        if (!install.success) {
          const stderr = await install.stderr();
          throw new Error(`\`${command}\` failed: ${stderr.slice(-300)}`);
        }
      }
    }

    // Serve the app on a public tunnel. An open tunnel needs no auth header,
    // so the Notte browser can load it like any other website.
    status(`Devbox ${devbox.id} ready; serving the app on port ${APP_PORT}`);
    await devbox.file.write({ file_path: `${APP_DIR}/index.html`, contents: APP_HTML });
    await devbox.cmd.execAsync(
      `cd ${APP_DIR} && python3 -m http.server ${APP_PORT} --bind 0.0.0.0 > /tmp/app.log 2>&1`,
    );
    await devbox.net.enableTunnel({ auth_mode: "open" });
    const appUrl = await devbox.getTunnelUrl(APP_PORT);
    status(`App is live at ${appUrl}`);

    // Upload the agent and run it. Results come back as files (not stdout), so
    // there is no fragile stdout-parsing protocol.
    await devbox.file.write({ file_path: AGENT_REMOTE_PATH, contents: AGENT_SCRIPT });
    status("Testing the app in the devbox; the browser runs on Notte");
    const result = await devbox.cmd.exec(
      `APP_URL=${appUrl} PATH=$HOME/.local/bin:$PATH python3 ${AGENT_REMOTE_PATH}`,
      undefined,
      { longPoll: { timeoutMs: AGENT_TIMEOUT_MS } },
    );
    if (!result.success) {
      const stderr = await result.stderr();
      throw new Error(`agent failed (exit ${result.exitCode}): ${stderr.slice(-300)}`);
    }

    const report = JSON.parse(
      await devbox.file.read({ file_path: `${RESULT_DIR}/report.json` }),
    ) as TestReport;

    // Pull the screenshot back as a binary file (not base64-through-text).
    const shotsDir = path.join(outputDir, "screenshots");
    await mkdir(shotsDir, { recursive: true });
    const screenshotPath = path.join(shotsDir, report.screenshot);
    const response = await devbox.file.download({ path: `${SHOTS_DIR}/${report.screenshot}` });
    await writeFile(screenshotPath, Buffer.from(await response.arrayBuffer()));
    status("Downloaded report.json and the screenshot");

    const reportPath = path.join(outputDir, "report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    if (snapshot) {
      status("Snapshotting devbox disk");
      await devbox.snapshotDisk({ name: `notte-browser-test-${devbox.id}` });
    }

    status("Tearing down devbox");
    return {
      devboxId: devbox.id,
      appUrl,
      todoAdded: report.todo_added,
      viewerUrl: report.viewer_url ?? null,
      reportPath,
      screenshotPath,
    };
  } finally {
    // The TS SDK has no context-manager teardown, so shut the devbox down
    // explicitly. Swallow teardown errors so they never mask a real failure.
    await devbox.shutdown().catch(() => {});
  }
}
