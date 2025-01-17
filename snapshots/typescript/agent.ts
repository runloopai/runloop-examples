import { Runloop } from "@runloop/api-client";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessage, ChatCompletionTool } from "openai/resources";

dotenv.config();

const RUNLOOP_API_KEY = process.env.RUNLOOP_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!RUNLOOP_API_KEY) {
  throw new Error("Missing required API key: RUNLOOP_API_KEY");
}

if (!OPENAI_API_KEY) {
  throw new Error("Missing required API key: OPENAI_API_KEY");
}

const runloop = new Runloop({ bearerToken: RUNLOOP_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const MAX_ITERATIONS = 10;
const SYSTEM_PROMPT = `
You are a senior game developer tasked with creating a simple Python console game of Snake in a Runloop Devbox.
Each step, you will modify and test the game. If the test is successful, take a snapshot of the Devbox.
`;

const USER_PROMPT = `
You are tasked with creating a simple Python console game of Snake in a Runloop Devbox.
All files are located and executeed in the /home/user/ directory.
Start by checking for a snapshot of the game by getting the list of available snapshots using getSnapshotsList.
Look for a snapshot whose name starts with "snake_game_typescript. 
If one exists, start a Devbox from the snapshot with the highest version number. Follow these guidelines to complete the task:

- If starting from a snapshot and the devbox has been started run 'snake_game.py' using the command **"python /home/user/snake_game.py"** in the Devbox.  
- If the file runs without errors, **increment the version number and take a snapshot** named "snake_game_typescript_<version+1>". 
- If the file does not exist, write the initial version of the game to a file named "snake_game.py" in the Devbox.
- Continue iterating and making improvements autonomously. Each iteration should enhance gameplay mechanics.  
-  **DO NOT WAIT FOR USER INPUT before making improvements.** Always assume the next logical improvement.  
- Take a snapshot every time the file runs successfully without errors.  
- If the game still has errors and **${MAX_ITERATIONS} iterations** have been reached, shut down the Devbox and end the task.  
`;

const tools = [
  {
    type: "function",
    function: {
      name: "executeShellCommand",
      description: "Run a shell command in the devbox",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
        additionalProperties: false,
      },
      strict: true,
    },
  } as const,
  {
    type: "function",
    function: {
      name: "writeFile",
      description: "Writes a file on the devbox at /home/user/<filename>",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string" },
          contents: { type: "string" },
        },
        required: ["filename", "contents"],
        additionalProperties: false,
      },
      strict: true,
    },
  } as const,
  {
    type: "function",
    function: {
      name: "createSnapshot",
      description: "Takes a snapshot of the Devbox and saves it",
      parameters: {
        type: "object",
        properties: {
          snapshotName: { type: "string" },
        },
        required: ["snapshotName"],
        additionalProperties: false,
      },
      strict: true,
    },
  } as const,
  {
    type: "function",
    function: {
      name: "getSnapshotsList",
      description: "Gets the list of available snapshots",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      additionalProperties: false,
      strict: true,
    },
  } as const,
  {
    type: "function",
    function: {
      name: "shutdownDevbox",
      description: "Shuts down the current devbox",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      strict: true,
    },
  } as const,
  {
    type: "function",
    function: {
      name: "createDevbox",
      description:
        "Creates a devbox from a snapshot by providing a snapshotId or a new one if not provided",
      parameters: {
        type: "object",
        properties: {
          snapshotId: { type: "string" },
        },
        required: ["snapshotId"],
        additionalProperties: false,
      },
      strict: true,
    },
  } as const,
];

async function runAgent() {
  let devboxId = "";

  const messageHistory: ChatCompletionMessage[] = [
    { role: "assistant", content: SYSTEM_PROMPT, refusal: null },
    {
      role: "user",
      content: USER_PROMPT,
      refusal: null,
    } as unknown as ChatCompletionMessage,
  ];

  let numIterations = 0;
  let response: ChatCompletion | null = null;

  while (numIterations < MAX_ITERATIONS) {
    try {
      response = await openai.chat.completions.create({
        messages: messageHistory,
        model: "gpt-4-turbo",
        tools: tools,
        tool_choice: "auto",
      });

      const latestMessage = response.choices[0].message;
      messageHistory.push(latestMessage);

      if (!latestMessage.tool_calls) break;

      const toolResponses: ChatCompletionMessage[] = [];

      if (latestMessage.tool_calls.length !== 0) {
        for (const toolCall of latestMessage.tool_calls) {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          let result: string;

          if (
            !devboxId &&
            toolCall.function.name !== "createDevbox" &&
            toolCall.function.name !== "getSnapshotsList"
          ) {
            console.log(
              `No devbox exists, and the agent isn't trying to create or list snapshots. Creating a new devbox... ${toolCall.function.name}`,
            );
            devboxId = await runloop.devboxes.createAndAwaitRunning().then((devox) => devox.id);
          }

          console.log(`Executing tool call: ${toolCall.function.name}`);
          switch (toolCall.function.name) {
            case "executeShellCommand":
              {
                const test = await runloop.devboxes.executeSync(devboxId, {
                  command: functionArgs.command,
                });
                result = `${test.stdout} ${test.stderr}`;
                console.log(result);
              }
              break;
            case "writeFile":
              await runloop.devboxes.writeFileContents(devboxId, {
                file_path: functionArgs.filename,
                contents: functionArgs.contents,
              });
              result = "File written successfully";
              break;
            case "createSnapshot":
              await runloop.devboxes.snapshotDisk(devboxId, {
                name: functionArgs.snapshotName,
              });
              result = `Snapshot signal sent with name ${functionArgs.snapshotName}`;
              break;
            case "getSnapshotsList":
              result = JSON.stringify(await runloop.devboxes.listDiskSnapshots());
              break;
            case "shutdownDevbox":
              console.log("Shutting down the devbox...");
              await runloop.devboxes.shutdown(devboxId);
              result = "Devbox shutdown signal sent.";
              break;
            case "createDevbox":
              console.log("Creating the devbox...");
              result = functionArgs.snapshotId
                ? await runloop.devboxes
                    .createAndAwaitRunning({
                      snapshot_id: functionArgs.snapshotId,
                    })
                    .then((devox) => devox.id)
                : (await runloop.devboxes.createAndAwaitRunning()).id;
              devboxId = result;
              result = devboxId;
              break;
            default:
              throw new Error(`Unknown action: ${functionArgs.action}`);
          }

          toolResponses.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          } as unknown as ChatCompletionMessage);
        }
      }

      messageHistory.push(...toolResponses);
    } catch (error) {
      console.error("Error during OpenAI API call:", error);
      break;
    }
    numIterations++;
  }

  if (!response) {
    console.error("Error: No response received from OpenAI API after", numIterations, "iterations");
    return;
  }

  console.log(response.choices[0].message.content);
  console.log(`The total number of iterations is ${numIterations}`);
}

async function main() {
  await runAgent();
}

main().catch(console.error);
