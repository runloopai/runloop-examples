# OpenClaw + Runloop.ai Setup

This directory contains examples for securely running OpenClaw inside Runloop devboxes,
eliminating host-level security risks while maintaining full agent capabilities.

## Prerequisites

- [uv](https://github.com/astral-sh/uv) (Python)
- [pnpm](https://pnpm.io/) (TypeScript)
- Runloop API key: `export RUNLOOP_API_KEY="your_api_key_here"`

For linting Python, install dev dependencies: `uv sync --extra dev`

## Python

```sh
uv sync
uv run setup_openclaw_runloop.py
```

## TypeScript

```sh
pnpm install
pnpm start
```

## Lint

```sh
pnpm lint
```

Or run individually:

- `pnpm run lint:py` / `pnpm run lint:py:fix` (Ruff)
