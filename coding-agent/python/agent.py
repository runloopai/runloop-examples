import logging
import os
from runloop_api_client import Runloop
import openai
import ell
from ell import Message
from typing import List
from runloop_api_client.types import DevboxView

logger = logging.getLogger("agent")

SYSTEM_PROMPT = """
You are an expert python coder that specializes in making single file bash scripts.
""".strip()

USER_PROMPT = """
Write a command-line script that prints sys.argv[1:] as ascii art.
The program should be callable from the command line via `python script.py`.

Once you have generated the program, run it and print the output to stdout.
Use "hello runloop" as the argument. Fix and re-run the program until it works.

Once it works, use tools to read the final program from the `script.py` file and return
the contents verbatim in a code block.

In a separate code block, print the verbatim output from the last time you
ran the program.
""".strip()

MAX_ITERATIONS = 10


def run_agent(runloop: Runloop, devbox: DevboxView, openai_api_key: str):
    openai.api_key = openai_api_key

    @ell.tool()
    def execute_shell_command(command: str):
        """Run a shell command in the devbox."""
        return runloop.devboxes.execute_sync(devbox.id, command=command).stdout

    @ell.tool()
    def read_file(filename: str):
        """Reads a file on the devbox."""
        return runloop.devboxes.read_file_contents(devbox.id, file_path=filename)

    @ell.tool()
    def write_file(filename: str, contents: str):
        """Writes a file on the devbox."""
        runloop.devboxes.write_file_contents(
            devbox.id, file_path=filename, contents=contents
        )

    @ell.complex(
        model="gpt-4-turbo", tools=[execute_shell_command, read_file, write_file]
    )
    def invoke_agent(message_history: List[Message]):
        """Calls the LLM to generate the program."""
        if not message_history:
            logger.debug("invoke_agent: first call")
        else:
            logger.debug(
                f"invoke_agent: calling again, last message = {message_history[-1].text}"
            )
        messages = [
            ell.system(SYSTEM_PROMPT),
            ell.user(USER_PROMPT),
        ] + message_history
        return messages

    message_history = []
    result = invoke_agent(message_history)
    num_iterations = 0
    while result.tool_calls and num_iterations < MAX_ITERATIONS:
        logger.debug(f"performing tool calls: {result.tool_calls}")
        message_history.append(result)
        result_message = result.call_tools_and_collect_as_message()
        logger.debug(f"result_message = {result_message}")
        message_history.append(result_message)
        result = invoke_agent(message_history)
        num_iterations += 1

    # Per our instructions, the last message *should* be the final script
    # and example usage.
    print(result.text)


def main(openai_api_key: str, runloop_api_key: str):
    runloop = Runloop(bearer_token=runloop_api_key)

    logger.info("Creating devbox ...")
    devbox = runloop.devboxes.create_and_await_running()
    devbox_id = devbox.id
    try:
        run_agent(runloop, devbox, openai_api_key)
    finally:
        logger.info(f"Destroying devbox {devbox_id}...")
        runloop.devboxes.shutdown(devbox_id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logger.info("Starting agent demo")

    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY is not set")
    runloop_api_key = os.environ.get("RUNLOOP_API_KEY")
    if not runloop_api_key:
        raise ValueError("RUNLOOP_API_KEY is not set")

    main(openai_api_key, runloop_api_key)
