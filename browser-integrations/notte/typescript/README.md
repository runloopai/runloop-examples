# Notte on Runloop: TypeScript

Test a web app served from a [Runloop](https://runloop.ai) devbox with a [Notte](https://notte.cc) cloud browser. The app runs in the devbox on a public tunnel; the browser runs on Notte, driven with Playwright over CDP and with the Notte CLI, so no Chromium runs in the devbox.

The orchestrator is TypeScript (`@runloop/api-client`). The in-devbox agent is Python (`agent.py`, embedded verbatim in `src/config.ts`); the devbox runs it with `python3`, so the blueprint only needs the Python Notte SDK.

## Setup

```bash
npm install

export RUNLOOP_API_KEY="your-key"
export NOTTE_API_KEY="your-key"
```

## Usage

```bash
npm run create-blueprint     # one time (reused on later runs)
npm run run-notte            # serve the app and test it with Notte
```

### Commands

| Command | Description |
| --- | --- |
| `npm run create-blueprint` | Reuse an existing built blueprint, or build one (`-- --rebuild` forces a fresh build) |
| `npm run run-notte` | Serve the app and test it (`-- --manual` skips the blueprint; `-- --snapshot` snapshots on success) |

## Layout

- `src/index.ts`: CLI entry point and public re-exports.
- `src/config.ts`: blueprint definition, the to-do app, and the in-devbox Python agent (embedded verbatim).
- `src/create-blueprint.ts`: idempotent blueprint build/reuse.
- `src/run-notte.ts`: serves the app on a tunnel and runs the test agent.
- `src/provision.ts`: bounded devbox provisioning (fail fast on a stuck provision).
- `src/status.ts`: progress output.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Notte SDK with the Playwright client, the Notte CLI and the Notte skills into a devbox image. No `playwright install chromium`: the browser runs on Notte.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up.
3. The devbox serves the app on port 8000 behind an open tunnel (`devbox.net.enableTunnel({ auth_mode: "open" })`, then `devbox.getTunnelUrl(8000)`).
4. The agent reads the app with `session.page` (Playwright over CDP to Notte), then adds a to-do with Notte CLI commands and scrapes the page to confirm it.
5. `run-notte` writes `report.json` plus `screenshots/app.png` and tears the devbox down in a `finally` block.

## Build

```bash
npm run build
```

`npm run build` runs `tsc` (type-check plus declaration emit to `dist/`).
