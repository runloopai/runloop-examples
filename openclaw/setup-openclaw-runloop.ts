/**
 * OpenClaw + Runloop.ai Setup Guide
 *
 * This script demonstrates how to securely run OpenClaw inside Runloop devboxes,
 * eliminating host-level security risks while maintaining full agent capabilities.
 *
 * Prerequisites:
 * - Node.js installed locally
 * - Runloop account with API key (get from https://runloop.ai/dashboard)
 *
 * Setup Steps:
 * 1. Install dependencies locally
 * 2. Create and configure a devbox
 * 3. Install OpenClaw on the devbox
 * 4. Snapshot the configured devbox
 * 5. Launch from snapshot for production use
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RunloopSDK } from "@runloop/api-client";

// ============================================================================
// STEP 0: Local Setup
// ============================================================================
/**
 * Before running this script, install required tools locally:
 *
 * npm install -g @runloop/api-client rl-cli
 *
 * Set your Runloop API key as an environment variable:
 * export RUNLOOP_API_KEY="your_api_key_here"
 */

// ============================================================================
// STEP 1: Initial Devbox Setup for OpenClaw Installation
// ============================================================================

interface DevboxSetupResult {
  devboxId: string;
  snapshotId: string;
  snapshotName: string;
}

async function setupOpenClawDevbox(): Promise<DevboxSetupResult> {
  const client = new RunloopSDK({
    bearerToken: process.env.RUNLOOP_API_KEY,
  });

  console.log("Creating new devbox for OpenClaw installation...");

  // Create a medium-sized devbox as root user (waits for running state)
  const devbox = await client.devbox.create({
    name: "openclaw-setup",
    launch_parameters: {
      resource_size_request: "MEDIUM",
    },
    environment_variables: {
      USER: "root",
      HOME: "/root",
    },
  });

  console.log(`Devbox created: ${devbox.id}`);
  console.log("Devbox is running!");
  console.log(`\n${"=".repeat(70)}`);
  console.log("MANUAL SETUP REQUIRED");
  console.log("=".repeat(70));
  console.log("\nNow SSH into the devbox to install OpenClaw:");
  console.log(`\n   rli devbox ssh ${devbox.id}\n`);
  console.log("Once connected, run these commands:");
  console.log("\n   npm install -g openclaw@latest");
  console.log("   openclaw onboard --install-daemon\n");
  console.log('Follow the guided setup process. When complete, type "exit"');
  console.log("to return to this script.\n");
  console.log("=".repeat(70));

  // Wait for user confirmation
  console.log("\nPress Enter after you have completed the OpenClaw setup...");
  await waitForUserInput();

  // Create snapshot with date-stamped name
  const today = new Date().toISOString().split("T")[0];
  const snapshotName = `openclaw-base-${today}`;

  console.log(`\nCreating snapshot: ${snapshotName}...`);
  const snapshot = await devbox.snapshotDisk({ name: snapshotName });

  console.log("Snapshot created successfully!");
  console.log(`   Snapshot ID: ${snapshot.id}`);
  console.log(`   Snapshot Name: ${snapshotName}`);

  // Shutdown the setup devbox (we'll use snapshots from now on)
  console.log("\nShutting down setup devbox...");
  await devbox.shutdown();
  console.log("Setup devbox shutdown complete");

  return {
    devboxId: devbox.id,
    snapshotId: snapshot.id,
    snapshotName,
  };
}

// ============================================================================
// STEP 2: Execute OpenClaw Commands from Snapshot
// ============================================================================

interface OpenClawExecutionResult {
  devboxId: string;
  command: string;
  output: string;
  preExecutionSnapshot: string;
  postExecutionSnapshot: string;
}

/**
 * Launches a devbox from the OpenClaw snapshot, executes a command,
 * and snapshots the state before shutdown.
 *
 * BEST PRACTICE: Always snapshot after each OpenClaw command to preserve
 * the agent's state and provide rollback points.
 */
