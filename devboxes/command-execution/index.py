import os
import time
from runloop_api_client import Runloop

def main():
    # Initialize the Runloop client
    runloop_client = Runloop(bearer_token=os.environ.get("RUNLOOP_API_KEY"))
    
    try:
        # Create a devbox and wait for it to be ready
        print("Creating devbox...")
        devbox = runloop_client.devboxes.create_and_await_running(name="command-execution-devbox-py")
        print(f"Devbox created: {devbox.id}")
        
        # Example 1: Synchronous command execution
        print("\nExecuting synchronous command...")
        result = runloop_client.devboxes.execute_sync(
            id=devbox.id,
            command="echo 'Hello from synchronous command'"
        )
        print(f"Command output: {result.stdout}")
        
        # Example 2: Asynchronous command execution
        print("\nExecuting asynchronous command...")
        execution = runloop_client.devboxes.execute_async(
            id=devbox.id,
            command='for i in {1..5}; do echo \"Hello from async command $i\"; sleep 1; done'
        )
        
        # Poll for results
        while True:
            status = runloop_client.devboxes.executions.retrieve(
                devbox_id=devbox.id,
                execution_id=execution.execution_id
            )
            print(f"Latest output: {status.stdout}")
            if status.status == "completed":
                break
            time.sleep(1)
        
        # Example 3: Stateful shell operations
        print("\nDemonstrating stateful shell operations...")
        shell_name = "my-shell"
        
        # Check initial directory
        result = runloop_client.devboxes.execute_sync(
            id=devbox.id,
            command="pwd",
            shell_name=shell_name
        )
        print(f"Initial directory: {result.stdout}")
        
        # Create and enter new directory
        result = runloop_client.devboxes.execute_sync(
            id=devbox.id,
            command="mkdir -p mynewfolder && cd mynewfolder",
            shell_name=shell_name
        )
        
        # Verify directory change persisted
        result = runloop_client.devboxes.execute_sync(
            id=devbox.id,
            command="pwd",
            shell_name=shell_name
        )
        print(f"New directory: {result.stdout}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Clean up
        if 'devbox' in locals():
            print("\nShutting down devbox...")
            runloop_client.devboxes.shutdown(devbox.id)

if __name__ == "__main__":
    main()
