# Browserbase on Runloop: Python

Drive [Browserbase](https://www.browserbase.com) cloud browsers from [Runloop](https://runloop.ai) devboxes. The agent runs in a devbox; the browser runs on Browserbase, driven by connecting Playwright over CDP to the session's connect URL, so no Chromium runs in the devbox.

## Setup

Requires Python 3.12+.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export RUNLOOP_API_KEY="your-key"
export BROWSERBASE_API_KEY="your-key"
export BROWSERBASE_PROJECT_ID="your-project-id"
```

## Usage

```bash
python main.py create-blueprint   # one time (reused on later runs)
python main.py run                 # research crawl
```

### Commands

| Command | Description |
| --- | --- |
| `create-blueprint [--rebuild]` | Reuse an existing built blueprint, or build one. `--rebuild` forces a fresh build. |
| `run [--manual] [--snapshot]` | Research crawl. `--manual` installs the Browserbase SDK at runtime; `--snapshot` snapshots the disk on success. |

## Layout

- `main.py`: CLI entry point.
- The `browserbase_runloop/` package:
  - `config`: blueprint definition, crawl targets, and the in-devbox agent loader.
  - `create_blueprint`: idempotent blueprint build/reuse.
  - `run_browserbase`: the research crawl orchestrator.
  - `agent`: the in-devbox crawl agent, uploaded and run with `python3`.
  - `provision`: bounded devbox provisioning (fail fast on a stuck provision).
  - `status`: progress output.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Browserbase SDK and the Playwright client into a devbox image. No `playwright install chromium`: the browser runs on Browserbase.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up.
3. The agent calls `sessions.create()` for a Browserbase browser, then connects Playwright with `chromium.connect_over_cdp(session.connect_url)` and drives the remote browser. No local browser.
4. `run` writes a report plus screenshots and tears the devbox down.
