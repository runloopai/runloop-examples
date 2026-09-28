// Run this script with: bun install && bun run nemoclaw_acp.ts
// Requires package.json with dependencies

import { readFileSync } from "node:fs";
import { PROTOCOL_VERSION } from "@agentclientprotocol/sdk";
import type { InitializeRequest, NewSessionRequest, PromptRequest } from "@agentclientprotocol/sdk";
import { RunloopSDK } from "@runloop/api-client";
import type { AxonPublishParams } from "@runloop/api-client/resources";

const SANDBOX_NAME = "runloop-example";

function makeAxonEvent(
  eventType: string,
  payload: InitializeRequest | NewSessionRequest | PromptRequest | string,
  {
    origin = "USER_EVENT",
    source = "axon_acp",
  }: { origin?: AxonPublishParams["origin"]; source?: string } = {},
): AxonPublishParams {
  const wirePayload = typeof payload === "string" ? payload : JSON.stringify(payload);
  return {
    event_type: eventType,
    origin,
    payload: wirePayload,
    source,
  };
}

async function main(sdk: RunloopSDK, openaiSecretName: string): Promise<void> {
  const installScript = readFileSync(new URL("./install_nemoclaw.sh", import.meta.url), "utf8");
  const axon = await sdk.axon.create({ name: "nemoclaw-axon" });

  console.log("creating a devbox and onboarding NemoClaw Hermes");
  const devbox = await sdk.devbox.create(
    {
      name: "nemoclaw-devbox",
      mounts: [
        {
          type: "file_mount",
          target: "/tmp/install_nemoclaw.sh",
          content: installScript,
        },
        {
          type: "broker_mount",
          axon_id: axon.id,
          protocol: "acp",
          agent_binary: "nemoclaw-acp",
          launch_args: ["--sandbox", SANDBOX_NAME],
        },
      ],
      launch_parameters: {
        resource_size_request: "CUSTOM_SIZE",
        custom_cpu_cores: 4,
        custom_gb_memory: 16,
        custom_disk_size: 40,
        launch_commands: ["bash /tmp/install_nemoclaw.sh"],
      },
      environment_variables: {
        PATH: "/home/user/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      },
      secrets: { OPENAI_API_KEY: openaiSecretName },
    },
    { longPoll: { timeoutMs: 3600000 } },
  );

  console.log(`created devbox, id=${devbox.id}`);

  try {
    const stream = await axon.subscribeSse(undefined, { signal: AbortSignal.timeout(300_000) });

    await axon.publish(
      makeAxonEvent("initialize", {
        protocolVersion: PROTOCOL_VERSION,
        clientInfo: { name: "runloop-axon", version: "1.0.0" },
      } as InitializeRequest),
    );

    await axon.publish(
      makeAxonEvent("session/new", {
        cwd: "/home/user",
        mcpServers: [],
      } as NewSessionRequest),
    );

    let sessionId = "";
    let promptSent = false;
    const userPrompt = "Who are you?";

    for await (const ev of stream) {
      if (!sessionId && ev.event_type === "session/new" && ev.origin === "AGENT_EVENT") {
        sessionId = JSON.parse(ev.payload).sessionId;
        if (!sessionId) {
          throw new Error("NemoClaw did not return a session ID");
        }
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

      if (promptSent) {
        if (ev.event_type === "session/update" && ev.origin === "AGENT_EVENT") {
          const parsed = JSON.parse(ev.payload);
          if (parsed.update?.sessionUpdate === "agent_message_chunk") {
            const textPart = parsed.update?.content?.text;
            if (textPart) {
              process.stdout.write(textPart);
            }
          }
        }
        if (ev.event_type === "turn.completed") {
          break;
        }
      }
    }
    console.log();

    console.log(`\nView full Axon event stream at https://platform.runloop.ai/axons/${axon.id}`);
  } finally {
    await devbox.shutdown();
  }
}

async function run(openaiSecretName: string): Promise<void> {
  const sdk = new RunloopSDK();
  await main(sdk, openaiSecretName);
}

const openaiSecretName = process.env.NEMOCLAW_OPENAI_SECRET_NAME;
if (!process.env.RUNLOOP_API_KEY || !openaiSecretName) {
  console.log("RUNLOOP_API_KEY and NEMOCLAW_OPENAI_SECRET_NAME are required");
  process.exit(1);
}

run(openaiSecretName);
