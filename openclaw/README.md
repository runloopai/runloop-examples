# OpenClaw + Runloop.ai Setup

This directory contains examples for securely running OpenClaw inside Runloop devboxes,
eliminating host-level security risks while maintaining full agent capabilities.

Python and TypeScript implementations share this directory for convenience; use either without needing both.

## Python

**Prerequisites:** [uv](https://github.com/astral-sh/uv), `export RUNLOOP_API_KEY="your_api_key_here"`

```sh
uv sync
uv run setup_openclaw_runloop.py
```

Lint (install dev deps first: `uv sync --extra dev`):

```sh
uv run ruff check . && uv run ruff format --check .
```

## TypeScript

**Prerequisites:** [pnpm](https://pnpm.io/), `export RUNLOOP_API_KEY="your_api_key_here"`

```sh
pnpm install
pnpm start
```

For parallel execution: `pnpm run parallel`
