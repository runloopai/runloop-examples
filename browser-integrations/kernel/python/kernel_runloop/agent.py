"""In-devbox research agent.

This module is uploaded into a Runloop devbox and run there (it is not imported
by the rest of the package). It drives a single Kernel cloud browser via
Playwright Execute to crawl a set of seed sites two levels deep, extracting
structured data and a homepage screenshot per seed. Configuration is read from
the environment, and results are written to files (no stdout protocol):

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

import json
import os
import time
from urllib.parse import urlparse

from kernel import Kernel

RESULT_DIR = "/home/user/result"
SHOTS_DIR = "/home/user/shots"

# Link paths we never follow (auth flows and non-content endpoints).
SKIP_SEGMENTS = {
    "login", "signin", "sign-in", "signup", "sign-up", "logout", "sign-out",
    "account", "auth", "oauth", "cart", "checkout", "register", "admin",
}
SKIP_SUFFIXES = (".txt", ".xml", ".json", ".pdf", ".zip", ".png", ".jpg", ".svg", ".rss", ".ico")

# Playwright snippet (JavaScript) run server-side on Kernel. It navigates, waits
# for the network to settle so client-rendered content is present, then returns
# structured data. `__URL__` is replaced per call.
EXTRACT_JS = r"""
await page.goto(__URL__, { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
return await page.evaluate(() => {
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
});
"""


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


def main():
    targets = json.loads(os.environ["TARGETS"])
    links_per_seed = int(os.environ.get("LINKS_PER_SEED", "10"))
    depth = int(os.environ.get("DEPTH", "2"))
    level2_parents = int(os.environ.get("LEVEL2_PARENTS", "2"))
    level2_links = int(os.environ.get("LEVEL2_LINKS", "3"))

    os.makedirs(RESULT_DIR, exist_ok=True)
    os.makedirs(SHOTS_DIR, exist_ok=True)

    client = Kernel()
    browser = client.browsers.create(stealth=True, timeout_seconds=1200)
    session_id = browser.session_id
    report = {
        "session_id": session_id,
        "live_view_url": browser.browser_live_view_url,
        "sites": [],
    }
    pages_visited = 0
    started = time.monotonic()

    def extract(url):
        resp = client.browsers.playwright.execute(
            session_id,
            code=EXTRACT_JS.replace("__URL__", json.dumps(url)),
            timeout_sec=60,
        )
        if not resp.success:
            raise RuntimeError(resp.error or "playwright.execute failed")
        return resp.result

    try:
        for seed in targets:
            print("seed " + seed["name"], flush=True)
            site = {"name": seed["name"], "url": seed["url"]}
            try:
                home = extract(seed["url"])
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
                shot = client.browsers.computer.capture_screenshot(session_id)
                shot_file = safe_name(seed["name"]) + ".png"
                with open(os.path.join(SHOTS_DIR, shot_file), "wb") as fh:
                    fh.write(shot.read())
                site["screenshot"] = shot_file
            except Exception as exc:
                print("  screenshot failed: " + str(exc)[:80], flush=True)

            visited = {home["final_url"].rstrip("/"), seed["url"].rstrip("/")}
            level1 = [u for u in home.get("links", []) if acceptable(u, visited)][:links_per_seed]

            for index, link in enumerate(level1):
                if not acceptable(link, visited):
                    continue
                try:
                    sub = extract(link)
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
                    level2 = [
                        u for u in sub.get("links", []) if acceptable(u, visited)
                    ][:level2_links]
                    for deep_link in level2:
                        if not acceptable(deep_link, visited):
                            continue
                        try:
                            deep = extract(deep_link)
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
    finally:
        try:
            client.browsers.delete_by_id(session_id)
            print("browser released", flush=True)
        except Exception as exc:
            print("release failed: " + str(exc)[:80], flush=True)

        # Always write results, so partial progress survives any single failure.
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
