from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8146/",wait_until="networkidle")
    pg.wait_for_timeout(3200)   # let the cover fully settle (ritual+scramble done)
    pg.keyboard.press("ArrowDown")
    prev=0
    for ms,tag in [(700,"a"),(1100,"b"),(1700,"c")]:
        pg.wait_for_timeout(ms-prev); pg.screenshot(path=f"docs/qa/p2b-{tag}.png"); prev=ms
    open("docs/qa/p2b-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
