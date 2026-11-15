// Timeline in the style of `git log --graph`.
//
// Liquid always renders a plain list (no JavaScript, small screens). On screens
// of 720px and up this module replaces it with an SVG graph built from the JSON
// embedded in the page (#timeline-data):
//
//   main          one vertical line, time runs along it
//   education     branches to the right of main
//   experience    branches to the left of main
//   milestones    commits on their branch ("↑" when kind: promotion)
//   achievements  hackathons and on-site CTFs, dots on main
//
// The vertical axis is ordinal: every event (branch start, milestone, branch
// end, achievement) takes one row, whatever the time between events.

import { compareDates, formatDate, formatRange, isoDate } from './dates.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GRAPH_QUERY = '(min-width: 720px)';

// How each `type` of timeline.yml is drawn. `ctf` is assigned to ctfs.yml items.
const TYPES = {
  education: { branch: true, side: 'right', group: 'education' },
  experience: { branch: true, side: 'left', group: 'experience' },
  volunteering: { branch: true, side: 'left', group: 'experience' },
  hackathon: { branch: false, group: 'achievement' },
  ctf: { branch: false, group: 'achievement' },
};

// Geometry in px. Colours and font sizes live in tokens.css.
const G = {
  lane: 32, // distance between two lanes
  padX: 30, // space left of the outermost left lane
  padY: 8,
  labelGap: 36, // space between the outermost right lane and the labels
  curve: 30, // height of the fork / merge curves
  tail: 50, // how far main continues past the oldest row
  maxLanes: 2, // lanes per side before a warning is logged
  rows: { fork: 66, milestone: 60, event: 62, merge: 42, head: 46 },
};

// Data problems are reported once, not on every redraw.
const warned = new Set();
function warnOnce(message) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

export function initTimeline() {
  const root = document.querySelector('[data-timeline]');
  if (!root) return;

  const section = root.closest('section') ?? document;
  const list = root.querySelector('[data-tl-list]');
  const graph = root.querySelector('[data-tl-graph]');
  const filterButtons = [...section.querySelectorAll('[data-tl-filter]')];
  const orderButton = section.querySelector('[data-tl-order]');
  const media = window.matchMedia(GRAPH_QUERY);
  const data = readData();
  const state = {
    filter: 'all',
    order: root.dataset.defaultOrder === 'oldest' ? 'oldest' : 'newest',
  };
  let drawnWidth = 0;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.tlFilter;
      update();
    });
  });
  orderButton?.addEventListener('click', () => {
    state.order = state.order === 'newest' ? 'oldest' : 'newest';
    update();
  });
  media.addEventListener('change', updateGraph);
  if (graph && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (graph.clientWidth !== drawnWidth) updateGraph();
    }).observe(root);
  }
  document.fonts?.ready.then(updateGraph);
  update();

  function update() {
    updateControls();
    updateList();
    updateGraph();
  }

  function updateControls() {
    filterButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.tlFilter === state.filter));
    });
    if (orderButton) {
      const newest = state.order === 'newest';
      orderButton.textContent = newest ? '↑ Newest' : '↓ Oldest';
      orderButton.setAttribute(
        'aria-label',
        newest ? 'Order: newest first. Switch to oldest first.' : 'Order: oldest first. Switch to newest first.',
      );
    }
  }

  // The list honours the same filter and order as the graph.
  function updateList() {
    if (!list) return;
    const items = [...list.children];
    items.forEach((item, index) => {
      item.dataset.index ??= String(index);
      item.hidden = state.filter !== 'all' && item.dataset.group !== state.filter;
    });
    const direction = state.order === 'newest' ? -1 : 1;
    items.sort(
      (a, b) =>
        direction * compareDates(a.dataset.start, b.dataset.start) ||
        Number(a.dataset.index) - Number(b.dataset.index),
    );
    list.append(...items);
  }

  function updateGraph() {
    if (!graph) return;
    if (!data || !media.matches) {
      root.classList.remove('has-graph');
      return;
    }
    root.classList.add('has-graph');
    if (!graph.clientWidth) return;

    const active = document.activeElement;
    const focused = graph.contains(active) ? active.dataset.modal : null;
    try {
      drawnWidth = graph.clientWidth;
      renderGraph(graph, buildModel(data, state.filter), state.order);
      if (focused) graph.querySelector(`[data-modal="${CSS.escape(focused)}"]`)?.focus();
    } catch (error) {
      // Never leave the visitor without a timeline: fall back to the list.
      console.error('Timeline graph could not be drawn, showing the list instead.', error);
      root.classList.remove('has-graph');
    }
  }
}

