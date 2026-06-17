from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={"width":1512,"height":900},device_scale_factor=2)
    logs=[]; pg.on("console",lambda m: logs.append(f"{m.type}: {m.text}"))
    # 1) gate shown on load
    pg.goto("http://localhost:8147/",wait_until="networkidle"); pg.wait_for_timeout(900)
    pg.screenshot(path="docs/qa/gate.png")
    gate_visible = pg.is_visible("#siteGate")
    # 2) wrong password -> error
    pg.fill("#siteGateEmail","test@vccp.com"); pg.fill("#siteGatePass","wrong"); pg.click(".site-gate__btn"); pg.wait_for_timeout(300)
    err = pg.text_content("#siteGateError")
    # 3) correct password -> reveal (note: fires one FormSubmit confirmation email)
    pg.fill("#siteGatePass","Challenger26"); pg.click(".site-gate__btn"); pg.wait_for_timeout(700)
    gate_gone = (pg.query_selector("#siteGate") is None)
    app_visible = pg.is_visible("#app")
    print("GATE_ON_LOAD:",gate_visible," ERR:",repr(err)," GATE_GONE_AFTER_OK:",gate_gone," APP_VISIBLE:",app_visible)
    # 4) ?pass bypass -> straight to journey; walk to step 09 for size check
    pg.goto("http://localhost:8147/?pass=Challenger26",wait_until="networkidle"); pg.wait_for_timeout(1500)
    print("BYPASS_GATE_GONE:", pg.query_selector("#siteGate") is None)
    for i in range(8): pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(850)
    pg.wait_for_timeout(1500); pg.screenshot(path="docs/qa/gate-09.png")
    open("docs/qa/gate-console.txt","w").write("\n".join(logs) or "(none)")
    b.close()
print("done")
