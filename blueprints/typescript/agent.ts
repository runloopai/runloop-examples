import { Runloop } from "@runloop/api-client";
import type { DevboxView } from "@runloop/api-client/resources";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessage } from "openai/resources";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RUNLOOP_API_KEY = process.env.RUNLOOP_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}
if (!RUNLOOP_API_KEY) {
  throw new Error("RUNLOOP_API_KEY is not set");
}

// Initialize clients
const runloop = new Runloop({ bearerToken: RUNLOOP_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const MAX_ITERATIONS = 16;
const BLUEPRINT_NAME = "ai_devbox_blueprint_ts";
const APT_PACKAGES = ["curl", "jq", "csvkit", "gnuplot", "xmlstarlet", "dateutils"];
const DOCKERFILE = `
FROM public.ecr.aws/f7m5a7m8/devbox:prod

# Set non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_PRIORITY=high

# Install required packages
RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y install \
    curl \
    jq \
    csvkit \
    gnuplot \
    xmlstarlet \
    dateutils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Environment setup for user
ENV USERNAME=user
ENV HOME=/home/$USERNAME

# Switch to non-root user
USER user
WORKDIR $HOME

# Set shell
SHELL ["/bin/bash", "-l", "-c"]
ENV SHELL /bin/bash

CMD while true; do sleep 1; done;
`.trim();

const SYSTEM_PROMPT = `
You are an expert DevOps assistant specializing in data processing and automation.
`.trim();

const USER_PROMPT = `
Verify that the following packages are installed: ${APT_PACKAGES.join(", ")}.
return the stdout verying the packages are installed in the devbox.
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

async function createBlueprint(runloop: Runloop): Promise<string> {
  console.log(`Creating Blueprint: ${BLUEPRINT_NAME}...`);

  const blueprint = await runloop.blueprints.createAndAwaitBuildCompleted({
    name: BLUEPRINT_NAME,
    dockerfile: DOCKERFILE,
  });

  console.log(`Blueprint ${BLUEPRINT_NAME} created with ID ${blueprint.id}`);
  return blueprint.id;
}

async function runAgent(devbox: DevboxView) {
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

      for (const toolCall of latestMessage.tool_calls) {
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let result: string;

        switch (toolCall.function.name) {
          case "executeShellCommand":
            result = (
              await runloop.devboxes.executeSync(devbox.id, {
                command: functionArgs.command,
              })
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
            throw new Error(`Unknown action: ${functionArgs.action}`);
        }

        toolResponses.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
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
    console.error("Error: No response received from OpenAI API after", numIterations, "iterations");
    return;
  }

  console.log(response.choices[0].message.content);
  console.log(`The total number of iterations is ${numIterations}`);
}

async function main() {
  // Create and build Blueprint
  const blueprintId = await createBlueprint(runloop);

  console.log(`Launching Devbox with Blueprint ${blueprintId}...`);
  const devbox = await runloop.devboxes.createAndAwaitRunning({
    blueprint_id: blueprintId,
  });

  console.log(`Devbox ${devbox.id} is running.`);

  try {
    await runAgent(devbox);
  } finally {
    console.log(`Shutting down Devbox ${devbox.id}...`);
    await runloop.devboxes.shutdown(devbox.id);
  }
}

main().catch(console.error);
