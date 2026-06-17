import sys
from playwright.sync_api import sync_playwright

URL = "http://localhost:8413/"
OUT = "/Users/seb.duffy/Documents/GitHub/StateofIndependance/docs/qa/rb-04-twists.png"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    msgs = []
    page.on("console", lambda m: msgs.append((m.type, m.text)))
    page.on("pageerror", lambda e: msgs.append(("pageerror", str(e))))

    page.goto(URL, wait_until="load")
    page.wait_for_timeout(2000)

    # Reveal 04-twists in isolation: hide every step, show ours, fire arrival.
    page.evaluate("""() => {
      const secs = Array.from(document.querySelectorAll('.journey-step'));
      secs.forEach(s => { s.hidden = (s.id !== '04-twists'); });
      const tw = document.getElementById('04-twists');
      tw.dispatchEvent(new CustomEvent('chapter:arrive', { detail: { ritual: false } }));
    }""")
    page.wait_for_timeout(1200)

    tw = page.locator("#\\30 4-twists, #04-twists")
    # Existence checks via attribute selectors.
    checks = {
        "headline": page.locator('[id="04-twists"] .tw-headline').count(),
        "rank items": page.locator('[id="04-twists"] [data-rank-trust] .rank-item').count(),
        "rank submit": page.locator('[id="04-twists"] .rank-submit').count(),
        "joy holiday tile": page.locator('[id="04-twists"] .tw-joy-tile--holiday').count(),
        "joy flex tiles": page.locator('[id="04-twists"] .tw-joy-tile--flex').count(),
        "ai tug svg": page.locator('[id="04-twists"] [data-tug-ai] svg').count(),
        "ai pills": page.locator('[id="04-twists"] .pillgroup-chip').count(),
        "ai bars svg": page.locator('[id="04-twists"] [data-bars-ai] svg').count(),
        "quote": page.locator('[id="04-twists"] .tw-ai-quote-body').count(),
    }
    print("ELEMENT COUNTS:", checks)

    # Drive the marquee: click "Reveal the real ranking", expect the aside to live.
    submit = page.locator('[id="04-twists"] .rank-submit')
    if submit.count() and submit.is_visible():
        submit.click()
        page.wait_for_timeout(900)
    aside_live = page.locator('[id="04-twists"] .tw-trust-aside.is-live').count()
    gauge_svg = page.locator('[id="04-twists"] [data-gauge-nhs] svg').count()
    flip_rows = page.locator('[id="04-twists"] [data-flip-nhs] .flip-row').count()
    print("AFTER RANK REVEAL: aside_live=%d gauge_svg=%d flip_rows=%d" % (aside_live, gauge_svg, flip_rows))

    # Toggle AI to high-stakes.
    high = page.locator('[id="04-twists"] .pillgroup-chip', has_text="High-stakes")
    if high.count():
        high.first.click()
        page.wait_for_timeout(700)

    # Overlap / overflow audit: any element wider than the viewport?
    overflow = page.evaluate("""() => {
      const root = document.getElementById('04-twists');
      const vw = window.innerWidth;
      let worst = 0, n = 0;
      root.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.right > vw + 2) { n++; worst = Math.max(worst, r.right - vw); }
      });
      return { count: n, worstPx: Math.round(worst), docOverflowX: document.documentElement.scrollWidth - vw };
    }""")
    print("OVERFLOW AUDIT:", overflow)

    # White-box audit: any chart container with a non-transparent white bg?
    whitebox = page.evaluate("""() => {
      const root = document.getElementById('04-twists');
      let hits = [];
      root.querySelectorAll('.chart-holder, .tw-rank, .tw-flip, [data-tug-ai], [data-bars-ai]').forEach(el => {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg === 'rgb(255, 255, 255)') hits.push(el.className);
      });
      return hits;
    }""")
    print("WHITE-BOX HITS:", whitebox)

    page.screenshot(path=OUT, full_page=True)
    print("SCREENSHOT:", OUT)

    errs = [m for m in msgs if m[0] in ("error", "pageerror")]
    print("CONSOLE ERRORS:", errs if errs else "none")
    print("ALL CONSOLE:", [m for m in msgs if m[0] != 'warning'][:20])

    browser.close()
