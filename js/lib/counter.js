/**
 * counter.js — eased count-up numbers, reduced-motion aware.
 *
 * Programmatic:
 *   import { countUp } from '../lib/counter.js';
 *   countUp(el, { to: 77, suffix: '%' });
 *
 * Declarative (scanned by observeCounters):
 *   <span data-count-to="77.3" data-count-decimals="1" data-count-suffix="%"></span>
 *   observeCounters(rootEl);   // starts each when it scrolls into view
 */

import { prefersReducedMotion } from './reveal.js';

const DEFAULT_DURATION_MS = 1200;
const VIEW_THRESHOLD = 0.4;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const formatValue = (value, decimals) =>
  value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Animate el's textContent from `from` to `to`.
 *
 * @param {HTMLElement} el
 * @param {{ to: number, from?: number, durationMs?: number,
 *           decimals?: number, prefix?: string, suffix?: string }} options
 */
export const countUp = (el, options) => {
  const {
    to,
    from = 0,
    durationMs = DEFAULT_DURATION_MS,
    decimals = 0,
    prefix = '',
    suffix = '',
  } = options;

  const render = (value) => {
    el.textContent = `${prefix}${formatValue(value, decimals)}${suffix}`;
  };

  if (prefersReducedMotion() || durationMs <= 0) {
    render(to);
    return;
  }

  const startTime = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - startTime) / durationMs, 1);
    render(from + (to - from) * easeOutCubic(progress));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

/**
 * Find all [data-count-to] elements inside rootEl and count each up
 * the first time it scrolls into view.
 *
 * Supported attributes: data-count-to (required), data-count-from,
 * data-count-decimals, data-count-prefix, data-count-suffix,
 * data-count-duration (ms).
 *
 * @param {HTMLElement} rootEl
 * @returns {() => void} cleanup function
 */
export const observeCounters = (rootEl) => {
  const targets = rootEl.querySelectorAll('[data-count-to]');

  const startFromDataset = (el) => {
    countUp(el, {
      to: Number(el.dataset.countTo),
      from: Number(el.dataset.countFrom) || 0,
      decimals: Number(el.dataset.countDecimals) || 0,
      prefix: el.dataset.countPrefix || '',
      suffix: el.dataset.countSuffix || '',
      durationMs: Number(el.dataset.countDuration) || DEFAULT_DURATION_MS,
    });
  };

  if (prefersReducedMotion()) {
    targets.forEach(startFromDataset);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        startFromDataset(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: VIEW_THRESHOLD }
  );

  targets.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
};
