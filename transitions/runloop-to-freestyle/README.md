# Runloop to Freestyle transition probe

This starter uses the Runloop and Freestyle JavaScript SDKs to compare isolated devboxes and VMs. It records JSON evidence and attempts cleanup even after errors. It does not migrate an existing customer environment or establish complete production equivalence.

## Run

Use Node.js 22 or later and isolated projects. Set `RUNLOOP_API_KEY` and `FREESTYLE_API_KEY` in your shell. The script creates billable resources; never commit credentials or raw results.

```sh
npm ci
npm run probe -- --output transition-results_private.json
npm run probe -- --extended --output transition-results_private.json
```

The default probe checks successful and nonzero command exits, stdout/stderr, and a UTF-8 file round trip. Extended mode adds binary and 1 MiB fixtures, modes and symlinks, application-file transfer in both directions, outbound firewall denial and allowance, suspend/pause and resume, native snapshots and restoration, and Freestyle process survival across pause and snapshot restore.

Freestyle VMs boot from `freestyle/ubuntu-sm` with no outbound allow rules initially. The extended probe adds HTTPS and DNS rules for its own VM. VMs and Freestyle snapshots have a one-hour deletion deadline as a fallback, and the script attempts explicit cleanup of every resource it created, including the Runloop snapshot. It never deletes pre-existing resources.

Exit `0` means all assertions and cleanup passed, `1` means a mismatch or cleanup failure, and `2` means an API/setup error. Inspect `errors`, `resources`, and `cleanup` even after a failed run. The report preserves stage and error type without printing SDK exception bodies, which can contain request credentials. Failed cleanup requires manual removal using the recorded IDs. The output file is created with mode `0600`; do not reuse an existing world-readable output file.

## Scope and next steps

The [Freestyle transition guide](https://docs.runloop.ai/docs/transitions/runloop-to-freestyle) maps devboxes, Axons, blueprints, snapshots, and evaluations. The [validation plan](https://docs.runloop.ai/docs/transitions/runloop-to-freestyle-validation) covers workload-specific session behavior, inbound authentication, timeouts, environment rebuilding, external databases, event recovery, and evaluation scoring. Those checks need the customer's own application and acceptance criteria.

Native snapshot comparisons do not demonstrate cross-provider snapshot import. The file-transfer probe copies one UTF-8 application file through authenticated SDK calls; larger datasets, modes, ownership, and database consistency need a migration tool designed for that workload.

## Recorded live evidence

On October 11, 2026 (PT), the extended probe passed **17/17 assertions** with `@runloop/api-client` 2.0.0 and `freestyle` 0.2.17. All nine VM, snapshot, and firewall/DNS cleanup actions succeeded. [validation-summary.json](validation-summary.json) contains the sanitized case results and timestamps; raw resource IDs and fixture output remain private.
