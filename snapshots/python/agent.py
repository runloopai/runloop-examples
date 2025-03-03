import logging
import os
from runloop_api_client import Runloop
import ell
from ell import Message
from typing import List

RUNLOOP_API_KEY = os.environ.get("RUNLOOP_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DEVBOX_ID = ""

if not RUNLOOP_API_KEY:
    raise ValueError("Missing required API key: RUNLOOP_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("Missing required API key: OPENAI_API_KEY")

MAX_ITERATIONS = 10

SYSTEM_PROMPT = """
You are a senior game developer tasked with creating a simple Python console game of Snake in a Runloop Devbox.
Each step, you will modify and test the game. If the test is successful, take a snapshot of the Devbox.
""".strip()

USER_PROMPT = """
1. If a snapshot named "snake_game_basic_<version>" exists, start a Devbox from the latest snapshot.  
2. Retrieve and analyze logs and `snake_game.py` for errors or improvements.  
3. Fix logged issues and enhance the game iteratively.  
4. Run `snake_game.py` to test functionality after each change.  
5. If the test passes, take a snapshot named "snake_game_basic_<version+1>".  
6. Continue iterating until the game is working without errors.
""".strip()


def run_agent(runloop: Runloop):
    """Runs the AI agent to develop the game iteratively."""

    @ell.tool()
    def execute_shell_command(command: str):
        """Executes a shell command inside the Devbox."""
        result = runloop.devboxes.execute_sync(DEVBOX_ID, command=command)
        return result.stdout if result.stdout else result.stderr

    @ell.tool()
    def write_file(file_name: str, contents: str):
        """Writes a file to the Devbox."""
        runloop.devboxes.write_file_contents(
            DEVBOX_ID, file_path=file_name, contents=contents
        )
        return

    @ell.tool()
    def create_snapshot(snapshot_name: str):
        """Takes a snapshot of the Devbox and saves it."""
        runloop.devboxes.snapshot_disk(DEVBOX_ID, name=snapshot_name)
        return snapshot_name

    @ell.tool()
    def get_latest_snapshot():
        """Retrieves the latest snapshot with the naming pattern 'snake_game_basic_<version>'."""
        try:
            snapshots = (
                runloop.devboxes.list_disk_snapshots().snapshots
            )  # Get response object

            latest_snapshot = None
            max_version = -1

            for snap in snapshots:
                name = snap.name
                if name.startswith("snake_game_basic_"):
                    version = int(name.split("_")[-1])  # Extract numeric version
                    if version > max_version:
                        max_version = version
                        latest_snapshot = snap.id
            return latest_snapshot

        except Exception:
            return None

    @ell.tool()
    def get_devbox_logs():
        """Retrieve the logs from the current devbox and return them in a JSON-serializable format."""
        try:
            logs_response = runloop.devboxes.logs.list(DEVBOX_ID)
            log_entries = logs_response.logs

            # Convert logs into a JSON-serializable list of dictionaries
            formatted_logs = [
                {
                    "cmd_id": log.cmd_id,
                    "level": log.level,
                    "timestamp_ms": log.timestamp_ms,
                    "shell_name": log.shell_name,
                    "cmd": log.cmd,
                    "message": log.message,
                    "exit_code": log.exit_code,
                    "source": log.source,
                }
                for log in log_entries
            ]

            return formatted_logs

        except Exception:
            return "Error retrieving logs"

    @ell.tool()
    def shutdown_devbox():
        """Shuts down the current devbox."""
        runloop.devboxes.shutdown(id=DEVBOX_ID)
        return f"Devbox {DEVBOX_ID} has been shut down"

    @ell.tool()
    def create_devbox(snapshot_id: str):
        """Creates a devbox from a snapshot if provided, otherwise creates a new devbox."""
        global DEVBOX_ID
        if snapshot_id:
            devbox_id = runloop.devboxes.create(snapshot_id=snapshot_id).id
        else:
            devbox_id = runloop.devboxes.create().id
        DEVBOX_ID = devbox_id
        devbox = runloop.devboxes.await_running(devbox_id)
        return devbox.id

    @ell.complex(
        model="gpt-4-turbo",
        tools=[
            execute_shell_command,
            get_devbox_logs,
            get_latest_snapshot,
            write_file,
            shutdown_devbox,
            create_snapshot,
            create_devbox,
        ],
    )
    def invoke_agent(message_history: List[Message]):
        """Invokes the AI agent to develop and test the game."""
        messages = [ell.system(SYSTEM_PROMPT), ell.user(USER_PROMPT)] + message_history
        return messages

    message_history = []
    result = invoke_agent(message_history)
    num_iterations = 0

    while result.tool_calls or num_iterations < MAX_ITERATIONS:
        message_history.append(result)
        result_message = result.call_tools_and_collect_as_message()
        message_history.append(result_message)
        result = invoke_agent(message_history)
        num_iterations += 1

    print(result.text)


def main():
    logger = logging.getLogger(__name__)
    runloop = Runloop(bearer_token=RUNLOOP_API_KEY)

    logger.info("Running AI agent")
    run_agent(runloop)


if __name__ == "__main__":
    main()
