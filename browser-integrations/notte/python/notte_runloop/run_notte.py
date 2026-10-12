"""Test a web app served from a Runloop devbox with a Notte cloud browser.

Provisions a devbox with a public tunnel (from the pre-built blueprint, or with a
runtime install when ``manual`` is set), serves a small to-do app on the tunnel,
uploads the test agent, and runs it. The agent drives a Notte cloud browser with
Playwright over CDP and with the Notte CLI. The report and screenshot are
downloaded, and the devbox is torn down automatically by the SDK context manager.
"""

import json
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING, cast

from runloop_api_client import RunloopSDK
from runloop_api_client.lib.polling import PollingConfig

if TYPE_CHECKING:
    from runloop_api_client.types.shared_params.launch_parameters import LaunchParameters

from .config import (
    AGENT_REMOTE_PATH,
    APP_DIR,
    APP_HTML,
    APP_PORT,
    BLUEPRINT_NAME,
    RESULT_DIR,
    SHOTS_DIR,
    SYSTEM_SETUP_COMMANDS,
    load_agent_source,
)
from .provision import provision_devbox, unique_name
from .status import status

# `cmd.exec` polls for completion with a 120s default; the agent can run longer,
# so widen the polling window (distinct from the per-request HTTP timeout).
_AGENT_POLLING = PollingConfig(interval_seconds=2.0, timeout_seconds=600)


@dataclass
class RunNotteOptions:
    """Options for :func:`run_notte`."""

    manual: bool = False  # install Notte at runtime instead of using the blueprint
    size: str = "SMALL"
    snapshot: bool = False  # snapshot the devbox disk on success
    output_dir: str = "."  # where report.json and screenshots/ are written locally


@dataclass
class RunNotteResult:
    """Result of a test run."""

    devbox_id: str
    app_url: str
    todo_added: bool
    viewer_url: str | None
    report_path: str
    screenshot_path: str


def run_notte(
    options: RunNotteOptions | None = None,
    runloop: RunloopSDK | None = None,
) -> RunNotteResult:
    """Provision a devbox, serve the app, test it with a Notte browser, return results."""
    options = options or RunNotteOptions()
    runloop = runloop or RunloopSDK()

    env = {"NOTTE_API_KEY": os.environ["NOTTE_API_KEY"]}
    launch = cast("LaunchParameters", {"resource_size_request": options.size})

    devbox_name = unique_name("notte-browser-test")
    if options.manual:
        status("Provisioning devbox (Notte installed at runtime)")
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
            status("Installing the Notte SDK, CLI and skills in the devbox")
            for command in SYSTEM_SETUP_COMMANDS:
                install = devbox.cmd.exec(command, timeout=300)
                if not install.success:
                    raise RuntimeError(f"`{command}` failed: " + (install.stderr() or "")[-300:])

        # Serve the app on a public tunnel. An open tunnel needs no auth header,
        # so the Notte browser can load it like any other website.
        status(f"Devbox {devbox.id} ready; serving the app on port {APP_PORT}")
        devbox.file.write(file_path=f"{APP_DIR}/index.html", contents=APP_HTML)
        devbox.cmd.exec_async(
            f"cd {APP_DIR} && python3 -m http.server {APP_PORT} --bind 0.0.0.0 > /tmp/app.log 2>&1"
        )
        devbox.net.enable_tunnel(auth_mode="open")
        app_url = devbox.get_tunnel_url(APP_PORT)
        if app_url is None:
            raise RuntimeError("the devbox has no tunnel")
        status(f"App is live at {app_url}")

        # Upload the agent and run it. Results come back as files (not stdout),
        # so there is no fragile stdout-parsing protocol.
        devbox.file.write(file_path=AGENT_REMOTE_PATH, contents=load_agent_source())
        status("Testing the app in the devbox; the browser runs on Notte")
        result = devbox.cmd.exec(
            f"APP_URL={app_url} PATH=$HOME/.local/bin:$PATH python3 {AGENT_REMOTE_PATH}",
            timeout=600,
            polling_config=_AGENT_POLLING,
        )
        if not result.success:
            raise RuntimeError(
                f"agent failed (exit {result.exit_code}): " + (result.stderr() or "")[-300:]
            )

        report = json.loads(devbox.file.read(file_path=f"{RESULT_DIR}/report.json"))

        # Pull the screenshot back as a binary file (not base64-through-text).
        shots_dir = os.path.join(options.output_dir, "screenshots")
        os.makedirs(shots_dir, exist_ok=True)
        screenshot_path = os.path.join(shots_dir, report["screenshot"])
        with open(screenshot_path, "wb") as fh:
            fh.write(devbox.file.download(path=f"{SHOTS_DIR}/{report['screenshot']}"))
        status("Downloaded report.json and the screenshot")

        report_path = os.path.join(options.output_dir, "report.json")
        with open(report_path, "w") as fh:
            json.dump(report, fh, indent=2)

        if options.snapshot:
            status("Snapshotting devbox disk")
            devbox.snapshot_disk(name=f"notte-browser-test-{devbox.id}")

        status("Tearing down devbox")

        return RunNotteResult(
            devbox_id=devbox.id,
            app_url=app_url,
            todo_added=report["todo_added"],
            viewer_url=report.get("viewer_url"),
            report_path=report_path,
            screenshot_path=screenshot_path,
        )
