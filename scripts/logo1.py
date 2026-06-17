from playwright.sync_api import sync_playwright
WANT={9:"arch",14:"emp",16:"move1"}
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1440,"height":810},device_scale_factor=1)
    pg.goto("http://localhost:8184/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(2000)
    for i in range(1,17):
        pg.keyboard.press("ArrowDown")
        if i in WANT: pg.wait_for_timeout(2400); pg.screenshot(path=f"docs/qa/L-{WANT[i]}.png")
        else: pg.wait_for_timeout(800)
    b.close()
print("done")
