# Kernel on Runloop: Python

Drive [Kernel](https://www.kernel.sh) cloud browsers from [Runloop](https://runloop.ai) devboxes. The agent runs in a devbox; the browser runs on Kernel, driven server-side with Playwright Execute, so no Chromium runs in the devbox.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export RUNLOOP_API_KEY="your-key"
export KERNEL_API_KEY="your-key"
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
| `run [--manual] [--snapshot]` | Research crawl. `--manual` installs the Kernel SDK at runtime; `--snapshot` snapshots the disk on success. |

## Layout

- `main.py`: CLI entry point.
- The `kernel_runloop/` package:
  - `config`: blueprint definition, crawl targets, and the in-devbox agent loader.
  - `create_blueprint`: idempotent blueprint build/reuse.
  - `run_kernel`: the research crawl orchestrator.
  - `agent`: the in-devbox crawl agent, uploaded and run with `python3`.
  - `provision`: bounded devbox provisioning (fail fast on a stuck provision).
  - `status`: progress output.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Kernel SDK into a devbox image.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up.
3. The agent drives a Kernel browser with `browsers.playwright.execute()`: Playwright runs co-located with the browser on Kernel and returns structured data. No CDP, no local browser.
4. `run` writes a report plus screenshots and tears the devbox down.
