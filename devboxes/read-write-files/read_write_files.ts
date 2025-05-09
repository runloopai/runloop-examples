import { Runloop } from "@runloop/api-client";

async function main() {
  // Initialize the Runloop client
  const runloop = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY!,
  });

  // Create a devbox and wait for it to be ready
  const devbox = await runloop.devboxes.createAndAwaitRunning();
  console.log(`Created devbox with ID: ${devbox.id}`);

  // Write a small text file
  const filePath = "/home/user/example.txt";
  const content = "Hello from Runloop devbox!";
  await devbox.writeFileContents(filePath, content);
  console.log(`Wrote content to ${filePath}`);

  // Read the file back
  const readContent = await devbox.readFileContents(filePath);
  console.log(`Read content from ${filePath}: ${readContent}`);

  // Clean up
  await devbox.delete();
  console.log("Devbox deleted");
}

main().catch(console.error);
