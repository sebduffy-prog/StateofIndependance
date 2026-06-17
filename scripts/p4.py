from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":820},device_scale_factor=2)
    pg.goto("http://localhost:8163/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1700)
    for _ in range(3): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(1000)
    pg.wait_for_timeout(1500); pg.screenshot(path="docs/qa/p4-full.png")
    info=pg.evaluate("""() => {
      const grid=document.querySelector('[id="04-baselines-rest"] .br-grid');
      const viz=document.querySelectorAll('[id="04-baselines-rest"] .br-viz svg');
      const r=grid&&grid.getBoundingClientRect();
      return { vw: window.innerWidth, gridRight: r&&Math.round(r.right), gridOverflows: r? r.right>window.innerWidth+1:null, vizCount: viz.length, firstVizW: viz[0]&&Math.round(viz[0].getBoundingClientRect().width) };
    }""")
    print(info)
    b.close()
