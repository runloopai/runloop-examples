from runloop_api_client import Runloop
import os
import time
import subprocess
from http_server import start_server
from dotenv import load_dotenv
load_dotenv()

client = Runloop(bearer_token=os.getenv("RUNLOOP_PRO"), base_url="https://api.runloop.pro")

def initialize_devbox():
    computer = client.devboxes.computers.create()
    client.devboxes.await_running(computer.devbox.id)

    vnc_port = computer.live_screen_url

    return {
        "VNC_URL": vnc_port,
        "DEVBOX": computer.devbox.id
    }


def start_streamlit():
    """ Starts the Streamlit app in a background process. """
    streamlit_cmd = ["python", "-m", "streamlit", "run", "computer/agent_streamlit.py", "--server.headless", "true"]
    streamlit_log = open("/tmp/streamlit_stdout.log", "w")
    return subprocess.Popen(streamlit_cmd, stdout=streamlit_log, stderr=subprocess.STDOUT)


if __name__ == "__main__":
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


