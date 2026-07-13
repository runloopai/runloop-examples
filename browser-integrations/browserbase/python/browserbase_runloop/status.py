"""Lightweight progress output for CLI runs.

Writes timestamped phase lines to stderr so they show live while a command runs,
keeping stdout reserved for the final structured result.
"""

import sys
import time

_START = time.monotonic()


def status(message: str) -> None:
    """Print one timestamped progress line to stderr."""
    elapsed = time.monotonic() - _START
    print(f"  [{elapsed:5.1f}s] {message}", file=sys.stderr, flush=True)
