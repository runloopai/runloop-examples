// Run this script with: bun install && bun run axon_acp_docs.ts
// Requires package.json with dependencies

import { RunloopSDK } from "@runloop/api-client";
import type { AxonPublishParams } from "@runloop/api-client/resources";
import {
  InitializeRequest,
  NewSessionRequest,
  PromptRequest,
  PROTOCOL_VERSION,
} from "@agentclientprotocol/sdk";

function makeAxonEvent(
  eventType: string,
  payload: InitializeRequest | NewSessionRequest | PromptRequest | string,
  {
    origin = "USER_EVENT",
    source = "axon_acp",
  }: { origin?: AxonPublishParams["origin"]; source?: string } = {}
): AxonPublishParams {
  const wirePayload = typeof payload === "string" ? payload : JSON.stringify(payload);
  return {
    event_type: eventType,
    origin,
    payload: wirePayload,
    source,
  };
}

async function main(sdk: RunloopSDK): Promise<void> {
  // Create an Axon for session communication
  const axon = await sdk.axon.create({ name: "acp-session" });

  console.log("creating a devbox and installing opencode");
  // Create a Devbox with an ACP-compliant agent, Opencode
  const devbox = await sdk.devbox.create({
    mounts: [
      {
        type: "broker_mount",
        axon_id: axon.id,
        protocol: "acp",
        agent_binary: "opencode",
        launch_args: ["acp"],
      },
    ],
    launch_parameters: {
      launch_commands: ["npm i -g opencode-ai"],
    },
  });

  console.log(`created devbox, id=${devbox.id}`);

  try {
    const stream = await axon.subscribeSse();

    await axon.publish(
      makeAxonEvent("initialize", {
        protocolVersion: PROTOCOL_VERSION,
        clientInfo: { name: "runloop-axon", version: "1.0.0" },
      } as InitializeRequest)
    );

    await axon.publish(
      makeAxonEvent("session/new", {
        cwd: "/home/user",
        mcpServers: [],
      } as NewSessionRequest)
    );

    let sessionId = "";
    let promptSent = false;
    const userPrompt = "Who are you?";

    for await (const ev of stream) {
      // Phase 1: Wait for session/new response from the agent
      if (!sessionId && ev.event_type === "session/new" && ev.origin === "AGENT_EVENT") {
        sessionId = JSON.parse(ev.payload).sessionId;
        console.log(`> ${userPrompt}`);
        process.stdout.write("< ");

        const prompt: PromptRequest = {
          sessionId,
          prompt: [{ type: "text", text: userPrompt }],
        };
        await axon.publish(makeAxonEvent("session/prompt", prompt));
        promptSent = true;
        continue;
      }

      // Phase 2: Stream agent response
      if (promptSent) {
        if (ev.event_type === "agent_message_chunk") {
          const textPart = JSON.parse(ev.payload).update.content.text;
          process.stdout.write(textPart);
        }
        if (ev.event_type === "turn.completed") {
          break;
        }
      }
    }
    console.log();

    console.log(
      `\nView full Axon event stream at https://platform.runloop.ai/axons/${axon.id}`
    );
  } finally {
    await devbox.shutdown();
  }
}

async function run(): Promise<void> {
  const sdk = new RunloopSDK();
  await main(sdk);
}

if (!process.env.RUNLOOP_API_KEY) {
  console.log("RUNLOOP_API_KEY is not set");
  process.exit(1);
}

run();
