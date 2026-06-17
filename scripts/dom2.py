from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1440,"height":810})
    pg.goto("http://localhost:8185/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1800)
    def chk(sel, label):
        r=pg.evaluate("""(sel)=>{const i=document.querySelector(sel); if(!i) return 'MISSING';
          const rc=i.getBoundingClientRect(); const nat=i.naturalWidth||0;
          return 'loaded='+(nat>0)+' rendered='+Math.round(rc.width)+'x'+Math.round(rc.height)+' src='+(i.getAttribute('src')||'').split('/').pop();}""", sel)
        print(f"{label}: {r}")
    # architects (step 10) = 9 presses
    for _ in range(9): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(700)
    chk('[id="10-segment-architects"] .seg-icon img, [id="10-segment-architects"] .seg-icon__img', 'SEG architects icon')
    # 15 empowerment = 14 presses
    for _ in range(5): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(700)
    chk('[id="15-empowerment"] .emp-tv-stat-icon__img, [id="15-empowerment"] .emp-tv-stat-icon img', 'NEED icon (money)')
    # move 17 = 16 presses
    for _ in range(2): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(700)
    chk('[id="17-move-unplug"] .mu-title-img', 'MOVE 01 title lockup')
    b.close()
