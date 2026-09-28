/**
 * Browserbase on Runloop: drive Browserbase cloud browsers from Runloop devboxes.
 *
 * Public API re-exports plus a small CLI:
 *
 *     browserbase-runloop create-blueprint [--rebuild]   reuse or build the Browserbase blueprint
 *     browserbase-runloop run [--manual] [--snapshot]    run the research crawl
 */

import { createBrowserbaseBlueprint } from "./create-blueprint.js";
import {
  type RunBrowserbaseOptions,
  type RunBrowserbaseResult,
  runBrowserbase,
} from "./run-browserbase.js";

export { BLUEPRINT_NAME, DEFAULT_TARGETS } from "./config.js";
export type { Target } from "./config.js";
export { createBrowserbaseBlueprint } from "./create-blueprint.js";
export { runBrowserbase } from "./run-browserbase.js";
export type { RunBrowserbaseOptions, RunBrowserbaseResult } from "./run-browserbase.js";

const USAGE =
  "Usage: browserbase-runloop {create-blueprint [--rebuild] | run [--manual] [--snapshot]}";

/** CLI entry point. Dispatches on the first positional argument. */
export async function main(): Promise<void> {
  const command = process.argv[2];
  const flags = process.argv.slice(3);

  switch (command) {
    case "create-blueprint": {
      const blueprintId = await createBrowserbaseBlueprint(undefined, {
        rebuild: flags.includes("--rebuild"),
      });
      console.log(`Blueprint ready: ${blueprintId}`);
      break;
    }
    case "run": {
      const options: RunBrowserbaseOptions = {
        manual: flags.includes("--manual"),
        snapshot: flags.includes("--snapshot"),
      };
      const result: RunBrowserbaseResult = await runBrowserbase(options);
      console.log(`Devbox ${result.devboxId} crawled ${result.pagesVisited} pages`);
      console.log(`Report: ${result.reportPath}`);
      if (result.liveViewUrl) {
        console.log(`Live view: ${result.liveViewUrl}`);
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
