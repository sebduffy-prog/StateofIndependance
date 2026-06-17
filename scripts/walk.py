import os
from playwright.sync_api import sync_playwright

OUT = "docs/qa/walk"
os.makedirs(OUT, exist_ok=True)
STEPS = 22

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1512, "height": 900}, device_scale_factor=2)
    logs = []
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8123/", wait_until="networkidle")
    pg.wait_for_timeout(1600)
    pg.screenshot(path=f"{OUT}/00-cover-settled.png")
    for i in range(1, STEPS):
        pg.keyboard.press("ArrowDown")
        pg.wait_for_timeout(520)            # mid-transition
        pg.screenshot(path=f"{OUT}/{i:02d}-mid.png")
        pg.wait_for_timeout(1100)           # settled
        pg.screenshot(path=f"{OUT}/{i:02d}-settled.png")
    with open(f"{OUT}/console.txt", "w") as f:
        f.write("\n".join(logs) or "(no console output)")
    b.close()
print("done; frames in", OUT)
