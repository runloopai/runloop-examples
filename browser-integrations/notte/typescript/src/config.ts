/**
 * Configuration for the Notte-on-Runloop starter.
 *
 * Holds the blueprint definition, the web app the devbox serves, the in-devbox
 * paths, and the in-devbox agent source. The agent is embedded verbatim as a
 * string and uploaded to a devbox at run time; the devbox runs it with Python,
 * so the agent source stays Python regardless of this orchestrator being
 * TypeScript.
 */

/** Name of the blueprint that bakes the Notte SDK, CLI and skills into a devbox image. */
export const BLUEPRINT_NAME = "notte-browser";

/**
 * Commands run at blueprint build time. We install the Notte SDK with the
 * Playwright *client* only, never `playwright install chromium`: the browser
 * runs on Notte, and `connect_over_cdp` drives it remotely. `--user` avoids
 * PEP 668 ("externally-managed-environment") failures on the base image. The
 * Notte skills installer needs Node 22.20+, newer than the starter image's
 * Node, so Node is upgraded first.
 */
export const SYSTEM_SETUP_COMMANDS: string[] = [
  "python3 -m pip install --user 'notte-sdk[playwright]'",
  "curl -fsSL https://notte.cc/install-cli.sh | sh",
  "sudo npx -y n 22",
  "cd /home/user && notte skill add --yes",
];

/** Port the devbox serves the app on, reached through the devbox's public tunnel. */
export const APP_PORT = 8000;

/** Paths used inside the devbox. */
export const APP_DIR = "/home/user/app";
export const AGENT_REMOTE_PATH = "/home/user/agent.py";
export const RESULT_DIR = "/home/user/result";
export const SHOTS_DIR = "/home/user/shots";

/** A small to-do app, standing in for whatever your agent builds in the devbox. */
export const APP_HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Devbox To-dos</title></head>
  <body style="font-family: sans-serif; max-width: 480px; margin: 40px auto">
    <h1>Devbox To-dos</h1>
    <form id="add">
      <input id="title" name="title" placeholder="New to-do" aria-label="New to-do">
      <button type="submit">Add</button>
    </form>
    <ul id="todos">
      <li>Write the app</li>
      <li>Start the server</li>
    </ul>
    <p id="count">2 to-dos</p>
    <script>
      document.getElementById("add").addEventListener("submit", (event) => {
        event.preventDefault();
        const input = document.getElementById("title");
        if (!input.value.trim()) return;
        const item = document.createElement("li");
        item.textContent = input.value.trim();
        document.getElementById("todos").appendChild(item);
        const count = document.querySelectorAll("#todos li").length;
        document.getElementById("count").textContent = \`\${count} to-dos\`;
        input.value = "";
      });
    </script>
  </body>
</html>
`;

/**
 * Source of the in-devbox test agent (`agent.py`), embedded verbatim.
 *
 * This is Python: it is written to the devbox and executed there with
 * `python3`. It is never imported or run by this TypeScript package; the
 * orchestrator only uploads it and runs it inside the devbox.
 */
export const AGENT_SCRIPT = `"""In-devbox test agent.

This module is uploaded into a Runloop devbox and run there (it is not imported
by the rest of the package). It checks a web app that the devbox itself serves
on a public tunnel URL, using a Notte cloud browser two ways:

1. Playwright over CDP, through \`\`session.page\`\` from the Notte SDK: read the
   to-do list and take a screenshot.
2. The Notte CLI, the same commands a coding agent in the devbox would run:
   add a to-do and scrape the page to confirm it landed.

The Playwright *client* and the CLI drive a browser that runs on Notte, so the
devbox never launches Chromium itself. Configuration is read from the
environment, and results are written to files (no stdout protocol):

    APP_URL         public tunnel URL of the app served by the devbox
    NOTTE_API_KEY   Notte API key

Outputs:
    /home/user/result/report.json   structured report
    /home/user/shots/app.png        screenshot of the app
"""

import json
import os
import subprocess
import time

from notte_sdk import NotteClient

RESULT_DIR = "/home/user/result"
SHOTS_DIR = "/home/user/shots"
NEW_TODO = "Ship the Runloop example"


def notte_cli(*args, echo=True):
    """Run one Notte CLI command in the devbox and return its stdout."""
    command = ["notte", *args]
    print("$ " + " ".join(command), flush=True)
    result = subprocess.run(command, capture_output=True, text=True, timeout=120, check=True)
    output = result.stdout.strip()
    if echo:
        print(output, flush=True)
    return output


def check_with_playwright(url, report):
    """Read the app with Playwright over CDP and screenshot it."""
    client = NotteClient()  # reads NOTTE_API_KEY
    with client.Session() as session:
        report["viewer_url"] = session.response.viewer_url
        # session.page is a Playwright page connected to the Notte browser over CDP.
        page = session.page
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        report["title"] = page.title()
        report["todos_before"] = page.locator("#todos li").all_inner_texts()
        page.screenshot(path=os.path.join(SHOTS_DIR, "app.png"))
        report["screenshot"] = "app.png"
        print(f"Playwright saw {report['todos_before']}", flush=True)


def check_with_cli(url, report):
    """Add a to-do and scrape the page with Notte CLI commands."""
    session = json.loads(notte_cli("sessions", "start", "-o", "json", echo=False))
    report["cli_session_id"] = session["session_id"]
    print(f"Session {session['session_id']}, live view: {session['viewer_url']}", flush=True)
    try:
        notte_cli("page", "goto", url)
        notte_cli("page", "fill", "#title", NEW_TODO)
        notte_cli("page", "click", "button[type=submit]")
        report["scraped"] = notte_cli("page", "scrape", "--only-main-content")
    finally:
        notte_cli("sessions", "stop", "--yes")
    report["todo_added"] = NEW_TODO in report["scraped"]


def main():
    url = os.environ["APP_URL"]
    os.makedirs(RESULT_DIR, exist_ok=True)
    os.makedirs(SHOTS_DIR, exist_ok=True)

    report = {"app_url": url}
    started = time.monotonic()
    try:
        check_with_playwright(url, report)
        check_with_cli(url, report)
    finally:
        # Always write results, so a failure still preserves partial progress.
        report["elapsed_seconds"] = round(time.monotonic() - started, 1)
        with open(os.path.join(RESULT_DIR, "report.json"), "w") as fh:
            json.dump(report, fh)
        print("wrote results", flush=True)


if __name__ == "__main__":
    main()
`;
