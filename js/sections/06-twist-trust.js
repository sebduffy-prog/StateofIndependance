/**
 * 06-twist-trust.js — Twist one: the institutional trust paradox.
 *
 * THE STAGE (navy ground, cream-on-navy). The reader drag-ranks the seven
 * institutions Britain was asked about (Q7 confidence) most-trusted to least.
 * On "reveal" the tiles snap to the country's real order (each annotated
 * "spot on" / "N off") and the right column lands the truth: the 53% → 24%
 * confidence spread, plus the NHS paradox — 6.42/10 (the most trusted of all)
 * yet 53% say it has declined. The drag-rank reveal IS the marquee interaction.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 6-twist-trust.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="06-twist-trust">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { dragRank } from '../lib/interactions.js';
import { radialGauge } from '../lib/charts.js';
import { countUp } from '../lib/counter.js';

const NHS_MEAN_SCORE = 6.42; // data/survey.json institutionTrust.headline.nhsMeanScore

/** Deterministic shuffle so the drag-rank never opens already solved. */
const seededShuffle = (arr) => {
  const out = arr.slice();
  let seed = 7;
  for (let i = out.length - 1; i > 0; i -= 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function init(rootEl, data) {
  // Re-play the arrival each time this stage reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const survey = data && data.survey;
  const ranking = survey
    && survey.institutionTrust
    && survey.institutionTrust.confidenceRanking
    && survey.institutionTrust.confidenceRanking.items;
  if (!Array.isArray(ranking) || ranking.length === 0) return; // fail soft

  const rankHost = rootEl.querySelector('[data-rank]');
  const revealPanel = rootEl.querySelector('[data-reveal]');
  const gaugeHost = rootEl.querySelector('[data-gauge]');
  if (!rankHost || !revealPanel || !gaugeHost) return;

  // True order = descending % confident (NHS 52.8 → Government 23.9).
  const trueItems = ranking.slice().sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = trueItems.map((i) => i.id);
  const items = seededShuffle(trueItems.map((i) => ({ id: i.id, label: i.label })));

  let revealed = false;
  const showReveal = () => {
    if (revealed) return;
    revealed = true;

    revealPanel.hidden = false;
    // Next frame so the unhide can transition.
    requestAnimationFrame(() => revealPanel.classList.add('is-shown'));

    // The flat semicircle gauge — NHS 6.42/10, cream-on-navy.
    radialGauge(gaugeHost, {
      value: NHS_MEAN_SCORE,
      max: 10,
      onNavy: true,
      label: 'NHS trust · out of 10',
      ariaLabel: 'NHS trust score 6.42 out of 10',
    });

    // Count the 53 → 24 spread numbers (arrival skipped them while hidden).
    revealPanel.querySelectorAll('[data-arrival-count]').forEach((node) => {
      countUp(node, {
        to: Number(node.dataset.to) || 0,
        decimals: 0,
        suffix: node.dataset.suffix || '',
      });
    });

    data.journey.ready();
  };

  // The marquee interaction: drag-rank → reveal the real order.
  dragRank(rankHost, {
    items,
    trueOrder,
    instructions: 'Drag to reorder — or focus a row and use the up and down arrow keys. '
      + 'Most trusted at the top.',
    onReveal: showReveal,
  });

  // Advisory hint: this stage has one interaction to try.
  data.journey.gate();
}
