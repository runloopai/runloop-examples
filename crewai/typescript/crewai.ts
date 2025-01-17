// import Runloop from '@runloop/api-client';
// import Crewai from '@crewai/sdk';

// const crewai = new Crewai({
//     apiKey: process.env.CREWAI_API_KEY,
// });

// const runloop = new Runloop({ bearerToken: process.env.RUNLOOP_API_KEY });

// async function generateCode(prompt: string): Promise<string> {
//     const response = await crewai.generate({
//         model: "crewai-3-5",
//         prompt: prompt,
//         maxTokens: 1000,
//         temperature: 0,
//         stop: ["\n"],
//     });
//     return response.text;
// }

// async function generateMazeCreator() {
//     try {
//         const prompt = "Write a Python script that generates a maze. The script should:\n" +
//             "1. Accept a size parameter from command line arguments\n" +
//             "2. Generate a random maze of the specified size. Remember to make the maze solvable and easy and to make it clear the outer borders of the maze.\n" +
//             "3. Print the maze where '#' represents walls and ' ' represents paths. Mark the Maze start with 'S' and end with 'E'\n" +
//             "4. Use argparse for command line argument parsing\n" +
//             "Please provide complete, working code." +
//             "The code should be in the format of a Python script that can be run directly with 'python gen_maze.py --size 5'.\n" +
//             "ONLY output the code and do NOT wrap the code in markdown! \n This means the output should not begin with ```python or end with ```\n";

//         const mazeGenerationScript = await generateCode(prompt);
//         console.log(mazeGenerationScript);

//         // Create a new Devbox so we can securely run our AI generated code
//         const devbox = await runloop.devboxes.createAndAwaitRunning();
//         console.log("Devbox ID:", devbox.id);
//         console.log(devbox.status);

//         await runloop.devboxes.writeFileContents(devbox.id, {
//             file_path: "gen_maze.py",
//             contents: mazeGenerationScript,
//         });

//         const result = await runloop.devboxes.executeSync(devbox.id, {
//             command: "python gen_maze.py --size 13",
//         });

//         if (result.exit_status === 0) {
//             console.log("Maze generated successfully");
//             console.log(result.stdout);
//         } else {
//             console.log("Maze generation failed");
//             console.log(result.stderr);
//         }
//     } catch (error) {
//         console.error("An error occurred: ", error);
//     }
// }

// generateMazeCreator();