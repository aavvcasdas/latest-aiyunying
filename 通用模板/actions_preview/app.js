// 通用模板动作预览台：直接按 cast_atlas.json 的矩形从母版 PNG 取帧。
// 不依赖 three.js / React / Canvas 库；动画只改 frame 索引，像素永远来自 canonical 图集。

const NAMES = {
  whale: '本鲸',
  gpt: '龙娘',
  claude: '小克',
  doubao: '豆包',
  gemini: '猫 / Gemini',
  kimi: 'Kimi',
  qwen: '千问',
  zai: '狐狸 / 智谱',
};
const ORDER = ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'];

const state = {
  data: null,
  atlas: null,
  mode: 'actions',
  character: 'all',
  playing: true,
  speed: 1,
  clock: 0,
  cards: [],
};

const $ = (sel) => document.querySelector(sel);
const grid = $('#grid');
const errorBox = $('#error');
const subtitle = $('#subtitle');
const masterBadge = $('#master-badge');
const stats = $('#stats');
const playToggle = $('#play-toggle');
const characterSelect = $('#character');
const speedInput = $('#speed');
const speedValue = $('#speed-value');
const showStrip = $('#show-strip');

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`无法载入 ${src}`));
    img.src = src;
  });
}

function rectOf(key) {
  return state.data?.rects?.[key];
}

function fit(r, boxX, boxY, boxW, boxH, bottomPad = 0) {
  const scale = Math.min(boxW / r[2], boxH / r[3]);
  const dw = r[2] * scale;
  const dh = r[3] * scale;
  return {
    dx: boxX + (boxW - dw) / 2,
    dy: boxY + boxH - dh - bottomPad,
    dw,
    dh,
  };
}

function checker(ctx, x, y, w, h, size = 8) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#111827';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1b2438';
  for (let yy = y; yy < y + h; yy += size) {
    for (let xx = x; xx < x + w; xx += size) {
      if (((xx / size + yy / size) | 0) % 2 === 0) ctx.fillRect(xx, yy, size, size);
    }
  }
  ctx.restore();
}

function drawFrame(ctx, key, x, y, w, h, bottomPad = 0) {
  const r = rectOf(key);
  if (!r) {
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('缺格', x + 2, y + 12);
    return;
  }
  const f = fit(r, x, y, w, h, bottomPad);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(state.atlas, r[0], r[1], r[2], r[3], f.dx, f.dy, f.dw, f.dh);
}

function drawStage(card) {
  const c = card.stage;
  const ctx = c.getContext('2d');
  checker(ctx, 0, 0, c.width, c.height, 10);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.beginPath();
  ctx.moveTo(0, c.height - 8.5);
  ctx.lineTo(c.width, c.height - 8.5);
  ctx.stroke();
  const key = card.frames[card.frame] ?? card.frames[0];
  drawFrame(ctx, key, 8, 8, c.width - 16, c.height - 16, 6);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(0, 0, c.width, 18);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(key, 6, 13);
}

function stripCols(card) {
  return Math.min(8, Math.max(1, card.frames.length));
}

function drawStrip(card) {
  const c = card.strip;
  const ctx = c.getContext('2d');
  const cell = 44;
  const rowH = 54;
  const cols = stripCols(card);
  const rows = Math.ceil(card.frames.length / cols);
  c.width = cols * cell;
  c.height = rows * rowH;
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, c.width, c.height);
  card.frames.forEach((key, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * rowH;
    checker(ctx, x, y, cell, rowH - 12, 6);
    drawFrame(ctx, key, x + 3, y + 3, cell - 6, rowH - 18, 0);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(String(i), x + 4, y + rowH - 3);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, rowH - 13);
  });
}

function ownersByProp() {
  const out = {};
  for (const [who, keys] of Object.entries(state.data.propsOf || {})) {
    for (const key of keys) (out[key] ||= []).push(who);
  }
  return out;
}

