"""Utility to run shell commands asynchronously with a timeout."""

import os
import dotenv
from runloop_api_client import Runloop

dotenv.load_dotenv()

runloop = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)

TRUNCATED_MESSAGE = (
    "<response clipped><NOTE>To save on context, only part of this file has been shown. "
    "Retry this tool after searching inside the file with `grep -n` to find relevant line numbers.</NOTE>"
)
MAX_RESPONSE_LEN = 16000


def maybe_truncate(content: str, truncate_after: int = MAX_RESPONSE_LEN) -> str:
    """Truncate content and append a notice if it exceeds the specified length."""
    return (
        content
        if len(content) <= truncate_after
        else content[:truncate_after] + TRUNCATED_MESSAGE
    )


async def run(
    cmd: str,
    timeout: float = 120.0,  # seconds
    truncate_after: int = MAX_RESPONSE_LEN,
):
    """Run a shell command asynchronously with a timeout."""
    response = runloop.devboxes.execute_sync(
        os.getenv("DEVBOX", ""), command=cmd, timeout=timeout
    )
    stdout, stderr = (response.stdout or "").encode(), (response.stderr or "").encode()
    return response.exit_status or 0, stdout[:truncate_after], stderr[:truncate_after]
