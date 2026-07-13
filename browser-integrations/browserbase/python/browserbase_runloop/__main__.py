"""Command-line entry point.

    browserbase-runloop create-blueprint [--rebuild]   reuse or build the Browserbase blueprint
    browserbase-runloop run [--manual] [--snapshot]    run the research crawl
"""

import sys

from .create_blueprint import create_browserbase_blueprint
from .run_browserbase import RunBrowserbaseOptions, run_browserbase

USAGE = "Usage: browserbase-runloop {create-blueprint [--rebuild] | run [--manual] [--snapshot]}"


def main() -> None:
    args = sys.argv[1:]
    command = args[0] if args else ""
    flags = args[1:]

    if command == "create-blueprint":
        blueprint_id = create_browserbase_blueprint(rebuild="--rebuild" in flags)
        print(f"Blueprint ready: {blueprint_id}")
    elif command == "run":
        result = run_browserbase(
            RunBrowserbaseOptions(manual="--manual" in flags, snapshot="--snapshot" in flags)
        )
        print(f"Devbox {result.devbox_id} crawled {result.pages_visited} pages")
        print(f"Report: {result.report_path}")
        if result.live_view_url:
            print(f"Live view: {result.live_view_url}")
    else:
        print(USAGE, file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
