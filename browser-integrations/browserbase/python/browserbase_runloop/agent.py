"""In-devbox research agent.

This module is uploaded into a Runloop devbox and run there (it is not imported
by the rest of the package). It creates a single Browserbase cloud browser, then
connects a local Playwright client to it over CDP (``connect_over_cdp`` against
the session's ``connect_url``) to crawl a set of seed sites two levels deep,
extracting structured data and a homepage screenshot per seed. The Playwright
*client* drives a browser that runs on Browserbase, so the devbox never launches
Chromium itself. Configuration is read from the environment, and results are
written to files (no stdout protocol):

    TARGETS         JSON list of {"name", "url"}
    LINKS_PER_SEED  level-1 internal links followed per seed (default 10)
    DEPTH           crawl depth, 1 or 2 (default 2)
    LEVEL2_PARENTS  how many level-1 pages to expand into level 2 (default 2)
    LEVEL2_LINKS    level-2 links per expanded parent (default 3)

Outputs:
    /home/user/result/report.json    full structured report
    /home/user/result/summary.json   compact summary
    /home/user/shots/<seed>.png      one homepage screenshot per seed
"""

import contextlib
import json
import os
import time
from urllib.parse import urlparse

from browserbase import Browserbase
from playwright.sync_api import sync_playwright

RESULT_DIR = "/home/user/result"
SHOTS_DIR = "/home/user/shots"

# Link paths we never follow (auth flows and non-content endpoints).
SKIP_SEGMENTS = {
    "login", "signin", "sign-in", "signup", "sign-up", "logout", "sign-out",
    "account", "auth", "oauth", "cart", "checkout", "register", "admin",
}
SKIP_SUFFIXES = (".txt", ".xml", ".json", ".pdf", ".zip", ".png", ".jpg", ".svg", ".rss", ".ico")

# JavaScript run in the page (via page.evaluate) after Playwright navigates. It
# returns structured data; navigation itself happens from Python with page.goto.
EXTRACT_JS = r"""() => {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const meta = document.querySelector('meta[name="description"]');
  const here = location.origin;
  const links = [];
  const seen = new Set();
  for (const a of document.querySelectorAll("a[href]")) {
    let u;
    try { u = new URL(a.href, location.href); } catch (e) { continue; }
    if (u.origin !== here) continue;
    u.hash = "";
    const key = u.href.replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    links.push(u.href);
  }
  return {
    final_url: location.href,
    title: clean(document.title),
    description: clean(meta ? meta.getAttribute("content") : ""),
    headings: Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((e) => clean(e.textContent)).filter(Boolean).slice(0, 15),
    link_count: document.querySelectorAll("a[href]").length,
    links: links.slice(0, 40),
  };
}"""


def acceptable(url, visited):
    """True if `url` is worth crawling (same-site content we have not seen)."""
    if url.rstrip("/") in visited:
        return False
    path = urlparse(url).path.lower()
    segments = [s for s in path.split("/") if s]
    if any(seg in SKIP_SEGMENTS for seg in segments):
        return False
    return not path.endswith(SKIP_SUFFIXES)


def safe_name(name):
    """Filesystem-safe slug for a seed name."""
    return "".join(c if c.isalnum() else "_" for c in name.lower())


def extract(page, url):
    """Navigate `page` to `url` and return the structured DOM data."""
    page.goto(url, wait_until="domcontentloaded", timeout=20000)
    with contextlib.suppress(Exception):
        # networkidle is best-effort; some pages never go fully idle.
        page.wait_for_load_state("networkidle", timeout=5000)
    return page.evaluate(EXTRACT_JS)


