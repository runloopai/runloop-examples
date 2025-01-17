from collections import defaultdict
from pathlib import Path
from typing import Literal, get_args, List

from anthropic.types.beta import BetaToolTextEditor20241022Param
from .base import BaseTool, ToolError, ToolResult
from runloop_api_client import Runloop
import os
import dotenv

dotenv.load_dotenv()

runloop = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)

Command = Literal["view", "create", "str_replace", "insert", "undo_edit"]
SNIPPET_LINES = 4

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


class EditTool(BaseTool):
    """
    A filesystem editor tool that allows the agent to view, create, and edit files.
    The tool parameters are defined by Anthropic and are not editable.
    """

    api_type: Literal["text_editor_20241022"] = "text_editor_20241022"
    name: Literal["str_replace_editor"] = "str_replace_editor"

    def __init__(self, devbox_id):
        super().__init__()
        self._file_history = defaultdict(list)
        self.devbox_id = devbox_id

    def to_params(self) -> BetaToolTextEditor20241022Param:
        return {"name": self.name, "type": self.api_type}

    async def __call__(self, *, command: Command, path: str, **kwargs):
        _path = Path(path)
        self.validate_path(command, _path)

        command_dispatch = {
            "view": self.view,
        }

        if command in command_dispatch:
            return await command_dispatch[command](_path, **kwargs)

        sync_dispatch = {
            "create": self.create,
            "str_replace": self.str_replace,
            "insert": self.insert,
            "undo_edit": self.undo_edit,
        }

        if command in sync_dispatch:
            return sync_dispatch[command](_path, **kwargs)

        raise ToolError(
            f"Unrecognized command {command}. Allowed commands: {', '.join(get_args(Command))}"
        )

    def validate_path(self, command: str, path: Path):
        """Validates the file path and ensures it's an absolute path."""
        if not path.is_absolute():
            raise ToolError(f"Path {path} is not absolute. Use an absolute path.")

        is_file = (
            "1"
            in runloop.devboxes.execute_sync(
                self.devbox_id, command=f"[ -f {path} ] && echo 1 || echo 0"
            ).stdout
        )

        is_dir = (
            "1"
            in runloop.devboxes.execute_sync(
                self.devbox_id, command=f"[ -d {path} ] && echo 1 || echo 0"
            ).stdout
        )

        if not is_file and command != "create":
            raise ToolError(f"Path {path} does not exist.")

        if is_file and command == "create":
            raise ToolError(f"File already exists at {path}.")

        if is_dir and command != "view":
            raise ToolError(f"Path {path} is a directory. Only `view` is allowed.")

    async def view(self, path: Path, view_range: List[int] | None = None):
        """Handles viewing a file or directory."""
        is_dir = (
            "1"
            in runloop.devboxes.execute_sync(
                self.devbox_id, command=f"[ -d {path} ] && echo 1 || echo 0"
            ).stdout
        )

        if is_dir:
            if view_range:
                raise ToolError("Cannot use `view_range` on a directory.")
            _, stdout, stderr = await run(
                rf"find {path} -maxdepth 2 -not -path '*/\.*'"
            )
            return ToolResult(output=f"Files in {path}:\n{stdout}", error=stderr)

        file_content = self.read_file(path)
        return ToolResult(output=self._make_output(file_content, str(path)))

    def create(self, path: Path, file_text: str):
        """Handles file creation."""
        if not file_text:
            raise ToolError("`file_text` is required for create command.")

        self.write_file(path, file_text)
        self._file_history[path].append(file_text)
        return ToolResult(output=f"File created successfully at {path}")

    def str_replace(self, path: Path, old_str: str, new_str: str | None):
        """Handles replacing a string in a file."""
        file_content = self.read_file(path)
        occurrences = file_content.count(old_str)

        if occurrences == 0:
            raise ToolError(f"`{old_str}` not found in {path}.")
        if occurrences > 1:
            raise ToolError(
                f"Multiple occurrences of `{old_str}` found in {path}. Ensure it's unique."
            )

        new_file_content = file_content.replace(old_str, new_str or "")
        self.write_file(path, new_file_content)
        self._file_history[path].append(file_content)

        return ToolResult(output=f"Replaced `{old_str}` in {path}.")

    def insert(self, path: Path, insert_line: int, new_str: str):
        """Handles inserting a string into a file at a specified line."""
        file_text = self.read_file(path)
        lines = file_text.split("\n")

        if insert_line < 0 or insert_line > len(lines):
            raise ToolError(f"Invalid `insert_line`: {insert_line}. Out of range.")

        new_content = lines[:insert_line] + [new_str] + lines[insert_line:]
        self.write_file(path, "\n".join(new_content))
        self._file_history[path].append(file_text)

        return ToolResult(output=f"Inserted text at line {insert_line} in {path}.")

    def undo_edit(self, path: Path):
        """Handles undoing the last edit."""
        if not self._file_history[path]:
            raise ToolError(f"No edit history found for {path}.")

        self.write_file(path, self._file_history[path].pop())
        return ToolResult(output=f"Undo successful for {path}.")

    def read_file(self, path: Path):
        """Reads a file from the devbox."""
        try:
            return runloop.devboxes.read_file_contents(
                self.devbox_id, file_path=str(path)
            )
        except Exception as e:
            raise ToolError(f"Error reading {path}: {e}")

    def write_file(self, path: Path, file_text: str):
        """Writes content to a file in the devbox."""
        try:
            runloop.devboxes.write_file_contents(
                self.devbox_id, contents=file_text, file_path=str(path)
            )
        except Exception as e:
            raise ToolError(f"Error writing to {path}: {e}")

    def _make_output(self, file_content: str, file_descriptor: str):
        """Formats the file content for CLI output."""
        file_content = maybe_truncate(file_content).expandtabs()
        return (
            f"Content of {file_descriptor}:\n"
            + "\n".join(
                f"{i + 1}\t{line}" for i, line in enumerate(file_content.split("\n"))
            )
            + "\n"
        )
