import asyncio
import os
from typing import ClassVar, Literal

from anthropic.types.beta import BetaToolBash20241022Param

from .base import BaseAnthropicTool, CLIResult, ToolError, ToolResult
import random
import string
import uuid
import dotenv
dotenv.load_dotenv()

from runloop_api_client import Runloop

runloop = Runloop(bearer_token=os.getenv("RUNLOOP_PRO"), base_url="https://api.runloop.pro")

DEVBOX = os.getenv("DEVBOX")

class _BashSession:
    """A session of a bash shell."""

    _started: bool
    _name: str

    command: str = "/bin/bash"
    _output_delay: float = 0.2  # seconds
    _timeout: float = 120.0  # seconds
    _sentinel: str = "<<exit>>"

    def __init__(self):
        self._started = False
        self._timed_out = False

    async def start(self):
        if self._started:
            return
        # Generate a random UUID (version 4)
        random_uuid = uuid.uuid4()

        # Convert the UUID object to a string
        uuid_string = str(random_uuid)
        self.name = uuid_string

        self._started = True

    def stop(self):
        """Terminate the bash shell."""
        if not self._started:
            raise ToolError("Session has not started.")

    async def run(self, command: str):
        """Execute a command in the bash shell."""
        if not self._started:
            raise ToolError("Session has not started.")
        if self._timed_out:
            raise ToolError(
                f"timed out: bash has not returned in {self._timeout} seconds and must be restarted",
            )

        try:
            async with asyncio.timeout(self._timeout):                
                cmd_result = runloop.devboxes.execute_sync(DEVBOX, command=command)
                output = cmd_result.stdout   

                if output.endswith("\n"):
                    output = output[:-1]

                error = cmd_result.stderr
                if cmd_result.exit_status:
                    error = error[:-1]   
                return CLIResult(output=output, error=error)
        except asyncio.TimeoutError:
            self._timed_out = True
            raise ToolError(
                f"timed out: bash has not returned in {self._timeout} seconds and must be restarted",
            ) from None

class BashTool(BaseAnthropicTool):
    """
    A tool that allows the agent to run bash commands.
    The tool parameters are defined by Anthropic and are not editable.
    """

    _session: _BashSession | None
    name: ClassVar[Literal["bash"]] = "bash"
    api_type: ClassVar[Literal["bash_20241022"]] = "bash_20241022"

    def __init__(self):
        self._session = None
        super().__init__()

    async def __call__(
        self, command: str | None = None, restart: bool = False, **kwargs
    ):
        if restart:
            if self._session:
                self._session.stop()
            self._session = _BashSession()
            await self._session.start()

            return ToolResult(system="tool has been restarted.")

        if self._session is None:
            self._session = _BashSession()
            await self._session.start()

        if command is not None:
            return await self._session.run(command)

        raise ToolError("no command provided.")

    def to_params(self) -> BetaToolBash20241022Param:
        return {
            "type": self.api_type,
            "name": self.name,}

    # Initialize Runloop client
    runloop = Runloop(bearer_token=os.getenv("RUNLOOP_PRO"), base_url="https://api.runloop.pro")


    class _BashSession:
        """A session of a bash shell."""

        command: str = "/bin/bash"
        _output_delay: float = 0.2  # seconds
        _timeout: float = 120.0  # seconds
        _sentinel: str = "<<exit>>"

        def __init__(self):
            self._started = False
            self._timed_out = False

        async def start(self):
            """Start the bash session."""
            if self._started:
                return

            # Generate a random UUID for the session name
            self.name = str(uuid.uuid4())
            self._started = True

        def stop(self):
            """Terminate the bash shell."""
            if not self._started:
                raise ToolError("Session has not started.")
            self._started = False

        async def run(self, command: str):
            """Execute a command in the bash shell."""
            if not self._started:
                raise ToolError("Session has not started.")
            if self._timed_out:
                raise ToolError(
                    f"timed out: bash has not returned in {self._timeout} seconds and must be restarted",
                )

            try:
                async with asyncio.timeout(self._timeout):
                    cmd_result = runloop.devboxes.execute_sync(DEVBOX, command=command)
                    output = cmd_result.stdout.strip()
                    error = cmd_result.stderr.strip() if cmd_result.exit_status else None
                    return CLIResult(output=output, error=error)
            except asyncio.TimeoutError:
                self._timed_out = True
                raise ToolError(
                    f"timed out: bash has not returned in {self._timeout} seconds and must be restarted",
                ) from None

    class BashTool(BaseAnthropicTool):
        """
        A tool that allows the agent to run bash commands.
        The tool parameters are defined by Anthropic and are not editable.
        """

        _session: _BashSession | None
        name: ClassVar[Literal["bash"]] = "bash"
        api_type: ClassVar[Literal["bash_20241022"]] = "bash_20241022"

        def __init__(self):
            self._session = None
            super().__init__()

        async def __call__(self, command: str | None = None, restart: bool = False, **kwargs):
            """Execute a bash command or restart the session."""
            if restart:
                if self._session:
                    self._session.stop()
                self._session = _BashSession()
                await self._session.start()
                return ToolResult(system="tool has been restarted.")

            if self._session is None:
                self._session = _BashSession()
                await self._session.start()

            if command is not None:
                return await self._session.run(command)

            raise ToolError("no command provided.")

        def to_params(self) -> BetaToolBash20241022Param:
            """Return the tool parameters."""
            return {
                "type": self.api_type,
                "name": self.name,
            }
