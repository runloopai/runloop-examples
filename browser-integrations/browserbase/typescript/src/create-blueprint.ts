/**
 * Create (or reuse) the Browserbase blueprint.
 *
 * A blueprint bakes the Browserbase SDK and the Playwright client into a devbox
 * image so that devboxes created from it start ready, with no per-run install.
 * A build usually takes about a minute but a cold build can run longer, so this
 * is a one-time step. By default it reuses the newest already-built
 * `browserbase-browser` blueprint; if one is still building (an earlier run that
 * has not finished), it waits for that build instead of starting a duplicate; and
 * it only builds fresh when none exists. Both the create and the wait use a
 * generous polling window so a slow first build does not raise a polling timeout
 * while it is still making progress. `run` then creates devboxes from the
 * blueprint by name.
 */

import { RunloopSDK } from "@runloop/api-client";

import { BLUEPRINT_NAME, SYSTEM_SETUP_COMMANDS } from "./config.js";
import { status } from "./status.js";

/** Options for {@link createBrowserbaseBlueprint}. */
export interface CreateBlueprintOptions {
  /** Force a fresh build even when a built blueprint already exists. */
  rebuild?: boolean;
}

// Blueprint builds are usually under a minute, but a cold build can take several.
// Wait generously rather than failing on the SDK default polling window, which is
// what made a first-run `create-blueprint` error while the build was still going.
const BUILD_TIMEOUT_MS = 900_000;

// Statuses that mean a build is in progress (not yet usable, and not failed).
const IN_PROGRESS = ["queued", "provisioning", "building"];

/**
 * Return the newest blueprint with our name as `{ id, state }`, or null.
 * Prefers a finished (`build_complete`) blueprint; otherwise returns the newest
 * one still in progress so the caller can wait for it instead of rebuilding.
 */
async function newestBlueprint(
  sdk: RunloopSDK,
): Promise<{ id: string; state: "build_complete" | "building" } | null> {
  let built: { ts: number; id: string } | null = null;
  let pending: { ts: number; id: string } | null = null;
  for (const blueprint of await sdk.blueprint.list({ name: BLUEPRINT_NAME })) {
    const info = await blueprint.getInfo();
    const ts = info.create_time_ms;
    if (info.status === "build_complete") {
      if (built === null || ts > built.ts) built = { ts, id: blueprint.id };
    } else if (IN_PROGRESS.includes(info.status)) {
      if (pending === null || ts > pending.ts) pending = { ts, id: blueprint.id };
    }
  }
  if (built !== null) return { id: built.id, state: "build_complete" };
  if (pending !== null) return { id: pending.id, state: "building" };
  return null;
}

/**
 * Return a built Browserbase blueprint id, reusing an existing one unless
 * `options.rebuild` is set.
 *
 * Pass `{ rebuild: true }` (CLI: `create-blueprint --rebuild`) to force a fresh
 * build, e.g. after changing {@link SYSTEM_SETUP_COMMANDS}.
 *
 * @param runloop - Optional pre-configured SDK instance (mainly for testing).
 * @param options - See {@link CreateBlueprintOptions}.
 * @returns The id of a built blueprint.
 */
export async function createBrowserbaseBlueprint(
  runloop?: RunloopSDK,
  options: CreateBlueprintOptions = {},
): Promise<string> {
  const sdk = runloop ?? new RunloopSDK();

  if (!options.rebuild) {
    const existing = await newestBlueprint(sdk);
    if (existing !== null) {
      if (existing.state === "build_complete") {
        status(`Reusing blueprint ${existing.id} (--rebuild to force a fresh build)`);
        return existing.id;
      }
      // An earlier run is still building this blueprint. Wait for that build
      // rather than starting a duplicate or failing the command.
      status(`Blueprint ${existing.id} is still building; waiting for it to finish`);
      await sdk.api.blueprints.awaitBuildComplete(existing.id, {
        longPoll: { timeoutMs: BUILD_TIMEOUT_MS },
      });
      status("Blueprint build complete");
      return existing.id;
    }
  }

  status(`Building blueprint '${BLUEPRINT_NAME}' (this blocks until the image is built)`);
  const blueprint = await sdk.blueprint.create(
    {
      name: BLUEPRINT_NAME,
      system_setup_commands: SYSTEM_SETUP_COMMANDS,
    },
    { longPoll: { timeoutMs: BUILD_TIMEOUT_MS } },
  );
  status("Blueprint build complete");
  return blueprint.id;
}
