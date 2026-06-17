from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    errs=[]; pg.on("console",lambda m: errs.append(f"{m.type}: {m.text}") if m.type=="error" else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto("http://localhost:8160/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1800)
    for _ in range(4): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(1100)
    # now reverse
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(550); pg.screenshot(path="docs/qa/eng-backmid.png")
    pg.wait_for_timeout(900); pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(1300)
    pg.screenshot(path="docs/qa/eng-backsettled.png")
    print("CONSOLE ERRORS:", errs or "none")
    b.close()
