import { GoogleGenerativeAI } from "@google/generative-ai";
import Runloop from "@runloop/api-client";

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL }); // non-null assertion operator in use, add default value to handle undefined
const runloop = new Runloop({ bearerToken: process.env.RUNLOOP_API_KEY });

async function generateMazeCreator() {
  const prompt = `Write a Python script that generates a maze. The script should:
    1. Accept a size parameter from command line arguments
    2. Generate a random maze of the specified size. Remember to make the maze solvable and easy and to make it clear the outer borders of the maze.
    3. Print the maze where '#' represents walls and ' ' represents paths. Mark the Maze start with 'S' and end with 'E'
    4. Use argparse for command line argument parsing
    The code should be in the format of a Python script that can be run directly with 'python gen_maze.py --size 5'.
    ONLY output the code and do NOT wrap the code in markdown!`;

  try {
    // Generate code using Google Gemini
    const mazeGenerationScript = (await model.generateContent(prompt)).response.text();
    console.log(mazeGenerationScript);

    // Execute the script in a Devbox
    const devbox = await runloop.devboxes.createAndAwaitRunning();
    console.log(`Devbox ID: ${devbox.id}`);

    await runloop.devboxes.writeFileContents(devbox.id, {
      file_path: "gen_maze.py",
      contents: mazeGenerationScript,
    });

    const { exit_status, stdout, stderr } = await runloop.devboxes.executeSync(devbox.id, {
      command: "python gen_maze.py --size 11",
    });

    exit_status === 0
      ? console.log("Maze generated successfully\n", stdout)
      : console.error("Maze generation failed\n", stderr);
  } catch (error) {
    console.error("Error:", error);
  }
}

generateMazeCreator();
