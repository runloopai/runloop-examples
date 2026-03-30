// Run this script with: bun install && bun run axon_claude_docs.ts
// Requires package.json with dependencies

import { RunloopSDK } from "@runloop/api-client";
import type { AxonPublishParams } from "@runloop/api-client/resources";

function makeAxonEvent(
  eventType: string,
  payload: Record<string, unknown> | string,
  {
    origin = "USER_EVENT",
    source = "axon_claude",
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
  const axon = await sdk.axon.create({ name: "claude-session" });

  console.log("creating a devbox and installing Claude Code");

  // Create a Devbox with Claude Code agent
  const devbox = await sdk.devbox.create({
    mounts: [
      {
        type: "broker_mount",
        axon_id: axon.id,
        protocol: "claude_json",
        launch_args: [],
      },
    ],
    launch_parameters: {
      launch_commands: [
        'curl -fsSL https://claude.ai/install.sh | bash && echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bash_profile',
      ],
    },
    environment_variables: {
      PATH: "/home/user/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    },
  });

  console.log(`created devbox, id=${devbox.id}`);

  try {
    const stream = await axon.subscribeSse();
    const userPrompt = "Who are you?";

    console.log(`> ${userPrompt}`);
    process.stdout.write("< ");

    await axon.publish(
      makeAxonEvent("query", {
        type: "user",
        message: {
          role: "user",
          content: [{ type: "text", text: userPrompt }],
        },
        session_id: axon.id,
      })
    );

    for await (const ev of stream) {
      // Print assistant text content and finish
      if (ev.event_type === "assistant") {
        const payload = JSON.parse(ev.payload);
        const content = payload.message?.content || [];
        for (const block of content) {
          if (block.type === "text") {
            process.stdout.write(block.text || "");
          }
        }
        break;
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("ANTHROPIC_API_KEY is not set");
  process.exit(1);
}

run();
