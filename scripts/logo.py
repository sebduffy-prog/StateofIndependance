from playwright.sync_api import sync_playwright
WANT={9:"arch",14:"emp",16:"move1",17:"move2"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":820},device_scale_factor=2)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8183/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(2000)
    for i in range(1,18):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2400); pg.screenshot(path=f"docs/qa/logo-{WANT[i]}.png")
        else: pg.wait_for_timeout(800)
    print("ERRORS:", errs or "none")
    b.close()