def crawl(page, targets, links_per_seed, depth, level2_parents, level2_links, report):
    """Crawl every seed on a single reused page; return the page count visited."""
    pages_visited = 0
    for seed in targets:
        print("seed " + seed["name"], flush=True)
        site = {"name": seed["name"], "url": seed["url"]}
        try:
            home = extract(page, seed["url"])
        except Exception as exc:
            site["error"] = str(exc)[:200]
            report["sites"].append(site)
            print("  home failed: " + str(exc)[:80], flush=True)
            continue
        pages_visited += 1
        site.update(
            final_url=home["final_url"],
            title=home["title"],
            description=home["description"],
            headings=home["headings"],
            link_count=home["link_count"],
            subpages=[],
        )

        # Screenshot the homepage now, before the crawl navigates away.
        site["screenshot"] = None
        try:
            shot_file = safe_name(seed["name"]) + ".png"
            page.screenshot(path=os.path.join(SHOTS_DIR, shot_file))
            site["screenshot"] = shot_file
        except Exception as exc:
            print("  screenshot failed: " + str(exc)[:80], flush=True)

        visited = {home["final_url"].rstrip("/"), seed["url"].rstrip("/")}
        level1 = [u for u in home.get("links", []) if acceptable(u, visited)][:links_per_seed]

        for index, link in enumerate(level1):
            if not acceptable(link, visited):
                continue
            try:
                sub = extract(page, link)
            except Exception as exc:
                print("  l1 failed: " + str(exc)[:60], flush=True)
                continue
            pages_visited += 1
            visited.add(sub["final_url"].rstrip("/"))
            entry = {
                "url": sub["final_url"],
                "title": sub["title"],
                "headings": sub["headings"][:5],
                "subpages": [],
            }
            # Expand the first few level-1 pages one level deeper.
            if depth >= 2 and index < level2_parents:
                level2 = [u for u in sub.get("links", []) if acceptable(u, visited)][:level2_links]
                for deep_link in level2:
                    if not acceptable(deep_link, visited):
                        continue
                    try:
                        deep = extract(page, deep_link)
                    except Exception as exc:
                        print("    l2 failed: " + str(exc)[:50], flush=True)
                        continue
                    pages_visited += 1
                    visited.add(deep["final_url"].rstrip("/"))
                    entry["subpages"].append({"url": deep["final_url"], "title": deep["title"]})
                    print("    ++ " + (deep["title"] or deep["final_url"])[:60], flush=True)
            site["subpages"].append(entry)
            print("  + " + (sub["title"] or sub["final_url"])[:64], flush=True)

        report["sites"].append(site)
    return pages_visited


def main():
    targets = json.loads(os.environ["TARGETS"])
    links_per_seed = int(os.environ.get("LINKS_PER_SEED", "10"))
    depth = int(os.environ.get("DEPTH", "2"))
    level2_parents = int(os.environ.get("LEVEL2_PARENTS", "2"))
    level2_links = int(os.environ.get("LEVEL2_LINKS", "3"))

    os.makedirs(RESULT_DIR, exist_ok=True)
    os.makedirs(SHOTS_DIR, exist_ok=True)

    project_id = os.environ["BROWSERBASE_PROJECT_ID"]
    client = Browserbase()  # reads BROWSERBASE_API_KEY
    session = client.sessions.create(project_id=project_id)

    # Live view: a human can watch the session in the browser. Best-effort, since
    # the debug endpoint can briefly 404 right after create.
    live_view_url = None
    try:
        live_view_url = client.sessions.debug(session.id).debugger_fullscreen_url
    except Exception as exc:
        print("live view unavailable: " + str(exc)[:80], flush=True)

    report = {
        "session_id": session.id,
        "live_view_url": live_view_url,
        "region": session.region,
        "sites": [],
    }
    pages_visited = 0
    started = time.monotonic()

    try:
        with sync_playwright() as pw:
            # Connect the Playwright client to the remote Browserbase browser over CDP.
            # No local Chromium: connect_over_cdp drives the browser on Browserbase.
            browser = pw.chromium.connect_over_cdp(session.connect_url)
            context = browser.contexts[0] if browser.contexts else browser.new_context()
            page = context.pages[0] if context.pages else context.new_page()
            try:
                pages_visited = crawl(
                    page, targets, links_per_seed, depth, level2_parents, level2_links, report
                )
            finally:
                with contextlib.suppress(Exception):
                    browser.close()
                    print("browser closed", flush=True)
    finally:
        # Always release the session and write results, so an unexpected failure
        # anywhere above still frees the Browserbase session and preserves the
        # partial progress that crawl() recorded into `report["sites"]`.
        with contextlib.suppress(Exception):
            client.sessions.update(session.id, status="REQUEST_RELEASE", project_id=project_id)
            print("session released", flush=True)

        report["pages_visited"] = pages_visited
        report["elapsed_seconds"] = round(time.monotonic() - started, 1)
        with open(os.path.join(RESULT_DIR, "report.json"), "w") as fh:
            json.dump(report, fh)

        summary = {
            "pages_visited": pages_visited,
            "elapsed_seconds": report["elapsed_seconds"],
            "live_view_url": report["live_view_url"],
            "sites": [
                {
                    "name": s.get("name"),
                    "title": s.get("title"),
                    "headings": len(s.get("headings") or []),
                    "subpages": len(s.get("subpages") or []),
                    "screenshot": s.get("screenshot"),
                    "error": s.get("error"),
                }
                for s in report["sites"]
            ],
        }
        with open(os.path.join(RESULT_DIR, "summary.json"), "w") as fh:
            json.dump(summary, fh)
        print("wrote results", flush=True)


if __name__ == "__main__":
    main()
