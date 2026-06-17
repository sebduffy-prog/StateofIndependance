from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    pg.goto("http://localhost:8129/",wait_until="networkidle"); pg.wait_for_timeout(1800)
    for i in range(1,22):
        pg.keyboard.press("ArrowDown")
        if i==21:  # outro
            pg.wait_for_timeout(5200); pg.screenshot(path="docs/qa/outro-final.png")
        elif i==8: # segments-intro: capture mid-arrival to check noise look
            pg.wait_for_timeout(1300); pg.screenshot(path="docs/qa/seg-mid.png"); pg.wait_for_timeout(1400)
        else:
            pg.wait_for_timeout(1300)
    b.close()
print("done")
