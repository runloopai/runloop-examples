from runloop_api_client import Runloop
import os
from dotenv import load_dotenv
load_dotenv()


def initialize_devbox():
    client = Runloop(bearer_token=os.getenv("RUNLOOP_PRO"), base_url="https://api.runloop.pro")

    computer = client.devboxes.computers.create()

    response = client.devboxes.await_running(computer.devbox.id)
    vnc_port = computer.live_screen_url

    print(computer)

    return {
        "VNC_URL": vnc_port,
        "DEVBOX": computer.devbox.id
    }

def update_env_file(env_vars, env_file=".env"):
    """
    Updates the .env file with new values while preserving existing ones.
    """
    env_data = {}

    # Read existing .env file if it exists
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    env_data[key] = value

    # Update with new values
    env_data.update(env_vars)

    # Write back to .env file
    with open(env_file, "w") as f:
        for key, value in env_data.items():
            f.write(f"{key}={value}\n")

if __name__ == "__main__":
    connection_info = initialize_devbox()

    update_env_file(connection_info)

    print("Updated .env file successfully!")




