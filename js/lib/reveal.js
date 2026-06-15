/**
 * reveal.js — IntersectionObserver scroll-reveal with optional stagger.
 *
 * Markup contract:
 *   - Give any element the class `reveal`; it fades/slides in when ~20%
 *     visible (styles live in css/vccp.css).
 *   - Put `data-stagger` on a PARENT to stagger its direct `.reveal`
 *     children (90 ms apart by default; override with data-stagger="140").
 *
 * Usage:
 *   import { observeReveals } from '../lib/reveal.js';
 *   observeReveals(rootEl);
 */

const DEFAULT_STAGGER_MS = 90;
const DEFAULT_THRESHOLD = 0.2;

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const applyStaggerDelays = (rootEl, staggerMs) => {
  const staggerParents = rootEl.querySelectorAll('[data-stagger]');
  staggerParents.forEach((parent) => {
    const stepMs = Number(parent.dataset.stagger) || staggerMs;
    const children = parent.querySelectorAll(':scope > .reveal');
    children.forEach((child, index) => {
      child.style.transitionDelay = `${index * stepMs}ms`;
    });
  });
};

/**
 * Observe all `.reveal` elements inside rootEl and add `.is-visible`
 * once they enter the viewport. Respects prefers-reduced-motion
 * (everything shown immediately, no observer created).
 *
 * @param {HTMLElement} rootEl - container to scan
 * @param {{ staggerMs?: number, threshold?: number }} [options]
 * @returns {() => void} cleanup function that disconnects the observer
 */
export const observeReveals = (rootEl, options = {}) => {
  const { staggerMs = DEFAULT_STAGGER_MS, threshold = DEFAULT_THRESHOLD } = options;
  const targets = rootEl.querySelectorAll('.reveal');

  if (prefersReducedMotion()) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return () => {};
  }

  applyStaggerDelays(rootEl, staggerMs);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold }
  );

  targets.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
};
