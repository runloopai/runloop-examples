import { Runloop } from "@runloop/api-client";

async function main() {
  // Initialize the Runloop client
  const runloop = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY!,
  });

  // Create a devbox with port 4040 available and start a web server
  const devbox = await runloop.devboxes.createAndAwaitRunning({
    launchParameters: {
      availablePorts: [4040],
      entrypoint: "python3 -m http.server 4040",
    },
  });
  console.log(`Created devbox with ID: ${devbox.id}`);

  // Create a tunnel to the web server
  const tunnel = await devbox.createTunnel({ port: 4040 });
  console.log(`Tunnel URL: ${tunnel.url}`);

  // Keep the tunnel open for 60 seconds
  await new Promise((resolve) => setTimeout(resolve, 60000));

  // Clean up
  await devbox.delete();
  console.log("Devbox deleted");
}

main().catch(console.error);
