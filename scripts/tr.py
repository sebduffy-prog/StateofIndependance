from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8144/",wait_until="networkidle"); pg.wait_for_timeout(1700)
    # walk all 22 to surface any engine error; grab a dissolve-through mid frame (03->04)
    for i in range(1,22):
        pg.keyboard.press("ArrowDown")
        if i==3: pg.wait_for_timeout(600); pg.screenshot(path="docs/qa/tr-04mid.png"); pg.wait_for_timeout(1400)
        else: pg.wait_for_timeout(900)
    open("docs/qa/tr-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
