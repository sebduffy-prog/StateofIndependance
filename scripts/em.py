from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    pg.goto("http://localhost:8130/",wait_until="networkidle"); pg.wait_for_timeout(1800)
    for i in range(1,22):
        pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(1300)
    pg.wait_for_timeout(4000)
    info=pg.evaluate("""() => {
      const em=document.querySelector('#\\\\32 2-outro .ot-accent, .ot-accent');
      if(!em) return {found:false};
      const cs=getComputedStyle(em);
      return {found:true, text:JSON.stringify(em.textContent), dataset:em.dataset.scrambleText,
        color:cs.color, opacity:cs.opacity, visibility:cs.visibility, fontSize:cs.fontSize,
        display:cs.display, width:em.getBoundingClientRect().width};
    }""")
    print(info)
    b.close()
