/**
 * Run the Kernel research agent inside a Runloop devbox.
 *
 * Provisions a devbox (from the pre-built blueprint, or with a runtime install
 * when `manual` is set), uploads the crawl agent, drives a Kernel cloud browser
 * via Playwright Execute, downloads the report and per-seed screenshots, and
 * returns a typed result. The devbox is always torn down in a `finally` block.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { type Devbox, RunloopSDK } from "@runloop/api-client";
import type { Runloop } from "@runloop/api-client";

import {
  AGENT_REMOTE_PATH,
  AGENT_SCRIPT,
  BLUEPRINT_NAME,
  DEFAULT_DEPTH,
  DEFAULT_LINKS_PER_SEED,
  DEFAULT_TARGETS,
  RESULT_DIR,
  SHOTS_DIR,
  type Target,
} from "./config.js";
import { provisionDevbox, uniqueName } from "./provision.js";
import { status } from "./status.js";

/**
 * The crawl runs longer than the SDK's default long-poll window, so widen it.
 * In the Python half this is a `PollingConfig(timeout_seconds=600)`; the TS SDK
 * expresses the same idea as `longPoll.timeoutMs`.
 */
const CRAWL_TIMEOUT_MS = 600_000;

/** Resource size accepted by the Runloop API (`launch_parameters.resource_size_request`). */
type ResourceSize = NonNullable<Runloop.LaunchParameters["resource_size_request"]>;

/** Options for {@link runKernel}. */
export interface RunKernelOptions {
  /** Install the Kernel SDK at runtime instead of using the blueprint. */
  manual?: boolean;
  /** Sites to crawl. Defaults to {@link DEFAULT_TARGETS}. */
  targets?: Target[];
  /** Level-1 internal links followed per seed. */
  linksPerSeed?: number;
  /** Crawl depth, 1 or 2. */
  depth?: number;
  /** Devbox resource size. */
  size?: ResourceSize;
  /** Snapshot the devbox disk on success. */
  snapshot?: boolean;
  /** Where report.json and screenshots/ are written locally. */
  outputDir?: string;
}

/** Result of a crawl run. */
export interface RunKernelResult {
  devboxId: string;
  pagesVisited: number;
  liveViewUrl: string | null;
  reportPath: string;
  screenshotsDir: string;
}

/** Shape of the compact summary the in-devbox agent writes to summary.json. */
interface CrawlSummary {
  pages_visited: number;
  live_view_url: string | null;
  sites: Array<{ screenshot: string | null }>;
}

/**
 * Provision a devbox, run the crawl agent against a Kernel browser, and return
 * results. The devbox is torn down (shutdown) regardless of success or failure.
 *
 * @param options - Crawl options; see {@link RunKernelOptions}.
 * @param runloop - Optional pre-configured SDK instance (mainly for testing).
 */
export async function runKernel(
  options: RunKernelOptions = {},
  runloop?: RunloopSDK,
): Promise<RunKernelResult> {
  const {
    manual = false,
    targets = DEFAULT_TARGETS,
    linksPerSeed = DEFAULT_LINKS_PER_SEED,
    depth = DEFAULT_DEPTH,
    size = "SMALL",
    snapshot = false,
    outputDir = ".",
  } = options;

  const sdk = runloop ?? new RunloopSDK();

  const apiKey = process.env.KERNEL_API_KEY;
  if (!apiKey) {
    throw new Error("KERNEL_API_KEY is not set");
  }

  const environment_variables = {
    KERNEL_API_KEY: apiKey,
    TARGETS: JSON.stringify(targets),
    LINKS_PER_SEED: String(linksPerSeed),
    DEPTH: String(depth),
  };
  const launch_parameters = { resource_size_request: size };

  // Provision from the blueprint by name, or a default devbox for the manual path.
  status(
    manual
      ? "Provisioning devbox (Kernel SDK installed at runtime)"
      : `Provisioning devbox from blueprint '${BLUEPRINT_NAME}'`,
  );
  const devboxName = uniqueName("kernel-research");
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
      status("Installing Kernel SDK in the devbox");
      const install = await devbox.cmd.exec("python3 -m pip install --user --quiet kernel");
      if (!install.success) {
        const stderr = await install.stderr();
        throw new Error(`kernel install failed: ${stderr.slice(-300)}`);
      }
    }

    // Upload the agent and run it. Results come back as files (not stdout), so
    // there is no fragile stdout-parsing protocol.
    status(`Devbox ${devbox.id} ready; uploading the crawl agent`);
    await devbox.file.write({ file_path: AGENT_REMOTE_PATH, contents: AGENT_SCRIPT });
    status("Crawling in the devbox (typically 2-3 min); browser runs on Kernel");
    const result = await devbox.cmd.exec(`python3 ${AGENT_REMOTE_PATH}`, undefined, {
      longPoll: { timeoutMs: CRAWL_TIMEOUT_MS },
    });
    if (!result.success) {
      const stderr = await result.stderr();
      throw new Error(`agent failed (exit ${result.exitCode}): ${stderr.slice(-300)}`);
    }

    const summary = JSON.parse(
      await devbox.file.read({ file_path: `${RESULT_DIR}/summary.json` }),
    ) as CrawlSummary;
    const report = JSON.parse(
      await devbox.file.read({ file_path: `${RESULT_DIR}/report.json` }),
    ) as unknown;

    // Pull screenshots back as binary files (not base64-through-text).
    const shotsDir = path.join(outputDir, "screenshots");
    await mkdir(shotsDir, { recursive: true });
    let shotCount = 0;
    for (const site of summary.sites) {
      const shot = site.screenshot;
      if (!shot) {
        continue;
      }
      const response = await devbox.file.download({ path: `${SHOTS_DIR}/${shot}` });
      const data = Buffer.from(await response.arrayBuffer());
      await writeFile(path.join(shotsDir, shot), data);
      shotCount += 1;
    }
    status(`Downloaded report.json and ${shotCount} screenshots`);

    const reportPath = path.join(outputDir, "report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    if (snapshot) {
      status("Snapshotting devbox disk");
      await devbox.snapshotDisk({ name: `kernel-research-${devbox.id}` });
    }

    status("Tearing down devbox");
    return {
      devboxId: devbox.id,
      pagesVisited: summary.pages_visited,
      liveViewUrl: summary.live_view_url,
      reportPath,
      screenshotsDir: shotsDir,
    };
  } finally {
    // The TS SDK has no context-manager teardown, so shut the devbox down
    // explicitly. Swallow teardown errors so they never mask a real failure.
    await devbox.shutdown().catch(() => {});
  }
}
