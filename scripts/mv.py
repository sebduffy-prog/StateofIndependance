from playwright.sync_api import sync_playwright
WANT={16:"17",20:"21"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":820},device_scale_factor=2)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8171/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1800)
    for i in range(1,21):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2400); pg.screenshot(path=f"docs/qa/mv-{WANT[i]}.png")
        else: pg.wait_for_timeout(750)
    print("ERRORS:", errs or "none")
    b.close()
