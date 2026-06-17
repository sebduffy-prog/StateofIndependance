from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    for h in [820, 768, 720]:
        pg=b.new_page(viewport={"width":1512,"height":h},device_scale_factor=1)
        pg.goto("http://localhost:8162/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1700)
        pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(2600)
        # measure: does the left rail overflow the viewport?
        info=pg.evaluate("""() => {
          const sec=document.querySelector('#\\\\30 2-research') || document.querySelector('[id="02-research"]');
          const rail=document.querySelector('#\\\\30 2-research .research-rail, [id="02-research"] .research-rail, .research-rail');
          const r = rail ? rail.getBoundingClientRect() : null;
          return { vh: window.innerHeight, railTop: r&&Math.round(r.top), railBottom: r&&Math.round(r.bottom), overflowsBottom: r? r.bottom>window.innerHeight+1 : null, overflowsTop: r? r.top<-1 : null };
        }""")
        print(h, info)
        pg.screenshot(path=f"docs/qa/p2h-{h}.png")
        pg.close()
    b.close()
