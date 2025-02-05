# Temporary Repository

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview
This repository is for testing a new workflow. It contains a basic HTTP server implementation and related scripts to facilitate development and deployment.

## Repository Structure
```
browser_demo/
├── model/               # Directory for LLM-related files
├── static_content/      # Directory for static content (HTML)
├── utils/               # Directory for static methods
├── .gitignore           # Specifies files to be ignored by Git
├── LICENSE              # MIT License
├── README.md            # Project documentation
├── entrypoint.sh        # Shell script for starting the application
├── http_server.py       # Basic HTTP server implementation
├── main.py              # Main script to run the application
```

## Features
- Simple HTTP server using Python.
- Organized project structure for ease of testing and workflow experimentation.
- Streamlit application and abstraction of AI agent
- Toolkit for AI agent use
- Includes a shell script (`entrypoint.sh`) for starting the application.

## Requirements
Ensure you have the following installed:
- Python 3.x

## Installation & Usage
1. Clone the repository:
   ```sh
   git clone https://github.com/IvanPedroza/browser.git
   cd <browser>
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Set your API keys in your .env file
   ```sh
   RUNLOOP_API_KEY=<YOUR_KEY_HERE>
   ANTHROPIC_API_KEY=<YOUR_KEY_HERE>
   ```

4. Run the main script:
   ```sh
   entrypoint.sh
   ```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing
This repository is primarily for workflow testing. If you'd like to contribute, feel free to open an issue or submit a pull request.


