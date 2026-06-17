from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    pg.goto("http://localhost:8125/",wait_until="networkidle"); pg.wait_for_timeout(1600)
    targets={4:"04",10:"10",12:"12",20:"20"}  # keypresses -> label
    for i in range(1,21):
        pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(100)
        if i in targets:
            pg.wait_for_timeout(3400)  # long settle: arrival(~1s)+scramble(~1.1s)+buffer
            pg.screenshot(path=f"docs/qa/probe-{targets[i]}.png")
        else:
            pg.wait_for_timeout(900)
    b.close()
print("probe done")
