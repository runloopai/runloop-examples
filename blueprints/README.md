# Runloop Blueprints Demo

This example demonstrates how to build AI agents that leverage Runloop devboxes with custom blueprints, enabling automatic package installation during launch.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Overview](#overview)
  - [What it does](#what-it-does)
- [Instructions](#instructions)
  - [General Setup](#general)
  - [Python Agent](#python-agent)
  - [TypeScript Agent](#typescript-agent)
- [Developer Notes](#developer-notes)
  - [Blueprint Configuration](#blueprint-configuration)
  - [Agent Implementation](#agent-implementation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

This demo illustrates how to use [Runloop](https://runloop.ai) blueprints to create customized devbox environments with pre-installed packages and tools. The demo includes implementations in both Python and TypeScript.

### What it does

The demo performs the following:

1. Creates a blueprint with specified APT packages installed
2. Launches a devbox using this blueprint
3. Runs an AI agent to verify package installation
4. Executes commands within the isolated devbox environment
5. Cleans up by shutting down the devbox

## Instructions

### General

Set up your envrionment with the necessary keys:

export RUNLOOP_API_KEY="..."

export OPENAI_API_KEY="..."

### Python

First use poetry to install all dependencies:

```sh
cd python/
poetry install
```
Then run the agent:
```sh
poetry run python agent.py
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
   ts-node agent.ts
   ```

 2. Using `npm`:
   ```sh
   npm run start
   ```

## Developer notes

Updating the TOC

To update the table of contents in this README, run:

npx doctoc README.md --github

### Python notes

The Python demo uses the ell library to call the LLM and to bind devbox tools to the agent.

### TypeScript notes

The TypeScript demo implements tool calling directly using OpenAI's function calling feature to allow the agent to interact with the devbox.