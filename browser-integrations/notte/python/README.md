# Notte on Runloop: Python

Test a web app served from a [Runloop](https://runloop.ai) devbox with a [Notte](https://notte.cc) cloud browser. The app runs in the devbox on a public tunnel; the browser runs on Notte, driven with Playwright over CDP and with the Notte CLI, so no Chromium runs in the devbox.

## Setup

Requires Python 3.12+.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export RUNLOOP_API_KEY="your-key"
export NOTTE_API_KEY="your-key"
```

## Usage

```bash
python main.py create-blueprint   # one time (reused on later runs)
python main.py run                 # serve the app and test it with Notte
```

### Commands

| Command | Description |
| --- | --- |
| `create-blueprint [--rebuild]` | Reuse an existing built blueprint, or build one. `--rebuild` forces a fresh build. |
| `run [--manual] [--snapshot]` | Serve the app and test it. `--manual` installs Notte at runtime; `--snapshot` snapshots the disk on success. |

## Layout

- `main.py`: CLI entry point.
- The `notte_runloop/` package:
  - `config`: blueprint definition, the to-do app, and the in-devbox agent loader.
  - `create_blueprint`: idempotent blueprint build/reuse.
  - `run_notte`: serves the app on a tunnel and runs the test agent.
  - `agent`: the in-devbox test agent, uploaded and run with `python3`.
  - `provision`: bounded devbox provisioning (fail fast on a stuck provision).
  - `status`: progress output.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Notte SDK with the Playwright client, the Notte CLI and the Notte skills into a devbox image. No `playwright install chromium`: the browser runs on Notte.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up.
3. The devbox serves the app on port 8000 behind an open tunnel (`devbox.net.enable_tunnel(auth_mode="open")`, then `devbox.get_tunnel_url(8000)`).
4. The agent reads the app with `session.page` (Playwright over CDP to Notte), then adds a to-do with Notte CLI commands and scrapes the page to confirm it.
5. `run` writes `report.json` plus `screenshots/app.png` and tears the devbox down.
