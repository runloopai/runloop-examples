# Runloop Code Mounts Examples

This directory contains examples of how to use Runloop's code mounts feature in both Python and TypeScript.

## Prerequisites

- Python 3.7+ (for Python example)
- Node.js 14+ (for TypeScript example)
- Runloop API key
- GitHub personal access token (for private repositories)

## Python Example

The Python example demonstrates how to:
1. Create a devbox with code mounts
2. Configure GitHub authentication
3. Work with private repositories

To run the Python example:

```bash
# Install dependencies
pip install requests

# Set environment variables
export RUNLOOP_API_KEY="your-runloop-api-key"
export GITHUB_TOKEN="your-github-token"

# Run the example
python python_example.py
```

## TypeScript Example

The TypeScript example demonstrates the same functionality as the Python example, but using TypeScript.

To run the TypeScript example:

```bash
# Install dependencies
npm install

# Set environment variables
export RUNLOOP_API_KEY="your-runloop-api-key"
export GITHUB_TOKEN="your-github-token"

# Run the example
npm start
```

## Environment Variables

Both examples require the following environment variables:

- `RUNLOOP_API_KEY`: Your Runloop API key
- `GITHUB_TOKEN`: Your GitHub personal access token (for private repositories)

## Features

Both examples demonstrate:

1. Creating a devbox with a single code mount
2. Creating a devbox with multiple code mounts
3. Configuring GitHub authentication manually
4. Error handling and response validation

## Security Best Practices

1. Never commit your API keys or tokens to version control
2. Use environment variables for sensitive credentials
3. Use tokens with minimum required permissions
4. Regularly rotate your tokens
5. Use HTTPS for all API calls

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Runloop Code Mounts Examples](#runloop-code-mounts-examples)
  - [Prerequisites](#prerequisites)
  - [Python Example](#python-example)
  - [TypeScript Example](#typescript-example)
  - [Environment Variables](#environment-variables)
  - [Features](#features)
  - [Security Best Practices](#security-best-practices)
  - [Overview](#overview)
    - [What it does](#what-it-does)
  - [Instructions](#instructions)
    - [General](#general)
    - [Python](#python)
    - [TypeScript](#typescript)
  - [Developer notes](#developer-notes)
    - [Updating the TOC](#updating-the-toc)
    - [Python notes](#python-notes)
    - [TypeScript notes](#typescript-notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

This demo showcases how to build a coding agent that uses a Runloop devbox to safely **execute commands** and perform **file I/O** against a code repository.

Although the agent runs on your local machine, the agent's connection to the "real world" -- the tools it can invoke -- are implemented against the devbox.

### What it does

Here's what the code agent does:

1. At launch, a devbox is created and a remote repository is pulled using [code mounts](https://docs.runloop.ai/main-concepts/devbox/code-mounts).
2. The agent is prompted to perform various cleanups on the repository.
3. Finally, the agent prints a `git diff` of the changes it has made.

## Instructions

### General

Set up your envrionment with the necessary keys:

```sh
export RUNLOOP_API_KEY="..."
export OPENAI_API_KEY="..."
export GITHUB_TOKEN="..."
```

### Python

First use `poetry` to install all dependencies:

```sh
cd python/
poetry install
```

Then run the agent:

```sh
poetry run python agent.py <github url>
```

For example, this command runs the agent against our sample Todo App:

```sh
poetry run python agent.py https://github.com/runloopai/simple-todo
```


### TypeScript

First install the dependencies using npm:

```sh
cd typescript/
npm install
```

Then run the agent. You have two options:

1. Using `ts-node`:
  ```sh
  ts-node agent.ts <github url>
  ```

2. Using `npm`:
  ```sh
  npm run start -- <github url>
  ```

We can run the agent against our sample Todo app using:

```sh
ts-node agent.ts https://github.com/runloopai/simple-todo
npm run start -- https://github.com/runloopai/simple-todo
```

## Developer notes

### Updating the TOC

To update the table of contents in this README, run:
```sh
npx doctoc README.md --github
```

### Python notes

The Python demo uses the `ell` library to call the LLM and to bind devbox tools to the agent.

### TypeScript notes

The TypeScript demo implements tool calling directly using OpenAI's function calling feature to allow the agent to interact with the devbox.

