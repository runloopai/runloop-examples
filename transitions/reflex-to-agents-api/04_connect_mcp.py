import sys

from common import default_agent, inline_file, run, workspace_session

LOCAL_MCP = """from mcp.server.fastmcp import FastMCP
server = FastMCP("workspace_notes")
@server.tool()
def migration_note() -> str:
    return "Update async callers and retain timeout handling."
server.run(transport="stdio")
"""


def configuration(route: str):
    from openai.types.beta.agent_tool_param import AgentToolConfigParamMcp
    from openai.types.beta.environment_param import EnvironmentParamOpenAIHosted

    environment: EnvironmentParamOpenAIHosted = {
        "type": "openai_hosted",
        "network": {"access": "disabled"},
    }
    tool: AgentToolConfigParamMcp = {
        "type": "mcp",
        "server_label": "openai_docs",
        "transport": {
            "type": "http",
            "server_url": "https://developers.openai.com/mcp",
        },
        "connection_origin": "service",
        "required": True,
    }
    prompt = "Use openai_docs to explain session follow-ups in outputs/mcp-notes.md."
    if route == "environment":
        tool["connection_origin"] = "environment"
        environment["network"] = {
            "access": "restricted",
            "allowed_domains": ["developers.openai.com"],
        }
    elif route == "stdio":
        tool = {
            "type": "mcp",
            "server_label": "workspace_notes",
            "required": True,
            "transport": {
                "type": "stdio",
                "command": "/workspace/mcp-env/bin/python",
                "args": ["/workspace/notes_mcp.py"],
                "cwd": "/workspace",
            },
        }
        environment["network"] = {"access": "enabled"}
        environment["files"] = [inline_file("notes_mcp.py", LOCAL_MCP)]
        environment["setup_commands"] = [
            {
                "command": "python -m venv /workspace/mcp-env && "
                "/workspace/mcp-env/bin/pip install 'mcp>=1,<2'"
            }
        ]
        prompt = "Call migration_note and save its advice to outputs/mcp-notes.md."
    elif route != "service":
        raise ValueError("Choose service, environment, or stdio")
    agent = default_agent()
    agent["tools"] = [tool]
    return agent, environment, prompt


async def main() -> None:
    route = sys.argv[1] if len(sys.argv) > 1 else "service"
    agent, environment, prompt = configuration(route)
    async with workspace_session(agent=agent, environment=environment) as work:
        await work.turn(prompt)
        await work.save("mcp-notes.md")


if __name__ == "__main__":
    run(main())
