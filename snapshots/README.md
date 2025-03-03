# Runloop Code Mount Demo

This is an example of a coding agent which uses infrastructure from [Runloop](https://runloop.ai) to build a command-line game of snake.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Overview](#overview)
  - [What it does](#what-it-does)
- [Instructions](#instructions)
  - [General](#general)
  - [Python](#python)
  - [TypeScript](#typescript)
- [Developer notes](#developer-notes)
  - [Python notes](#python-notes)
  - [TypeScript notes](#typescript-notes)
  - [Updating the TOC](#updating-the-toc)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

This demo showcases how to build a coding agent that uses a Runloop devbox to safely **execute commands** and perform **file I/O** to iteratively develop an interactive game.

The Runloop devbox acts as a controlled execution environment where all coding operations take place, and although the agent runs on your local machine, the agent's connection to the "real world" -- the tools it can invoke -- are implemented against the devbox.

### What it does

Here's what the code agent does:

1. The agent is prompted to generate a simple command-line game of snake.
2. The program is written to a file and executed, with both of these actions taking place on the devbox.
3. We ask the agent to make changes to the program, and save a snapshot of the current state of the devbox if the game runs without errors.
4. The agent iterates from the last known state of the game saved in the devbox snapshot.

## Instructions

### General

Set up your environment with the necessary keys:

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

