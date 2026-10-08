# Runloop to Modal transition probe

This starter compares command execution and UTF-8 file transfer through the Runloop and Modal Python SDKs. It creates one temporary devbox and one Modal Sandbox, writes a unique file to each, records JSON results, and attempts to shut both down. It does **not** migrate data or establish production equivalence.

## Run

Use isolated projects. The probe creates billable resources. Set `RUNLOOP_API_KEY` in your shell and [authenticate the Modal CLI](https://modal.com/docs/guide) before running. Do not commit credentials or test output.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python compare_core_public.py --output transition-results_private.json
```

The script creates or reuses a Modal App named `runloop-transition-validation`. It terminates the Sandbox and shuts down the devbox in a `finally` block; the App itself remains. The command exits `0` when comparisons and cleanup succeed, `1` for a mismatch or cleanup failure, and `2` if the probe cannot complete. Inspect the JSON before drawing conclusions.

## Scope and next steps

The fixtures cover a successful command's exit code, stdout and stderr, and one UTF-8 text file round trip. Extend the probe with nonzero exits, binary and large files, permissions, runtime type, networking, lifetime and idle termination, and snapshot recovery before treating it as migration evidence.

The [Modal validation plan](https://docs.runloop.ai/docs/transitions/runloop-to-modal-validation) specifies those checks, plus Axon and evaluation cases. Axon and evaluation comparisons need the customer's chosen target journal or harness; there is no universal SDK substitution.

