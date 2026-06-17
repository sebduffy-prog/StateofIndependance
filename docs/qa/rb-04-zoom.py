from playwright.sync_api import sync_playwright

URL = "http://localhost:8413/"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(URL, wait_until="load")
    page.wait_for_timeout(2000)
    page.evaluate("""() => {
      document.querySelectorAll('.journey-step').forEach(s => s.hidden = (s.id !== '04-twists'));
      document.getElementById('04-twists').dispatchEvent(new CustomEvent('chapter:arrive', {detail:{ritual:false}}));
    }""")
    page.wait_for_timeout(800)
    page.locator('[id="04-twists"] .rank-submit').click()
    page.wait_for_timeout(900)
    # flip the paradox card to see the "reality" face
    page.locator('[id="04-twists"] [data-flip-nhs] .flip-row').click()
    page.wait_for_timeout(400)
    page.locator('[id="04-twists"] .tw-twist--dark').screenshot(
        path="/Users/seb.duffy/Documents/GitHub/StateofIndependance/docs/qa/rb-04-dark.png")
    # AI band at high-stakes
    page.locator('[id="04-twists"] .pillgroup-chip', has_text="High-stakes").first.click()
    page.wait_for_timeout(700)
    tug = page.evaluate("""() => {
      const t = document.querySelector('[id=\\"04-twists\\"] [data-tug-ai] svg');
      return t ? t.getAttribute('aria-label') : null;
    }""")
    page.locator('[id="04-twists"] .tw-twist--warm').nth(1).screenshot(
        path="/Users/seb.duffy/Documents/GitHub/StateofIndependance/docs/qa/rb-04-ai.png")
    print("AI tug aria after high-stakes toggle:", tug)
    browser.close()
