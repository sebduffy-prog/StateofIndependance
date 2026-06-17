from playwright.sync_api import sync_playwright
WANT={5:"06",6:"07",9:"10",10:"11",11:"12",12:"13",13:"14",15:"16"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8150/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1700)
    for i in range(1,16):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2500); pg.screenshot(path=f"docs/qa/k3-{WANT[i]}.png")
        else: pg.wait_for_timeout(800)
    open("docs/qa/k3-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
