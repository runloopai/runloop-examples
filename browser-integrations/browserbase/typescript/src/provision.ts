/**
 * Provision a devbox with a bounded wait, failing fast on a stuck provision.
 *
 * The OO `devbox.create` waits for the devbox to reach `running` with an
 * effectively unbounded default, so a stuck provision hangs for many minutes
 * with no feedback. `provisionDevbox` bounds that wait: on timeout, or if the
 * devbox enters a terminal non-running state, it shuts the devbox down and
 * throws, so a bad provision is loud and immediate instead of silent, and never
 * leaks a half-provisioned (billable) devbox.
 */

import type { Devbox, Runloop, RunloopSDK } from "@runloop/api-client";

/** How long to wait for a devbox to reach `running` before giving up. */
const PROVISION_TIMEOUT_MS = 120_000;

/** Append a random numeric slug so repeated runs do not stack identical devbox names. */
export function uniqueName(base: string): string {
  return `${base}-${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;
}

/**
 * Create a devbox and wait until it is running, or fail fast and clean up.
 *
 * @param sdk - The Runloop SDK instance.
 * @param params - Devbox create parameters (name, launch_parameters, blueprint_name, ...).
 * @returns A {@link Devbox} bound to the running devbox.
 */
export async function provisionDevbox(
  sdk: RunloopSDK,
  params: Runloop.DevboxCreateParams,
): Promise<Devbox> {
  const view = await sdk.api.devboxes.create(params); // returns immediately, still provisioning
  try {
    await sdk.api.devboxes.awaitRunning(view.id, { longPoll: { timeoutMs: PROVISION_TIMEOUT_MS } });
  } catch (err) {
    // Don't leave a half-provisioned, billable devbox stuck; shut it down.
    await sdk.api.devboxes.shutdown(view.id).catch(() => {});
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `devbox ${view.id} did not reach running within ${PROVISION_TIMEOUT_MS / 1000}s ` +
        `(${detail}); it was shut down`,
    );
  }
  return sdk.devbox.fromId(view.id);
}
