import json
from playwright.sync_api import sync_playwright

URL = "http://localhost:8366/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    logs = []
    page.on("console", lambda m: logs.append((m.type, m.text)))
    page.on("pageerror", lambda e: logs.append(("pageerror", str(e))))

    page.goto(URL, wait_until="load")
    page.wait_for_timeout(2000)

    # Click BEGIN / first CTA if present, then advance via Next to step 06.
    # Soft gating: Next unlocks after dwell. Click whatever starts the journey.
    try:
        page.locator("#app button, .cover button, [data-begin]").first.click(timeout=2000)
    except Exception:
        pass
    page.wait_for_timeout(800)

    def visible_step():
        return page.evaluate("""() => {
          const s = [...document.querySelectorAll('section.chapter')].find(x => !x.hidden);
          return s ? s.id : null;
        }""")

    # Advance until 06-empowerment is the visible step (max 12 tries).
    for _ in range(12):
        cur = visible_step()
        if cur == "06-empowerment":
            break
        nxt = page.locator("#journeyNext")
        # wait for dwell unlock
        for _ in range(20):
            if nxt.is_enabled():
                break
            page.wait_for_timeout(300)
        nxt.click()
        page.wait_for_timeout(900)

    cur = visible_step()
    print("VISIBLE_STEP:", cur)

    page.wait_for_timeout(1200)

    # Measure the venn stage + check no horizontal overflow / overlap basics.
    info = page.evaluate("""() => {
      const root = document.getElementById('06-empowerment');
      const r = root.getBoundingClientRect();
      const stage = root.querySelector('.emp-tv-stage');
      const sr = stage ? stage.getBoundingClientRect() : null;
      const needs = [...root.querySelectorAll('.emp-tv-need')].map(n => {
        const b = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        return {acc: n.style.getPropertyValue('--accent'), bg: cs.backgroundColor,
                w: Math.round(b.width)};
      });
      return {
        docScrollW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
        contentH: root.scrollHeight, vh: window.innerHeight,
        stage: sr ? {w: Math.round(sr.width), h: Math.round(sr.height)} : null,
        needs,
      };
    }""")
    print("INFO:", json.dumps(info))

    # Keyboard convergence: focus each legend row and press Enter to bring in.
    rows = page.locator("#06-empowerment .emp-tv-leg")
    n = rows.count()
    print("LEG_ROWS:", n)
    for i in range(n):
        rows.nth(i).focus()
        rows.nth(i).press("Enter")
        page.wait_for_timeout(700)
    page.wait_for_timeout(1400)

    converged = page.evaluate("""() => {
      const st = document.querySelector('#06-empowerment .emp-tv-stage');
      const hint = document.querySelector('#06-empowerment [data-emp-tv-hint]');
      return {converged: st ? st.classList.contains('is-converged') : false,
              hint: hint ? hint.textContent : null};
    }""")
    print("CONVERGED:", json.dumps(converged))

    next_enabled = page.locator("#journeyNext").is_enabled()
    print("NEXT_ENABLED:", next_enabled)

    page.screenshot(path="docs/qa/pd-06-empowerment.png", full_page=False)

    errs = [l for l in logs if l[0] in ("error", "pageerror", "warning")]
    print("CONSOLE_ISSUES:", json.dumps(errs))
    browser.close()