function readData() {
  const source = document.getElementById('timeline-data');
  if (!source) return null;
  try {
    const parsed = JSON.parse(source.textContent);
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      ctfs: Array.isArray(parsed.ctfs) ? parsed.ctfs : [],
    };
  } catch (error) {
    console.warn('Timeline data could not be read.', error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Model: rows (one per event, oldest first) and branches with their lanes     */
/* -------------------------------------------------------------------------- */

function buildModel(data, filter) {
  const rows = [];
  const branches = [];
  const wanted = (group) => filter === 'all' || filter === group;

  for (const entry of data.entries) {
    const type = TYPES[entry.type];
    const start = isoDate(entry.start);
    if (!type || !start) {
      warnOnce(`Timeline: skipped "${entry.id}" (unknown type or missing start).`);
      continue;
    }
    if (!wanted(type.group)) continue;

    if (!type.branch) {
      rows.push({ kind: 'event', date: start, rank: 1, entry, group: type.group });
      continue;
    }

    let end = isoDate(entry.end) || null;
    if (end && end < start) end = start;
    const branch = { entry, side: type.side, group: type.group, start, end, lane: 1 };
    branches.push(branch);

    rows.push({ kind: 'fork', date: start, rank: 2, entry, branch, group: type.group });
    for (const milestone of entry.milestones ?? []) {
      let date = isoDate(milestone.date);
      if (!date) continue;
      // A milestone always sits between the start and the end of its branch.
      if (date < start) date = start;
      if (end && date > end) date = end;
      const rank = end && date === end && end !== start ? -1 : 3;
      rows.push({ kind: 'milestone', date, rank, entry, branch, milestone, group: type.group });
    }
    if (end) {
      rows.push({ kind: 'merge', date: end, rank: end === start ? 4 : 0, entry, branch, group: type.group });
    }
  }

  if (wanted(TYPES.ctf.group)) {
    for (const ctf of data.ctfs) {
      const start = isoDate(ctf.start);
      if (start) rows.push({ kind: 'event', date: start, rank: 1, entry: ctf, group: TYPES.ctf.group, ctf: true });
    }
  }

  // Oldest first. ISO strings compare correctly even with mixed precision.
  // Same date: branch ends, then achievements, then branch starts, then milestones.
  rows.forEach((row, index) => { row.seq = index; });
  rows.sort((a, b) => compareDates(a.date, b.date) || a.rank - b.rank || a.seq - b.seq);
  rows.forEach((row, index) => {
    row.index = index;
    if (row.kind === 'fork') {
      row.branch.startRow = index;
      row.branch.forkRow = row;
    } else if (row.kind === 'merge') {
      row.branch.endRow = index;
      row.branch.mergeRow = row;
    }
  });
  branches.forEach((branch) => { branch.endRow ??= Infinity; });

  assignLanes(branches);
  return { rows, branches };
}

// Greedy interval colouring, one side at a time: a branch takes the first lane
// whose previous branch has already ended, so BSc and MSc share a lane.
function assignLanes(branches) {
  for (const side of ['left', 'right']) {
    const list = branches.filter((branch) => branch.side === side).sort((a, b) => a.startRow - b.startRow);
    const laneEnds = [];
    for (const branch of list) {
      let lane = laneEnds.findIndex((end) => end < branch.startRow);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = branch.endRow;
      branch.lane = lane + 1;
    }
    if (laneEnds.length > G.maxLanes) {
      warnOnce(`Timeline: ${laneEnds.length} overlapping branches on the ${side} side (designed for ${G.maxLanes}).`);
    }
    untangle(list, laneEnds.length);
  }
}

// Lanes on the same side can be stacked in any order. Pick the order in which
// fork and merge curves cross the fewest other branches (keeps the greedy
// order when it is already as good as any other).
function untangle(list, laneCount) {
  if (laneCount < 2 || laneCount > 4) return;
  const lanes = Array.from({ length: laneCount }, (_, index) => index + 1);
  let best = null;
  for (const order of permutations(lanes)) {
    const cost = countCrossings(list, order);
    if (!best || cost < best.cost) best = { cost, order };
  }
  list.forEach((branch) => { branch.lane = best.order[branch.lane - 1]; });
}

function countCrossings(list, order) {
  let total = 0;
  for (const branch of list) {
    const lane = order[branch.lane - 1];
    for (const other of list) {
      if (other === branch || order[other.lane - 1] >= lane) continue;
      // `other` runs between this branch and main: do the curves pass through it?
      if (other.startRow < branch.startRow && other.endRow > branch.startRow) total += 1;
      if (Number.isFinite(branch.endRow) && other.startRow < branch.endRow && other.endRow > branch.endRow) total += 1;
    }
  }
  return total;
}

function* permutations(items) {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let index = 0; index < items.length; index += 1) {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const tail of permutations(rest)) yield [items[index], ...tail];
  }
}

