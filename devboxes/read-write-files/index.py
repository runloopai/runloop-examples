import os
from runloop_api_client import Runloop

# Initialize the Runloop client
runloop_client = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

# Create a devbox and wait for it to be ready
print("Creating devbox...")
devbox = runloop_client.devboxes.create_and_await_running(name="read-write-files-py")
print(f"Created devbox with ID: {devbox.id}")

# Write a small text file
file_path = "/home/user/example.txt"
content = "Hello from Runloop devbox!"
runloop_client.devboxes.write_file_contents(devbox.id, file_path=file_path, contents=content)
print(f"Wrote content to {file_path}")

# Read the file back
read_content = runloop_client.devboxes.read_file_contents(devbox.id, file_path=file_path)
print(f"Read content from {file_path}: {read_content}")

# Clean up
runloop_client.devboxes.shutdown(devbox.id)
print("Devbox shutdown") 