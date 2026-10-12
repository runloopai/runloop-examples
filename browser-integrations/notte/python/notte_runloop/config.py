"""Configuration for the Notte-on-Runloop starter.

Holds the blueprint definition, the web app the devbox serves, and a helper that
loads the in-devbox agent source so it can be uploaded to a devbox at run time.
"""

from importlib import resources

# Name of the blueprint that bakes the Notte SDK, the Notte CLI and the Notte
# skills into a devbox image.
BLUEPRINT_NAME = "notte-browser"

# Commands run at blueprint build time. We install the Notte SDK with the
# Playwright *client* only. We deliberately do NOT run `playwright install
# chromium`: the browser runs on Notte, and Playwright's `connect_over_cdp`
# drives that remote browser over a WebSocket without launching anything local.
# `--user` avoids PEP 668 ("externally-managed-environment") failures on the
# base image. The Notte skills installer needs Node 22.20+, newer than the
# starter image's Node, so Node is upgraded first.
SYSTEM_SETUP_COMMANDS = [
    "python3 -m pip install --user 'notte-sdk[playwright]'",
    "curl -fsSL https://notte.cc/install-cli.sh | sh",
    "sudo npx -y n 22",
    "cd /home/user && notte skill add --yes",
]

# Port the devbox serves the app on, reached through the devbox's public tunnel.
APP_PORT = 8000

# Paths used inside the devbox.
APP_DIR = "/home/user/app"
AGENT_REMOTE_PATH = "/home/user/agent.py"
RESULT_DIR = "/home/user/result"
SHOTS_DIR = "/home/user/shots"

# A small to-do app, standing in for whatever your agent builds in the devbox.
APP_HTML = """<!doctype html>
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
        document.getElementById("count").textContent = `${count} to-dos`;
        input.value = "";
      });
    </script>
  </body>
</html>
"""


def load_agent_source() -> str:
    """Return the source of the in-devbox test agent (`agent.py`)."""
    return resources.files("notte_runloop").joinpath("agent.py").read_text()
