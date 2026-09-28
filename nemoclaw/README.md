# NemoClaw + Runloop

Examples demonstrating how to install [NemoClaw](https://github.com/NVIDIA/NemoClaw) inside a Runloop devbox and communicate with its Hermes agent over the [Agent Client Protocol (ACP)](https://agentclientprotocol.org/) via a Runloop Axon.

The Axon acts as a distributed event store between your local process and the NemoClaw agent running on the devbox. A Broker mount wires the two together so that standard ACP messages (initialize → session/new → session/prompt) flow over the same channel.

Python and TypeScript implementations share this directory — use either without needing both.

## Prerequisites

- **Runloop API key** — `export RUNLOOP_API_KEY="your-api-key"`
- **Runloop secret containing an OpenAI API key.** Create it in your Runloop account, then set `export NEMOCLAW_OPENAI_SECRET_NAME="your-secret-name"`. The examples pass the secret name to the devbox API; they do not read or print its value. NemoClaw uses the `gpt-5.4-mini` model in this example.
- The examples request 4 CPUs, 16 GiB RAM, and 40 GiB disk, install Docker and `lsof` on the default Debian devbox image, and start the Docker daemon. [NVIDIA's headless installation](https://docs.nvidia.com/nemoclaw/user-guide/hermes/deployment/deploy-to-headless-server) uses Docker and an inference provider. Installation and onboarding can take a while and use external inference credits.

## Python

Uses [uv](https://docs.astral.sh/uv/) for dependency management.

```bash
uv run nemoclaw_acp.py
```

## TypeScript

Uses [Bun](https://bun.sh/) — install dependencies first:

```bash
bun install
bun run nemoclaw_acp.ts
```

## How it works

1. **Create an Axon** — a named event channel managed by Runloop.
2. **Launch a devbox** with a `broker_mount`. A launch command installs Docker and the pinned NVIDIA NemoClaw v0.0.129 release, then performs unattended Hermes onboarding with the injected inference credential. The broker then starts [`nemoclaw-acp --sandbox runloop-example`](https://docs.nvidia.com/nemoclaw/user-guide/hermes/reference/commands#nemoclaw-acp). Running an example accepts NemoClaw's third-party software prompt noninteractively.
3. **Subscribe to the Axon SSE stream** to receive events from the agent.
4. **Send ACP messages** — `initialize`, `session/new`, then `session/prompt` — over the Axon.
5. **Stream the response** by listening for `session/update` events with `agent_message_chunk` payloads until `turn.completed`.

You can inspect the full event history for any run at:

```
https://platform.runloop.ai/axons/<axon-id>
```
