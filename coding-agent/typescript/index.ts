import { Runloop } from "@runloop/api-client";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessage } from "openai/resources";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RUNLOOP_API_KEY = process.env.RUNLOOP_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key.");
}
if (!RUNLOOP_API_KEY) {
  throw new Error("Missing Runloop API key.");
}

// Initialize clients
const runloop = new Runloop({ bearerToken: RUNLOOP_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const MAX_ITERATIONS = 10;
const SYSTEM_PROMPT =
  "You are an expert Python coder that specializes in making single-file bash scripts.".trim();

const USER_PROMPT = `
Write a command-line script that prints sys.argv[1:] as ASCII words.
The program should be callable from the command line via \`python script.py\` and print the words on stdout.

Once you have generated the program, run it and print the output to stdout.

After running the program, change the ASCII art to be a little fancier,
then print it again.

Once it works, read the final program from the file and return it to me,
and in a separate code block print an example usage and output. The example
output should come from executing the program with the tool, with
the arguments "hello runloop".
`.trim();

// Define a single universal function schema
const universalFunctionSchema = {
  function: {
    name: "useRunloopTools",
    description:
      "Perform operations inside a Runloop Devbox, such as executing commands on the shell, reading files, or writing files.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["execute_command", "read_file", "write_file"],
          description:
            "The type of action to perform: execute a shell command, read a file, or write a file.",
        },
        command: {
          type: "string",
          description: "The shell command to execute (if action is 'execute_command').",
        },
        filename: {
          type: "string",
          description:
            "The file path for reading a file if action is 'read_file'. All files should be read from /home/user/",
        },
        contents: {
          type: "string",
          description: "The contents to write to the file (if action is 'write_file').",
        },
      },
      required: ["action", "command", "filename", "contents"],
      additionalProperties: false,
    },
    strict: true,
  },
  type: "function",
} as const;

// Define helper functions for executing tool calls
async function executeShellCommandInsideDevbox(devboxId: string, command: string): Promise<string> {
  return (await runloop.devboxes.executeSync(devboxId, { command })).stdout;
}

async function readFileFromDevbox(devboxId: string, filename: string): Promise<string> {
  return runloop.devboxes.readFileContents(devboxId, { file_path: filename });
}

async function writeFileToDevbox(
  devboxId: string,
  filename: string,
  contents: string,
): Promise<void> {
  await runloop.devboxes.writeFileContents(devboxId, {
    file_path: filename,
    contents: contents,
  });
}

// Define function to run the agent
async function runAgent(devboxId: string) {
  const messageHistory: ChatCompletionMessage[] = [
    { role: "assistant", content: SYSTEM_PROMPT, refusal: null },
    {
      role: "user",
      content: USER_PROMPT,
      refusal: null,
    } as unknown as ChatCompletionMessage,
  ];

  let numIterations = 0;
  let response: ChatCompletion;

  // Loop until we reach the maximum number of iterations
  while (numIterations < MAX_ITERATIONS) {
    try {
      response = await openai.chat.completions.create({
        messages: messageHistory,
        model: "gpt-4-turbo",
        tools: [universalFunctionSchema],
        tool_choice: "auto",
      });

      const latestMessage: ChatCompletionMessage = response.choices[0].message;
      messageHistory.push(latestMessage);

      if (!latestMessage.tool_calls) break;

      const toolResponses: ChatCompletionMessage[] = [];

      // Process function calls
      for (const toolCall of latestMessage.tool_calls) {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let result: string;

        switch (functionArgs.action) {
          case "execute_command":
            result = await executeShellCommandInsideDevbox(devboxId, functionArgs.command);
            break;
          case "read_file":
            result = await readFileFromDevbox(devboxId, functionArgs.filename);
            break;
          case "write_file":
            await writeFileToDevbox(devboxId, functionArgs.filename, functionArgs.contents);
            result = "File written successfully.";
            break;
          default:
            throw new Error(`Unknown action: ${functionArgs.action}`);
        }

        // Add a tool response message for each tool call
        toolResponses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
          refusal: null,
        } as unknown as ChatCompletionMessage);
      }

      messageHistory.push(...toolResponses);
    } catch (error) {
      console.error("Error during OpenAI API call:", error);
      break;
    }
    numIterations++;
  }

  if (!response) {
    console.error("Did not receive a response, something went wrong...");
    return;
  }

  console.log(response.choices[0].message.content);
}

async function main() {
  console.log("Creating a Runloop Devbox...");
  const devbox = await runloop.devboxes.create();
  await runloop.devboxes.awaitRunning(devbox.id);

  try {
    await runAgent(devbox.id);
  } finally {
    console.log("Shutting down the devbox...");
    await runloop.devboxes.shutdown(devbox.id);
  }
}

main().catch(console.error);
