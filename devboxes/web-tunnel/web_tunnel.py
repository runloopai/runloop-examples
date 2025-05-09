import os
from runloop_api_client import Runloop

# Initialize the Runloop client
runloop_client = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

# Create a devbox with port 4040 available and start a web server
devbox = runloop_client.devboxes.create_and_await_running(
    launch_parameters={
        "available_ports": [4040],
        "entrypoint": "python3 -m http.server 4040"
    }
)
print(f"Created devbox with ID: {devbox.id}")

# Create a tunnel to the web server
tunnel = devbox.create_tunnel(port=4040)
print(f"Tunnel URL: {tunnel.url}")

# Keep the tunnel open for 60 seconds
import time
time.sleep(60)

# Clean up
devbox.delete()
print("Devbox deleted") 