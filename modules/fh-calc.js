/**
 * Frosthaven Attack Modifier Deck Calculator (Easter Egg)
 *
 * Hidden modal triggered by 'G' key (desktop) or long-press on card (mobile).
 * Calculates deck statistics, expected value, and probability distributions.
 */

const STORAGE_KEY = 'liminal_fh_calc';

// Card type definitions: { id, label, value, rolling, cat, group }
// group: 'base' = always visible, 'rolling' = collapsed, 'extra' = collapsed
const CARD_TYPES = [
  // Base cards (always visible)
  { id: 'miss',  label: 'Miss',   value: null, rolling: false, cat: 'miss',  group: 'base' },
  { id: 'n2',    label: '\u22122', value: -2,   rolling: false, cat: 'neg',   group: 'base' },
  { id: 'n1',    label: '\u22121', value: -1,   rolling: false, cat: 'neg',   group: 'base' },
  { id: 'p0',    label: '+0',      value: 0,    rolling: false, cat: 'neut',  group: 'base' },
  { id: 'p1',    label: '+1',      value: 1,    rolling: false, cat: 'pos',   group: 'base' },
  { id: 'p2',    label: '+2',      value: 2,    rolling: false, cat: 'pos',   group: 'base' },
  { id: 'crit',  label: '\u00d72', value: null, rolling: false, cat: 'crit',  group: 'base' },
  // Extra non-rolling cards (collapsed)
  { id: 'p3',      label: '+3',           value: 3, rolling: false, cat: 'pos', group: 'extra' },
  { id: 'p4',      label: '+4',           value: 4, rolling: false, cat: 'pos', group: 'extra' },
  { id: 'refresh', label: 'Refresh Item', value: 0, rolling: false, cat: 'pos', group: 'extra' },
  // Rolling modifiers (collapsed)
  { id: 'rp1',     label: '+1',         value: 1, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rp2',     label: '+2',         value: 2, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rpierce', label: 'Pierce 3',   value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rmuddle', label: 'Muddle',     value: 0, rolling: true, cat: 'neg', group: 'rolling' },
  { id: 'rpoison', label: 'Poison',     value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rwound',  label: 'Wound',      value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rimmob',  label: 'Immobilize', value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rstun',   label: 'Stun',       value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rpush',   label: 'Push 1',     value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rpull',   label: 'Pull 1',     value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rfire',   label: 'Fire',       value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rice',    label: 'Ice',        value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rair',    label: 'Air',        value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rearth',  label: 'Earth',      value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rlight',  label: 'Light',      value: 0, rolling: true, cat: 'pos', group: 'rolling' },
  { id: 'rdark',   label: 'Dark',       value: 0, rolling: true, cat: 'pos', group: 'rolling' },
];

const BASE_DECK = { p0: 6, p1: 5, n1: 5, p2: 1, n2: 1, crit: 1, miss: 1 };

// ── State ──────────────────────────────────────────────────────────────

let deck = {};
let snapshot = null; // { deck: {...}, stats: {...} }

function resetDeck() {
  deck = {};
  for (const ct of CARD_TYPES) deck[ct.id] = 0;
  Object.assign(deck, BASE_DECK);
}

function addCards(id, delta) {
  deck[id] = Math.max(0, (deck[id] || 0) + delta);
}

function totalCards() {
  return Object.values(deck).reduce((s, n) => s + n, 0);
}

// ── Persistence ────────────────────────────────────────────────────────

function saveState() {
  try {
    const state = { deck: { ...deck } };
    if (snapshot) state.snapshot = snapshot;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { resetDeck(); return; }
    const state = JSON.parse(raw);
    resetDeck();
    if (state.deck) Object.assign(deck, state.deck);
    if (state.snapshot) snapshot = state.snapshot;
  } catch { resetDeck(); }
}

// ── Presets ─────────────────────────────────────────────────────────────

// Common Frosthaven perk operations (appear across many class perk sheets)
const PRESETS = [
  { label: 'Remove two \u22121',           apply: () => addCards('n1', -2),                                   valid: () => deck.n1 >= 2 },
  { label: 'Remove one \u22122',            apply: () => addCards('n2', -1),                                   valid: () => deck.n2 >= 1 },
  { label: 'Remove one +0',              apply: () => addCards('p0', -1),                                   valid: () => deck.p0 >= 1 },
  { label: 'Remove four +0',             apply: () => addCards('p0', -4),                                   valid: () => deck.p0 >= 4 },
  { label: 'Replace one \u22121 with +0',  apply: () => { addCards('n1', -1); addCards('p0', 1); },           valid: () => deck.n1 >= 1 },
  { label: 'Replace one \u22121 with +1',  apply: () => { addCards('n1', -1); addCards('p1', 1); },           valid: () => deck.n1 >= 1 },
  { label: 'Replace one +0 with +2',     apply: () => { addCards('p0', -1); addCards('p2', 1); },           valid: () => deck.p0 >= 1 },
  { label: 'Replace one \u22122 with +0',  apply: () => { addCards('n2', -1); addCards('p0', 1); },           valid: () => deck.n2 >= 1 },
  { label: 'Add one +1',                 apply: () => addCards('p1', 1) },
  { label: 'Add one +2',                 apply: () => addCards('p2', 1) },
  { label: 'Add one +3',                 apply: () => addCards('p3', 1) },
  { label: 'Add two rolling +1',         apply: () => addCards('rp1', 2) },
  { label: 'Add one rolling +2',         apply: () => addCards('rp2', 1) },
  { label: 'Add one rolling Pierce 3',   apply: () => addCards('rpierce', 1) },
  { label: 'Add one rolling Push 1',     apply: () => addCards('rpush', 1) },
  { label: 'Add one rolling Pull 1',     apply: () => addCards('rpull', 1) },
  { label: 'Add one rolling Muddle',     apply: () => addCards('rmuddle', 1) },
  { label: 'Add one rolling Poison',     apply: () => addCards('rpoison', 1) },
  { label: 'Add one rolling Wound',      apply: () => addCards('rwound', 1) },
  { label: 'Add one rolling Immobilize', apply: () => addCards('rimmob', 1) },
  { label: 'Add one rolling Stun',       apply: () => addCards('rstun', 1) },
  { label: 'Add one rolling Fire',       apply: () => addCards('rfire', 1) },
  { label: 'Add one rolling Ice',        apply: () => addCards('rice', 1) },
  { label: 'Add one rolling Air',        apply: () => addCards('rair', 1) },
  { label: 'Add one rolling Earth',      apply: () => addCards('rearth', 1) },
  { label: 'Add one rolling Light',      apply: () => addCards('rlight', 1) },
  { label: 'Add one rolling Dark',       apply: () => addCards('rdark', 1) },
];

// ── Stats computation ──────────────────────────────────────────────────

function computeStats() {
  const total = totalCards();
  if (total === 0) return null;

  let rollingCount = 0, rollingValueSum = 0;
  let baseCount = 0, baseValueSum = 0;
  let critCount = deck.crit || 0, missCount = deck.miss || 0;
  let positiveCount = 0, negativeCount = 0, neutralCount = 0;

  for (const ct of CARD_TYPES) {
    const n = deck[ct.id] || 0;
    if (n === 0) continue;
    if (ct.rolling) {
      rollingCount += n;
      rollingValueSum += (ct.value || 0) * n;
    } else if (ct.id !== 'crit' && ct.id !== 'miss') {
      baseCount += n;
      baseValueSum += (ct.value || 0) * n;
      if (ct.value > 0 || ct.id === 'refresh') positiveCount += n;
      else if (ct.value < 0) negativeCount += n;
      else neutralCount += n;
    }
  }

  const drawPool = baseCount + critCount + missCount;
  if (drawPool === 0) return null;

  const normalEV = baseCount > 0 ? baseValueSum / drawPool : 0;
  const rollingEVPerDraw = total > 0 ? rollingValueSum / total * (total / drawPool) : 0;
  const critPct = (critCount / drawPool) * 100;
  const missPct = (missCount / drawPool) * 100;
  const reliableCount = baseCount - negativeCount + critCount;
  const reliability = (reliableCount / drawPool) * 100;
  const rollingChainProb = total > drawPool ? (1 - drawPool / total) * 100 : 0;
  const expectedChainLen = rollingCount / drawPool;
  const posPct = (positiveCount / drawPool) * 100;
  const negPct = (negativeCount / drawPool) * 100;
  const neutPct = (neutralCount / drawPool) * 100;

  return {
    total, drawPool, rollingCount,
    normalEV, rollingEVPerDraw,
    totalEV: normalEV + rollingEVPerDraw,
    critPct, missPct, reliability,
    rollingChainProb, expectedChainLen,
    posPct, negPct, neutPct,
    positiveCount, negativeCount, neutralCount,
    critCount, missCount
  };
}

// ── Rendering ──────────────────────────────────────────────────────────

let els = {};  // cached DOM elements, set during init

function buildCardRow(ct) {
  const count = deck[ct.id] || 0;
  const row = document.createElement('div');
  row.className = 'fh-card-row' + (count > 0 ? ' fh-has-cards' : '');
  const label = ct.rolling
    ? `<span class="fh-rolling-tag">ROLL</span>${ct.label}`
    : ct.label;
  row.innerHTML = `
    <span class="fh-card-label">${label}</span>
    <button class="fh-card-btn" data-id="${ct.id}" data-d="-1">&minus;</button>
    <span class="fh-card-count">${count}</span>
    <button class="fh-card-btn" data-id="${ct.id}" data-d="1">+</button>
  `;
  return row;
}

function updateDetailsSummary(detailsEl, total) {
  const summary = detailsEl.querySelector('.fh-details-summary');
  let span = summary.querySelector('.fh-details-count');
  if (!span) {
    span = document.createElement('span');
    span.className = 'fh-details-count';
    summary.appendChild(span);
  }
  span.textContent = total > 0 ? `(${total} cards)` : '';
}

function renderDeckGrid() {
  els.baseGrid.innerHTML = '';
  els.rollingGrid.innerHTML = '';
  els.extraGrid.innerHTML = '';

  let rollingTotal = 0, extraTotal = 0;

  for (const ct of CARD_TYPES) {
    const count = deck[ct.id] || 0;
    const row = buildCardRow(ct);
    if (ct.group === 'rolling') {
      els.rollingGrid.appendChild(row);
      rollingTotal += count;
    } else if (ct.group === 'extra') {
      els.extraGrid.appendChild(row);
      extraTotal += count;
    } else {
      els.baseGrid.appendChild(row);
    }
  }

  updateDetailsSummary(els.rollingDetails, rollingTotal);
  updateDetailsSummary(els.extraDetails, extraTotal);
}

function renderPresets() {
  els.presets.innerHTML = '';
  for (const p of PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'fh-preset-btn';
    btn.textContent = p.label;
    btn.disabled = p.valid ? !p.valid() : false;
    btn.addEventListener('click', () => { p.apply(); update(); });
    els.presets.appendChild(btn);
  }
}

// Stat tooltip descriptions
const STAT_TIPS = {
  deckSize:   'Total cards in the deck, split into base (non-rolling) cards that end your draw and rolling cards that chain before the final draw.',
  ev:         'Average modifier added to your attack per draw. Includes the additive contribution of rolling modifiers. Crit (\u00d72) and Miss (null) are excluded from the additive average but shown separately.',
  crit:       'Probability of drawing the \u00d72 card, which doubles your total attack value. Higher is better.',
  miss:       'Probability of drawing the null/Miss card, which reduces your attack to zero. Lower is better.',
  reliability:'Percentage of non-rolling draws that are neutral or better (\u22650 modifier, including \u00d72). A deck with 100% reliability never draws a negative modifier.',
  rolling:    'Chance that any given draw starts with at least one rolling modifier before resolving. Rolling cards add their effect and you draw again until a non-rolling card ends the chain.',
  split:      'Breakdown of base (non-rolling, non-special) cards into positive (>0), neutral (0), and negative (<0) buckets. Does not count \u00d72 or Miss.',
};

function tip(key) {
  return `<span class="fh-stat-tip" title="${STAT_TIPS[key]}">?</span>`;
}

function buildStatsHTML(s, ref) {
  if (!s) return '<p class="dialog-hint">Add cards to see stats</p>';

  const evClass = s.totalEV > 0.01 ? 'fh-positive' : s.totalEV < -0.01 ? 'fh-negative' : 'fh-neutral';
  const evSign = s.totalEV > 0 ? '+' : '';

  function delta(curr, prev, fmt, invert) {
    if (!ref) return '';
    const d = curr - prev;
    if (Math.abs(d) < 0.005) return '<span class="fh-stat-delta fh-delta-same">=</span>';
    const better = invert ? d < 0 : d > 0;
    const cls = better ? 'fh-delta-up' : 'fh-delta-down';
    const sign = d > 0 ? '+' : '';
    return `<span class="fh-stat-delta ${cls}">${sign}${fmt(d)}</span>`;
  }
  const f2 = v => v.toFixed(2);
  const f1 = v => v.toFixed(1) + '%';
  const f0 = v => String(v);

  return `
    <div class="fh-stat">
      <div class="fh-stat-label">Deck Size ${tip('deckSize')}</div>
      <div class="fh-stat-value">${s.total}${delta(s.total, ref?.total, f0)} <span style="font-size:0.6rem;color:rgba(255,255,255,0.4)">(${s.drawPool}+${s.rollingCount}r)</span></div>
    </div>
    <div class="fh-stat">
      <div class="fh-stat-label">Expected Value ${tip('ev')}</div>
      <div class="fh-stat-value ${evClass}">${evSign}${s.totalEV.toFixed(2)}${delta(s.totalEV, ref?.totalEV, f2)}</div>
    </div>
    <div class="fh-stat">
      <div class="fh-stat-label">Crit Chance ${tip('crit')}</div>
      <div class="fh-stat-value fh-positive">${s.critPct.toFixed(1)}%${delta(s.critPct, ref?.critPct, f1)}</div>
    </div>
    <div class="fh-stat">
      <div class="fh-stat-label">Miss Chance ${tip('miss')}</div>
      <div class="fh-stat-value fh-negative">${s.missPct.toFixed(1)}%${delta(s.missPct, ref?.missPct, f1, true)}</div>
    </div>
    <div class="fh-stat">
      <div class="fh-stat-label">Reliability ${tip('reliability')}</div>
      <div class="fh-stat-value">${s.reliability.toFixed(1)}%${delta(s.reliability, ref?.reliability, f1)}</div>
    </div>
    <div class="fh-stat">
      <div class="fh-stat-label">Rolling Chain ${tip('rolling')}</div>
      <div class="fh-stat-value">${s.rollingChainProb.toFixed(1)}%</div>
    </div>
    <div class="fh-stat">
      <div class="fh-stat-label">Pos / Neut / Neg ${tip('split')}</div>
      <div class="fh-stat-value"><span class="fh-positive">${s.posPct.toFixed(0)}%</span> / <span class="fh-neutral">${s.neutPct.toFixed(0)}%</span> / <span class="fh-negative">${s.negPct.toFixed(0)}%</span></div>
    </div>
  `;
}

function renderStats() {
  const s = computeStats();

  if (!snapshot) {
    els.compareWrap.innerHTML = `<div class="fh-stats-grid">${buildStatsHTML(s)}</div>`;
    return;
  }

  els.compareWrap.innerHTML = `
    <div class="fh-compare-col">
      <div class="fh-compare-label fh-compare-label--before">Before</div>
      <div class="fh-stats-grid">${buildStatsHTML(snapshot.stats)}</div>
    </div>
    <div class="fh-compare-col">
      <div class="fh-compare-label fh-compare-label--after">After</div>
      <div class="fh-stats-grid">${buildStatsHTML(s, snapshot.stats)}</div>
    </div>
  `;
}

function renderHistogram() {
  const total = totalCards();
  if (total === 0) { els.histogram.innerHTML = ''; return; }

  const buckets = [];
  for (const ct of CARD_TYPES) {
    const n = deck[ct.id] || 0;
    if (n === 0) continue;
    const label = ct.rolling ? `Rolling ${ct.label}` : ct.label;
    let barClass;
    if (ct.id === 'crit') barClass = 'fh-bar-crit';
    else if (ct.id === 'miss') barClass = 'fh-bar-miss';
    else if (ct.rolling) barClass = 'fh-bar-rolling';
    else if (ct.value > 0 || ct.id === 'refresh') barClass = 'fh-bar-positive';
    else if (ct.value < 0) barClass = 'fh-bar-negative';
    else barClass = 'fh-bar-neutral';
    buckets.push({ label, count: n, pct: (n / total) * 100, barClass });
  }

  const maxPct = Math.max(...buckets.map(b => b.pct), 1);

  els.histogram.innerHTML = buckets.map(b => `
    <div class="fh-hist-row">
      <span class="fh-hist-label">${b.label}</span>
      <div class="fh-hist-bar-wrap">
        <div class="fh-hist-bar ${b.barClass}" style="width:${(b.pct / maxPct * 100).toFixed(1)}%"></div>
      </div>
      <span class="fh-hist-pct">${b.count} (${b.pct.toFixed(1)}%)</span>
    </div>
  `).join('');
}

function syncSnapshotButtons() {
  const hasSnap = !!snapshot;
  els.snapshotBtn.style.display  = hasSnap ? 'none' : '';
  els.revertBtn.style.display    = hasSnap ? '' : 'none';
  els.clearSnapBtn.style.display = hasSnap ? '' : 'none';
}

function update() {
  renderDeckGrid();
  renderPresets();
  renderStats();
  renderHistogram();
  syncSnapshotButtons();
  saveState();
}

// ── Public API ─────────────────────────────────────────────────────────

export function initFhCalc() {
  els = {
    dialog:         document.getElementById('fh-calc-dialog'),
    baseGrid:       document.getElementById('fh-deck-grid'),
    rollingGrid:    document.getElementById('fh-rolling-grid'),
    extraGrid:      document.getElementById('fh-extra-grid'),
    rollingDetails: document.getElementById('fh-rolling-details'),
    extraDetails:   document.getElementById('fh-extra-details'),
    presets:        document.getElementById('fh-presets'),
    compareWrap:    document.getElementById('fh-compare-wrap'),
    histogram:      document.getElementById('fh-histogram'),
    snapshotBtn:    document.getElementById('fh-snapshot'),
    revertBtn:      document.getElementById('fh-revert-snapshot'),
    clearSnapBtn:   document.getElementById('fh-clear-snapshot'),
  };

  loadState();

  // Close button
  document.getElementById('fh-calc-close').addEventListener('click', () => els.dialog.close());

  // Grid click delegation
  function handleGridClick(e) {
    const btn = e.target.closest('.fh-card-btn');
    if (!btn) return;
    addCards(btn.dataset.id, parseInt(btn.dataset.d, 10));
    update();
  }
  els.baseGrid.addEventListener('click', handleGridClick);
  els.rollingGrid.addEventListener('click', handleGridClick);
  els.extraGrid.addEventListener('click', handleGridClick);

  // Snapshot
  els.snapshotBtn.addEventListener('click', () => {
    snapshot = { deck: { ...deck }, stats: computeStats() };
    update();
  });

  // Revert to snapshot
  els.revertBtn.addEventListener('click', () => {
    if (!snapshot) return;
    deck = {};
    for (const ct of CARD_TYPES) deck[ct.id] = 0;
    Object.assign(deck, snapshot.deck);
    update();
  });

  // Clear snapshot
  els.clearSnapBtn.addEventListener('click', () => {
    snapshot = null;
    update();
  });

  // Reset to base deck
  document.getElementById('fh-reset').addEventListener('click', () => {
    resetDeck();
    snapshot = null;
    update();
  });

  // Keyboard shortcut (G)
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === 'g') openCalc();
  });

  // Long-press on card for mobile
  const cardScene = document.querySelector('.card-scene');
  if (cardScene) {
    let lpTimer = null;
    cardScene.addEventListener('touchstart', () => {
      lpTimer = setTimeout(() => { lpTimer = null; openCalc(); }, 600);
    }, { passive: true });
    cardScene.addEventListener('touchend',  () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });
    cardScene.addEventListener('touchmove', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });
  }
}

export function openCalc() {
  update();
  els.dialog.showModal();
}
