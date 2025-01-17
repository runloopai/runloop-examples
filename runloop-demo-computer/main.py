import time
import logging
import os
import subprocess
from runloop_api_client import Runloop
from dotenv import load_dotenv

logger = logging.getLogger("browser-demo")

client = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)


def initialize_devbox():
    """Starts a new Runloop Devbox with the browser extension installed.

    Returns: (devbox_id, vnc_url)
    """
    computer = client.devboxes.computers.create()
    client.devboxes.await_running(computer.devbox.id)
    return computer.devbox.id, computer.live_screen_url


def start_streamlit(api_key, devbox_id, vnc_url):
    """Starts the Streamlit app in a background process.

    Streamlit needs to be run in headless mode, and there isn't good support for doing so
    from a library. So we run it as a subprocess instead.
    """
    logger.info("Starting streamlit process ...")
    streamlit_cmd = [
        "python",
        "-m",
        "streamlit",
        "run",
        "streamlit_app.py",
        "--server.headless",
        "true",
    ]
    env = {
        "ANTHROPIC_API_KEY": api_key,
        "DEVBOX_ID": devbox_id,
        "VNC_URL": vnc_url,
    }
    env.update(os.environ)
    return subprocess.Popen(
        streamlit_cmd,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        env=env,
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting Runloop computer use demo")
    load_dotenv()

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY is not set; please set it in your environment")
        os._exit(1)

    logger.info("Creating new devbox on Runloop ...")
    devbox_id, vnc_url = initialize_devbox()

    try:
        logger.info("Starting Streamlit app ...")
        streamlit_process = start_streamlit(api_key, devbox_id, vnc_url)

        print("✨ Computer Use Demo is ready! ✨")
        print("Open http://localhost:8501 in your browser to begin")

        # Keep the main script running & handle termination
        try:
            streamlit_process.wait()
        except KeyboardInterrupt:
            print("Closing application processes...")
            streamlit_process.kill()
            time.sleep(1)
            streamlit_process.terminate()
    finally:
        client.devboxes.shutdown(devbox_id)
        print("Application stopped successfully.")
