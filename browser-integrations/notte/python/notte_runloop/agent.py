"""In-devbox test agent.

This module is uploaded into a Runloop devbox and run there (it is not imported
by the rest of the package). It checks a web app that the devbox itself serves
on a public tunnel URL, using a Notte cloud browser two ways:

1. Playwright over CDP, through ``session.page`` from the Notte SDK: read the
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
