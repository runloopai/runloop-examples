# Kernel on Runloop

Give a Runloop agent browser access with [Kernel](https://www.kernel.sh): the agent runs in a devbox, the browser runs on Kernel, and the devbox drives it server-side with Playwright Execute, so no Chromium ever runs in the devbox.

This is the runnable companion to the [Kernel on Runloop](https://docs.runloop.ai/docs/tutorials/kernel-runloop) tutorial and cookbook recipes.

## What's here

A **research crawl** (`run`), in both Python and TypeScript: a research agent inside a devbox drives one Kernel browser to scan seed sites and bring back structured data plus screenshots.

| Language | Location | Run |
|----------|----------|-----|
| Python | [`python/`](python/) | `python main.py {create-blueprint \| run}` |
| TypeScript | [`typescript/`](typescript/) | `npm run {create-blueprint \| run-kernel}` |

## Setup

Both versions need two API keys:

```bash
cp .env.example .env   # fill in your keys, then export them (or export directly)
export RUNLOOP_API_KEY="your-key"
export KERNEL_API_KEY="your-key"
```

- `RUNLOOP_API_KEY`: provisions and drives the devbox ([platform.runloop.ai](https://platform.runloop.ai/settings#api-keys))
- `KERNEL_API_KEY`: injected into the devbox to reach Kernel ([kernel.sh](https://www.kernel.sh))

See the per-language READMEs for full instructions.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Kernel SDK into a devbox image, so devboxes start ready.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up, instead of hanging.
3. The agent calls `browsers.create()` for a Kernel cloud browser session, then drives it with `browsers.playwright.execute()`: Playwright code runs co-located with the browser on Kernel and returns structured data. No CDP, no local browser.
4. The report and screenshots come back as files, and the devbox is torn down.
