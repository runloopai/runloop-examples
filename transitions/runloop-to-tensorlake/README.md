# Runloop to Tensorlake transition probes

This starter compares basic command execution and UTF-8 file transfer through the two Python SDKs. It creates one temporary devbox and one named sandbox, writes a unique file in each, records results as JSON, and attempts to shut both down. It does **not** migrate data or establish production equivalence.

## Run

Use an isolated project on each provider. The probe creates billable resources. Set `RUNLOOP_API_KEY` and `TENSORLAKE_API_KEY` in your shell; do not add them to files or command arguments.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python compare_core_public.py --output transition-results_private.json
```

The command exits `0` when all comparisons and cleanup succeed, `1` on a mismatch or cleanup failure, and `2` when it cannot complete the probe. Inspect the JSON before drawing conclusions. The result contains SDK versions and probe values, but not credentials. Do not commit result files if your fixture data is sensitive.

## Scope and next steps

The matching command outputs and file contents are intentionally small, deterministic fixtures. They only test the specified calls at the time of the run. Add fixtures for nonzero exit, binary files, permissions, and large transfers before using these checks for acceptance.

The [validation plan](https://docs.runloop.ai/docs/transitions/runloop-to-tensorlake-validation) proposes further comparisons for named shells, processes, network policy, images, suspend/resume, checkpoints, Axons, and evaluations. Those scripts are not supplied here. Axon and evaluation checks need the customer's chosen target journal or harness; they cannot be implemented as a universal SDK substitution.

