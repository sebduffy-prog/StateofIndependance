from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    pg.goto("http://localhost:8161/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1700)
    for _ in range(7): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(1000)
    # land on 08, sample the title textContent through the scramble
    for ms in [200,500,900,1400,2200]:
        pg.wait_for_timeout(ms if ms==200 else 0)
        t=pg.evaluate("() => {const h=document.querySelector('#\\\\38 8-twist-ai .twist-ai-title'); return h?h.textContent.trim():'(none)';}")
        print(f"t+{ms}: {t!r}")
        if ms!=2200: pg.wait_for_timeout([500,900,1400,2200][[200,500,900,1400].index(ms)]-ms) if ms in [200,500,900,1400] else None
    b.close()
