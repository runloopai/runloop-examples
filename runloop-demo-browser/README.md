# Runloop Browser Use Demo

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

This repository provides a demonstration of remote browser automation using a Runloop Devbox in an isolated environment. The system enables AI-driven browser interactions by running Playwright and a Streamlit-based UI locally while controlling a remote browser instance in the Devbox.

This setup uses a cloud-based sandbox environment, providing a structured and secure way to interact with a browser remotely while keeping execution isolated.

## Features

- **Remote Browser Execution**: The browser runs in a secured Devbox environment, separate from local execution.
- **Local Playwright Automation**: Playwright handles browser control, with all commands executed from the local environment.
- **Streamlit User Interface**: A web-based interface facilitates interaction with the remote browser session.
- **AI Integration**: The project includes an abstraction layer for AI-assisted automation.
- **Secure & Isolated Execution**: The Devbox ensures no local browser state contamination, enhancing reproducibility.

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


## Prerequisites

Ensure you have the following:
- **Python 3.12 or later**
- **Git**
- **Runloop API Key**
- **LLM API KEY (Claude, Bedrock, Vertex)**


## Installation & Setup

1. **Clone the repository**:
   ```sh
   git clone https://github.com/runloopai/examples.git
   cd runloop-demo-browser

2. Set up a Python virtual environment:
    ```sh
    python3 -m venv venv
    source venv/bin/activate
    ```
3. Install Python dependencies:
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

## **Development Notes**

The remote browser runs inside the Devbox, while Playwright and the AI Agent run locally.
Playwright interacts with the Chrome browser via Chrome DevTools Protocol (CDP)
All UI and automation controls are handled locally, ensuring fast response times without exposing sensitive operations to the local machine.

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
