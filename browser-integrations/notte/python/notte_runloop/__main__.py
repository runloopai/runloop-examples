"""Command-line entry point.

notte-runloop create-blueprint [--rebuild]   reuse or build the Notte blueprint
notte-runloop run [--manual] [--snapshot]    serve the app and test it with Notte
"""

import sys

from .create_blueprint import create_notte_blueprint
from .run_notte import RunNotteOptions, run_notte

USAGE = "Usage: notte-runloop {create-blueprint [--rebuild] | run [--manual] [--snapshot]}"


def main() -> None:
    args = sys.argv[1:]
    command = args[0] if args else ""
    flags = args[1:]

    if command == "create-blueprint":
        blueprint_id = create_notte_blueprint(rebuild="--rebuild" in flags)
        print(f"Blueprint ready: {blueprint_id}")
    elif command == "run":
        result = run_notte(
            RunNotteOptions(manual="--manual" in flags, snapshot="--snapshot" in flags)
        )
        print(f"Devbox {result.devbox_id} served {result.app_url}")
        print(f"To-do added through the Notte CLI: {result.todo_added}")
        print(f"Report: {result.report_path}")
        print(f"Screenshot: {result.screenshot_path}")
        if result.viewer_url:
            print(f"Live view: {result.viewer_url}")
    else:
        print(USAGE, file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
