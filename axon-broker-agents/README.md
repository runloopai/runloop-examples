# Axon / Broker Examples

Runnable examples demonstrating Axon, Runloop's distributed event store, and Broker, an interchange layer between on-box agents and Axons.

## ACP Protocol Examples

Standalone scripts demonstrating ACP (Agent Client Protocol) integration with Runloop Axons.
Examples install Opencode, initialize and start a new session, and then prompt Opencode using 
its default model, bigpickle.

### Prerequisites

Set your API key:
```bash
export RUNLOOP_API_KEY="your-api-key"
```

### Python

Uses [uv](https://docs.astral.sh/uv/) for dependency management

```bash
uv run axon_acp_docs.py
```

### TypeScript

Uses [Bun](https://bun.sh/) - install dependencies first:

```bash
bun install
bun run axon_acp_docs.ts
```

## Claude Protocol Examples

Standalone scripts demonstrating Claude JSON protocol integration with Runloop Axons.

### Prerequisites

Set your API keys:
```bash
export RUNLOOP_API_KEY="your-api-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
```

### Python

```bash
uv run axon_claude_docs.py
```

### TypeScript

```bash
bun install
bun run axon_claude_docs.ts
```

