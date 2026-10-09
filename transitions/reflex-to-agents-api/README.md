# Reflex workflows with the OpenAI Agents API

Runnable examples accompanying [the Reflex to Agents API guide preview](https://runloopai-docs-reflex-to-agents-api.mintlify.site/docs/transitions/reflex-to-agents-api).
The guide is the starting point. These scripts use OpenAI-managed sandboxes only.

| Reflex usage pattern | Example |
| --- | --- |
| Start a task | `01_start_task.py` |
| Send follow-ups | `02_follow_up.py` |
| Use a persona | `03_use_persona.py` |
| Connect MCP services or paths | `04_connect_mcp.py` (`service`, `environment`, `stdio`) |
| Stop and continue work | `05_return_to_work.py` (`start`, `continue`, `cancel`, `delete`) |
| Authenticate GitHub | `06_github_auth.py` (`mcp`, `api`) |

## Setup and run

Use Python 3.11 or newer and an OpenAI project with Agents API access:

```bash
uv venv --python 3.12
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python 01_start_task.py
```

Set `OPENAI_API_KEY` in your application shell or secret manager, outside the sandbox.
Grant `api.agents.read`, `api.agents.write`, and `api.responses.write`.
For GitHub also grant `api.vaults.read` and `api.vaults.write`, set `GITHUB_TOKEN`, and set
`GITHUB_REPOSITORY=owner/repo` for MCP mode. Never commit or log credential values.
`OPENAI_AGENT_MODEL` overrides the default `gpt-6-astra`.

Run the other filenames the same way, adding the desired mode for MCP and GitHub.
The stdio mode uploads its own script and installs `mcp>=1,<2` inside a sandbox venv.
It requires enabled networking. Local computer paths must be uploaded to the managed sandbox.

GitHub MCP mode permits issue search/read only; API mode uses a vault environment credential
and restricted HTTPS to `api.github.com`. The sandbox receives a placeholder; the proxy supplies
the real token. This does not configure `git clone` or an interactive GitHub login.

Outputs download into `artifacts/<session-id>/`, scoped to the completed turn and output path.
Runs incur model and container charges and attempt bounded cleanup. Inspect generated outputs.
If cleanup fails, use the printed session ID to inspect or delete the session later.
The GitHub example also prints its temporary vault ID; delete that vault through the Vaults API
if credential cleanup fails. A vault cleanup failure preserves any earlier task failure.

## Continue across invocations

```bash
.venv/bin/python 05_return_to_work.py start
.venv/bin/python 05_return_to_work.py continue SESSION_ID
.venv/bin/python 05_return_to_work.py delete SESSION_ID
```

Replace `SESSION_ID` with the printed ID. From a second terminal, `cancel SESSION_ID` stops active
work while retaining the session. `start` deliberately leaves its session open even if a turn fails.
Save its ID and delete it when finished. Serialize callers for a session.

There is no documented managed sandbox suspend/resume API. Continuing starts a new turn; it does not
restore an interrupted process. After sandbox expiry, download published artifacts before deleting
the session, then upload needed files into a new managed session. A scheduler can invoke the
start-task script; scheduling, retries, and overlapping-run policy belong to your application.

## Offline verification

```bash
.venv/bin/python -m unittest discover -s tests -v
uvx ruff check .
uvx ruff format --check .
uvx pyright common.py 01_start_task.py 02_follow_up.py 03_use_persona.py 04_connect_mcp.py 05_return_to_work.py 06_github_auth.py --pythonpath .venv/bin/python
```

Tests use mocked SDK calls and make no provider requests. No live sandbox, MCP, or GitHub runs
have been performed. Verify access, endpoint reachability, tool names, and outputs before adoption.

References: [managed sandboxes](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted),
[MCP](https://developers.openai.com/api/docs/guides/agents-api/tools/mcp),
[vaults](https://developers.openai.com/api/docs/guides/agents-api/tools/vaults),
[sessions](https://developers.openai.com/api/docs/guides/agents-api/sessions).
