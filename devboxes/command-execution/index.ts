import { Runloop } from "@runloop/api-client";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Initialize the Runloop client
  const runloopClient = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY,
  });

  let devbox;

  try {
    // Create a devbox and wait for it to be ready
    console.log("Creating devbox...");
    devbox = await runloopClient.devboxes.createAndAwaitRunning();
    console.log(`Devbox created: ${devbox.id}`);

    // Example 1: Synchronous command execution
    console.log("\nExecuting synchronous command...");
    const syncResult = await runloopClient.devboxes.executeSync(devbox.id, {
      command: "echo 'Hello from synchronous command'",
    });
    console.log(`Command output: ${syncResult.stdout}`);

    // Example 2: Asynchronous command execution
    console.log("\nExecuting asynchronous command...");
    const execution = await runloopClient.devboxes.executeAsync(devbox.id, {
      command:
        "for i in {1..5}; do echo 'Hello from async command $i'; sleep 1; done",
    });

    // Poll for results
    while (true) {
      const status = await runloopClient.devboxes.executions.awaitCompleted(
        devbox.id,
        execution.execution_id
      );
      console.log(`Latest output: ${status.stdout}`);
      if (status.status === "completed") {
        break;
      }
      await sleep(1000);
    }

    // Example 3: Stateful shell operations
    console.log("\nDemonstrating stateful shell operations...");
    const shellName = "my-shell";

    // Check initial directory
    const initialDir = await runloopClient.devboxes.executeSync(devbox.id, {
      command: "pwd",
      shell_name: shellName,
    });
    console.log(`Initial directory: ${initialDir.stdout}`);

    // Create and enter new directory
    await runloopClient.devboxes.executeSync(devbox.id, {
      command: "mkdir -p mynewfolder && cd mynewfolder",
      shell_name: shellName,
    });

    // Verify directory change persisted
    const newDir = await runloopClient.devboxes.executeSync(devbox.id, {
      command: "pwd",
      shell_name: shellName,
    });
    console.log(`New directory: ${newDir.stdout}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    if (devbox) {
      console.log("\nShutting down devbox...");
      await runloopClient.devboxes.shutdown(devbox.id);
    }
  }
}

main();
