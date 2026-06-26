# Browserbase on Runloop: TypeScript

Drive [Browserbase](https://www.browserbase.com) cloud browsers from [Runloop](https://runloop.ai) devboxes. The agent runs in a devbox; the browser runs on Browserbase, driven by connecting Playwright over CDP to the session's connect URL, so no Chromium runs in the devbox.

The orchestrator is TypeScript (`@runloop/api-client`). The in-devbox agent is Python (`agent.py`, embedded verbatim in `src/config.ts`); the devbox runs it with `python3`, so the blueprint only needs the Python Browserbase SDK.

## Setup

```bash
npm install

export RUNLOOP_API_KEY="your-key"
export BROWSERBASE_API_KEY="your-key"
export BROWSERBASE_PROJECT_ID="your-project-id"
```

## Usage

```bash
npm run create-blueprint     # one time (reused on later runs)
npm run run-browserbase      # research crawl
```

### Commands

| Command | Description |
| --- | --- |
| `npm run create-blueprint` | Reuse an existing built blueprint, or build one (`-- --rebuild` forces a fresh build) |
| `npm run run-browserbase` | Research crawl (`-- --manual` skips the blueprint; `-- --snapshot` snapshots on success) |

## Layout

- `src/index.ts`: CLI entry point and public re-exports.
- `src/config.ts`: blueprint definition, crawl targets, and the in-devbox Python agent (embedded verbatim).
- `src/create-blueprint.ts`: idempotent blueprint build/reuse.
- `src/run-browserbase.ts`: the research crawl orchestrator.
- `src/provision.ts`: bounded devbox provisioning (fail fast on a stuck provision).
- `src/status.ts`: progress output.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Browserbase SDK and the Playwright client into a devbox image. No `playwright install chromium`: the browser runs on Browserbase.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up.
3. The in-devbox agent calls `sessions.create()` for a Browserbase browser, then connects Playwright with `chromium.connect_over_cdp(session.connect_url)` and drives the remote browser. No local browser.
4. `run-browserbase` writes a report plus screenshots and tears the devbox down in a `finally` block.

## Build

```bash
npm run build
```

`npm run build` runs `tsc` (type-check plus declaration emit to `dist/`).
