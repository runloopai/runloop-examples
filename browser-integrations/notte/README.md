# Notte on Runloop

Test a web app served from a Runloop devbox with a [Notte](https://notte.cc) cloud browser: the app runs in a devbox and is exposed on a public tunnel, the browser runs on Notte, and the devbox drives it with Playwright over CDP and with the Notte CLI, so no Chromium ever runs in the devbox.

## What's here

A **devbox app test** (`run`), in both Python and TypeScript: the devbox serves a small to-do app, then an agent inside the devbox checks it with a Notte browser. Playwright reads the page and takes a screenshot, and Notte CLI commands add a to-do and scrape the page to confirm it.

| Language | Location | Run |
|----------|----------|-----|
| Python | [`python/`](python/) | `python main.py {create-blueprint \| run}` |
| TypeScript | [`typescript/`](typescript/) | `npm run {create-blueprint \| run-notte}` |

## Setup

The Python example needs Python 3.12+; the TypeScript example needs Node.js 18+.

Both versions need two values:

```bash
cp .env.example .env   # fill in your keys, then export them (or export directly)
export RUNLOOP_API_KEY="your-key"
export NOTTE_API_KEY="your-key"
```

- `RUNLOOP_API_KEY`: provisions and drives the devbox ([platform.runloop.ai](https://platform.runloop.ai/settings#api-keys))
- `NOTTE_API_KEY`: injected into the devbox to reach Notte ([console.notte.cc](https://console.notte.cc))

See the per-language READMEs for full instructions.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Notte SDK with the Playwright client, the [Notte CLI](https://github.com/nottelabs/notte-cli) (`curl -fsSL https://notte.cc/install-cli.sh | sh`) and the [Notte skills](https://github.com/nottelabs/notte-skills) into a devbox image. The skills land in `~/.agents/skills`, where coding agents such as Claude Code and Codex pick them up. There is no `playwright install chromium`: the browser runs on Notte.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up, instead of hanging.
3. The devbox serves the app on port 8000 and opens a tunnel with `auth_mode="open"`, so the app is reachable at `https://8000-<tunnel-key>.tunnel.runloop.ai` without an auth header.
4. The agent opens a Notte session and uses `session.page`, a Playwright page connected to the Notte browser over CDP, to read the to-do list and take a screenshot. It then runs `notte sessions start`, `notte page goto`, `notte page fill`, `notte page click` and `notte page scrape`, the same commands a coding agent in the devbox would run.
5. The report and screenshot come back as files, and the devbox is torn down.
