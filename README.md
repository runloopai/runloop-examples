# ➰ Runloop Examples

This repository contains examples and demos for [Runloop](https://runloop.ai), the platform for building AI-powered software engineering agents. 

Please refer to the [Runloop documentation site](https://docs.runloop.ai) for more information on these demos.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [➰ Runloop Examples](#-runloop-examples)
  - [Examples](#examples)
    - [Getting Started](#getting-started)
    - [Devbox Primitives](#devbox-primitives)
    - [Axons \& Broker](#axons--broker)
    - [Add-ons](#add-ons)
    - [Browser Integrations](#browser-integrations)
    - [LLM \& Framework integrations](#llm--framework-integrations)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Examples

### Getting Started

These examples show you how to use core Runloop features to build and run an agent.

| Example | Description | Python | TypeScript |
|---------|-------------|---------|------------|
| **Simple Coding Agent** | Basic agent that can write and modify code | [`coding-agent/python/`](coding-agent/python/) | [`coding-agent/typescript/`](coding-agent/typescript/) |
| **Blueprints** | Pre-built agent templates and patterns | [`blueprints/python/`](blueprints/python/) | [`blueprints/typescript/`](blueprints/typescript/) |
| **Code Mounts** | Mount and work with external codebases | [`code-mounts/python/`](code-mounts/python/) | [`code-mounts/typescript/`](code-mounts/typescript/) |
| **Snapshots** | Save and restore agent state | [`snapshots/python/`](snapshots/python/) | [`snapshots/typescript/`](snapshots/typescript/) |

### Devbox Primitives

Self-contained examples for working with individual Devbox capabilities. Compose these to build custom agent workflows.

| Example | Description | Location |
|---------|-------------|----------|
| **Start / Stop** | Create, boot, and shut down a Devbox | [`devboxes/start-stop/`](devboxes/start-stop/) |
| **Command Execution** | Run shell commands inside a Devbox | [`devboxes/command-execution/`](devboxes/command-execution/) |
| **Read / Write Files** | Read and write files on a Devbox filesystem | [`devboxes/read-write-files/`](devboxes/read-write-files/) |
| **Web Tunnel** | Expose a Devbox service via a public tunnel | [`devboxes/web-tunnel/`](devboxes/web-tunnel/) |

### Axons & Broker

Runnable examples demonstrating Axons, Runloop's distributed event store, and Broker, the interchange layer between on-box agents and Axons.

| Example | Description | Python | TypeScript |
|---------|-------------|---------|------------|
| **ACP Protocol** | Agent Client Protocol integration: installs Opencode, starts a session, and prompts the default `bigpickle` model | [`axon-broker-agents/axon_acp_docs.py`](axon-broker-agents/axon_acp_docs.py) | [`axon-broker-agents/axon_acp_docs.ts`](axon-broker-agents/axon_acp_docs.ts) |
| **Claude JSON Protocol** | Claude JSON protocol integration with Runloop Axons | [`axon-broker-agents/axon_claude_docs.py`](axon-broker-agents/axon_claude_docs.py) | [`axon-broker-agents/axon_claude_docs.ts`](axon-broker-agents/axon_claude_docs.ts) |

### Add-ons

These examples show you how to use add-ons which extend the core Runloop platform.

| Example | Description | Location |
|---------|-------------|----------|
| **Browser Control** | Control web browsers and automate web tasks | [`runloop-demo-browser/`](runloop-demo-browser/) |
| **Computer Control** | Interact with the local computer system | [`runloop-demo-computer/`](runloop-demo-computer/) |
| **OpenClaw** | Securely run OpenClaw inside Runloop Devboxes, including a parallel-execution example | [`openclaw/`](openclaw/) |

### Browser Integrations

Drive third-party cloud browser providers from Runloop devboxes. The agent runs in a devbox; the browser runs on the provider, so no Chromium runs in the devbox.

| Provider | Description | Python | TypeScript |
|----------|-------------|---------|------------|
| **Kernel** | [Kernel](https://www.kernel.sh) cloud browsers driven server-side via Playwright Execute | [`browser-integrations/kernel/python/`](browser-integrations/kernel/python/) | [`browser-integrations/kernel/typescript/`](browser-integrations/kernel/typescript/) |

### LLM & Framework integrations

These examples show integrations with various LLM providers and frameworks.

| Provider/Framework | Description | Python | TypeScript |
|-------------------|-------------|---------|------------|
| **Anthropic** | Claude API integration | [`llm-integrations/anthropic/python/`](llm-integrations/anthropic/python/) | [`llm-integrations/anthropic/typescript/`](llm-integrations/anthropic/typescript/) |
| **CrewAI** | Multi-agent orchestration framework | [`llm-integrations/crewai/python/`](llm-integrations/crewai/python/) | - |
| **Gemini** | Google's Gemini API integration | [`llm-integrations/gemini/python/`](llm-integrations/gemini/python/) | [`llm-integrations/gemini/typescript/`](llm-integrations/gemini/typescript/) |
| **LangChain** | LangChain framework integration | [`llm-integrations/langchain/python/`](llm-integrations/langchain/python/) | [`llm-integrations/langchain/typescript/`](llm-integrations/langchain/typescript/) |
| **LlamaIndex** | LlamaIndex framework integration | [`llm-integrations/llamaindex/python/`](llm-integrations/llamaindex/python/) | [`llm-integrations/llamaindex/typescript/`](llm-integrations/llamaindex/typescript/) |
| **Mistral** | Mistral AI API integration | [`llm-integrations/mistral/python/`](llm-integrations/mistral/python/) | [`llm-integrations/mistral/typescript/`](llm-integrations/mistral/typescript/) |
| **OpenAI** | OpenAI API integration | [`llm-integrations/openai/python/`](llm-integrations/openai/python/) | [`llm-integrations/openai/typescript/`](llm-integrations/openai/typescript/) |
| **Vercel AI** | Vercel AI SDK integration | - | [`llm-integrations/vercelai/typescript/`](llm-integrations/vercelai/typescript/) |
