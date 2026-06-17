from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.goto("http://localhost:8145/",wait_until="networkidle"); pg.wait_for_timeout(1700)
    pg.keyboard.press("ArrowDown"); prev=0
    for ms,tag in [(250,"a"),(550,"b"),(900,"c"),(1400,"d")]:
        pg.wait_for_timeout(ms if tag=="a" else ms-prev)
        pg.screenshot(path=f"docs/qa/p2-{tag}.png"); prev=ms
    open("docs/qa/p2-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
