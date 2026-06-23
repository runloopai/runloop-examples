"""Create (or reuse) the Browserbase blueprint.

A blueprint bakes the Browserbase SDK and the Playwright client into a devbox
image so that devboxes created from it start ready, with no per-run install.
Building one takes ~40s, so this is a one-time step: by default it reuses the
newest already-built `browserbase-browser` blueprint and only builds when none
exists. `run` then creates devboxes from the blueprint by name.
"""

from runloop_api_client import RunloopSDK

from .config import BLUEPRINT_NAME, SYSTEM_SETUP_COMMANDS
from .status import status


def _existing_built_blueprint(runloop: RunloopSDK) -> str | None:
    """Return the id of the newest built blueprint with our name, or None."""
    built: list[tuple[int, str]] = []
    for blueprint in runloop.blueprint.list(name=BLUEPRINT_NAME):
        info = blueprint.get_info()
        if info.status == "build_complete":
            built.append((info.create_time_ms or 0, blueprint.id))
    if not built:
        return None
    return max(built)[1]


def create_browserbase_blueprint(
    runloop: RunloopSDK | None = None, *, rebuild: bool = False
) -> str:
    """Return a built Browserbase blueprint id, reusing an existing one unless rebuild=True.

    Pass ``rebuild=True`` (CLI: ``create-blueprint --rebuild``) to force a fresh
    build, e.g. after changing :data:`SYSTEM_SETUP_COMMANDS`.
    """
    runloop = runloop or RunloopSDK()

    if not rebuild:
        existing = _existing_built_blueprint(runloop)
        if existing is not None:
            status(f"Reusing built blueprint {existing} (skipping ~40s build; --rebuild to force)")
            return existing

    status(f"Building blueprint '{BLUEPRINT_NAME}' (this blocks until the image is built)")
    blueprint = runloop.blueprint.create(
        name=BLUEPRINT_NAME,
        system_setup_commands=SYSTEM_SETUP_COMMANDS,
    )
    status("Blueprint build complete")
    return blueprint.id
