// npm install ai @ai-sdk/openai @e2b/code-interpreter
import { openai } from "@ai-sdk/openai";
import Runloop from "@runloop/api-client";
import { generateText } from "ai";

// Initialize clients
const runloop = new Runloop({ bearerToken: process.env.RUNLOOP_API_KEY });
const model = openai("gpt-4o");

async function generateMazeCreator() {
  const prompt = `Write a Python script that generates a maze. The script should:
    1. Accept a size parameter from command line arguments
    2. Generate a random maze of the specified size. Remember to make the maze solvable and easy and to make it clear the outer borders of the maze.
    3. Print the maze where '#' represents walls and ' ' represents paths. Mark the Maze start with 'S' and end with 'E'
    4. Use argparse for command line argument parsing
    The code should be in the format of a Python script that can be run directly with 'python gen_maze.py --size 5'.
    ONLY output the code and do NOT wrap the code in markdown! Your code should start with an import and end with a print statement. Do not include the word python and you do not need a shebang.`;

  try {
    // Generate code with OpenAI
    const { text: mazeGenerationScript } = await generateText({
      model,
      prompt,
    });
    console.log(mazeGenerationScript);

    // Execute the script in a Devbox
    const devbox = await runloop.devboxes.createAndAwaitRunning();
    console.log(`Devbox ID: ${devbox.id}`);

    await runloop.devboxes.writeFileContents(devbox.id, {
      file_path: "gen_maze.py",
      contents: mazeGenerationScript,
    });

    const { exit_status, stdout, stderr } = await runloop.devboxes.executeSync(devbox.id, {
      command: "python gen_maze.py --size 10",
    });

    exit_status === 0
      ? console.log("Maze generated successfully\n", stdout)
      : console.error("Maze generation failed\n", stderr);
  } catch (error) {
    console.error("Error:", error);
  }
}

generateMazeCreator();
