"""Create (or reuse) the Browserbase blueprint.

A blueprint bakes the Browserbase SDK and the Playwright client into a devbox
image so that devboxes created from it start ready, with no per-run install.
A build usually takes about a minute but a cold build can run longer, so this is
a one-time step. By default it: reuses the newest already-built
`browserbase-browser` blueprint; if one is still building (an earlier run that has
not finished), waits for that build instead of starting a duplicate; and only
builds fresh when none exists. Both the create and the wait use a generous polling
window so a slow first build does not raise PollingTimeout while it is still
making progress. `run` then creates devboxes from the blueprint by name.
"""

from runloop_api_client import RunloopSDK
from runloop_api_client.lib.polling import PollingConfig

from .config import BLUEPRINT_NAME, SYSTEM_SETUP_COMMANDS
from .status import status

# Blueprint builds are usually under a minute, but a cold build can take several.
# Wait generously rather than failing on the SDK's default polling window, which is
# what made a first-run `create-blueprint` error while the build was still going.
_BUILD_POLLING = PollingConfig(interval_seconds=5.0, timeout_seconds=900, max_attempts=10000)

# Statuses that mean a build is in progress (not yet usable, and not failed).
_IN_PROGRESS = ("queued", "provisioning", "building")


def _newest_blueprint(runloop: RunloopSDK) -> tuple[str, str] | None:
    """Return (id, state) of the newest blueprint with our name, or None.

    Prefers a finished (`build_complete`) blueprint; otherwise returns the newest
    one still in progress so the caller can wait for it instead of starting a
    duplicate build. `state` is either "build_complete" or "building".
    """
    built: list[tuple[int, str]] = []
    pending: list[tuple[int, str]] = []
    for blueprint in runloop.blueprint.list(name=BLUEPRINT_NAME):
        info = blueprint.get_info()
        ts = info.create_time_ms or 0
        if info.status == "build_complete":
            built.append((ts, blueprint.id))
        elif info.status in _IN_PROGRESS:
            pending.append((ts, blueprint.id))
    if built:
        return (max(built)[1], "build_complete")
    if pending:
        return (max(pending)[1], "building")
    return None


def create_browserbase_blueprint(
    runloop: RunloopSDK | None = None, *, rebuild: bool = False
) -> str:
    """Return a built Browserbase blueprint id, reusing an existing one unless rebuild=True.

    Pass ``rebuild=True`` (CLI: ``create-blueprint --rebuild``) to force a fresh
    build, e.g. after changing :data:`SYSTEM_SETUP_COMMANDS`.
    """
    runloop = runloop or RunloopSDK()

    if not rebuild:
        existing = _newest_blueprint(runloop)
        if existing is not None:
            blueprint_id, state = existing
            if state == "build_complete":
                status(f"Reusing blueprint {blueprint_id} (--rebuild to force a fresh build)")
                return blueprint_id
            # An earlier run is still building this blueprint. Wait for that build
            # rather than starting a duplicate or failing the command.
            status(f"Blueprint {blueprint_id} is still building; waiting for it to finish")
            runloop.api.blueprints.await_build_complete(blueprint_id, polling_config=_BUILD_POLLING)
            status("Blueprint build complete")
            return blueprint_id

    status(f"Building blueprint '{BLUEPRINT_NAME}' (this blocks until the image is built)")
    blueprint = runloop.blueprint.create(
        name=BLUEPRINT_NAME,
        system_setup_commands=SYSTEM_SETUP_COMMANDS,
        polling_config=_BUILD_POLLING,
    )
    status("Blueprint build complete")
    return blueprint.id
