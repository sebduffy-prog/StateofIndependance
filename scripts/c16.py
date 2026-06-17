from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1440,"height":820},device_scale_factor=2)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8172/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1700)
    for _ in range(15): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(780)
    pg.wait_for_timeout(1800); pg.screenshot(path="docs/qa/c16-final.png")
    print("ERRORS:", errs or "none")
    b.close()
