/**
 * 07-twist-joy.js — WORKFLOW A branded placeholder (see docs/STRUCTURE-V2.md).
 *
 * Renders nothing extra: the fragment already carries the on-brand-world
 * title, eyebrow and "coming in build B" note. This module only wires the
 * arrival signature (character->title reveal + cascade) so the placeholder
 * behaves like a real stage when it reaches focus. Build B replaces this with
 * the real content + marquee interaction.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 7-twist-joy.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="07-twist-joy">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';

export default function init(rootEl) {
  // Re-play the arrival each time this stage reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));
}
