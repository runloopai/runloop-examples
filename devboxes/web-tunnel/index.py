import os
from runloop_api_client import Runloop

# Initialize the Runloop client
runloop_client = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

# Create a devbox with port 4040 available and start a web server
devbox = runloop_client.devboxes.create_and_await_running(
    launch_parameters={
        "keep_alive_time_seconds": 60,
        "available_ports": [4040],
    }
)
print(f"Created devbox with ID: {devbox.id}")

# Create a tunnel to the web server
tunnel = runloop_client.devboxes.create_tunnel(id=devbox.id, port=4040)
print(f"Tunnel URL: {tunnel.url}:{tunnel.port}")

# Clean up
runloop_client.devboxes.shutdown(id=devbox.id)
print("Devbox deleted") 