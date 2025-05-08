import { Runloop } from "@runloop/api-client";

// Initialize the Runloop client with API key from environment variable
const runloopClient = new Runloop({
  bearerToken: process.env.RUNLOOP_API_KEY,
});

async function main() {
  try {
    // Create the first devbox and wait for it to be ready
    console.log("Creating devboxes");

    const devbox1 = await runloopClient.devboxes.createAndAwaitRunning();
    console.log(`Devbox 1 created: ${devbox1.id}`);

    // Create the second devbox with a custom timeout
    const devbox2 = await runloopClient.devboxes.createAndAwaitRunning(
      {},
      {
        timeout: 300,
      }
    );
    console.log(
      `You can access your devbox at: https://platform.runloop.ai/devboxes/${devbox2.id}?tab=shell`
    );

    // Shutdown the first devbox
    await runloopClient.devboxes.shutdown(devbox1.id);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
