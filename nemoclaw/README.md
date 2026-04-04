# NemoClaw + Runloop

Examples demonstrating how to install [NemoClaw](https://github.com/runloopai/nemoclaw) inside a Runloop devbox and communicate with it over the [Agent Client Protocol (ACP)](https://agentclientprotocol.org/) via a Runloop Axon.

The Axon acts as a distributed event store between your local process and the NemoClaw agent running on the devbox. A Broker mount wires the two together so that standard ACP messages (initialize → session/new → session/prompt) flow over the same channel.

Python and TypeScript implementations share this directory — use either without needing both.

## Prerequisites

- **Runloop API key** — `export RUNLOOP_API_KEY="your-api-key"`

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
2. **Launch a devbox** with a `broker_mount` that installs NemoClaw via `npm install -g nemoclaw` and starts it in ACP mode (`nemoclaw acp`).
3. **Subscribe to the Axon SSE stream** to receive events from the agent.
4. **Send ACP messages** — `initialize`, `session/new`, then `session/prompt` — over the Axon.
5. **Stream the response** by listening for `session/update` events with `agent_message_chunk` payloads until `turn.completed`.

You can inspect the full event history for any run at:

```
https://platform.runloop.ai/axons/<axon-id>
```
