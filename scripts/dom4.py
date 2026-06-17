from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1440,"height":810})
    pg.goto("http://localhost:8187/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1800)
    def chk(sel,label):
        r=pg.evaluate("""(sel)=>{const i=document.querySelector(sel);if(!i)return 'MISSING';return i.offsetWidth+'x'+i.offsetHeight+' (natural '+i.naturalWidth+'x'+i.naturalHeight+')';}""",sel)
        print(f"{label}: {r}")
    for _ in range(16): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(650)
    pg.wait_for_timeout(2500)  # full settle
    chk('[id="17-move-unplug"] .mu-title-img','MOVE01 title offsetW (want 280-460)')
    chk('[id="17-move-unplug"] .mu-icon__img, [id="17-move-unplug"] .mu-icon img','MOVE01 small stat icon')
    b.close()