async function executeOpenClawCommand(
  snapshotId: string,
  message: string,
  thinking: "low" | "medium" | "high" = "high",
): Promise<OpenClawExecutionResult> {
  const client = new RunloopSDK({
    bearerToken: process.env.RUNLOOP_API_KEY,
  });

  console.log(`\n${"=".repeat(70)}`);
  console.log("OPENCLAW EXECUTION SESSION");
  console.log("=".repeat(70));
  console.log(`Command: "${message}"`);
  console.log(`Thinking Level: ${thinking}`);
  console.log(`${"=".repeat(70)}\n`);

  // Launch devbox from snapshot (waits for running state)
  console.log("Launching devbox from snapshot...");
  const devbox = await client.devbox.createFromSnapshot(snapshotId, {
    name: `openclaw-task-${Date.now()}`,
    launch_parameters: {
      resource_size_request: "MEDIUM",
    },
  });

  console.log(`Devbox launched: ${devbox.id}`);
  console.log("Devbox ready for execution\n");

  // Create pre-execution snapshot
  const preSnapshotName = `openclaw-pre-${Date.now()}`;
  console.log(`Creating pre-execution snapshot: ${preSnapshotName}...`);
  const preSnapshot = await devbox.snapshotDisk({ name: preSnapshotName });
  console.log(`Pre-execution snapshot created: ${preSnapshot.id}\n`);

  // Execute OpenClaw command
  const openclawCommand = `openclaw agent --message "${message}" --thinking ${thinking}`;
  console.log(`Executing: ${openclawCommand}\n`);
  console.log("Streaming logs (this may take a while)...\n");

  const result = await devbox.cmd.exec(openclawCommand);
  const stdout = await result.stdout();
  const stderr = await result.stderr();

  console.log("--- OpenClaw Output ---");
  console.log(stdout);
  if (stderr) {
    console.log("--- Errors/Warnings ---");
    console.log(stderr);
  }
  console.log("--- End Output ---\n");

  // BEST PRACTICE: Snapshot after each command to preserve agent state
  const postSnapshotName = `openclaw-post-${Date.now()}`;
  console.log(`Creating post-execution snapshot: ${postSnapshotName}...`);
  const postSnapshot = await devbox.snapshotDisk({ name: postSnapshotName });
  console.log(`Post-execution snapshot created: ${postSnapshot.id}`);
  console.log("   This snapshot preserves the agent state for future use\n");

  // Shutdown devbox
  console.log("Shutting down devbox...");
  await devbox.shutdown();
  console.log("Devbox shutdown complete\n");

  return {
    devboxId: devbox.id,
    command: openclawCommand,
    output: stdout,
    preExecutionSnapshot: preSnapshot.id,
    postExecutionSnapshot: postSnapshot.id,
  };
}

// ============================================================================
// STEP 3: Interactive Execution (Alternative to SDK)
// ============================================================================

/**
 * For interactive debugging or manual control, you can use RLI:
 *
 * 1. Create devbox from snapshot:
 *    const devbox = await client.devbox.createFromSnapshot('snap_xxx', { name: 'my-devbox' });
 *
 * 2. SSH into the devbox:
 *    rli devbox ssh <devbox-id>
 *
 * 3. Run OpenClaw commands manually:
 *    openclaw agent --message "Your task" --thinking high
 *
 * 4. Exit and snapshot from your script:
 *    await devbox.snapshotDisk({ name: '...' });
 *
 * This approach gives you full visibility into OpenClaw's execution
 * while maintaining the security boundary of the devbox.
 */

// ============================================================================
// Helper Functions
// ============================================================================

function waitForUserInput(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  try {
    console.log("OpenClaw + Runloop.ai Setup\n");

    // PHASE 1: Initial setup (run once)
    console.log("PHASE 1: Setting up OpenClaw on a fresh devbox\n");
    const setup = await setupOpenClawDevbox();
    console.log("\nSetup complete!");
    console.log(`   Snapshot ID: ${setup.snapshotId}`);
    console.log(`   Snapshot Name: ${setup.snapshotName}\n`);

    // PHASE 2: Execute commands from snapshot (run as needed)
    console.log("PHASE 2: Executing OpenClaw commands from snapshot\n");

    const result1 = await executeOpenClawCommand(
      setup.snapshotId,
      "Create a ship checklist for our product launch",
      "high",
    );
    console.log("Task 1 complete\n");

    const result2 = await executeOpenClawCommand(
      setup.snapshotId,
      "Analyze our codebase and suggest performance improvements",
      "high",
    );
    console.log("Task 2 complete\n");

    console.log("=".repeat(70));
    console.log("All tasks completed successfully!");
    console.log("=".repeat(70));
    console.log("\nSnapshot History:");
    console.log(`  Base: ${setup.snapshotName}`);
    console.log(`  Task 1 Pre: ${result1.preExecutionSnapshot}`);
    console.log(`  Task 1 Post: ${result1.postExecutionSnapshot}`);
    console.log(`  Task 2 Pre: ${result2.preExecutionSnapshot}`);
    console.log(`  Task 2 Post: ${result2.postExecutionSnapshot}`);
    console.log("\nEach snapshot can be used to launch new devboxes");
    console.log("   preserving the exact state at that point in time.\n");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Export functions for use as a library
export {
  setupOpenClawDevbox,
  executeOpenClawCommand,
  type DevboxSetupResult,
  type OpenClawExecutionResult,
};
