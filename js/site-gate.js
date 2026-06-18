/**
 * site-gate.js — soft access gate for The State of Independence.
 *
 * First-load overlay: requires an email + a shared password. TWO passwords are
 * accepted, both equally valid: Challenger26 and ChallengerVCCP.
 * On success it (1) records the email to the lead endpoint so it can be checked
 * centrally, (2) keeps a localStorage backup, (3) remembers the unlock on this
 * device, and (4) reveals the journey.
 *
 * Bypass for sharing: append ?pass=Challenger26 (or ?pass=ChallengerVCCP) to the
 * URL (matches the VCCP site-gate convention). A prior unlock on this device
 * also skips the gate.
 *
 * Soft gate only: client-side, not real security — it keeps the work behind a
 * shared password and captures who is viewing.
 */
(function () {
  var PASSES = ['Challenger26', 'ChallengerVCCP'];
  var KEY_UNLOCKED = 'soi_gate_unlocked_v1';
  var KEY_EMAILS = 'soi_gate_emails_v1';
  // FormSubmit delivers each submission straight to this inbox (no backend, no
  // signup). The FIRST submission triggers a one-time confirmation email that
  // must be clicked once to activate delivery.
  var LEAD_ENDPOINT = 'https://formsubmit.co/ajax/seb.duffy@vccp.com';

  function reveal() {
    var overlay = document.getElementById('siteGate');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.body.classList.remove('is-gated');
  }

  var params = new URLSearchParams(window.location.search);
  var bypass = PASSES.indexOf(params.get('pass')) !== -1;
  var already = false;
  try { already = localStorage.getItem(KEY_UNLOCKED) === '1'; } catch (e) {}

  if (bypass || already) { reveal(); return; }

  function ready() {
    var form = document.getElementById('siteGateForm');
    var emailEl = document.getElementById('siteGateEmail');
    var passEl = document.getElementById('siteGatePass');
    var errEl = document.getElementById('siteGateError');
    if (!form || !emailEl || !passEl) return;

    var validEmail = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); };

    var storeLocal = function (email) {
      try {
        var arr = JSON.parse(localStorage.getItem(KEY_EMAILS) || '[]');
        arr.push({ email: email, at: new Date().toISOString() });
        localStorage.setItem(KEY_EMAILS, JSON.stringify(arr));
      } catch (e) {}
    };

    var sendLead = function (email) {
      try {
        fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: email,
            source: 'State of Independence',
            at: new Date().toISOString(),
            _subject: 'State of Independence — new viewer',
          }),
        }).catch(function () {});
      } catch (e) {}
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = (emailEl.value || '').trim();
      var pass = (passEl.value || '').trim();
      if (errEl) errEl.textContent = '';
      if (!validEmail(email)) {
        if (errEl) errEl.textContent = 'Please enter a valid email address.';
        emailEl.focus();
        return;
      }
      if (PASSES.indexOf(pass) === -1) {
        if (errEl) errEl.textContent = 'Incorrect password.';
        passEl.focus();
        passEl.select();
        return;
      }
      storeLocal(email);
      sendLead(email);
      try { localStorage.setItem(KEY_UNLOCKED, '1'); } catch (e) {}
      reveal();
    });

    emailEl.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
