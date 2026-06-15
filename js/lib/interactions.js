/**
 * interactions.js — accessible interaction helpers for the site's
 * "commit-then-reveal" grammar. Every pointer interaction here has a
 * keyboard path. Markup is built in JS; styling hooks are class names
 * scoped per chapter in css/sections/{id}.css plus a few shared classes
 * defined inline by chapters as needed.
 *
 * Exports:
 *   flipReveal(container, opts)   split-flap less->more rows
 *   clickToGuess(container, opts) guess-a-percentage slider, then reveal
 *   dragRank(container, opts)     reorder tiles (pointer + keyboard), reveal
 *   quiz(container, opts)         agree/disagree flow -> x/y position
 *   pillGroup(container, opts)    single-select pill control
 */

/* ───────────────────────── flipReveal ──────────────────────────────
 * opts: {
 *   rows: [{ less, more }],
 *   fromToLabels?: ['Less','More'],   // header labels
 *   onFlip?: (index, flipped) => void
 * }
 * Each row is a button (role implicit) that toggles between its "less"
 * and "more" state on click/Enter/Space. Returns { flipAll, el }.
 */
export const flipReveal = (container, opts) => {
  const { rows, fromToLabels = ['Less', 'More'], onFlip } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'flip-rows';

  const header = document.createElement('div');
  header.className = 'flip-head';
  header.innerHTML = `<span>${fromToLabels[0]}</span><span>${fromToLabels[1]}</span>`;
  wrap.append(header);

  const buttons = rows.map((row, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flip-row';
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = `
      <span class="flip-less">${row.less}</span>
      <span class="flip-arrow" aria-hidden="true">→</span>
      <span class="flip-more">${row.more}</span>`;
    const toggle = () => {
      const flipped = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(flipped));
      btn.classList.toggle('is-flipped', flipped);
      onFlip && onFlip(i, flipped);
    };
    btn.addEventListener('click', toggle);
    wrap.append(btn);
    return btn;
  });

  container.append(wrap);
  return {
    el: wrap,
    flipAll(flipped = true) {
      buttons.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(flipped));
        btn.classList.toggle('is-flipped', flipped);
      });
    },
  };
};

/* ───────────────────────── clickToGuess ────────────────────────────
 * A "what do you think the number is?" slider. The reader commits a
 * guess (0–max), then the true value is revealed with the delta.
 * opts: {
 *   trueValue, max?=100, unit?='%', label, prompt?,
 *   onReveal?: (guess, trueValue) => void
 * }
 * Returns { el, reveal() }.
 */
export const clickToGuess = (container, opts) => {
  const { trueValue, max = 100, unit = '%', label, prompt, onReveal } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'guess';

  const uid = `guess-${Math.round(trueValue * 100)}-${label.length}`;
  wrap.innerHTML = `
    <p class="guess-prompt">${prompt || 'Your guess'}</p>
    <label class="guess-label" for="${uid}">${label}</label>
    <div class="guess-control">
      <input id="${uid}" class="guess-range" type="range" min="0" max="${max}"
             value="${Math.round(max / 2)}" step="1"
             aria-describedby="${uid}-out"/>
      <output id="${uid}-out" class="guess-output">${Math.round(max / 2)}${unit}</output>
    </div>
    <button type="button" class="vccp-btn guess-submit">Lock in my guess</button>
    <div class="guess-reveal" hidden></div>`;

  const range = wrap.querySelector('.guess-range');
  const output = wrap.querySelector('.guess-output');
  const submit = wrap.querySelector('.guess-submit');
  const revealBox = wrap.querySelector('.guess-reveal');

  range.addEventListener('input', () => {
    output.textContent = `${range.value}${unit}`;
  });

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    const guess = Number(range.value);
    const diff = Math.abs(guess - trueValue);
    const close = diff <= 5;
    range.disabled = true;
    submit.hidden = true;
    revealBox.hidden = false;
    revealBox.innerHTML = `
      <p class="guess-actual">The answer is
        <strong>${trueValue.toLocaleString('en-GB', { maximumFractionDigits: 1 })}${unit}</strong>.</p>
      <p class="guess-delta ${close ? 'vccp-delta-up' : 'vccp-delta-down'}">
        You were ${diff.toLocaleString('en-GB', { maximumFractionDigits: 1 })} points
        ${guess > trueValue ? 'over' : guess < trueValue ? 'under' : 'exactly right'}.
      </p>`;
    onReveal && onReveal(guess, trueValue);
  };

  submit.addEventListener('click', reveal);
  container.append(wrap);
  return { el: wrap, reveal };
};

