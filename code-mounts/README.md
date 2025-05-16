# Runloop Code Mount Demo

This is an example of a coding agent which uses infrastructure from [Runloop](https://runloop.ai) and the [code mounts](https://docs.runloop.ai/main-concepts/devbox/code-mounts) to interact with another repository.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Runloop Code Mount Demo](#runloop-code-mount-demo)
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

