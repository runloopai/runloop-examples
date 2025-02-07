import subprocess
import time
import os
from runloop_api_client import Runloop
from dotenv import load_dotenv
from http_server import start_server

load_dotenv()

client = Runloop(
    bearer_token=os.getenv("RUNLOOP_API_KEY"),
    base_url=os.getenv("RUNLOOP_API_BASE_URL"),
)


def initialize_devbox():
    browser = client.devboxes.browsers.create()
    client.devboxes.await_running(browser.devbox.id)

    vnc_url = browser.live_view_url

    return {
        "DEVBOX": browser.devbox.id,
        "CDP_URL": browser.connection_url,
        "VNC_URL": vnc_url,
    }


def start_streamlit():
    """Starts the Streamlit app in a background process."""
    streamlit_cmd = [
        "python",
        "-m",
        "streamlit",
        "run",
        "browser/agent_streamlit.py",
        "--server.headless",
        "true",
    ]
    streamlit_log = open("/tmp/streamlit_stdout.log", "w")
    return subprocess.Popen(
        streamlit_cmd, stdout=streamlit_log, stderr=subprocess.STDOUT
    )


if __name__ == "__main__":
    connection_info = initialize_devbox()
    os.environ["DEVBOX"] = connection_info["DEVBOX"]
    os.environ["CDP_URL"] = connection_info["CDP_URL"]

    # Start Streamlit app
    streamlit_process = start_streamlit()

    # Start HTTP server
    server_process = start_server(connection_info["VNC_URL"])
    print("✨ Browser Use Demo is ready! ✨")
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
