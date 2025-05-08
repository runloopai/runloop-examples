import os
from runloop_api_client import Runloop

runloop_client = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

# create the devbox and wait for it to be ready
print("Creating devboxes")
devbox1 = runloop_client.devboxes.create_and_await_running()
print(f"Devbox 1 created: {devbox1.id}")

devbox2 = runloop_client.devboxes.create_and_await_running(timeout=300)
print(f"You can access your devbox at: https://platform.runloop.ai/devboxes/{devbox2.id}?tab=shell")

runloop_client.devboxes.shutdown(devbox1.id)
