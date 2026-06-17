/**
 * Kernel on Runloop: drive Kernel cloud browsers from Runloop devboxes.
 *
 * Public API re-exports plus a small CLI:
 *
 *     kernel-runloop create-blueprint [--rebuild]   reuse or build the Kernel blueprint
 *     kernel-runloop run [--manual] [--snapshot]    run the research crawl
 */

import { createKernelBlueprint } from "./create-blueprint.js";
import { type RunKernelOptions, type RunKernelResult, runKernel } from "./run-kernel.js";

export { BLUEPRINT_NAME, DEFAULT_TARGETS } from "./config.js";
export type { Target } from "./config.js";
export { createKernelBlueprint } from "./create-blueprint.js";
export { runKernel } from "./run-kernel.js";
export type { RunKernelOptions, RunKernelResult } from "./run-kernel.js";

const USAGE = "Usage: kernel-runloop {create-blueprint [--rebuild] | run [--manual] [--snapshot]}";

/** CLI entry point. Dispatches on the first positional argument. */
export async function main(): Promise<void> {
  const command = process.argv[2];
  const flags = process.argv.slice(3);

  switch (command) {
    case "create-blueprint": {
      const blueprintId = await createKernelBlueprint(undefined, {
        rebuild: flags.includes("--rebuild"),
      });
      console.log(`Blueprint ready: ${blueprintId}`);
      break;
    }
    case "run": {
      const options: RunKernelOptions = {
        manual: flags.includes("--manual"),
        snapshot: flags.includes("--snapshot"),
      };
      const result: RunKernelResult = await runKernel(options);
      console.log(`Devbox ${result.devboxId} crawled ${result.pagesVisited} pages`);
      console.log(`Report: ${result.reportPath}`);
      if (result.liveViewUrl) {
        console.log(`Live view: ${result.liveViewUrl}`);
      }
      break;
    }
    default:
      console.log(USAGE);
  }
}

// Self-run guard: only execute the CLI when this module is the entry point.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
