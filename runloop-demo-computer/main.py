from runloop_api_client import Runloop
import logging
import os
import time
import subprocess
from http_server import start_server
from dotenv import load_dotenv

logger = logging.getLogger("computer-demo")

load_dotenv()

client = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)


def initialize_devbox():
    logger.info("Creating new devbox on Runloop ...")
    computer = client.devboxes.computers.create()
    client.devboxes.await_running(computer.devbox.id)

    vnc_port = computer.live_screen_url

    return {"VNC_URL": vnc_port, "DEVBOX": computer.devbox.id}


def start_streamlit():
    """Starts the Streamlit app in a background process."""
    logger.info("Starting streamlit process ...")
    streamlit_cmd = [
        "python",
        "-m",
        "streamlit",
        "run",
        "computer/agent_streamlit.py",
        "--server.headless",
        "true",
    ]
    streamlit_log = open("/tmp/streamlit_stdout.log", "w")
    return subprocess.Popen(
        streamlit_cmd, stdout=streamlit_log, stderr=subprocess.STDOUT
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting Runloop computer demo")

    connection_info = initialize_devbox()
    os.environ["DEVBOX"] = connection_info["DEVBOX"]

    # Start Streamlit app
    streamlit_process = start_streamlit()

    # Start HTTP server
    server_process = start_server(connection_info["VNC_URL"])
    print("✨ Computer Use Demo is ready! ✨")
    print("Open http://localhost:8080 in your browser to begin")

    # Keep the main script running & handle termination
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Closing application processes...")
        streamlit_process.terminate()
        server_process.terminate()
        streamlit_process.wait()
        server_process.join()
        client.devboxes.shutdown(connection_info["DEVBOX"])
        print("Application stopped successfully.")