function buildCards() {
  const d = state.data;
  if (state.mode === 'actions') {
    const chars = state.character === 'all' ? ORDER : [state.character];
    const out = [];
    for (const who of chars) {
      for (const [name, a] of Object.entries(d.actions[who] || {})) {
        out.push({
          kind: 'action',
          who,
          whoLabel: NAMES[who] || who,
          name,
          label: a.label || name,
          frames: a.frames || [],
          fps: a.fps || 12,
          loop: Boolean(a.loop),
          size: a.size || null,
          fx: a.fx || null,
        });
      }
    }
    return out;
  }
  if (state.mode === 'props') {
    const owners = ownersByProp();
    let keys = d.props || [];
    if (state.character !== 'all') {
      keys = keys.filter((key) => (owners[key] || []).includes(state.character));
    }
    return keys.map((key) => ({
      kind: 'prop',
      who: owners[key] || [],
      whoLabel: (owners[key] || []).map((x) => NAMES[x] || x).join(' / ') || '公共',
      name: key,
      label: key,
      frames: [key],
      fps: 1,
      loop: false,
      size: null,
      fx: null,
    }));
  }
  return Object.entries(d.fx || {}).map(([key, frames]) => ({
    kind: 'fx',
    who: [],
    whoLabel: '通用',
    name: key,
    label: key,
    frames: frames || [key],
    fps: 1,
    loop: false,
    size: null,
    fx: null,
  }));
}

function frameAt(card, t) {
  const n = Math.max(1, card.frames.length);
  const fps = Math.max(1, card.fps || 12);
  if (card.loop) return Math.floor(t * fps) % n;
  const duration = n / fps;
  const cycle = duration + 0.65;
  const u = t % cycle;
  return Math.min(n - 1, Math.floor(u * fps));
}

function updateFooter(card) {
  const n = card.frames.length;
  const loop = card.loop ? '循环' : '单次';
  const size = card.size ? ` · ${card.size[0]}×${card.size[1]}` : '';
  card.footer.textContent = `${card.frame + 1}/${n} 帧 · ${card.fps} fps · ${loop}${size}${card.fx ? ` · fx:${card.fx}` : ''}`;
}

function makeCard(card, index) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.kind = card.kind;

  const head = document.createElement('div');
  head.className = 'card-head';
  const who = document.createElement('span');
  who.className = 'who';
  who.textContent = card.whoLabel;
  const label = document.createElement('strong');
  label.textContent = card.label;
  const key = document.createElement('code');
  key.textContent = `${card.who && card.kind === 'action' ? `${card.who}.` : ''}${card.name}`;
  head.append(who, label, key);

  const stage = document.createElement('canvas');
  stage.className = 'stage';
  stage.width = 240;
  stage.height = 190;

  const stripWrap = document.createElement('div');
  stripWrap.className = 'strip-wrap';
  const strip = document.createElement('canvas');
  strip.className = 'strip';
  strip.title = '点击任意一格定位到该帧';
  stripWrap.append(strip);

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  el.append(head, stage, stripWrap, footer);
  grid.append(el);

  Object.assign(card, { el, stage, strip, footer, frame: 0, lastDrawn: -1, phase: index * 0.19 });
  drawStrip(card);
  drawStage(card);
  updateFooter(card);

  strip.addEventListener('click', (ev) => {
    const rect = strip.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (strip.width / rect.width);
    const y = (ev.clientY - rect.top) * (strip.height / rect.height);
    const cell = 44;
    const rowH = 54;
    const cols = stripCols(card);
    const col = Math.floor(x / cell);
    const row = Math.floor(y / rowH);
    const idx = row * cols + col;
    if (idx >= 0 && idx < card.frames.length) {
      setPlaying(false);
      state.clock = 0;
      card.frame = idx;
      drawStage(card);
      updateFooter(card);
    }
  });
}

function renderGrid() {
  grid.innerHTML = '';
  state.cards = buildCards();
  state.cards.forEach(makeCard);
  grid.classList.toggle('hide-strip', !showStrip.checked);
  updateStats();
}

