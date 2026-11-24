// Deterministic 6.5 s render comparison for the 2026-11-24 本鲸 final correction.
// It uses the canonical template capture contract (window.__FILM__) and draws
// the same atlas rectangles from three real atlas PNGs: original, v1 and v2.
(() => {
  const W = 1280, H = 720, PW = W / 3, SEG = 0.5, FPS = 12;
  const canvas = document.getElementById('film');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const PANELS = [
    { label: 'ORIGINAL', file: './original.png', accent: '#93a4bd' },
    { label: 'V1 RECONSTRUCTION', file: './v1.png', accent: '#f0a6c8' },
    { label: 'WAVE/POINT ROLLED BACK + old clothes', file: './v2.png', accent: '#86efac' },
  ];
  const LABELS = {
    idle: 'idle', nod: 'nod', shake: 'head shake', sad: 'sad', spin: 'SPIN TURN',
    happy: 'happy', wave: 'WAVE', point: 'POINT / OFFER', eat: 'eat', float: 'float',
    hover: 'hover', wink: 'wink', sleep: 'sleep',
  };
  let ready = false, meta = null, actions = null, similarity = null, images = [];
  let loadError = '';

  const loadJSON = (url) => fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url} HTTP ${r.status}`);
    return r.json();
  });
  const loadImage = (url) => new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`cannot load ${url}`));
    im.src = url;
  });

  window.__FILM__ = {
    duration: 6.5,
    fps: FPS,
    ready: () => ready,
    render: (t) => draw(t),
  };

  Promise.all([
    loadJSON('./cast_atlas.json'),
    loadJSON('./cast_actions.json'),
    loadJSON('./v2_similarity.json').catch(() => null),
    ...PANELS.map((p) => loadImage(p.file)),
  ]).then(([m, a, s, ...imgs]) => {
    meta = m; actions = a; similarity = s; images = imgs;
    window.__FILM__.duration = Object.keys(actions.actions.whale).length * SEG;
    ready = true;
    draw(0);
  }).catch((err) => {
    loadError = String(err);
    console.error('FILM_COMPARE_LOAD_FAIL', err);
    ctx.fillStyle = '#080c17'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fca5a5'; ctx.font = '20px monospace';
    ctx.fillText(loadError, 20, 30);
  });

  function panelState(t) {
    const names = Object.keys(actions.actions.whale);
    const i = Math.min(names.length - 1, Math.max(0, Math.floor(t / SEG)));
    const local = t - i * SEG;
    const a = actions.actions.whale[names[i]];
    const fi = Math.floor(local * a.fps) % a.frames.length;
    const key = a.frames[fi];
    return { names, i, local, a, fi, key, rect: meta.s[key] };
  }

  function text(str, x, y, size = 14, color = '#e5e7eb', weight = 'normal') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(str, x, y);
  }

  function draw(t) {
    if (!ready) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#080c17'; ctx.fillRect(0, 0, W, H);
    const st = panelState(t);
    text('WHALE ACTION RENDER COMPARISON', 18, 12, 22, '#f8fafc', 'bold');
    text(`template capture contract · ${FPS} fps · ${st.names.length} actions · ${window.__FILM__.duration.toFixed(1)}s · t=${t.toFixed(3)}s`, 18, 38, 13, '#94a3b8');

    // Timeline: one slot per canonical 本鲸 action.
    const tx = 18, ty = 62, tw = W - 36, th = 12;
    ctx.fillStyle = '#111827'; ctx.fillRect(tx, ty, tw, th);
    for (let i = 0; i < st.names.length; i++) {
      const x = tx + (i / st.names.length) * tw;
      const w = tw / st.names.length - 2;
      ctx.fillStyle = i === st.i ? '#86efac' : (i < st.i ? '#365b4d' : '#223049');
      ctx.fillRect(x, ty, Math.max(2, w), th);
    }

    for (let i = 0; i < PANELS.length; i++) drawPanel(i, st);
    const s = similarity;
    const summary = s
      ? `Not pixel-identical: 111-cell silhouette IoU ${s.v1.meanSilhouetteIoU} -> ${s.v2.meanSilhouetteIoU}; final closer in ${s.closerSilhouetteCells}/111 cells. Wave and point are rolled back to the pre-clothes-freeze cells (original arm poses, their own skirt); the other 11 actions keep the linked-fix look; rice bowl baked into eat frames; pre-redraw lower-body art with linked head/body motion and a new walk rhythm.`
      : 'Not pixel-identical; wave/point are rolled back to the pre-clothes-freeze art, a rice bowl is baked into eat frames, and the other actions keep pre-redraw lower-body art with linked head/body motion.';
    text(summary, 18, H - 22, 13, '#cbd5e1');
  }

  function drawPanel(i, st) {
    const p = PANELS[i], x0 = i * PW;
    ctx.fillStyle = i === 2 ? '#0d1726' : '#0b1220';
    ctx.fillRect(x0, 0, PW, H);
    ctx.strokeStyle = '#26324a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + 0.5, 0); ctx.lineTo(x0 + 0.5, H); ctx.stroke();

    // Header.
    ctx.fillStyle = p.accent; ctx.fillRect(x0 + 14, 86, 5, 22);
    text(p.label, x0 + 27, 86, 16, p.accent, 'bold');
    const label = LABELS[st.names[st.i]] || st.names[st.i];
    text(`${label}  [${st.i + 1}/${st.names.length}]`, x0 + 16, 110, 13, '#e5e7eb', 'bold');
    text(`${st.key}  frame ${st.fi + 1}/${st.a.frames.length}`, x0 + 16, 128, 12, '#94a3b8');

    const [rx, ry, rw, rh] = st.rect;
    const maxW = PW - 80, maxH = 350;
    const scale = Math.max(1, Math.floor(Math.min(maxW / rw, maxH / rh)));
    const dw = rw * scale, dh = rh * scale;
    const dx = x0 + Math.round((PW - dw) / 2), dy = 158;

    // Stage backdrop and ground shadow.
    ctx.fillStyle = '#101827'; ctx.fillRect(x0 + 14, 150, PW - 28, 362);
    ctx.strokeStyle = '#26324a'; ctx.strokeRect(x0 + 14.5, 150.5, PW - 29, 361);
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.beginPath(); ctx.ellipse(x0 + PW / 2, dy + dh + 6, dw * 0.36, 9, 0, 0, Math.PI * 2); ctx.fill();

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images[i], rx, ry, rw, rh, dx, dy, dw, dh);

    const armAction = st.names[st.i] === 'wave' || st.names[st.i] === 'point';
    const spinAction = st.names[st.i] === 'spin';
    const eatAction = st.names[st.i] === 'eat';
    if (eatAction) {
      const bx = dx + dw * 0.33, by = dy + dh * 0.53, bw = dw * 0.34, bh = dh * 0.30;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
    }
    if (armAction) {
      const bx = dx + dw * 0.52, by = dy + dh * 0.28, bw = dw * 0.40, bh = dh * 0.40;
      ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
    }
    if (i === 2 && !spinAction) {
      const bx = dx + dw * 0.18, by = dy + dh * 0.58, bw = dw * 0.64, bh = dh * 0.42;
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
    }

    // Bottom detail panel: arm zoom for wave/point, explanatory note for spin/others.
    const ix = x0 + 14, iy = 526, iw = PW - 28, ih = 150;
    ctx.fillStyle = '#080f1d'; ctx.fillRect(ix, iy, iw, ih);
    ctx.strokeStyle = p.accent; ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
    if (armAction) {
      const sx = rx + Math.floor(rw * 0.52), sy = ry + Math.floor(rh * 0.28);
      const sw = Math.max(1, Math.floor(rw * 0.40)), sh = Math.max(1, Math.floor(rh * 0.40));
      const zs = Math.max(1, Math.floor(Math.min((iw - 16) / sw, (ih - 34) / sh)));
      const zw = sw * zs, zh = sh * zs;
      ctx.fillStyle = '#111827'; ctx.fillRect(ix + 6, iy + 28, iw - 12, ih - 34);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(images[i], sx, sy, sw, sh,
        ix + Math.round((iw - zw) / 2), iy + 28 + Math.round((ih - 34 - zh) / 2), zw, zh);
      text('ARM / HAND ZOOM', ix + 9, iy + 8, 12, p.accent, 'bold');
    } else if (eatAction) {
      text('RICE BOWL / EAT', ix + 10, iy + 12, 14, p.accent, 'bold');
      text(i === 2 ? 'Bowl + rice baked into all 8 eat frames.' : 'No bowl / no rice: only blink and chew.', ix + 10, iy + 40, 13, '#cbd5e1');
      text(i === 2 ? 'Uses the existing prop_bowl cell and fixed palette.' : 'Same frame keys, but the meal was missing.', ix + 10, iy + 68, 12, '#94a3b8');
    } else if (spinAction) {
      text('SPIN TURN', ix + 10, iy + 12, 14, p.accent, 'bold');
      text(i === 0 ? 'Original: very thin squashed front frame.' :
        i === 1 ? 'V1: real side frame, but too compressed at 0.78.' :
          'Final: side turn kept near full width; no noodle frame.', ix + 10, iy + 40, 13, '#cbd5e1');
      text(`bbox ratio ${i === 0 ? '0.2955' : i === 1 ? '0.7381' : '0.7093'} on spin_2`, ix + 10, iy + 68, 12, '#94a3b8');
    } else {
      text('CANONICAL ACTION FRAME', ix + 10, iy + 12, 13, p.accent, 'bold');
      text('Same atlas rectangle and frame key in all three panels.', ix + 10, iy + 40, 13, '#cbd5e1');
      text(i === 2 ? 'Final: pre-redraw apron/skirt/boots; head, torso and skirt move together.' : 'Earlier columns use the prior reconstruction art.', ix + 10, iy + 66, 12, '#94a3b8');
    }
  }
})();
