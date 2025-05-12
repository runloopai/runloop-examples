import { Runloop } from "@runloop/api-client";

async function main() {
  // Initialize the Runloop client
  const runloop = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY!,
  });

  // Create a devbox with port 4040 available and start a web server
  const devbox = await runloop.devboxes.createAndAwaitRunning({
    launch_parameters: {
      available_ports: [4040],
      keep_alive_time_seconds: 60,
    },
  });
  console.log(`Created devbox with ID: ${devbox.id}`);

  // Create a tunnel to the web server
  const tunnel = await runloop.devboxes.createTunnel(devbox.id, { port: 4040 });
  console.log(`Tunnel URL: ${tunnel.url}:${tunnel.port}`);

  // Clean up
  await runloop.devboxes.shutdown(devbox.id);
  console.log("Devbox deleted");
}

main().catch(console.error);
