/**
 * Lightweight progress output for CLI runs.
 *
 * Writes timestamped phase lines to stderr so they show live while a command
 * runs, keeping stdout reserved for the final structured result.
 */

const START = Date.now();

/** Print one timestamped progress line to stderr. */
export function status(message: string): void {
  const elapsed = ((Date.now() - START) / 1000).toFixed(1).padStart(5);
  process.stderr.write(`  [${elapsed}s] ${message}\n`);
}