/* -------------------------------------------------------------------------- */
/* Drawing                                                                     */
/* -------------------------------------------------------------------------- */

function renderGraph(container, model, order) {
  const { rows, branches } = model;
  const width = container.clientWidth;
  const laneCount = (side) => Math.max(0, ...branches.filter((b) => b.side === side).map((b) => b.lane));
  const xMain = G.padX + laneCount('left') * G.lane;
  const xLabel = xMain + laneCount('right') * G.lane + G.labelGap;
  const xOf = (branch) => xMain + (branch.side === 'right' ? 1 : -1) * branch.lane * G.lane;
  const labelWidth = width - xLabel - 16;

  // Rows from top to bottom. `past` is the direction (in y) that goes back in time.
  const newestFirst = order === 'newest';
  const past = newestFirst ? 1 : -1;
  const head = { kind: 'head' };
  const display = newestFirst ? [head, ...rows.slice().reverse()] : [...rows, head];
  let cursor = G.padY + (newestFirst ? 0 : G.tail);
  for (const row of display) {
    row.height = G.rows[row.kind];
    row.top = cursor;
    row.y = cursor + row.height / 2;
    cursor += row.height;
  }
  const height = cursor + G.padY + (newestFirst ? G.tail : 0);

  const svg = el('svg', {
    class: 'tl-svg',
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    role: 'group',
    'aria-label': 'Timeline graph. Each entry opens a dialog with details.',
  });
  const leaders = el('g', { 'aria-hidden': 'true' });
  const lines = el('g', { 'aria-hidden': 'true' });
  const content = el('g');
  svg.append(leaders, lines, content);
  // Attach first: text can only be measured once it is in the document.
  container.replaceChildren(svg);

  // Branches, outermost lane first, so inner lanes are drawn over the curves
  // of outer ones wherever a crossing cannot be avoided.
  const curve = G.curve * past;
  for (const branch of [...branches].sort((a, b) => b.lane - a.lane)) {
    const x = xOf(branch);
    const startY = branch.forkRow.y;
    let d = `M ${xMain} ${startY + curve} C ${xMain} ${startY + curve / 2}, ${x} ${startY + curve / 2}, ${x} ${startY}`;
    if (branch.mergeRow) {
      const endY = branch.mergeRow.y;
      d += ` L ${x} ${endY + curve} C ${x} ${endY + curve / 2}, ${xMain} ${endY + curve / 2}, ${xMain} ${endY}`;
    } else {
      d += ` L ${x} ${head.y}`;
    }
    lines.append(
      el('path', { class: 'tl-line tl-line--halo', d }),
      el('path', { class: `tl-line is-${branch.group}`, d }),
    );
  }

  // Main line, with a dotted tail hinting that history goes on.
  const oldestY = (rows[0] ?? head).y;
  lines.append(
    el('line', { class: 'tl-line tl-line--main', x1: xMain, y1: head.y, x2: xMain, y2: oldestY + curve }),
    el('line', { class: 'tl-line tl-line--tail', x1: xMain, y1: oldestY + curve, x2: xMain, y2: oldestY + G.tail * past }),
  );

  for (const row of display) {
    const group = el('g', { class: `tl-row tl-row--${row.kind}${row.group ? ` is-${row.group}` : ''}` });
    content.append(group);
    const dotX = row.branch && row.kind !== 'merge' ? xOf(row.branch) : xMain;
    const titleY = row.y - 5;
    const subY = row.y + 15;
    let dotRadius = 6.5;
    let label = '';

    if (row.kind !== 'head' && row.kind !== 'merge') {
      // Whole row is one target: focusable, opens the modal on click / Enter / Space.
      group.classList.add('tl-row--interactive');
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.dataset.modal = `modal-${row.entry.id}`;
      group.append(el('rect', { class: 'tl-row__hit', x: 3, y: row.top + 3, width: width - 6, height: row.height - 6, rx: 8 }));
    } else {
      group.setAttribute('aria-hidden', 'true');
    }

    if (row.kind === 'fork') {
      const { entry } = row;
      const period = formatRange(entry.start, entry.end);
      const subtitle = joinParts(row.group === 'experience' && entry.organization ? entry.title : entry.organization, period);
      group.append(el('circle', { class: 'tl-dot', cx: dotX, cy: row.y, r: dotRadius }));
      text(group, 'tl-label__title', xLabel, titleY, branchName(entry), labelWidth);
      text(group, 'tl-label__sub', xLabel, subY, subtitle, labelWidth);
      label = `${branchName(entry)}, ${subtitle}`;
    } else if (row.kind === 'milestone') {
      const { entry, milestone } = row;
      const promotion = milestone.kind === 'promotion';
      const subtitle = joinParts(branchName(entry), formatDate(milestone.date), milestone.kind);
      if (promotion) {
        dotRadius = 9;
        group.append(el('circle', { class: 'tl-dot tl-dot--hollow', cx: dotX, cy: row.y, r: dotRadius }));
        text(group, 'tl-dot__glyph', dotX, row.y + 4, '↑');
      } else {
        dotRadius = 4.5;
        group.append(el('circle', { class: 'tl-dot', cx: dotX, cy: row.y, r: dotRadius }));
      }
      text(group, 'tl-label__title', xLabel, titleY, `${promotion ? '↑ ' : ''}${milestone.title ?? ''}`, labelWidth);
      text(group, 'tl-label__sub', xLabel, subY, subtitle, labelWidth);
      label = `${milestone.title ?? 'Milestone'}, ${subtitle}`;
    } else if (row.kind === 'event') {
      const { entry } = row;
      const name = entry.title ?? entry.name ?? '';
      const result = entry.result ?? entry.placement;
      const subtitle = joinParts(formatRange(entry.start, entry.end, { single: true }), entry.location, row.ctf ? 'CTF' : null);
      if (entry.highlight) {
        group.append(el('circle', { class: 'tl-dot__ring', cx: dotX, cy: row.y, r: dotRadius + 4.5 }));
        dotRadius += 4.5;
      }
      group.append(el('circle', { class: `tl-dot${entry.highlight ? ' tl-dot--gold' : ''}`, cx: dotX, cy: row.y, r: 6.5 }));
      let titleX = xLabel;
      if (result) {
        titleX += badge(group, `tl-badge${entry.highlight ? ' tl-badge--gold' : ''}`, 'tl-badge__text', xLabel, titleY - 4, result) + 10;
      }
      text(group, 'tl-label__title', titleX, titleY, name, labelWidth - (titleX - xLabel));
      text(group, 'tl-label__sub', xLabel, subY, subtitle, labelWidth);
      label = joinParts(result, name, subtitle).replaceAll(' · ', ', ');
    } else if (row.kind === 'merge') {
      const { entry } = row;
      const verb = row.group === 'education' ? 'completed' : 'ended';
      dotRadius = 5.5;
      group.append(el('circle', { class: 'tl-dot tl-dot--hollow', cx: dotX, cy: row.y, r: dotRadius }));
      text(group, 'tl-label__faint', xLabel, row.y + 4, joinParts('merge', `${shortName(entry)} ${verb}`, formatDate(entry.end)), labelWidth);
    } else {
      // Head: where main and every ongoing branch end today.
      dotRadius = 4.5;
      group.append(el('circle', { class: 'tl-dot', cx: xMain, cy: row.y, r: dotRadius }));
      for (const branch of branches.filter((b) => !b.mergeRow)) {
        const open = el('g', { class: `is-${branch.group}` });
        open.append(
          el('circle', { class: 'tl-pulse', cx: xOf(branch), cy: row.y, r: 5 }),
          el('circle', { class: 'tl-dot', cx: xOf(branch), cy: row.y, r: 5 }),
        );
        group.append(open);
      }
      const refWidth = badge(group, 'tl-ref', 'tl-ref__text', xLabel, row.y, 'main');
      text(group, 'tl-label__faint', xLabel + refWidth + 10, row.y + 4, 'HEAD', labelWidth - refWidth - 10);
    }

    if (row.kind !== 'head') {
      const from = dotX + dotRadius + 6;
      const to = xLabel - 12;
      if (to - from > 6) leaders.append(el('line', { class: 'tl-leader', x1: from, y1: row.y, x2: to, y2: row.y }));
    }
    if (label) group.setAttribute('aria-label', `${label}. Show details.`);
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

// The name of a branch: the organization for experience, the title otherwise.
function branchName(entry) {
  return TYPES[entry.type]?.group === 'experience' ? entry.organization || entry.title || '' : entry.title || '';
}

// Short name for the faint "merge" line: optional `short` field, else the part
// of an education title before " in " ("BSc in ..." -> "BSc").
function shortName(entry) {
  if (entry.short) return entry.short;
  if (TYPES[entry.type]?.group === 'education') return String(entry.title ?? '').split(' in ')[0];
  return branchName(entry);
}

function joinParts(...parts) {
  return parts.filter(Boolean).join(' · ');
}

function el(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

// Adds a line of text and shortens it with an ellipsis when it does not fit.
function text(parent, className, x, y, value, maxWidth = 0) {
  const node = el('text', { class: className, x, y });
  node.textContent = value;
  parent.append(node);
  if (maxWidth > 0 && node.getComputedTextLength() > maxWidth) {
    let low = 0;
    let high = value.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      node.textContent = `${value.slice(0, middle).trimEnd()}…`;
      if (node.getComputedTextLength() <= maxWidth) low = middle;
      else high = middle - 1;
    }
    node.textContent = `${value.slice(0, low).trimEnd()}…`;
    const tooltip = el('title');
    tooltip.textContent = value;
    node.append(tooltip);
  }
  return node;
}

// A small rounded label (result badge, "main" ref). Returns its width.
function badge(parent, className, textClassName, x, centerY, value) {
  const group = el('g', { class: className });
  const box = el('rect', { class: `${className.split(' ')[0]}__box`, x, y: centerY - 11, height: 22, rx: 4 });
  group.append(box);
  parent.append(group);
  const label = text(group, textClassName, x + 8, centerY + 4, String(value));
  const width = Math.ceil(label.getComputedTextLength()) + 16;
  box.setAttribute('width', String(width));
  return width;
}
