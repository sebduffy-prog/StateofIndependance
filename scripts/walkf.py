import os
from playwright.sync_api import sync_playwright
OUT="docs/qa/walkf"; os.makedirs(OUT,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8142/",wait_until="networkidle"); pg.wait_for_timeout(2000)
    pg.screenshot(path=f"{OUT}/00-cover.png")
    for i in range(1,22):
        pg.keyboard.press("ArrowDown")
        pg.wait_for_timeout(2700)   # full transition (~1.3s) + scramble (~1.2s) + buffer
        pg.screenshot(path=f"{OUT}/{i:02d}.png")
    open(f"{OUT}/console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("walkf done")
