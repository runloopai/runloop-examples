# Runloop Computer Use Demo

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

This project provides a **computer automation demo** where an AI agent remotely controls a **virtual machine (VM) inside a Runloop Devbox**. Inspired by [Anthropic’s computer use demo](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo), this adaptation ensures a **secure, isolated execution environment** while the AI agent runs locally and interacts with the remote desktop.

The AI agent uses **LLMs** to execute commands, manage files, and interact with applications in the remote Devbox, simulating real-world automation use cases.

## Features

- **Remote Desktop Execution**: The computer runs inside a Runloop Devbox, ensuring an isolated and reproducible environment.
- **Local AI Agent Control**: The agent runs locally and sends commands to the remote computer.
- **Secure & Contained Execution**: Prevents contamination of the local machine, ensuring all actions remain within the Devbox.
- **Streamlit UI**: Provides a web-based interface for controlling the remote machine.
- **Integrated Toolkit**: Supports command execution, file manipulation, and automation workflows.

## Repository Structure
```
browser_demo/
├── model/               # Directory for LLM-related files
├── static_content/      # Directory for static HTML content
├── .gitignore           # Specifies files to be ignored by Git
├── LICENSE              # MIT License
├── README.md            # Project documentation
├── http_server.py       # Basic HTTP server implementation
├── main.py              # Main script to run the application
```


## Supported LLMs

The AI agent supports multiple large language models (LLMs) via different APIs:

- **Anthropic** (Claude models via `ANTHROPIC_API_KEY`)
- **AWS Bedrock** (Bedrock models via `AWS credentials`)
- **Google Vertex AI** (Gemini models via `Google Cloud credentials`)


## Requirements

Ensure you have the following installed:

- **Python 3.10 or later**
- **Git**

## Installation & Setup

1. **Clone the repository**:
   ```sh
   git clone https://github.com/runloopai/examples.git
   cd runloop-demo-computer

2. Set up a Python virtual environment:
    ```sh
    python3 -m venv venv
    source venv/bin/activate
    ```
3. Install dependencies:
    ```sh
    pip install -r requirements.txt
    ```
4. Configure API keys: Create a .env file in the root directory and populate it with your credentials:
    ```sh
    RUNLOOP_API_KEY=<YOUR_RUNLOOP_KEY>
    ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_KEY>
    ```

## **Running the Project**

1. Run the application:
    ```bash
    python main.py
    ```
2. Access the UI:
    Open your browser and navigate to http://localhost:8501 to interact with the remote-controlled browser session.

## Development Notes

The computer environment runs remotely in the Devbox, ensuring a clean and secure execution state.
The AI agent executes commands locally, forwarding them to the remote machine over a secure connection.
For debugging, you can use VNC to view the remote desktop and verify actions in real time.


## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
