"""Command-line entry point.

    kernel-runloop create-blueprint [--rebuild]   reuse or build the Kernel blueprint
    kernel-runloop run [--manual] [--snapshot]    run the research crawl
"""

import sys

from .create_blueprint import create_kernel_blueprint
from .run_kernel import RunKernelOptions, run_kernel

USAGE = "Usage: kernel-runloop {create-blueprint [--rebuild] | run [--manual] [--snapshot]}"


def main() -> None:
    args = sys.argv[1:]
    command = args[0] if args else ""
    flags = args[1:]

    if command == "create-blueprint":
        blueprint_id = create_kernel_blueprint(rebuild="--rebuild" in flags)
        print(f"Blueprint ready: {blueprint_id}")
    elif command == "run":
        result = run_kernel(
            RunKernelOptions(manual="--manual" in flags, snapshot="--snapshot" in flags)
        )
        print(f"Devbox {result.devbox_id} crawled {result.pages_visited} pages")
        print(f"Report: {result.report_path}")
        if result.live_view_url:
            print(f"Live view: {result.live_view_url}")
    else:
        print(USAGE)


if __name__ == "__main__":
    main()
