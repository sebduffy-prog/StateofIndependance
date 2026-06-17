from playwright.sync_api import sync_playwright
WANT={3:"04",8:"09",17:"18"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8141/",wait_until="networkidle"); pg.wait_for_timeout(1800)
    for i in range(1,18):
        pg.keyboard.press("ArrowDown")
        if i in WANT:
            pg.wait_for_timeout(2600); pg.screenshot(path=f"docs/qa/c2-{WANT[i]}.png")
        else:
            pg.wait_for_timeout(850)
    open("docs/qa/c2-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
