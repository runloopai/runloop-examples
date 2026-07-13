"""Run the Browserbase research agent inside a Runloop devbox.

Provisions a devbox (from the pre-built blueprint, or with a runtime install when
``manual`` is set), uploads the crawl agent, drives a Browserbase cloud browser
by connecting Playwright over CDP to the session's ``connect_url``, downloads the
report and per-seed screenshots, and returns a typed result. The devbox is torn
down automatically by the SDK context manager.
"""

import json
import os
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, cast

from runloop_api_client import RunloopSDK
from runloop_api_client.lib.polling import PollingConfig

if TYPE_CHECKING:
    from runloop_api_client.types.shared_params.launch_parameters import LaunchParameters

from .config import (
    AGENT_REMOTE_PATH,
    BLUEPRINT_NAME,
    DEFAULT_DEPTH,
    DEFAULT_LINKS_PER_SEED,
    DEFAULT_TARGETS,
    RESULT_DIR,
    SHOTS_DIR,
    load_agent_source,
)
from .provision import provision_devbox, unique_name
from .status import status

# `cmd.exec` polls for completion with a 120s default; the crawl runs longer, so
# widen the polling window (distinct from the per-request HTTP timeout).
_CRAWL_POLLING = PollingConfig(interval_seconds=2.0, timeout_seconds=600)


@dataclass
class RunBrowserbaseOptions:
    """Options for :func:`run_browserbase`."""

    manual: bool = False  # install the Browserbase SDK at runtime instead of the blueprint
    targets: list[dict[str, str]] = field(default_factory=lambda: list(DEFAULT_TARGETS))
    links_per_seed: int = DEFAULT_LINKS_PER_SEED
    depth: int = DEFAULT_DEPTH
    size: str = "SMALL"
    snapshot: bool = False  # snapshot the devbox disk on success
    output_dir: str = "."  # where report.json and screenshots/ are written locally


@dataclass
class RunBrowserbaseResult:
    """Result of a crawl run."""

    devbox_id: str
    pages_visited: int
    live_view_url: str | None
    report_path: str
    screenshots_dir: str


def run_browserbase(
    options: RunBrowserbaseOptions | None = None,
    runloop: RunloopSDK | None = None,
) -> RunBrowserbaseResult:
    """Provision a devbox, run the crawl agent against a Browserbase browser, return results."""
    options = options or RunBrowserbaseOptions()
    runloop = runloop or RunloopSDK()

    env = {
        "BROWSERBASE_API_KEY": os.environ["BROWSERBASE_API_KEY"],
        "BROWSERBASE_PROJECT_ID": os.environ["BROWSERBASE_PROJECT_ID"],
        "TARGETS": json.dumps(options.targets),
        "LINKS_PER_SEED": str(options.links_per_seed),
        "DEPTH": str(options.depth),
    }
    launch = cast("LaunchParameters", {"resource_size_request": options.size})

    devbox_name = unique_name("browserbase-research")
    if options.manual:
        status("Provisioning devbox (Browserbase SDK installed at runtime)")
        devbox_cm = provision_devbox(
            runloop, name=devbox_name, environment_variables=env, launch_parameters=launch
        )
    else:
        status(f"Provisioning devbox from blueprint '{BLUEPRINT_NAME}'")
        devbox_cm = provision_devbox(
            runloop,
            name=devbox_name,
            environment_variables=env,
            launch_parameters=launch,
            blueprint_name=BLUEPRINT_NAME,
        )

    with devbox_cm as devbox:
        if options.manual:
            status("Installing Browserbase SDK + Playwright client in the devbox")
            install = devbox.cmd.exec(
                "python3 -m pip install --user --quiet browserbase playwright", timeout=240
            )
            if not install.success:
                raise RuntimeError("install failed: " + (install.stderr() or "")[-300:])

        # Upload the agent and run it. Results come back as files (not stdout),
        # so there is no fragile stdout-parsing protocol.
        status(f"Devbox {devbox.id} ready; uploading the crawl agent")
        devbox.file.write(file_path=AGENT_REMOTE_PATH, contents=load_agent_source())
        status("Crawling in the devbox (typically 2-3 min); browser runs on Browserbase")
        result = devbox.cmd.exec(
            f"python3 {AGENT_REMOTE_PATH}", timeout=600, polling_config=_CRAWL_POLLING
        )
        if not result.success:
            raise RuntimeError(
                f"agent failed (exit {result.exit_code}): " + (result.stderr() or "")[-300:]
            )

        summary = json.loads(devbox.file.read(file_path=f"{RESULT_DIR}/summary.json"))
        report = json.loads(devbox.file.read(file_path=f"{RESULT_DIR}/report.json"))

        # Pull screenshots back as binary files (not base64-through-text).
        shots_dir = os.path.join(options.output_dir, "screenshots")
        os.makedirs(shots_dir, exist_ok=True)
        shot_count = 0
        for site in summary["sites"]:
            shot = site.get("screenshot")
            if not shot:
                continue
            data = devbox.file.download(path=f"{SHOTS_DIR}/{shot}")
            with open(os.path.join(shots_dir, shot), "wb") as fh:
                fh.write(data)
            shot_count += 1
        status(f"Downloaded report.json and {shot_count} screenshots")

        report_path = os.path.join(options.output_dir, "report.json")
        with open(report_path, "w") as fh:
            json.dump(report, fh, indent=2)

        if options.snapshot:
            status("Snapshotting devbox disk")
            devbox.snapshot_disk(name=f"browserbase-research-{devbox.id}")

        status("Tearing down devbox")

        return RunBrowserbaseResult(
            devbox_id=devbox.id,
            pages_visited=summary["pages_visited"],
            live_view_url=summary.get("live_view_url"),
            report_path=report_path,
            screenshots_dir=shots_dir,
        )
