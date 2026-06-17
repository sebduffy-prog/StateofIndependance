from playwright.sync_api import sync_playwright
WANT={0:"cover",1:"02",3:"04",7:"08",13:"14",14:"15",15:"16"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":820},device_scale_factor=2)
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto("http://localhost:8170/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(2600)
    pg.screenshot(path="docs/qa/truth-cover.png")
    for i in range(1,16):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2700); pg.screenshot(path=f"docs/qa/truth-{WANT[i]}.png")
        else: pg.wait_for_timeout(850)
    print("ERRORS:", errs or "none")
    b.close()
