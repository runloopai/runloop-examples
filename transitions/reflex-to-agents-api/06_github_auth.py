import os
import re
import sys

from openai import AsyncOpenAI
from openai.types.beta.environment_param import EnvironmentParamOpenAIHosted

from common import ExampleError, default_agent, run, workspace_session

GITHUB_MCP = "https://api.githubcopilot.com/mcp/"


async def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "mcp"
    if mode not in {"mcp", "api"}:
        raise ExampleError("Choose mcp or api")
    for name in ("OPENAI_API_KEY", "GITHUB_TOKEN"):
        if not os.environ.get(name):
            raise ExampleError(f"Set {name} before running this example")
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    if mode == "mcp" and not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
        raise ExampleError("Set GITHUB_REPOSITORY to owner/repo")
    async with AsyncOpenAI(timeout=60, max_retries=0) as client:
        vault = await client.beta.agents.vaults.create(name="Transition example GitHub")
        print(f"Vault: {vault.id}", flush=True)
        succeeded = False
        try:
            agent = default_agent()
            environment: EnvironmentParamOpenAIHosted = {
                "type": "openai_hosted",
                "network": {"access": "disabled"},
            }
            if mode == "mcp":
                credential = await client.beta.agents.vaults.credentials.create(
                    vault.id,
                    name="GitHub MCP token",
                    auth={
                        "type": "static_bearer",
                        "mcp_server_url": GITHUB_MCP,
                        "token": os.environ["GITHUB_TOKEN"],
                    },
                )
                agent["tools"] = [
                    {
                        "type": "mcp",
                        "server_label": "github",
                        "transport": {"type": "http", "server_url": GITHUB_MCP},
                        "connection_origin": "service",
                        "credential_id": credential.id,
                        "allowed_tools": ["search_issues", "issue_read"],
                        "required": True,
                    }
                ]
                prompt = (
                    f"Use GitHub MCP to find up to five open issues in {repository}. "
                    "Write their titles and URLs to outputs/github.md. Do not change anything."
                )
            else:
                await client.beta.agents.vaults.credentials.create(
                    vault.id,
                    name="GitHub API token",
                    auth={
                        "type": "environment_variable",
                        "secret_name": "GITHUB_TOKEN",
                        "secret_value": os.environ["GITHUB_TOKEN"],
                        "networking": {
                            "type": "limited",
                            "allowed_hosts": ["api.github.com"],
                        },
                    },
                )
                environment["network"] = {
                    "access": "restricted",
                    "allowed_domains": ["api.github.com"],
                }
                prompt = (
                    "Run curl --fail --silent --show-error https://api.github.com/user "
                    '-H "Authorization: Bearer $GITHUB_TOKEN" and write only the returned '
                    "login field to outputs/github.md. Do not print environment variables."
                )
            async with workspace_session(
                agent=agent, environment=environment, vault_ids=[vault.id]
            ) as work:
                await work.turn(prompt)
                await work.save("github.md")
            succeeded = True
        finally:
            try:
                await client.beta.agents.vaults.delete(vault.id)
            except Exception:  # noqa: BLE001
                message = f"Vault cleanup failed; delete vault {vault.id} later"
                if succeeded:
                    raise ExampleError(message) from None
                print(message, file=sys.stderr)


if __name__ == "__main__":
    run(main())
