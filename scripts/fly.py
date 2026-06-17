from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8148/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(2600)
    # cover -> 02 flythrough: capture the leaving stage engulfing
    pg.keyboard.press("ArrowDown"); prev=0
    for ms,tag in [(360,"a"),(640,"b"),(900,"c")]:
        pg.wait_for_timeout(ms-prev); pg.screenshot(path=f"docs/qa/fly-{tag}.png"); prev=ms
    # walk rest to surface engine errors
    for i in range(20): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(700)
    open("docs/qa/fly-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
