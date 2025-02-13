import asyncio
import os
import uuid
from typing import ClassVar, Literal

from anthropic.types.beta import BetaToolBash20241022Param
from .base import BaseAnthropicTool, CLIResult, ToolError, ToolResult
from runloop_api_client import Runloop
import dotenv

dotenv.load_dotenv()

runloop = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)


class _BashSession:
    """A session of a bash shell."""

    command: ClassVar[str] = "/bin/bash"
    _timeout: ClassVar[float] = 120.0  # seconds

    def __init__(self, devbox_id: str):
        self.devbox_id = devbox_id
        self._started = False
        self._timed_out = False
        self.name = str(uuid.uuid4())

    async def start(self):
        """Start the bash session."""
        if not self._started:
            self._started = True

    def stop(self):
        """Terminate the bash shell session."""
        if not self._started:
            raise ToolError("Session has not started.")
        self._started = False

    async def run(self, command: str):
        """Execute a command in the bash shell."""
        if not self._started:
            raise ToolError("Session has not started.")
        if self._timed_out:
            raise ToolError(
                f"Bash timed out after {self._timeout} seconds and must be restarted."
            )

        try:
            async with asyncio.timeout(self._timeout):
                cmd_result = runloop.devboxes.execute_sync(
                    self.devbox_id, command=command
                )
                return CLIResult(
                    output=(cmd_result.stdout or "").strip(),
                    error=(cmd_result.stderr or "").strip()
                    if cmd_result.exit_status
                    else None,
                )
        except asyncio.TimeoutError:
            self._timed_out = True
            raise ToolError(
                f"Bash timed out after {self._timeout} seconds and must be restarted."
            ) from None


class BashTool(BaseAnthropicTool):
    """
    A tool that allows the agent to run bash commands.
    """

    name: ClassVar[Literal["bash"]] = "bash"
    api_type: ClassVar[Literal["bash_20241022"]] = "bash_20241022"

    def __init__(self, devbox_id: str):
        super().__init__()
        self.devbox_id = devbox_id
        self._session = None

    async def __call__(
        self, command: str | None = None, restart: bool = False, **kwargs
    ):
        """Execute a bash command or restart the session."""
        if restart:
            return await self._restart_session()

        if self._session is None:
            self._session = _BashSession(self.devbox_id)
            await self._session.start()

        if command:
            return await self._session.run(command)

        raise ToolError("No command provided.")

    async def _restart_session(self):
        """Restart the bash session."""
        if self._session:
            self._session.stop()
        self._session = _BashSession(self.devbox_id)
        await self._session.start()
        return ToolResult(system="Tool has been restarted.")

    def to_params(self) -> BetaToolBash20241022Param:
        """Return tool parameters."""
        return {"type": self.api_type, "name": self.name}
