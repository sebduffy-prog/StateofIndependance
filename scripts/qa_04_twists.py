from playwright.sync_api import sync_playwright
import os

OUT = "docs/qa/exp2-04-twists.png"
os.makedirs("docs/qa", exist_ok=True)

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    page.goto("http://localhost:8324/", wait_until="load")
    page.wait_for_timeout(2000)

    # Reveal the twists step directly (all sections are mounted, just hidden).
    page.evaluate("""() => {
        const s = document.getElementById('04-twists');
        document.querySelectorAll('.journey-step').forEach(x => x.hidden = true);
        if (s) { s.hidden = false; s.scrollIntoView(); }
    }""")
    page.wait_for_timeout(800)

    sec = page.locator('[id="04-twists"]')
    print("section visible:", sec.is_visible())

    box = sec.bounding_box()
    print("section box:", box)

    # Ring-fence board present.
    board = page.locator('[data-host="cut-board"]')
    print("board count:", board.count())
    chips = page.locator('[id="04-twists"] .tw-chip')
    print("chip count:", chips.count())
    fenced = page.locator('[id="04-twists"] .tw-chip.is-fenced')
    print("fenced chip count:", fenced.count(), "| label:", fenced.first.inner_text().replace("\n", " ") if fenced.count() else None)

    # Drag a FLEXIBLE chip to the right past the cut threshold.
    flex = page.locator('[id="04-twists"] .tw-chip:not(.is-fenced)').first
    flex.scroll_into_view_if_needed()
    fb = flex.bounding_box()
    print("flex chip:", flex.inner_text().replace("\n", " "), fb)
    page.mouse.move(fb["x"] + fb["width"]/2, fb["y"] + fb["height"]/2)
    page.mouse.down()
    for dx in range(0, 200, 20):
        page.mouse.move(fb["x"] + fb["width"]/2 + dx, fb["y"] + fb["height"]/2)
        page.wait_for_timeout(15)
    page.mouse.up()
    page.wait_for_timeout(500)
    cut = page.locator('[id="04-twists"] .tw-chip.is-cut')
    print("cut chip count after flex drag:", cut.count())

    # Drag the FENCED holiday chip right; it must RESIST + spring back.
    fence = fenced.first
    fence.scroll_into_view_if_needed()
    hb = fence.bounding_box()
    cx, cy = hb["x"] + hb["width"]/2, hb["y"] + hb["height"]/2
    page.mouse.move(cx, cy)
    page.mouse.down()
    for dx in range(0, 240, 20):
        page.mouse.move(cx + dx, cy)
        page.wait_for_timeout(15)
    # transform mid-drag (should be clamped small, not 200+px)
    mid_tf = fence.evaluate("el => el.style.transform")
    print("holiday transform mid-drag:", mid_tf)
    straining = fence.evaluate("el => el.classList.contains('is-straining')")
    print("holiday straining mid-drag:", straining)
    page.mouse.up()
    page.wait_for_timeout(900)  # let the spring settle back
    rest_tf = fence.evaluate("el => el.style.transform")
    print("holiday transform after release:", rest_tf)
    still_fenced = fence.evaluate("el => !el.classList.contains('is-cut')")
    print("holiday NOT cut (resisted):", still_fenced)
    readout = page.locator('[data-host="cut-readout"]').inner_text()
    print("readout:", readout)

    # Gating check: drag-rank reveal still gates Next. Verify the gate API is
    # present and the trust truth reveals via the dragRank submit path.
    next_disabled = page.locator('#journeyNext').is_disabled() if page.locator('#journeyNext').count() else "no-next"
    print("journeyNext disabled (step shown out of band):", next_disabled)

    page.evaluate("() => window.scrollTo(0,0)")
    sec.screenshot(path=OUT)
    print("screenshot:", OUT)

    print("CONSOLE ISSUES:", errors if errors else "none")
    browser.close()
