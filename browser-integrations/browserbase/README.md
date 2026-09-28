# Browserbase on Runloop

Give a Runloop agent browser access with [Browserbase](https://www.browserbase.com): the agent runs in a devbox, the browser runs on Browserbase, and the devbox drives it by connecting Playwright over CDP to the session's connect URL, so no Chromium ever runs in the devbox.

This is the runnable companion to the [Browserbase on Runloop](https://docs.runloop.ai/docs/tutorials/browserbase-runloop) tutorial.

## What's here

A **research crawl** (`run`), in both Python and TypeScript: a research agent inside a devbox drives one Browserbase browser to scan seed sites and bring back structured data plus screenshots.

| Language | Location | Run |
|----------|----------|-----|
| Python | [`python/`](python/) | `python main.py {create-blueprint \| run}` |
| TypeScript | [`typescript/`](typescript/) | `npm run {create-blueprint \| run-browserbase}` |

## Setup

The Python example needs Python 3.12+; the TypeScript example needs Node.js 18+.

Both versions need three values:

```bash
cp .env.example .env   # fill in your keys, then export them (or export directly)
export RUNLOOP_API_KEY="your-key"
export BROWSERBASE_API_KEY="your-key"
export BROWSERBASE_PROJECT_ID="your-project-id"
```

- `RUNLOOP_API_KEY`: provisions and drives the devbox ([platform.runloop.ai](https://platform.runloop.ai/settings#api-keys))
- `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`: injected into the devbox to reach Browserbase ([browserbase.com](https://www.browserbase.com))

See the per-language READMEs for full instructions.

## How it works

1. `create-blueprint` builds (or reuses) a blueprint that bakes the Browserbase SDK and the Playwright client into a devbox image, so devboxes start ready. There is no `playwright install chromium`: the browser runs on Browserbase.
2. A run provisions a devbox with a bounded wait: a stuck provision fails fast and is cleaned up, instead of hanging.
3. The agent calls `sessions.create()` for a Browserbase cloud browser, then connects Playwright to it with `chromium.connect_over_cdp(session.connect_url)` and drives the remote browser. No local browser.
4. The report and screenshots come back as files, and the devbox is torn down.
