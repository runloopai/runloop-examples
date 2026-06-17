/**
 * Create (or reuse) the Kernel blueprint.
 *
 * A blueprint bakes the Kernel SDK into a devbox image so that devboxes created
 * from it start ready, with no per-run install. Building one takes ~40s, so this
 * is a one-time step: by default it reuses the newest already-built
 * `kernel-browser` blueprint and only builds when none exists. `run` then creates
 * devboxes from the blueprint by name.
 */

import { RunloopSDK } from "@runloop/api-client";

import { BLUEPRINT_NAME, SYSTEM_SETUP_COMMANDS } from "./config.js";
import { status } from "./status.js";

/** Options for {@link createKernelBlueprint}. */
export interface CreateBlueprintOptions {
  /** Force a fresh build even when a built blueprint already exists. */
  rebuild?: boolean;
}

/** Return the id of the newest built blueprint with our name, or null. */
async function existingBuiltBlueprint(sdk: RunloopSDK): Promise<string | null> {
  let best: { ts: number; id: string } | null = null;
  for (const blueprint of await sdk.blueprint.list({ name: BLUEPRINT_NAME })) {
    const info = await blueprint.getInfo();
    if (info.status === "build_complete" && (best === null || info.create_time_ms > best.ts)) {
      best = { ts: info.create_time_ms, id: blueprint.id };
    }
  }
  return best?.id ?? null;
}

/**
 * Return a built Kernel blueprint id, reusing an existing one unless
 * `options.rebuild` is set.
 *
 * Pass `{ rebuild: true }` (CLI: `create-blueprint --rebuild`) to force a fresh
 * build, e.g. after changing {@link SYSTEM_SETUP_COMMANDS}.
 *
 * @param runloop - Optional pre-configured SDK instance (mainly for testing).
 * @param options - See {@link CreateBlueprintOptions}.
 * @returns The id of a built blueprint.
 */
export async function createKernelBlueprint(
  runloop?: RunloopSDK,
  options: CreateBlueprintOptions = {},
): Promise<string> {
  const sdk = runloop ?? new RunloopSDK();

  if (!options.rebuild) {
    const existing = await existingBuiltBlueprint(sdk);
    if (existing !== null) {
      status(`Reusing built blueprint ${existing} (skipping ~40s build; --rebuild to force)`);
      return existing;
    }
  }

  status(`Building blueprint '${BLUEPRINT_NAME}' (this blocks until the image is built)`);
  const blueprint = await sdk.blueprint.create({
    name: BLUEPRINT_NAME,
    system_setup_commands: SYSTEM_SETUP_COMMANDS,
  });
  status("Blueprint build complete");
  return blueprint.id;
}
