"""Configuration for the Browserbase-on-Runloop starter.

Holds the blueprint definition, the default crawl targets, and a helper that
loads the in-devbox agent source so it can be uploaded to a devbox at run time.
"""

from importlib import resources

# Name of the blueprint that bakes the Browserbase + Playwright client into a
# devbox image.
BLUEPRINT_NAME = "browserbase-browser"

# Commands run at blueprint build time. We install the Browserbase SDK and the
# Playwright *client* only. We deliberately do NOT run `playwright install
# chromium`: the browser runs on Browserbase, and Playwright's `connect_over_cdp`
# drives that remote browser over a WebSocket without launching anything local.
# `--user` avoids PEP 668 ("externally-managed-environment") failures on the
# base image.
SYSTEM_SETUP_COMMANDS = ["python3 -m pip install --user browserbase playwright"]

# Default sites the research agent crawls. Override via RunBrowserbaseOptions.targets.
DEFAULT_TARGETS = [
    {"name": "Runloop", "url": "https://runloop.ai"},
    {"name": "Runloop Docs", "url": "https://docs.runloop.ai"},
    {"name": "Browserbase", "url": "https://www.browserbase.com"},
    {"name": "Browserbase Docs", "url": "https://docs.browserbase.com"},
    {"name": "Hacker News", "url": "https://news.ycombinator.com"},
    {"name": "Python Docs", "url": "https://docs.python.org/3/"},
]

# Default crawl breadth and depth.
DEFAULT_LINKS_PER_SEED = 10
DEFAULT_DEPTH = 2

# Paths used inside the devbox.
AGENT_REMOTE_PATH = "/home/user/agent.py"
RESULT_DIR = "/home/user/result"
SHOTS_DIR = "/home/user/shots"


def load_agent_source() -> str:
    """Return the source of the in-devbox crawl agent (`agent.py`)."""
    return resources.files("browserbase_runloop").joinpath("agent.py").read_text()
