# Runloop Command Execution Examples

This repository contains examples demonstrating how to execute commands on Runloop devboxes using both Python and TypeScript.

## Prerequisites

- Python 3.7+ or Node.js 16+
- Runloop API key (set as environment variable `RUNLOOP_API_KEY`)

## Python Example

1. Install dependencies:
```bash
pip install runloop-api-client
```

2. Run the example:
```bash
python index.py
```

## TypeScript Example

1. Install dependencies:
```bash
npm install
```

2. Run the example:
```bash
npm start
```

## What the Examples Demonstrate

Both examples show:
1. Creating a devbox
2. Executing synchronous commands
3. Executing asynchronous commands with polling
4. Using stateful shells to maintain command context
5. Proper cleanup of resources

The examples are self-contained and include error handling and proper resource cleanup.