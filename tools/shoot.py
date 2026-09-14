"""Render the landing page for the critics.

Usage: python3 tools/shoot.py <out_dir> [shot ...]
Shots: desk-first desk-full desk-nav desk-hover mob-first mob-full mob-menu planner-desk planner-mob
       plus element shots: el:<css-selector>:<desk|mob>:<name>
"""
import sys, threading, pathlib, functools, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
SHOTS = sys.argv[2:] or ["desk-first", "desk-full", "mob-first", "mob-full"]

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

import os
# BASE_URL=http://127.0.0.1:8099/ renders the server build through an SSH tunnel (nothing is generated locally).
BASE = os.environ.get("BASE_URL")
if not BASE:
    Handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    BASE = f"http://127.0.0.1:{httpd.server_address[1]}/"
URL = BASE + os.environ.get("PAGE", "index.html")

DESK = dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
MOB = dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
TAB = dict(viewport={"width": 820, "height": 1180}, device_scale_factor=1, is_mobile=True, has_touch=True)
MOBTALL = dict(viewport={"width": 390, "height": 1000}, device_scale_factor=2, is_mobile=True, has_touch=True)

def prime(page):
    """Scroll through the page so lazy images load, then return to top."""
    page.evaluate("""async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      scrollTo(0, 0);
    }""")
    page.wait_for_timeout(400)

def open_page(browser, dev, reduced=False):
    ctx = browser.new_context(**dev, reduced_motion="reduce" if reduced else "no-preference")
    page = ctx.new_page()
    page.goto(URL, wait_until="load"); page.wait_for_timeout(900)
    page.evaluate("document.fonts.ready")
    if reduced:
        page.add_style_tag(content=".sticky-cta{display:none!important}")
    return ctx, page

with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    for shot in SHOTS:
        if shot.startswith("el:"):
            _, sel, dev, name = shot.split(":", 3)
            ctx, page = open_page(b, {"desk": DESK, "mob": MOB, "tab": TAB}[dev], reduced=True)
            prime(page)
            page.locator(sel).first.scroll_into_view_if_needed(); page.wait_for_timeout(300)
            page.locator(sel).first.screenshot(path=str(OUT / f"{name}.jpg"), type="jpeg", quality=84)
            ctx.close(); continue
        dev = DESK if shot.startswith(("desk", "planner-desk")) else (MOBTALL if shot == "mob-tall" else MOB)
        full = shot.endswith("full")
        ctx, page = open_page(b, dev, reduced=full)
        if full:
            prime(page)
            page.screenshot(path=str(OUT / f"{shot}.jpg"), full_page=True, type="jpeg", quality=80)
        elif shot.endswith("first") or shot == "mob-tall":
            page.wait_for_timeout(1400)
            page.screenshot(path=str(OUT / f"{shot}.jpg"), type="jpeg", quality=84)
        elif shot == "desk-nav":
            page.mouse.wheel(0, 700); page.wait_for_timeout(900)
            page.screenshot(path=str(OUT / f"{shot}.jpg"), type="jpeg", quality=84)
        elif shot == "desk-hover":
            prime(page)
            card = page.locator(".card").first
            card.scroll_into_view_if_needed(); page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / "desk-hover-before.jpg"), type="jpeg", quality=84)
            card.hover(); page.wait_for_timeout(700)
            page.screenshot(path=str(OUT / "desk-hover-after.jpg"), type="jpeg", quality=84)
        elif shot == "mob-scrolled":
            page.mouse.wheel(0, 1500); page.wait_for_timeout(1200)
            page.screenshot(path=str(OUT / f"{shot}.jpg"), type="jpeg", quality=84)
        elif shot == "mob-menu":
            page.locator("[data-menu-open]").first.click(); page.wait_for_timeout(600)
            page.screenshot(path=str(OUT / f"{shot}.jpg"), type="jpeg", quality=84)
        elif shot.startswith("planner"):
            page.locator(".hero [data-planner-open]").first.click(); page.wait_for_timeout(700)
            page.screenshot(path=str(OUT / f"{shot}.jpg"), type="jpeg", quality=84)
            page.locator("[data-planner-submit]").click(); page.wait_for_timeout(400)
            page.screenshot(path=str(OUT / f"{shot}-errors.jpg"), type="jpeg", quality=84)
        ctx.close()
    b.close()
httpd.shutdown()
print("shots ->", OUT)
