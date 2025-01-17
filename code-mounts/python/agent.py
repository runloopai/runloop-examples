import logging
import os
import sys
from runloop_api_client import Runloop
import openai
import ell
from ell import Message
from typing import List, Tuple
from runloop_api_client.types import DevboxView
from urllib.parse import urlparse

logger = logging.getLogger("agent")

SYSTEM_PROMPT = """
You are an expert coder and git user.
""".strip()

USER_PROMPT = """
Find and navigate to the code repository located in a subdirectory of /home/user and perform cleanups.

- If the repository has a README.md file, use the `npx doctoc README.md --github` command to add or update the table of contents.
- If the repository appears to be a Javascript or Typescript project, install and run `npx @biomejs/biome lint --write .` to fix all lint errors.

Once you've made all the fixes, stage all changes with git, then show the diff with `git diff --cached`.
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
        model="gpt-4o-mini", tools=[execute_shell_command, read_file, write_file]
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


def main(
    openai_api_key: str,
    runloop_api_key: str,
    github_token: str,
    repo_owner: str,
    repo_name: str,
):
    runloop = Runloop(bearer_token=runloop_api_key)

    logger.info("Creating devbox ...")
    devbox = runloop.devboxes.create_and_await_running(
        code_mounts=[
            {
                "repo_owner": repo_owner,
                "repo_name": repo_name,
                "token": github_token,
            }
        ]
    )
    devbox_id = devbox.id
    try:
        run_agent(runloop, devbox, openai_api_key)
    finally:
        logger.info(f"Destroying devbox {devbox_id}...")
        runloop.devboxes.shutdown(devbox_id)


def parse_github_url(url: str) -> Tuple[str, str]:
    """Parse a github url into a repo name and owner."""
    if not url.startswith("https://github.com/"):
        raise ValueError("Invalid github url")
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    parts = path.split("/")
    logger.info(f"Repository owner: {parts[0]}, repository name: {parts[1]}")
    if len(parts) != 2:
        raise ValueError("Invalid github url - must contain owner and repo")
    return parts[0], parts[1]


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
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise ValueError("GITHUB_TOKEN is not set")

    if len(sys.argv) != 2:
        sys.stderr.write("Usage: agent.py <github url>\n")
        sys.exit(1)

    repo_owner, repo_name = parse_github_url(sys.argv[1])

    main(openai_api_key, runloop_api_key, github_token, repo_owner, repo_name)
