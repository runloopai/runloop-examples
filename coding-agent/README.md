# Runloop Example Agent

This is an example of a simple coding agent which uses infrastructure from [Runloop](https://runloop.ai).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Overview](#overview)
  - [What it does](#what-it-does)
- [Instructions](#instructions)
  - [General](#general)
  - [Python](#python)
- [Developer notes](#developer-notes)
  - [Updating the TOC](#updating-the-toc)
  - [Python notes](#python-notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

This demo showcases how to build a coding agent that uses a Runloop devbox to safely **execute commands** and perform **file I/O**, in a sandboxed environment. 

Although the agent runs on your local machine, the agent's connection to the "real world" -- the tools it can invoke -- are implemented against the devbox.

### What it does

This demo showcases a simple coding agent. Here's what the code agent does:

1. The agent is prompted to generate a simple program.
2. The program is written to a file and executed, with both of these actions taking place on the devbox.
3. We ask the agent to make changes to the program, and save and run the file again.
4. Finally, we download the program and print it out.

## Instructions

### General

Set up your envrionment with the necessary keys:

```sh
export RUNLOOP_API_KEY="..."
export OPENAI_API_KEY="..."
```

### Python

First use `poetry` to install all dependencies:

```sh
cd python/
poetry install
```

Then run the agent:

```sh
poetry run python agent.py
```

## Developer notes

### Updating the TOC

To update the table of contents in this README, run:
```sh
npx doctoc README.md --github
```

### Python notes

The python demo uses the `ell` library to call the LLM and to bind devbox tools to the agent.
