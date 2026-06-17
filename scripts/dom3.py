from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1440,"height":810})
    pg.goto("http://localhost:8186/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1800)
    def chk(sel,label):
        r=pg.evaluate("""(sel)=>{const i=document.querySelector(sel);if(!i)return 'MISSING';const r=i.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height);}""",sel)
        print(f"{label}: {r}")
    for _ in range(13): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(650)
    chk('[id="15-empowerment"] .emp-tv-stat-icon__img','NEED icon (want ~44px)')
    for _ in range(3): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(650)
    chk('[id="17-move-unplug"] .mu-title-img','MOVE title (want ~280-460w)')
    b.close()
