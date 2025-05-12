# Runloop Command Execution Examples

This repository contains examples demonstrating how to execute commands on Runloop devboxes using both Python and TypeScript.

## Prerequisites

- Python 3.7+ or Node.js 16+
- Runloop API key (set as environment variable `RUNLOOP_API_KEY`)

## Python Example

1. Install dependencies:
```bash
uv sync
# or
pip install runloop-api-client
```

2. Run the example:
```bash
uv run index.py
# or 
python index.py
```

## TypeScript Example

1. Install dependencies:
```bash
npm install
```

2. Run the example:
```bash
npx tsx index.ts
```