/* ───────────────────────── dragRank ────────────────────────────────
 * Reorder a list of tiles into a predicted order, then reveal the true
 * order and how far off each was. Pointer drag (HTML5 DnD) AND keyboard
 * (focus a tile, press ArrowUp/ArrowDown to move it).
 * opts: {
 *   items: [{ id, label }],            // initial (shuffled) order
 *   trueOrder: [id, ...],              // correct top->bottom order
 *   instructions?: string,
 *   onReveal?: (placedOrder) => void   // called with the user's ids
 * }
 * Returns { el, reveal() }.
 */
export const dragRank = (container, opts) => {
  const { items, trueOrder, instructions, onReveal } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'rank';

  const help = document.createElement('p');
  help.className = 'rank-help';
  help.textContent = instructions ||
    'Drag to reorder — or focus a row and use the up and down arrow keys.';
  wrap.append(help);

  const list = document.createElement('ol');
  list.className = 'rank-list';
  list.setAttribute('aria-label', 'Your predicted ranking, most trusted at the top');

  let order = items.slice();
  let dragId = null;

  const render = () => {
    list.innerHTML = '';
    order.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'rank-item';
      li.tabIndex = 0;
      li.setAttribute('draggable', 'true');
      li.dataset.id = item.id;
      li.setAttribute('aria-label', `${item.label}, position ${index + 1} of ${order.length}`);
      li.innerHTML = `
        <span class="rank-pos" aria-hidden="true">${index + 1}</span>
        <span class="rank-label">${item.label}</span>
        <span class="rank-grip" aria-hidden="true">⠿</span>`;
      list.append(li);
    });
  };

  const move = (id, dir) => {
    const i = order.findIndex((o) => o.id === id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    order = next;
    render();
    const moved = list.querySelector(`[data-id="${id}"]`);
    moved && moved.focus();
  };

  list.addEventListener('keydown', (e) => {
    const li = e.target.closest('.rank-item');
    if (!li) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); move(li.dataset.id, -1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(li.dataset.id, 1); }
  });

  list.addEventListener('dragstart', (e) => {
    const li = e.target.closest('.rank-item');
    if (!li) return;
    dragId = li.dataset.id;
    li.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  list.addEventListener('dragend', (e) => {
    const li = e.target.closest('.rank-item');
    li && li.classList.remove('is-dragging');
    dragId = null;
  });
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const over = e.target.closest('.rank-item');
    if (!over || !dragId || over.dataset.id === dragId) return;
    const from = order.findIndex((o) => o.id === dragId);
    const to = order.findIndex((o) => o.id === over.dataset.id);
    const next = order.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    order = next;
    render();
  });

  wrap.append(list);

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'vccp-btn rank-submit';
  submit.textContent = 'Reveal the real ranking';
  wrap.append(submit);

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    submit.hidden = true;
    help.textContent = 'Tiles snap to the real order — your guess shown alongside.';
    const trueIndex = new Map(trueOrder.map((id, i) => [id, i]));
    const userOrder = order.map((o) => o.id);
    order = order.slice().sort((a, b) => trueIndex.get(a.id) - trueIndex.get(b.id));
    list.querySelectorAll('[draggable]').forEach((n) => n.setAttribute('draggable', 'false'));
    render();
    // annotate each row with how far off it was
    order.forEach((item) => {
      const wasAt = userOrder.indexOf(item.id);
      const nowAt = trueIndex.get(item.id);
      const off = Math.abs(wasAt - nowAt);
      const li = list.querySelector(`[data-id="${item.id}"]`);
      if (!li) return;
      li.tabIndex = -1;
      const tag = document.createElement('span');
      tag.className = `rank-delta ${off === 0 ? 'vccp-delta-up' : 'vccp-delta-down'}`;
      tag.textContent = off === 0 ? 'spot on' : `${off} off`;
      li.append(tag);
    });
    onReveal && onReveal(userOrder);
  };
  submit.addEventListener('click', reveal);

  render();
  container.append(wrap);
  return { el: wrap, reveal };
};

