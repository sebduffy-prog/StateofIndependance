/**
 * 06-twist-trust.js — Twist one: the institutional trust paradox.
 *
 * Navy ground. Cream-on-navy. Full-bleed one screen.
 *
 * THE STAGE:
 *   LEFT  — drag-rank 7 institutions (most → least trusted)
 *   RIGHT — pre-reveal teaser → post-reveal truth
 *           (53%→24% hero spread + NHS radialGauge 6.42/10 + paradox line)
 *
 * On "Reveal" the right column transitions from teaser to stats;
 * the spread numbers count up; the radialGauge animates in.
 *
 * Contract: docs/CONTRACT.md. CSS scoped to #\30 6-twist-trust.
 *
 * @param {HTMLElement} rootEl  the <section id="06-twist-trust">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { dragRank } from '../lib/interactions.js';
import { radialGauge } from '../lib/charts.js';
import { countUp } from '../lib/counter.js';

// Verified against data/survey.json institutionTrust.headline
const NHS_MEAN = 6.42;
const NHS_DECLINED_PCT = 53; // deck-rounded from 52.6

/**
 * Deterministic shuffle so drag-rank never opens already solved.
 * Keeps a stable scramble on every mount (same seed → same scramble).
 */
const seededShuffle = (arr) => {
  const out = arr.slice();
  let seed = 13;
  for (let i = out.length - 1; i > 0; i -= 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function init(rootEl, data) {
  // Re-play the arrival beat on every visit — idempotent.
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const survey = data && data.survey;
  const rankingData =
    survey &&
    survey.institutionTrust &&
    survey.institutionTrust.confidenceRanking &&
    survey.institutionTrust.confidenceRanking.items;

  // Fail soft — show the arrival but skip interactions when data is absent.
  if (!Array.isArray(rankingData) || rankingData.length === 0) return;

  const rankHost = rootEl.querySelector('[data-rank]');
  const prePanel = rootEl.querySelector('[data-pre-reveal]');
  const truthPanel = rootEl.querySelector('[data-truth]');
  const gaugeHost = rootEl.querySelector('[data-gauge]');

  if (!rankHost || !prePanel || !truthPanel || !gaugeHost) return;

  // True order = descending % confident (NHS 52.8 → Government 23.9).
  const sorted = rankingData.slice().sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = sorted.map((item) => item.id);
  // Present in a deterministic scramble so the visitor actually has to think.
  const items = seededShuffle(sorted.map((item) => ({ id: item.id, label: item.label })));

  let revealed = false;

  const showReveal = () => {
    if (revealed) return;
    revealed = true;

    // Fade out teaser, fade in truth.
    prePanel.classList.add('is-hidden');

    // Brief delay to let the CSS transition run before showing truth.
    setTimeout(() => {
      prePanel.hidden = true;
      truthPanel.hidden = false;

      // Trigger animation next frame so the unhide registers.
      requestAnimationFrame(() => {
        truthPanel.classList.add('is-shown');

        // Count up the 53% and 24% spread numbers.
        truthPanel.querySelectorAll('[data-count-to]').forEach((node) => {
          countUp(node, {
            to: Number(node.dataset.countTo) || 0,
            decimals: 0,
            suffix: node.dataset.countSuffix || '%',
            durationMs: 1100,
          });
        });

        // Radial gauge — NHS 6.42/10, cream on navy.
        radialGauge(gaugeHost, {
          value: NHS_MEAN,
          max: 10,
          onNavy: true,
          label: 'NHS trust score · out of 10',
          ariaLabel: `NHS trust score ${NHS_MEAN} out of 10`,
        });

        data.journey.ready();
      });
    }, 280);
  };

  // Mount the drag-rank interaction — the marquee beat.
  dragRank(rankHost, {
    items,
    trueOrder,
    instructions:
      'Drag to reorder, or use ↑ ↓ arrow keys. Most trusted at the top.',
    onReveal: showReveal,
  });

  // Advisory hint: tell the visitor there is an interaction to try.
  data.journey.gate();
}
