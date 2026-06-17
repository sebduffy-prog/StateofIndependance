from playwright.sync_api import sync_playwright
WANT={10:"11",11:"12",21:"22"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    pg.goto("http://localhost:8143/",wait_until="networkidle"); pg.wait_for_timeout(1700)
    for i in range(1,22):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2500); pg.screenshot(path=f"docs/qa/q3-{WANT[i]}.png")
        else: pg.wait_for_timeout(800)
    b.close()
print("done")