function updateStats() {
  const d = state.data;
  const totalActions = ORDER.reduce((n, who) => n + Object.keys(d.actions[who] || {}).length, 0);
  const totalFrames = ORDER.reduce(
    (n, who) => n + Object.values(d.actions[who] || {}).reduce((m, a) => m + (a.frames?.length || 0), 0),
    0,
  );
  const whaleActions = Object.keys(d.actions.whale || {}).length;
  const whaleFrames = Object.values(d.actions.whale || {}).reduce((m, a) => m + (a.frames?.length || 0), 0);
  const shown = state.cards.length;
  const shownFrames = state.cards.reduce((n, c) => n + c.frames.length, 0);
  const charLabel = state.character === 'all' ? '全部角色' : (NAMES[state.character] || state.character);
  const modeLabel = { actions: '动作', props: '道具', fx: '表情贴' }[state.mode];
  stats.innerHTML = [
    `<b>${shown}</b> 个${modeLabel}`,
    `<b>${shownFrames}</b> 帧`,
    `角色筛选：<b>${charLabel}</b>`,
    `全库：<b>${totalActions}</b> 动作 / <b>${totalFrames}</b> 帧`,
    `本鲸：<b>${whaleActions}</b> 动作 / <b>${whaleFrames}</b> 帧`,
  ].join('<span class="sep">·</span>');
}

function setPlaying(value) {
  state.playing = value;
  playToggle.textContent = value ? '暂停' : '播放';
  playToggle.classList.toggle('paused', !value);
  if (value) state.lastTick = performance.now();
}

function tick(now) {
  const dt = Math.min(0.1, (now - (state.lastTick ?? now)) / 1000);
  state.lastTick = now;
  if (state.playing) state.clock += dt * state.speed;
  for (const card of state.cards) {
    if (state.playing) {
      const next = frameAt(card, state.clock + card.phase);
      if (next !== card.frame) card.frame = next;
    }
    if (card.frame !== card.lastDrawn) {
      drawStage(card);
      updateFooter(card);
      card.lastDrawn = card.frame;
    }
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    state.clock = 0;
    renderGrid();
  });
});

characterSelect.addEventListener('change', () => {
  state.character = characterSelect.value;
  state.clock = 0;
  renderGrid();
});

$('#whale-only').addEventListener('click', () => {
  state.mode = 'actions';
  state.character = 'whale';
  characterSelect.value = 'whale';
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'actions'));
  state.clock = 0;
  renderGrid();
});

playToggle.addEventListener('click', () => setPlaying(!state.playing));

$('#step').addEventListener('click', () => {
  setPlaying(false);
  state.clock = 0;
  for (const card of state.cards) {
    card.frame = (card.frame + 1) % Math.max(1, card.frames.length);
    drawStage(card);
    updateFooter(card);
    card.lastDrawn = card.frame;
  }
});

$('#reset').addEventListener('click', () => {
  setPlaying(false);
  state.clock = 0;
  for (const card of state.cards) {
    card.frame = 0;
    drawStage(card);
    updateFooter(card);
    card.lastDrawn = 0;
  }
});

speedInput.addEventListener('input', () => {
  state.speed = Number(speedInput.value);
  speedValue.textContent = `${state.speed.toFixed(2)}×`;
});

showStrip.addEventListener('change', () => grid.classList.toggle('hide-strip', !showStrip.checked));

async function boot() {
  try {
    const [data, atlas] = await Promise.all([
      fetch('/api/cast', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      }),
      loadImage('/assets/cast_atlas.png'),
    ]);
    state.data = data;
    state.atlas = atlas;
    subtitle.textContent = `${data.master.w}×${data.master.h} 母版 · ${data.master.cells} 格 · 实时读取，无缓存`;
    masterBadge.textContent = `SHA ${data.master.sha256.slice(0, 12)} · ${data.master.bytes.toLocaleString()} B`;
    renderGrid();
    setPlaying(true);
    state.lastTick = performance.now();
    requestAnimationFrame(tick);
  } catch (err) {
    showError(`预览启动失败：${err.message}`);
    subtitle.textContent = '无法读取母版或动作表';
  }
}

boot();
