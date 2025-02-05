"""Utility to run shell commands asynchronously with a timeout."""

from runloop_api_client import Runloop
import os
import dotenv
import logging
dotenv.load_dotenv()
runloop = Runloop(bearer_token=os.getenv("RUNLOOP_PRO"), base_url="https://api.runloop.pro")


# Logger setup
logging.basicConfig(
    level=logging.INFO,  
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)



TRUNCATED_MESSAGE: str = "<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>"
MAX_RESPONSE_LEN: int = 16000



def maybe_truncate(content: str, truncate_after: int | None = MAX_RESPONSE_LEN):
    """Truncate content and append a notice if content exceeds the specified length."""
    return (
        content
        if not truncate_after or len(content) <= truncate_after
        else content[:truncate_after] + TRUNCATED_MESSAGE
    )

async def run(
    cmd: str,
    timeout: float | None = 120.0,  # seconds
    truncate_after: int | None = MAX_RESPONSE_LEN,
):
    """Run a shell command asynchronously with a timeout."""
    try:
        response = runloop.devboxes.execute_sync(os.getenv("DEVBOX"), command=cmd, timeout=timeout)
        logger.error(response)
        logger.error(response.stdout)
        logger.error(response.stderr)
        # Prepare stdout and stderr
        stdout = response.stdout or b""  # Default to empty bytes if None or empty
        stderr = response.stderr or b""  # Default to empty bytes if None or empty

        # Ensure stdout and stderr are bytes (since asyncio returns byte streams)
        if isinstance(stdout, str):
            stdout = stdout.encode()  # Convert string to bytes
        if isinstance(stderr, str):
            stderr = stderr.encode()  # Convert string to bytes

        # Truncate stdout and stderr if specified
        if truncate_after:
            stdout = stdout[:truncate_after]
            stderr = stderr[:truncate_after]

        # Return the tuple (exit_status, stdout, stderr)
        return (
            response.exit_status or 0,  # Default to 0 if exit_status is None
            stdout,
            stderr,
        )
    except :
        pass

