"""
OpenClaw + Runloop.ai Setup Guide (Python)

This script demonstrates how to securely run OpenClaw inside Runloop devboxes,
eliminating host-level security risks while maintaining full agent capabilities.

Prerequisites:
- Python 3.8+ installed locally
- Runloop account with API key (get from https://runloop.ai/dashboard)

Setup Steps:
1. Install dependencies locally
2. Create and configure a devbox
3. Install OpenClaw on the devbox
4. Snapshot the configured devbox
5. Launch from snapshot for production use
"""

import os
from datetime import datetime
from runloop_api_client import RunloopSDK

# ============================================================================
# STEP 0: Local Setup
# ============================================================================
"""
Before running this script, install required tools locally:

pip install runloop-api-client
npm install -g rl-cli

Set your Runloop API key as an environment variable:
export RUNLOOP_API_KEY="your_api_key_here"
"""

# ============================================================================
# STEP 1: Initial Devbox Setup for OpenClaw Installation
# ============================================================================


class DevboxSetupResult:
    def __init__(self, devbox_id: str, snapshot_id: str, snapshot_name: str):
        self.devbox_id = devbox_id
        self.snapshot_id = snapshot_id
        self.snapshot_name = snapshot_name


def setup_openclaw_devbox() -> DevboxSetupResult:
    """
    Creates a devbox, guides user through OpenClaw installation via SSH,
    and creates a snapshot for future use.
    """
    client = RunloopSDK(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

    print("Creating new devbox for OpenClaw installation...")

    # Create a medium-sized devbox as root user (waits for running state)
    devbox = client.devbox.create(
        name="openclaw-setup",
        launch_parameters={"resource_size_request": "MEDIUM"},
        environment_variables={"USER": "root", "HOME": "/root"},
    )

    print(f"Devbox created: {devbox.id}")
    print("Devbox is running!")
    print("\n" + "=" * 70)
    print("MANUAL SETUP REQUIRED")
    print("=" * 70)
    print("\nNow SSH into the devbox to install OpenClaw:")
    print(f"\n   rli devbox ssh {devbox.id}\n")
    print("Once connected, run these commands:")
    print("\n   npm install -g openclaw@latest")
    print("   openclaw onboard --install-daemon\n")
    print('Follow the guided setup process. When complete, type "exit"')
    print("to return to this script.\n")
    print("=" * 70)

    # Wait for user confirmation
    print("\nPress Enter after you have completed the OpenClaw setup...")
    input()

    # Create snapshot with date-stamped name
    today = datetime.now().strftime("%Y-%m-%d")
    snapshot_name = f"openclaw-base-{today}"

    print(f"\nCreating snapshot: {snapshot_name}...")
    snapshot = devbox.snapshot_disk(name=snapshot_name)

    print("Snapshot created successfully!")
    print(f"   Snapshot ID: {snapshot.id}")
    print(f"   Snapshot Name: {snapshot_name}")

    # Shutdown the setup devbox (we'll use snapshots from now on)
    print("\nShutting down setup devbox...")
    devbox.shutdown()
    print("Setup devbox shutdown complete")

    return DevboxSetupResult(
        devbox_id=devbox.id, snapshot_id=snapshot.id, snapshot_name=snapshot_name
    )


# ============================================================================
# STEP 2: Execute OpenClaw Commands from Snapshot
# ============================================================================


class OpenClawExecutionResult:
    def __init__(
        self,
        devbox_id: str,
        command: str,
        output: str,
        pre_execution_snapshot: str,
        post_execution_snapshot: str,
    ):
        self.devbox_id = devbox_id
        self.command = command
        self.output = output
        self.pre_execution_snapshot = pre_execution_snapshot
        self.post_execution_snapshot = post_execution_snapshot


def execute_openclaw_command(
    snapshot_id: str, message: str, thinking: str = "high"
) -> OpenClawExecutionResult:
    """
    Launches a devbox from the OpenClaw snapshot, executes a command,
    and snapshots the state before shutdown.

    BEST PRACTICE: Always snapshot after each OpenClaw command to preserve
    the agent's state and provide rollback points.

    Args:
        snapshot_id: The snapshot ID to launch from
        message: The message/task for OpenClaw
        thinking: Thinking level ('low', 'medium', or 'high')

    Returns:
        OpenClawExecutionResult with command output and snapshot IDs
    """
    client = RunloopSDK(bearer_token=os.environ.get("RUNLOOP_API_KEY"))

    print(f"\n{'=' * 70}")
    print("OPENCLAW EXECUTION SESSION")
    print("=" * 70)
    print(f'Command: "{message}"')
    print(f"Thinking Level: {thinking}")
    print("=" * 70 + "\n")

    # Launch devbox from snapshot (waits for running state)
    print("Launching devbox from snapshot...")
    devbox = client.devbox.create_from_snapshot(
        snapshot_id,
        name=f"openclaw-task-{int(datetime.now().timestamp())}",
        launch_parameters={"resource_size_request": "MEDIUM"},
    )

    print(f"Devbox launched: {devbox.id}")
    print("Devbox ready for execution\n")

    # Create pre-execution snapshot
    pre_snapshot_name = f"openclaw-pre-{int(datetime.now().timestamp())}"
    print(f"Creating pre-execution snapshot: {pre_snapshot_name}...")
    pre_snapshot = devbox.snapshot_disk(name=pre_snapshot_name)
    print(f"Pre-execution snapshot created: {pre_snapshot.id}\n")

    # Execute OpenClaw command
    openclaw_command = f'openclaw agent --message "{message}" --thinking {thinking}'
    print(f"Executing: {openclaw_command}\n")
    print("Streaming logs (this may take a while)...\n")

    result = devbox.cmd.exec(openclaw_command)

    print("--- OpenClaw Output ---")
    print(result.stdout())
    if result.stderr():
        print("--- Errors/Warnings ---")
        print(result.stderr())
    print("--- End Output ---\n")

    # BEST PRACTICE: Snapshot after each command to preserve agent state
    post_snapshot_name = f"openclaw-post-{int(datetime.now().timestamp())}"
    print(f"Creating post-execution snapshot: {post_snapshot_name}...")
    post_snapshot = devbox.snapshot_disk(name=post_snapshot_name)
    print(f"Post-execution snapshot created: {post_snapshot.id}")
    print("   This snapshot preserves the agent state for future use\n")

    # Shutdown devbox
    print("Shutting down devbox...")
    devbox.shutdown()
    print("Devbox shutdown complete\n")

    return OpenClawExecutionResult(
        devbox_id=devbox.id,
        command=openclaw_command,
        output=result.stdout(),
        pre_execution_snapshot=pre_snapshot.id,
        post_execution_snapshot=post_snapshot.id,
    )


# ============================================================================
# STEP 3: Interactive Execution (Alternative to SDK)
# ============================================================================

"""
For interactive debugging or manual control, you can use RLI:

1. Create devbox from snapshot:
   devbox = client.devbox.create_from_snapshot('snap_xxx', name='my-devbox')

2. SSH into the devbox:
   rli devbox ssh <devbox-id>

3. Run OpenClaw commands manually:
   openclaw agent --message "Your task" --thinking high

4. Exit and snapshot from your script:
   devbox.snapshot_disk(name='...')

This approach gives you full visibility into OpenClaw's execution
while maintaining the security boundary of the devbox.
"""

# ============================================================================
# Example Usage
# ============================================================================


def main():
    """
    Main execution flow demonstrating the complete OpenClaw + Runloop workflow.
    """
    try:
        print("OpenClaw + Runloop.ai Setup\n")

        # PHASE 1: Initial setup (run once)
        print("PHASE 1: Setting up OpenClaw on a fresh devbox\n")
        setup = setup_openclaw_devbox()
        print("\nSetup complete!")
        print(f"   Snapshot ID: {setup.snapshot_id}")
        print(f"   Snapshot Name: {setup.snapshot_name}\n")

        # PHASE 2: Execute commands from snapshot (run as needed)
        print("PHASE 2: Executing OpenClaw commands from snapshot\n")

        result1 = execute_openclaw_command(
            setup.snapshot_id, "Create a ship checklist for our product launch", "high"
        )
        print("Task 1 complete\n")

        result2 = execute_openclaw_command(
            setup.snapshot_id, "Analyze our codebase and suggest performance improvements", "high"
        )
        print("Task 2 complete\n")

        print("=" * 70)
        print("All tasks completed successfully!")
        print("=" * 70)
        print("\nSnapshot History:")
        print(f"  Base: {setup.snapshot_name}")
        print(f"  Task 1 Pre: {result1.pre_execution_snapshot}")
        print(f"  Task 1 Post: {result1.post_execution_snapshot}")
        print(f"  Task 2 Pre: {result2.pre_execution_snapshot}")
        print(f"  Task 2 Post: {result2.post_execution_snapshot}")
        print("\nEach snapshot can be used to launch new devboxes")
        print("   preserving the exact state at that point in time.\n")

    except Exception as error:
        print(f"Error: {error}")
        raise


if __name__ == "__main__":
    main()
