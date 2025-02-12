# Runloop Browser Demo

An example of an LLM-controlled interactive browser, using Runloop Devboxes, the Runloop Browser Add-On, and Streamlit for the UI.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Overview](#overview)
- [Running the Demo](#running-the-demo)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [**Running the Project**](#running-the-project)
- [Developer Notes](#developer-notes)
  - [Code Structure](#code-structure)
  - [How it works](#how-it-works)
  - [Updating the TOC](#updating-the-toc)
- [**License**](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

This demo shows how to use the following components together:
* [Runloop Devboxes](https://docs.runloop.ai/) to run a browser on a remote, sandboxed virtual machine
* Anthropic Claude as an AI agent to control the browser
* Streamlit for the browser UI

## Running the Demo

### Prerequisites

Ensure you have the following:
- Python 3.12 or later
- A Runloop account with access to the Runloop API
- An Anthropic account with access to the Anthropic API

### Setup

Build the Python virtualenv:
```sh
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:
```sh
pip install -r requirements.txt
```

Set up your API keys:
```sh
export RUNLOOP_API_KEY=<YOUR_RUNLOOP_KEY>
export ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_KEY>
```

(Alternatively, you can set the keys in a `.env` file.)


### **Running the Project**

Launch the application:
```sh
python main.py
```

Open your browser and navigate to http://localhost:8051 to interact with the remote-controlled browser session.

## Developer Notes

### Code Structure

The code is organized as follows:
* `main.py` -- The main program that sets up a devbox and runs the demo.
* `streamlit_app.py` -- The Streamlit app that runs a local http server and the browser UI.
* `loop.py` -- The main agent loop, interacting with Claude and the browser tool.
* `tools.py` -- Classes to connect a remote browser instance to the Anthropic Claude agent.


### How it works

The remote browser runs inside the Devbox, while Playwright and the AI Agent run locally.
Playwright interacts with the Chrome browser via Chrome DevTools Protocol (CDP)
All UI and automation controls are handled locally, ensuring fast response times without exposing sensitive operations to the local machine.

### Updating the TOC

To update the table of contents in this README, run:
```sh
npx doctoc README.md --github
```

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
