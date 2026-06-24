"""Provision a devbox with a bounded wait, failing fast on a stuck provision.

The OO ``devbox.create`` waits for the devbox to reach ``running`` with an
effectively unbounded default (120 attempts, no time cap), so a stuck provision
hangs for many minutes with no feedback. :func:`provision_devbox` bounds that
wait: on timeout, or if the devbox enters a terminal non-running state, it shuts
the devbox down and raises, so a bad provision is loud and immediate instead of
silent, and never leaks a half-provisioned (billable) devbox.
"""

import contextlib
import secrets
from typing import TYPE_CHECKING, Any

from runloop_api_client import RunloopSDK
from runloop_api_client.lib.polling import PollingConfig
from runloop_api_client.sdk.devbox import Devbox

if TYPE_CHECKING:
    from runloop_api_client.types.shared_params.launch_parameters import LaunchParameters

# Fail-fast ceiling: the most we wait for the devbox to reach `running` before
# giving up and tearing it down. It returns the instant it is running (boot is
# ~1-3s), so this is just a stuck-provision guard, not an expected boot time. Keep
# it well under the crawl window so a bad provision fails quickly. (If you ever
# raise it past ~120s, also bump `max_attempts` on the PollingConfig below, or the
# default of 120 attempts caps the real wait regardless of this value.)
PROVISION_TIMEOUT_SECONDS = 60


def unique_name(base: str) -> str:
    """Append a random numeric slug so repeated runs do not stack identical devbox names."""
    return f"{base}-{secrets.randbelow(9_000_000) + 1_000_000}"


def provision_devbox(
    runloop: RunloopSDK,
    *,
    name: str,
    launch_parameters: "LaunchParameters",
    environment_variables: dict[str, str] | None = None,
    blueprint_name: str | None = None,
) -> Devbox:
    """Create a devbox and wait until it is running, or fail fast and clean up.

    Returns a :class:`Devbox` (usable as a context manager). On a stuck or failed
    provision it shuts the devbox down and raises :class:`RuntimeError`.
    """
    api = runloop.api
    params: dict[str, Any] = {"name": name, "launch_parameters": launch_parameters}
    if environment_variables is not None:
        params["environment_variables"] = environment_variables
    if blueprint_name is not None:
        params["blueprint_name"] = blueprint_name

    view = api.devboxes.create(**params)  # returns immediately, still provisioning
    try:
        api.devboxes.await_running(
            view.id, polling_config=PollingConfig(timeout_seconds=PROVISION_TIMEOUT_SECONDS)
        )
    except Exception as exc:
        # Don't leave a half-provisioned, billable devbox stuck; shut it down.
        with contextlib.suppress(Exception):
            api.devboxes.shutdown(view.id)
        raise RuntimeError(
            f"devbox {view.id} did not reach running within "
            f"{PROVISION_TIMEOUT_SECONDS}s ({exc}); it was shut down"
        ) from exc
    return runloop.devbox.from_id(view.id)
