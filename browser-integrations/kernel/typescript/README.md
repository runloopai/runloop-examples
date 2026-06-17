# Kernel on Runloop: TypeScript

Drive [Kernel](https://www.kernel.sh) cloud browsers from [Runloop](https://runloop.ai) devboxes. The agent runs in a devbox; the browser runs on Kernel, driven server-side with Playwright Execute, so no Chromium runs in the devbox.

The orchestrator is TypeScript (`@runloop/api-client`). The in-devbox agent is Python (`agent.py`, embedded verbatim in `src/config.ts`); the devbox runs it with `python3`.

## Setup

```bash
npm install

export RUNLOOP_API_KEY="your-key"
export KERNEL_API_KEY="your-key"
```

## Usage

```bash
npm run create-blueprint   # one time (reused on later runs)
npm run run-kernel         # research crawl
```

### Commands

| Command | Description |
| --- | --- |
| `npm run create-blueprint` | Reuse an existing built blueprint, or build one (`-- --rebuild` forces a fresh build) |
| `npm run run-kernel` | Research crawl (`-- --manual` skips the blueprint; `-- --snapshot` snapshots on success) |

## Layout

- `src/index.ts`: CLI entry point.
- `src/config.ts`: blueprint and crawl config, and the embedded Python agent.
- `src/run-kernel.ts`: the research crawl orchestrator.
- `src/provision.ts`: bounded devbox provisioning. `src/status.ts`: progress output.

## Development

```bash
npm run build   # tsc type-check + declaration emit
```
