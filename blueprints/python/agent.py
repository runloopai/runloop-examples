import logging
import os
from runloop_api_client import Runloop
import ell
from ell import Message
from typing import List

logger = logging.getLogger("agent")

RUNLOOP_API_KEY = os.environ.get("RUNLOOP_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not RUNLOOP_API_KEY:
    raise ValueError("Missing required API key: RUNLOOP_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("Missing required API key: OPENAI_API_KEY")

MAX_ITERATIONS = 10
# Blueprint Configuration
BLUEPRINT_NAME = "ai_devbox_blueprint"
APT_PACKAGES = ["jq", "xmlstarlet", "htop", "netcat", "imagemagick"]
DOCKERFILE = """
FROM public.ecr.aws/f7m5a7m8/devbox:prod

# Set non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_PRIORITY=high

# Install required packages
RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y install \
    jq \
    xmlstarlet \
    htop \
    netcat-openbsd \
    imagemagick && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Environment setup for user
ENV USERNAME=user
ENV HOME=/home/$USERNAME

# Switch to non-root user
USER user
WORKDIR $HOME

# Set shell
SHELL ["/bin/bash", "-l", "-c"]
ENV SHELL /bin/bash

CMD while true; do sleep 1; done;
"""

SYSTEM_PROMPT = """
You are an expert DevOps assistant helping developers manage cloud environments efficiently.
""".strip()

USER_PROMPT = f"""
Verify that the following packages are installed: {", ".join(APT_PACKAGES)}.
return the stdout verying the packages are installed in the devbox.
""".strip()


def create_blueprint(runloop: Runloop) -> str:
    """Creates a Blueprint that installs selected packages."""
    logger.info(f"Creating Blueprint: {BLUEPRINT_NAME}...")

    blueprint = runloop.blueprints.create_and_await_build_complete(
        name=BLUEPRINT_NAME,
        dockerfile=DOCKERFILE,
    )
    blueprint_id = blueprint.id
    logger.info(f"Blueprint {BLUEPRINT_NAME} created with ID {blueprint_id}")
    return blueprint_id


def run_agent(runloop: Runloop, devbox):
    """Runs an AI agent to verify package installation and execute a script."""

    @ell.tool()
    def execute_shell_command(command: str):
        """Executes a shell command in the Devbox."""
        return runloop.devboxes.execute_sync(devbox.id, command=command).stdout

    @ell.tool()
    def write_file(file_name: str, contents: str):
        """Writes a script file in the Devbox."""
        runloop.devboxes.write_file_contents(
            devbox.id, file_path=file_name, contents=contents
        )

    @ell.tool()
    def read_file(file_name: str):
        """Reads the script output file in the Devbox."""
        return runloop.devboxes.read_file_contents(devbox.id, file_path=file_name)

    @ell.complex(
        model="gpt-4-turbo", tools=[execute_shell_command, write_file, read_file]
    )
    def invoke_agent(message_history: List[Message]):
        """Calls the AI agent to execute tasks."""
        messages = [ell.system(SYSTEM_PROMPT), ell.user(USER_PROMPT)] + message_history
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

    print(result.text)


def main():
    runloop = Runloop(bearer_token=RUNLOOP_API_KEY)

    # Create and build the Blueprint
    blueprint_id = create_blueprint(runloop)

    # Launch Devbox using the Blueprint
    logger.info(f"Launching Devbox with Blueprint {blueprint_id}...")

    devbox = runloop.devboxes.create_and_await_running(blueprint_id=blueprint_id)

    logger.info(f"Devbox {devbox.id} is running.")

    # Run AI Agent inside the Devbox with the installed packages
    try:
        run_agent(runloop, devbox)
    finally:
        logger.info(f"Shutting down Devbox {devbox.id}...")
        runloop.devboxes.shutdown(devbox.id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting AI-powered Devbox demo")
    main()
