from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    pg.goto("http://localhost:8128/",wait_until="networkidle"); pg.wait_for_timeout(1800)
    for _ in range(3): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(1500)  # land on step 04
    info=pg.evaluate("""() => {
      const ae=document.activeElement;
      const cs=ae?getComputedStyle(ae):null;
      const fv = ae && ae.matches(':focus-visible');
      // find any element in the focused section with a visible navy outline or box-shadow
      const sec=ae?ae.closest('section,div.journey-stage,[class*=stage]'):null;
      return {
        active: ae?ae.tagName+'.'+ae.className:null,
        tabindex: ae?ae.getAttribute('tabindex'):null,
        focusVisible: fv,
        outline: cs?`${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`:null,
        boxShadow: cs?cs.boxShadow:null,
      };
    }""")
    print(info)
    b.close()
