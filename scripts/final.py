import os
from playwright.sync_api import sync_playwright
OUT="docs/qa/final"; os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1440,"height":820},device_scale_factor=2)
    errs=[]; pg.on("pageerror",lambda e: errs.append(f"PAGEERROR {e}"))
    pg.on("console",lambda m: errs.append(f"console.error: {m.text}") if m.type=="error" else None)
    pg.goto("http://localhost:8173/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(2200)
    pg.screenshot(path=f"{OUT}/00.png")
    for i in range(1,22):
        pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(2500)
        pg.screenshot(path=f"{OUT}/{i:02d}.png")
    print("CONSOLE/PAGE ERRORS:", errs or "NONE")
    b.close()
