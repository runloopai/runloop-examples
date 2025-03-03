import { Runloop } from "@runloop/api-client";
import type { DevboxView } from "@runloop/api-client/resources";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessage } from "openai/resources";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RUNLOOP_API_KEY = process.env.RUNLOOP_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}
if (!RUNLOOP_API_KEY) {
  throw new Error("RUNLOOP_API_KEY is not set");
}
if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not set");
}

// Initialize clients
const runloop = new Runloop({ bearerToken: RUNLOOP_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const MAX_ITERATIONS = 10;
const SYSTEM_PROMPT = `
You are an expert coder and git user.
`.trim();

const USER_PROMPT = `
Find and navigate to the code repository located in a subdirectory of /home/user and perform cleanups.

- If the repository has a README.md file, use the \`npx doctoc README.md --github\` command to add or update the table of contents.
- If the repository appears to be a Javascript or Typescript project, install and run \`npx @biomejs/biome lint --write .\` to fix all lint errors.

Once you've made all the fixes, stage all changes with git, then show the diff with \`git diff --cached\`.
`.trim();

// Tool definitions
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
      name: "readFile",
      description: "Reads a file on the devbox",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string" },
        },
        required: ["filename"],
        additionalProperties: false,
      },
      strict: true,
    },
  } as const,
  {
    type: "function",
    function: {
      name: "writeFile",
      description: "Writes a file on the devbox",
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
];

async function runAgent(devbox: DevboxView) {
  const messageHistory: ChatCompletionMessage[] = [
    { role: "assistant", content: SYSTEM_PROMPT, refusal: null },
    { role: "user", content: USER_PROMPT, refusal: null } as unknown as ChatCompletionMessage,
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

      const latestMessage: ChatCompletionMessage = response.choices[0].message;
      messageHistory.push(latestMessage);

      if (!latestMessage.tool_calls) break;

      const toolResponses: ChatCompletionMessage[] = [];

      // Process function calls
      for (const toolCall of latestMessage.tool_calls) {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let result: string;

        switch (toolCall.function.name) {
          case "executeShellCommand":
            result = (
              await runloop.devboxes.executeSync(devbox.id, { command: functionArgs.command })
            ).stdout;
            break;
          case "readFile":
            result = await runloop.devboxes.readFileContents(devbox.id, {
              file_path: functionArgs.filename,
            });
            break;
          case "writeFile":
            await runloop.devboxes.writeFileContents(devbox.id, {
              file_path: functionArgs.filename,
              contents: functionArgs.contents,
            });
            result = "File written successfully.";
            break;
          default:
            throw new Error(`Unknown tool ${toolCall.function.name}`);
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
    }
    numIterations++;
  }
  if (!response) {
    console.error("Did not receive a response, something went wrong...");
    return;
  }

  console.log(response.choices[0].message.content);
}

function parseGithubUrl(url: string): [string, string] {
  if (!url.startsWith("https://github.com/")) {
    throw new Error("Invalid github url");
  }

  const parsed = new URL(url);
  const path = parsed.pathname.replace(/^\/|\/$/g, "");
  const parts = path.split("/");

  if (parts.length !== 2) {
    throw new Error("Invalid github url - must contain owner and repo");
  }

  const repoName = parts[1].endsWith(".git") ? parts[1].replace(/\.git$/, "") : parts[1];

  return [parts[0], repoName];
}

async function main() {
  if (process.argv.length !== 3) {
    console.error("Usage: ts-node agent.ts <github url> \nUsage: npm run start -- <github url> ");
    process.exit(1);
  }

  const [repoOwner, repoName] = parseGithubUrl(process.argv[2]);
  console.log(`Repository owner: ${repoOwner}, repository name: ${repoName}`);
  console.log("Creating devbox ...");
  const devbox = await runloop.devboxes.createAndAwaitRunning({
    code_mounts: [
      {
        repo_name: repoName,
        repo_owner: repoOwner,
        token: GITHUB_TOKEN,
      },
    ],
  });

  try {
    await runAgent(devbox);
  } finally {
    console.log(`Destroying devbox ${devbox.id}...`);
    await runloop.devboxes.shutdown(devbox.id);
  }
}

main().catch(console.error);
