import { Runloop } from "@runloop/api-client";

async function main() {
  // Initialize the Runloop client
  const runloop = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY!,
  });

  // Create a devbox and wait for it to be ready
  console.log("Creating devbox...");
  let devbox;

  try {
    devbox = await runloop.devboxes.createAndAwaitRunning({
      name: "read-write-files-ts",
    });

    // Write a small text file
    // All files are relative to /home/user
    const file_path = "/home/user/example.txt";
    const contents = "Hello from Runloop devbox!";
    await runloop.devboxes.writeFileContents(devbox.id, {
      file_path,
      contents,
    });
    console.log(`Wrote content to ${file_path}`);

    // Read the file back
    const readContent = await runloop.devboxes.readFileContents(devbox.id, {
      file_path,
    });
    console.log(`Read content from ${file_path}: ${readContent}`);
  } catch (error) {
    console.error(error);
  } finally {
    if (devbox) {
      await runloop.devboxes.shutdown(devbox.id);
      console.log("Devbox shutdown");
    }
  }
}

main();