/* ───────────────────────── quiz ────────────────────────────────────
 * Agree / disagree statement flow that accumulates an x/y score.
 * opts: {
 *   questions: [{ id, statement, agree:{x,y}, disagree:{x,y} }],
 *   onAnswer?: (x, y, index) => void,   // running totals after each pick
 *   onComplete?: (x, y) => void
 * }
 * Returns { el, reset() }.
 */
export const quiz = (container, opts) => {
  const { questions, onAnswer, onComplete } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'quiz';

  const progress = document.createElement('p');
  progress.className = 'quiz-progress';
  const card = document.createElement('div');
  card.className = 'quiz-card';
  wrap.append(progress, card);

  let index = 0;
  let totalX = 0;
  let totalY = 0;

  const renderQuestion = () => {
    const q = questions[index];
    progress.textContent = `Question ${index + 1} of ${questions.length}`;
    card.innerHTML = `<p class="quiz-statement">${q.statement}</p>`;
    const actions = document.createElement('div');
    actions.className = 'quiz-actions';
    [['Agree', 'agree'], ['Disagree', 'disagree']].forEach(([text, key]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = key === 'agree' ? 'vccp-btn' : 'vccp-btn vccp-btn-quiet';
      btn.textContent = text;
      btn.addEventListener('click', () => {
        totalX += q[key].x;
        totalY += q[key].y;
        onAnswer && onAnswer(totalX, totalY, index);
        index += 1;
        if (index < questions.length) renderQuestion();
        else {
          progress.textContent = 'Done';
          card.innerHTML = '';
          onComplete && onComplete(totalX, totalY);
        }
      });
      actions.append(btn);
    });
    card.append(actions);
    const first = actions.querySelector('button');
    first && first.focus({ preventScroll: true });
  };

  renderQuestion();
  container.append(wrap);
  return {
    el: wrap,
    reset() { index = 0; totalX = 0; totalY = 0; renderQuestion(); },
  };
};

/* ───────────────────────── pillGroup ───────────────────────────────
 * Single-select pill control (radio semantics). The active pill is the
 * only rounded element allowance — but to stay brand-legal we use
 * SQUARE chips here (the nav pill is the one rounded element), styled by
 * the chapter. Class names provided; chapters style them.
 * opts: { options:[{value,label}], value?, ariaLabel, onChange(value) }
 * Returns { el, setValue(value) }.
 */
export const pillGroup = (container, opts) => {
  const { options, ariaLabel, onChange } = opts;
  let value = opts.value ?? options[0].value;

  const group = document.createElement('div');
  group.className = 'pillgroup';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', ariaLabel || 'Filter');

  const buttons = options.map((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pillgroup-chip';
    btn.setAttribute('role', 'radio');
    btn.dataset.value = opt.value;
    btn.textContent = opt.label;
    const setChecked = (on) => {
      btn.setAttribute('aria-checked', String(on));
      btn.classList.toggle('is-active', on);
      btn.tabIndex = on ? 0 : -1;
    };
    setChecked(opt.value === value);
    btn.addEventListener('click', () => {
      if (value === opt.value) return;
      value = opt.value;
      buttons.forEach((b) => {
        const on = b.dataset.value === value;
        b.setAttribute('aria-checked', String(on));
        b.classList.toggle('is-active', on);
        b.tabIndex = on ? 0 : -1;
      });
      onChange && onChange(value);
    });
    group.append(btn);
    return btn;
  });

  // arrow-key navigation within the group
  group.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const i = buttons.findIndex((b) => b.dataset.value === value);
    const next = e.key === 'ArrowRight'
      ? buttons[(i + 1) % buttons.length]
      : buttons[(i - 1 + buttons.length) % buttons.length];
    next.click();
    next.focus();
  });

  container.append(group);
  return {
    el: group,
    setValue(v) {
      const btn = buttons.find((b) => b.dataset.value === v);
      btn && btn.click();
    },
  };
};
