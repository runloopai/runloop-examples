/**
 * Notte on Runloop: test a web app served from a Runloop devbox with a Notte cloud browser.
 *
 * Public API re-exports plus a small CLI:
 *
 *     notte-runloop create-blueprint [--rebuild]   reuse or build the Notte blueprint
 *     notte-runloop run [--manual] [--snapshot]    serve the app and test it with Notte
 */

import { createNotteBlueprint } from "./create-blueprint.js";
import { type RunNotteOptions, type RunNotteResult, runNotte } from "./run-notte.js";

export { BLUEPRINT_NAME } from "./config.js";
export { createNotteBlueprint } from "./create-blueprint.js";
export { runNotte } from "./run-notte.js";
export type { RunNotteOptions, RunNotteResult } from "./run-notte.js";

const USAGE = "Usage: notte-runloop {create-blueprint [--rebuild] | run [--manual] [--snapshot]}";

/** CLI entry point. Dispatches on the first positional argument. */
export async function main(): Promise<void> {
  const command = process.argv[2];
  const flags = process.argv.slice(3);

  switch (command) {
    case "create-blueprint": {
      const blueprintId = await createNotteBlueprint(undefined, {
        rebuild: flags.includes("--rebuild"),
      });
      console.log(`Blueprint ready: ${blueprintId}`);
      break;
    }
    case "run": {
      const options: RunNotteOptions = {
        manual: flags.includes("--manual"),
        snapshot: flags.includes("--snapshot"),
      };
      const result: RunNotteResult = await runNotte(options);
      console.log(`Devbox ${result.devboxId} served ${result.appUrl}`);
      console.log(`To-do added through the Notte CLI: ${result.todoAdded}`);
      console.log(`Report: ${result.reportPath}`);
      console.log(`Screenshot: ${result.screenshotPath}`);
      if (result.viewerUrl) {
        console.log(`Live view: ${result.viewerUrl}`);
      }
      break;
    }
    default:
      console.error(USAGE);
      process.exitCode = 1;
  }
}

// Self-run guard: only execute the CLI when this module is the entry point.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
