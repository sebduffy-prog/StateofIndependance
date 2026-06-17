from playwright.sync_api import sync_playwright
WANT={0:"cover",1:"02",4:"05",14:"15"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8151/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(2600)
    pg.screenshot(path="docs/qa/elev-cover.png")
    for i in range(1,15):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2600); pg.screenshot(path=f"docs/qa/elev-{WANT[i]}.png")
        else: pg.wait_for_timeout(800)
    open("docs/qa/elev-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
