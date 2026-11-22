// 十一镜 · 四十个词拍。每个词都有自己的画面动作，时机全部挂在词的实测起点上（W0 / L0），不写死百分比。
import {
  G, W, H, C, TAU, clamp, lerp, seg, ss, eo, back, rnd,
  actor, icon, shadow, paper, grain, inkBlob, mountains, glyph, seal, text,
  rain, ripples, cloud, umbrella, flower, peony, bell, teapot, glassCup, pour, steam,
  sleeve, coin, leaf, heart, drop, crow, goose, puzzle, redThread, eave, lantern, pipa,
} from "./draw";
import { W0, L0, L1, LINES } from "./timeline";

export interface Shot {
  id: string;
  t0: number;
  t1: number;
  line: number;
  draw: (g: G, t: number) => void;
}

/** 词拍的墨字：起笔 0.35 秒，下一词到来时化开 */
function wordInk(g: G, t: number, n: number, w: number, x: number, y: number, size: number, o: { color?: string; alpha?: number; vertical?: boolean; hold?: number } = {}) {
  const wd = LINES[n - 1].words[w];
  const p = seg(t, wd.t0, wd.t0 + 0.35);
  const end = o.hold ?? wd.t1;
  const dis = seg(t, end, end + 0.4);
  glyph(g, wd.text, x, y, size, p, { color: o.color ?? C.ink, alpha: o.alpha ?? 0.16, dissolve: dis, vertical: o.vertical });
}
function camera(g: G, cx: number, cy: number, z: number, dx = 0, dy = 0) {
  g.translate(W / 2 + dx, H / 2 + dy);
  g.scale(z, z);
  g.translate(-cx, -cy);
}
function stoneGround(g: G, y: number, color: string, wet = false) {
  g.fillStyle = color;
  g.fillRect(0, y, W, H - y);
  g.strokeStyle = "rgba(0,0,0,0.18)";
  g.lineWidth = 2;
  for (let r = 0; r < 5; r++) {
    const yy = y + 12 + r * r * 9 + r * 10;
    g.beginPath();
    g.moveTo(0, yy);
    g.lineTo(W, yy);
    g.stroke();
    for (let i = 0; i < 14; i++) {
      const xx = ((i + (r % 2) * 0.5) * W) / 13;
      g.beginPath();
      g.moveTo(xx, yy);
      g.lineTo(xx + (xx - W / 2) * 0.06, yy + 10 + r * 9);
      g.stroke();
    }
  }
  if (wet) {
    const gr = g.createLinearGradient(0, y, 0, H);
    gr.addColorStop(0, "rgba(180,210,230,0.18)");
    gr.addColorStop(1, "rgba(180,210,230,0)");
    g.fillStyle = gr;
    g.fillRect(0, y, W, H - y);
  }
}
function flash(g: G, t: number, at: number, dur = 0.25, color = "255,255,255", a = 0.7) {
  const u = seg(t, at, at + dur);
  if (u <= 0 || u >= 1) return;
  g.fillStyle = `rgba(${color},${a * (1 - u)})`;
  g.fillRect(0, 0, W, H);
}
function wall(g: G, x0: number, x1: number, top: number, bottom: number, color = "#ece6da") {
  g.fillStyle = color;
  g.fillRect(x0, top, x1 - x0, bottom - top);
  g.fillStyle = "rgba(0,0,0,0.06)";
  for (let i = 0; i < 8; i++) g.fillRect(x0 + rnd(i) * (x1 - x0), top + rnd(i + 4) * (bottom - top), 60 + rnd(i + 9) * 80, 3);
}
function lattice(g: G, x: number, y: number, w: number, h: number, light: number, barsOnly = false) {
  g.save();
  if (!barsOnly) {
    const gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, `rgba(255,214,140,${0.25 + 0.6 * light})`);
    gr.addColorStop(1, `rgba(240,170,90,${0.2 + 0.5 * light})`);
    g.fillStyle = light > 0 ? gr : "#3a3530";
    g.fillRect(x, y, w, h);
  }
  g.strokeStyle = C.wood;
  g.lineWidth = 6;
  g.strokeRect(x, y, w, h);
  g.lineWidth = 3;
  const n = 4;
  for (let i = 1; i < n; i++) {
    g.beginPath();
    g.moveTo(x + (w * i) / n, y);
    g.lineTo(x + (w * i) / n, y + h);
    g.stroke();
    g.beginPath();
    g.moveTo(x, y + (h * i) / n);
    g.lineTo(x + w, y + (h * i) / n);
    g.stroke();
  }
  g.restore();
}

// ============ 第一镜：我 / 的 / 思念 ============
const s1: Shot = {
  id: "01", t0: 0, t1: W0(2, 0), line: 1,
  draw(g, t) {
    paper(g, "#f1e8d4", "#dfd0b0");
    grain(g, 0.07);
    // 起手一滴墨落下晕开
    const b = eo(seg(t, 0, 0.45));
    inkBlob(g, 470, 600, 210 * b, 3, "rgba(30,26,23,0.12)");
    inkBlob(g, 470, 610, 120 * b, 7, "rgba(30,26,23,0.18)");
    // 我
    wordInk(g, t, 1, 0, 300, 320, 420, { alpha: 0.13, hold: L1(1) });
    const z = lerp(1.04, 1, eo(seg(t, 0, 2.7)));
    g.save();
    camera(g, W / 2, H / 2, z);
    shadow(g, 470, 612, 90, 0.2);
    const appear = eo(seg(t, 0.1, 0.5));
    actor(g, t < W0(1, 0) + 0.9 ? "act_whale_point" : "act_whale_idle", t - W0(1, 0), 470, 612 + (1 - appear) * 30, 3, { alpha: appear, loop: t < W0(1, 0) + 0.9 ? false : true, fps: 7 });
    g.restore();
    // 的：一缕墨线牵出去
    const lp = eo(seg(t, W0(1, 1), W0(1, 2) + 0.2));
    if (lp > 0) {
      g.save();
      g.strokeStyle = "rgba(30,26,23,0.75)";
      g.lineWidth = 5;
      g.lineCap = "round";
      g.beginPath();
      for (let i = 0; i <= 40 * lp; i++) {
        const u = i / 40;
        const x = lerp(520, 880, u);
        const y = lerp(380, 300, u) - Math.sin(u * Math.PI) * 90 + Math.sin(u * 12) * 6;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.restore();
    }
    // 思念：念 = 今 + 心
    const t2 = W0(1, 2);
    const pg = seg(t, t2, t2 + 0.35);
    const split = eo(seg(t, t2 + 0.5, t2 + 1.0));
    if (pg > 0) {
      glyph(g, "思", 760, 250, 150, pg, { alpha: 0.85 * (1 - split), color: C.ink });
      if (split < 1) glyph(g, "念", 960, 250, 150, pg, { alpha: 0.9 * (1 - split), color: C.ink });
      if (split > 0) {
        glyph(g, "今", 960, 250 - split * 70, 120, 1, { alpha: 0.85 * (1 - seg(t, t2 + 1.1, t2 + 1.4)), color: C.ink2 });
        glyph(g, "心", 960, 250 + split * 60, 120, 1, { alpha: 1 - seg(t, t2 + 0.9, t2 + 1.15), color: C.red });
        const hk = seg(t, t2 + 0.9, t2 + 1.15);
        const beat = 1 + 0.12 * Math.max(0, Math.sin((t - t2) * 9));
        heart(g, 960, 310 + split * 10, 70 * eo(hk) * beat, C.red);
      }
      // 念想泡泡从头顶升起
      for (let i = 0; i < 4; i++) {
        const bp = eo(seg(t, t2 + 0.15 + i * 0.18, t2 + 0.5 + i * 0.18));
        const bx = lerp(560, 860, i / 3.4);
        const by = lerp(330, 170, i / 3.4) + Math.sin(t * 2 + i) * 6;
        const r = (10 + i * 12) * bp;
        if (r <= 0) continue;
        g.save();
        g.fillStyle = "rgba(255,252,244,0.92)";
        g.strokeStyle = C.ink;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(bx, by, r, 0, TAU);
        g.fill();
        g.stroke();
        g.restore();
        if (i === 3) icon(g, "p_claude_neutral", bx, by, 0.75 * bp);
      }
    }
    // 片名印
    seal(g, "浪人琵琶", 1140, 110, 96, seg(t, 0.05, 0.45), -0.05);
  },
};

// ============ 第二镜：似 / 六月 / 里的 ============
const s2: Shot = {
  id: "02", t0: W0(2, 0), t1: W0(2, 3), line: 2,
  draw(g, t) {
    const a = W0(2, 0), b = W0(2, 1), c = W0(2, 2), d = W0(2, 3);
    const dive = ss(seg(t, c, d));
    paper(g, "#f1e8d4", "#dacbb0");
    grain(g, 0.06);
    wordInk(g, t, 2, 0, 330, 330, 360, { alpha: 0.12 });
    g.save();
    camera(g, 640, 360, 1 + dive * 3.2, 0, dive * 30);
    // 似：心被捏成一滴雨
    const m = ss(seg(t, a, a + 0.5));
    const fall = eo(seg(t, b + 0.6, b + 1.0));
    if (t < b + 1.05) {
      const hx = lerp(960, 640, eo(seg(t, a, b)));
      const hy = lerp(320, 210, eo(seg(t, a, b))) + fall * 150;
      heart(g, hx, hy, 90 * (1 - m), C.red);
      drop(g, hx, hy, 70 * m, "#6d9cc0");
      if (m > 0.2 && m < 1) text(g, "似", hx + 70, hy - 50, 44, C.ink2, "center", 1 - m);
    }
    // 六月：黄历翻页
    const show = back(seg(t, b - 0.1, b + 0.35));
    if (show > 0) {
      g.save();
      g.translate(640, 400);
      g.scale(show, show);
      g.fillStyle = "rgba(0,0,0,0.15)";
      g.fillRect(-150, -170, 310, 360);
      g.fillStyle = "#fbf6ea";
      g.fillRect(-160, -180, 310, 360);
      g.fillStyle = C.red;
      g.fillRect(-160, -180, 310, 64);
      text(g, "黄历", -5, -148, 34, "#fbe8c8");
      const months = ["一", "二", "三", "四", "五", "六"];
      const fp = seg(t, b, b + 0.7);
      const mi = Math.min(5, Math.floor(fp * 6));
      const flipU = (fp * 6) % 1;
      text(g, months[mi], -5, 10, 150, C.ink);
      text(g, "月", -5, 120, 60, C.red);
      if (fp < 1) {
        // 正在翻起的那一页
        g.save();
        g.fillStyle = "#efe6d0";
        g.globalAlpha = 1 - flipU;
        g.fillRect(-160, -116, 310, 296 * (1 - flipU));
        g.restore();
      }
      g.restore();
      // 石榴花（榴月）开在黄历四周
      for (let i = 0; i < 7; i++) {
        const fo = eo(seg(t, b + 0.7 + i * 0.06, b + 1.0 + i * 0.06));
        const an = (i / 7) * TAU + 0.3;
        flower(g, 640 + Math.cos(an) * 230, 400 + Math.sin(an) * 210, 30 * fo, "#d8402e", "#f2c14e", 6, an, fo);
      }
    }
    // 雨滴落在黄历上
    if (fall > 0.95) {
      const rp = seg(t, b + 1.0, b + 1.8);
      g.save();
      g.strokeStyle = `rgba(80,130,170,${1 - rp})`;
      g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        const rr = (rp * 120 - k * 25);
        if (rr > 0) {
          g.beginPath();
          g.ellipse(640, 360, rr, rr * 0.5, 0, 0, TAU);
          g.stroke();
        }
      }
      g.restore();
    }
    g.restore();
    // 里的：钻进纸页，透出雨天
    if (dive > 0) {
      g.fillStyle = `rgba(52,72,92,${dive})`;
      g.fillRect(0, 0, W, H);
      rain(g, t, dive * 0.25);
    }
    wordInk(g, t, 2, 1, 1080, 330, 200, { alpha: 0.2 * (1 - dive), vertical: true });
  },
};

// ============ 第三镜：小雨 / 哗哗 ============
const s3: Shot = {
  id: "03", t0: W0(2, 3), t1: L0(3), line: 2,
  draw(g, t) {
    const a = W0(2, 3), b = W0(2, 4);
    const pour = ss(seg(t, b - 0.05, b + 0.3));
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, lerpCol("#4a6178", "#27384a", pour));
    sky.addColorStop(1, lerpCol("#8ba0ad", "#4a5a66", pour));
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    mountains(g, 470, 90, 1.3, "rgba(40,60,78,0.55)", t * 6);
    mountains(g, 520, 60, 4.1, "rgba(30,46,60,0.7)", t * 12);
    wordInk(g, t, 2, 3, 300, 260, 300, { color: "#d9e6ef", alpha: 0.18 });
    const shake = pour > 0 && t < b + 0.6 ? Math.sin(t * 80) * 6 * (1 - seg(t, b, b + 0.6)) : 0;
    g.save();
    camera(g, 640, 360, lerp(1, 1.06, seg(t, a, L0(3))), shake, 0);
    // 云上的龙娘施雨
    const cy = 220 + Math.sin(t * 1.5) * 6;
    cloud(g, 960, cy + 70, 70, "rgba(225,232,240,0.95)");
    actor(g, "act_gpt_cast", t - a, 960, cy + 60, 2.2, { fps: 8 });
    cloud(g, 900, cy + 92, 46, "rgba(210,220,232,0.95)");
    cloud(g, 1050, cy + 96, 40, "rgba(210,220,232,0.95)");
    cloud(g, 300, 120, 80, "rgba(150,165,180,0.7)");
    stoneGround(g, 560, "#3e4a52", true);
    ripples(g, t, 580, 710, Math.floor(lerp(8, 30, pour)));
    shadow(g, 520, 652, 80, 0.3);
    actor(g, pour > 0.5 ? "act_whale_shiver" : "act_whale_idle", t - a, 520, 652, 3, { fps: pour > 0.5 ? 12 : 7, tint: "#2a4060", ta: 0.18 });
    if (pour > 0.5) icon(g, "fx_sweat", 590, 420, 3, 1);
    g.restore();
    // 雨：先细后倾盆
    rain(g, t, lerp(0.22, 1, pour), { slant: lerp(0.08, 0.32, pour), speed: lerp(700, 1500, pour), len: lerp(18, 40, pour) });
    // 几颗大雨滴里裹着心事
    for (let i = 0; i < 5; i++) {
      const per = 1.4;
      const ph = ((t - a + i * 0.37) % per) / per;
      const x = 160 + i * 230 + Math.sin(i) * 40;
      drop(g, x + ph * 30, -40 + ph * 700, 16, "rgba(180,210,235,0.75)");
      heart(g, x + ph * 30, -34 + ph * 700, 6, "rgba(220,90,90,0.9)");
    }
    flash(g, t, b, 0.3, "235,240,255", 0.75);
    // 哗哗：拟声字砸下来
    const pp = seg(t, b, b + 0.4);
    if (pp > 0) {
      ["哗", "哗"].forEach((ch, i) => {
        const k = back(seg(t, b + i * 0.18, b + 0.4 + i * 0.18));
        if (k <= 0) return;
        const bob = Math.sin((t - b) * 10 + i * 2) * 6;
        g.save();
        g.translate(360 + i * 210, 300 + bob);
        g.rotate((i ? 0.12 : -0.1) + Math.sin(t * 6 + i) * 0.03);
        g.scale(k, k);
        glyph(g, ch, 0, 0, 210, 1, { color: "#eef6fb", stroke: C.inkBlue, alpha: 0.95 });
        g.restore();
      });
    }
  },
};

// ============ 第四镜：对你 / 情有所钟 ============
const s4: Shot = {
  id: "04", t0: L0(3), t1: L0(4), line: 3,
  draw(g, t) {
    const a = W0(3, 0), b = W0(3, 1);
    // 左冷右暖
    const sx = 640 + Math.sin(t * 0.8) * 10;
    g.fillStyle = "#33465a";
    g.fillRect(0, 0, sx, H);
    const warm = g.createLinearGradient(sx, 0, W, H);
    warm.addColorStop(0, "#f2cf95");
    warm.addColorStop(1, "#d98f55");
    g.fillStyle = warm;
    g.fillRect(sx, 0, W - sx, H);
    g.save();
    g.beginPath();
    g.rect(0, 0, sx, H);
    g.clip();
    stoneGround(g, 560, "#2c3944", true);
    rain(g, t, 0.55, { slant: 0.2 });
    ripples(g, t, 580, 700, 10, 9);
    g.restore();
    g.save();
    g.beginPath();
    g.rect(sx, 0, W - sx, H);
    g.clip();
    eave(g, sx + 40, W + 40, 170, "#3a2a22");
    wall(g, sx, W, 214, 560, "#f4e3c6");
    g.fillStyle = "#8a5a37";
    g.fillRect(sx, 560, W - sx, 160);
    lantern(g, 1150, 214, 30, Math.sin(t * 2) * 0.08);
    g.restore();
    // 分界墨线
    g.strokeStyle = C.ink;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(sx, 0);
    g.lineTo(sx, H);
    g.stroke();
    shadow(g, 300, 640, 70, 0.3);
    actor(g, "act_whale_sad", t - a, 300, 640, 2.8, { fps: 6, tint: "#2a4060", ta: 0.15 });
    shadow(g, 960, 640, 70, 0.2);
    actor(g, "act_claude_idle", t - a, 960, 640, 2.8, { fps: 7 });
    wordInk(g, t, 3, 0, 300, 180, 160, { color: "#dbe7f0", alpha: 0.35 });
    // 对你：红线牵过去
    redThread(g, 330, 450, 930, 450, eo(seg(t, a, a + 0.55)), t);
    // 情有所钟：一口钟落下来撞响
    const drop_ = eo(seg(t, b - 0.05, b + 0.3));
    if (drop_ > 0) {
      const hits = [b + 0.15, b + 0.55, b + 0.95];
      let sw = 0;
      for (const h of hits) if (t > h) sw = Math.sin((t - h) * 12) * 0.22 * Math.exp(-(t - h) * 3);
      glyph(g, "钟", sx, 320, 330, seg(t, b, b + 0.3), { color: "#5e401c", alpha: 0.22 });
      bell(g, sx, -140 + drop_ * 400, 95, sw);
      for (const h of hits) {
        const u = seg(t, h, h + 0.9);
        if (u <= 0 || u >= 1) continue;
        g.save();
        g.strokeStyle = `rgba(245,200,100,${0.9 * (1 - u)})`;
        g.lineWidth = 6 * (1 - u) + 1;
        g.beginPath();
        g.arc(sx, 320, 60 + u * 520, 0, TAU);
        g.stroke();
        g.restore();
        heart(g, sx + Math.cos(h * 7) * u * 260, 250 + Math.sin(h * 7) * u * 160 - u * 40, 22 * (1 - u * 0.5), C.red, 1 - u);
      }
      const hp = seg(t, b + 0.2, b + 0.5);
      if (hp > 0) icon(g, "fx_heart", 300, 370 - hp * 20, 4, hp);
      glyph(g, "情有所钟", sx, 440, 70, seg(t, b + 0.1, b + 0.5), { color: "#fff3dc", stroke: "#3a2414", alpha: 1 });
    }
  },
};

// ============ 第五镜：为你 / 两袖 / 清风 ============
const s5: Shot = {
  id: "05", t0: L0(4), t1: L0(5), line: 4,
  draw(g, t) {
    const a = W0(4, 0), b = W0(4, 1), c = W0(4, 2);
    // 雨后庭院，月出
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1f2a3b");
    sky.addColorStop(1, "#5b6b78");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(250,240,210,0.9)";
    g.beginPath();
    g.arc(1040, 130, 52, 0, TAU);
    g.fill();
    mountains(g, 500, 70, 2.2, "rgba(25,35,48,0.75)");
    stoneGround(g, 560, "#3a434a", true);
    const close = ss(seg(t, b - 0.15, b + 0.35));
    g.save();
    camera(g, lerp(640, 440, close), lerp(360, 470, close), lerp(1, 1.6, close));
    // 两袖：两只水袖从肩头甩开（画在人物身后）
    const sp = back(seg(t, b, b + 0.45));
    const sfade = 1 - seg(t, c + 1.0, c + 1.5);
    if (sp > 0 && sfade > 0) {
      g.save();
      g.globalAlpha = sfade;
      sleeve(g, 418, 560, 62 * sp, -1, t * 1.3);
      sleeve(g, 462, 560, 62 * sp, 1, t * 1.3 + 0.5);
      g.restore();
    }
    // 为你：一拜
    shadow(g, 440, 640, 80, 0.3);
    if (t < b) {
      actor(g, "act_whale_bow", t - a, 440, 640, 3, { fps: 7, loop: false });
    } else if (t < c + 0.2) {
      actor(g, "act_whale_idle", t - b, 440, 640, 3, { fps: 7 });
    } else {
      actor(g, "act_whale_shake", t - c, 440, 640, 3, { fps: 9 });
    }
    actor(g, "act_claude_idle", t, 980, 640, 2.2, { fps: 6, alpha: 1 - close });
    if (t < b) icon(g, "fx_shine", 900, 420, 3, seg(t, a + 0.3, a + 0.6));
    g.restore();
    wordInk(g, t, 4, 0, 760, 260, 300, { color: "#e6edf3", alpha: 0.2 });
    // 两袖：两只大袖从身侧甩开
    if (t > b && t < c + 1.4) {
      const fade = 1 - seg(t, c + 1.0, c + 1.4);
      glyph(g, "两袖", 1130, 330, 130, seg(t, b, b + 0.4), { color: "#f3f0ea", alpha: 0.85 * fade, vertical: true });
    }
    // 清风：袖里只有风
    if (t > c) {
      const u = t - c;
      g.save();
      g.strokeStyle = "rgba(235,245,250,0.6)";
      g.lineWidth = 3;
      g.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const y = 150 + i * 34 + Math.sin(i * 3) * 20;
        const x = ((u * 900 + rnd(i) * W * 1.4) % (W + 500)) - 250;
        g.beginPath();
        for (let k = 0; k <= 16; k++) {
          const px = x + k * 14;
          const py = y + Math.sin(k * 0.5 + u * 5 + i) * 10;
          k ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.stroke();
      }
      g.restore();
      for (let i = 0; i < 10; i++) {
        const x = ((u * 520 + rnd(i + 20) * 1400) % 1500) - 100;
        const y = 220 + rnd(i + 40) * 300 + Math.sin(u * 4 + i) * 30;
        i % 3 === 0 ? flower(g, x, y, 9, C.pink, "#fff", 5, u * 3 + i) : leaf(g, x, y, 12, u * 4 + i);
      }
      // 一枚铜钱掉出来，滚到千问脚边
      const cu = seg(t, c + 0.3, c + 2.2);
      const cx = lerp(560, 1000, eo(cu));
      const bounce = Math.abs(Math.sin(cu * Math.PI * 3)) * (1 - cu) * 120;
      coin(g, cx, 640 - bounce - 14, 14, cu * 18);
      const qa = seg(t, c + 0.8, c + 1.3);
      actor(g, "act_qwen_sway", t - c, 1080, 640, 2.2, { fps: 7, alpha: qa });
      if (qa > 0) icon(g, "prop_fan", 1130, 520, 3, qa);
      if (t > c + 2.0) icon(g, "fx_question", 1080, 420, 3, seg(t, c + 2.0, c + 2.3));
      icon(g, "fx_sweat", 600, 330, 3.5, seg(t, c + 0.4, c + 0.7));
      glyph(g, "清风", 760, 170, 120, seg(t, c, c + 0.4), { color: "#eef5f8", alpha: 0.85, dissolve: seg(t, c + 1.6, L0(5)) });
    }
  },
};

// ============ 第六镜：小生 / 的 / 花伞 / 还落在 / 你家 ============
const s6: Shot = {
  id: "06", t0: L0(5), t1: L0(6), line: 5,
  draw(g, t) {
    const a = W0(5, 0), b = W0(5, 1), c = W0(5, 2), d = W0(5, 3), e = W0(5, 4);
    const outside = ss(seg(t, d - 0.1, d + 0.35));
    if (outside < 1) {
      // 戏台
      g.fillStyle = "#2a1512";
      g.fillRect(0, 0, W, H);
      const spot = lerp(260, 170, seg(t, b, b + 0.3)) * (1 + 0.04 * Math.sin(t * 3));
      const gr = g.createRadialGradient(640, 520, 10, 640, 520, spot * 1.6);
      gr.addColorStop(0, "rgba(255,226,170,0.85)");
      gr.addColorStop(1, "rgba(255,226,170,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.fillStyle = "#5b2a1c";
      g.fillRect(0, 600, W, 120);
      // 幕布
      const op = eo(seg(t, a - 0.2, a + 0.35));
      for (const s of [-1, 1]) {
        g.fillStyle = "#9e2324";
        g.beginPath();
        const edge = 640 + s * lerp(20, 520, op);
        g.moveTo(s < 0 ? 0 : W, 0);
        g.lineTo(edge, 0);
        g.quadraticCurveTo(edge + s * 40, 360, edge - s * 30, H);
        g.lineTo(s < 0 ? 0 : W, H);
        g.fill();
        g.strokeStyle = "rgba(0,0,0,0.25)";
        g.lineWidth = 3;
        for (let k = 1; k < 5; k++) {
          const x = lerp(s < 0 ? 0 : W, edge, k / 5);
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x + s * 10, H);
          g.stroke();
        }
      }
      g.fillStyle = "#c79a3d";
      g.fillRect(0, 0, W, 34);
      const pose = t < c ? 1 : 1 - seg(t, c, c + 0.3);
      shadow(g, 640, 606, 80, 0.4);
      actor(g, "act_whale_wave", t - a, 640, 606, 3, { fps: 9, alpha: pose });
      seal(g, "小生", 820, 260, 120, seg(t, a + 0.05, a + 0.35) * pose, 0.08);
      flash(g, t, a + 0.1, 0.2, "255,230,170", 0.5);
      // 花伞旋开
      const ou = seg(t, c, c + 0.45);
      if (ou > 0) {
        const fallU = ss(seg(t, d - 0.1, d + 0.5));
        umbrella(g, lerp(640, 900, fallU), lerp(380, 520, fallU), 260 * (1 - fallU * 0.55), ou, (t - c) * 4, fallU * 0.4);
        for (let i = 0; i < 12; i++) {
          const pu = seg(t, c + 0.1 + i * 0.03, c + 1.2 + i * 0.03);
          if (pu <= 0 || pu >= 1) continue;
          const an = (i / 12) * TAU;
          flower(g, 640 + Math.cos(an) * pu * 500, 360 + Math.sin(an) * pu * 300, 14, i % 2 ? "#ffd1dc" : "#ffe7b0", C.gold, 5, pu * 6);
        }
        glyph(g, "花伞", 640, 110, 110, seg(t, c, c + 0.3), { color: "#f8e6c4", alpha: 0.9 });
      }
      g.globalAlpha = 1;
    }
    if (outside > 0) {
      g.save();
      g.globalAlpha = outside;
      // 你家门前，雨夜
      g.fillStyle = "#2f3d4a";
      g.fillRect(0, 0, W, H);
      eave(g, 260, 1180, 120, "#22201f");
      wall(g, 280, 1160, 164, 600, "#d9d2c4");
      // 门
      g.fillStyle = C.wood;
      g.fillRect(760, 300, 200, 300);
      g.strokeStyle = "#2e1c10";
      g.lineWidth = 5;
      g.strokeRect(760, 300, 200, 300);
      g.beginPath();
      g.moveTo(860, 300);
      g.lineTo(860, 600);
      g.stroke();
      g.fillStyle = C.gold;
      g.beginPath();
      g.arc(845, 450, 7, 0, TAU);
      g.arc(875, 450, 7, 0, TAU);
      g.fill();
      // 窗
      const lit = seg(t, e, e + 0.3);
      lattice(g, 400, 250, 220, 170, lit);
      if (lit > 0) {
        g.save();
        g.beginPath();
        g.rect(400, 250, 220, 170);
        g.clip();
        actor(g, "act_claude_lookaround", t - e, 510, 470 - eo(seg(t, e + 0.1, e + 0.5)) * 90, 2, { fps: 8 });
        g.restore();
        lattice(g, 400, 250, 220, 170, lit, true);
      }
      lantern(g, 1010, 164, 26, Math.sin(t * 2.5) * 0.1, 0.8);
      stoneGround(g, 600, "#38434b", true);
      wordInk(g, t, 5, 4, 1060, 400, 180, { color: C.ink, alpha: 0.2 });
      // 伞斜靠门边
      const lean = ss(seg(t, d, d + 0.6));
      umbrella(g, lerp(900, 980, lean), lerp(-200, 470, eo(seg(t, d, d + 0.5))), 120, 1 - lean * 0.85, 0, lerp(0, 0.45, lean));
      ripples(g, t, 610, 710, 14, 21);
      rain(g, t, 0.6, { slant: 0.15 });
      if (lit > 0.5) icon(g, "fx_exclaim", 560, 260, 3, seg(t, e + 0.4, e + 0.6));
      g.restore();
    }
  },
};

// ============ 第七镜：你 / 美眷 / 如花 ============
const s7: Shot = {
  id: "07", t0: L0(6), t1: L0(7), line: 6,
  draw(g, t) {
    const a = W0(6, 0), b = W0(6, 1), c = W0(6, 2);
    paper(g, "#f8e4dc", "#efc7bd");
    grain(g, 0.05);
    wordInk(g, t, 6, 2, 640, 330, 520, { color: C.red, alpha: 0.1, hold: L1(6) });
    const z = lerp(1.08, 1, eo(seg(t, a, L1(6))));
    g.save();
    camera(g, 640, 400, z);
    // 美眷：金光与花环围拢
    const ring = eo(seg(t, b, b + 0.5));
    if (ring > 0) {
      g.save();
      const gr = g.createRadialGradient(640, 420, 20, 640, 420, 320);
      gr.addColorStop(0, `rgba(255,236,180,${0.7 * ring})`);
      gr.addColorStop(1, "rgba(255,236,180,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.restore();
      for (let i = 0; i < 22; i++) {
        const an = (i / 22) * TAU + t * 0.3;
        const r = lerp(520, 250, ring);
        flower(g, 640 + Math.cos(an) * r, 400 + Math.sin(an) * r * 0.85, 14, i % 2 ? "#fff3f6" : "#f7c3cf", C.gold, 5, an);
      }
    }
    shadow(g, 640, 640, 90, 0.18);
    actor(g, "act_claude_curtsy", t - a, 640, 640, 3.4, { fps: 7, loop: false });
    // 如花：牡丹盛开
    const spots: [number, number, number, "pink" | "red" | "white"][] = [
      [400, 560, 70, "pink"], [880, 560, 70, "red"], [330, 330, 52, "white"], [950, 320, 56, "pink"], [500, 190, 40, "red"], [800, 180, 44, "white"],
    ];
    spots.forEach(([x, y, r, h], i) => peony(g, x, y, r, seg(t, c + i * 0.06, c + 0.4 + i * 0.06), h));
    g.restore();
    if (t > b) for (let i = 0; i < 4; i++) icon(g, "fx_sparkle", 520 + i * 80, 260 + Math.sin(i * 2) * 40, 3, 0.5 + 0.5 * Math.sin(t * 8 + i), Math.floor(t * 8 + i));
    for (let i = 0; i < 16; i++) {
      const u = ((t - a) * 0.4 + rnd(i)) % 1;
      flower(g, rnd(i + 3) * W + Math.sin(t + i) * 30, u * H, 8, "#f6b3c0", "#fff", 5, t * 2 + i);
    }
    glyph(g, "美眷", 180, 330, 120, seg(t, b, b + 0.3), { color: C.red, alpha: 0.7, vertical: true });
  },
};

// ============ 第八镜：我 / 浪迹 / 天涯 ============
const s8: Shot = {
  id: "08", t0: L0(7), t1: L0(8), line: 7,
  draw(g, t) {
    const a = W0(7, 0), b = W0(7, 1), c = W0(7, 2);
    const far = ss(seg(t, c - 0.1, c + 0.6));
    if (far < 1) {
      g.save();
      g.globalAlpha = 1 - far;
      paper(g, "#dfe3e0", "#b9c2c2");
      const scroll = Math.max(0, t - b) * 260;
      mountains(g, 380, 120, 0.7, "rgba(80,96,104,0.35)", scroll * 0.2);
      mountains(g, 450, 90, 2.9, "rgba(50,66,76,0.55)", scroll * 0.5);
      g.fillStyle = "#8e9a98";
      g.fillRect(0, 580, W, 140);
      // 浪迹：脚印化作浪
      if (t > b) {
        for (let i = 0; i < 14; i++) {
          const x = 560 - i * 70 + (scroll % 70);
          const age = i * 70 - (scroll % 70);
          const k = clamp(age / 300);
          g.save();
          g.fillStyle = `rgba(30,40,50,${0.5 * (1 - k)})`;
          g.beginPath();
          g.ellipse(x, 615 + (i % 2) * 14, 9, 5, 0, 0, TAU);
          g.fill();
          g.strokeStyle = `rgba(40,90,130,${0.85 * k * (1 - k * 0.3)})`;
          g.lineWidth = 4;
          g.beginPath();
          const wx = x;
          const wy = 615 + (i % 2) * 14;
          g.arc(wx, wy, 12 + k * 18, Math.PI, Math.PI * 1.85);
          g.arc(wx + 14 + k * 18, wy - 4, 7, Math.PI * 1.1, Math.PI * 0.2, true);
          g.stroke();
          g.restore();
        }
      }
      wordInk(g, t, 7, 0, 300, 250, 280, { alpha: 0.14 });
      shadow(g, 640, 622, 70, 0.25);
      if (t < b) actor(g, "act_whale_sad", t - a, 640, 622, 3, { fps: 6, flip: true });
      else actor(g, "walk_whale", t - b, 640, 622, 3, { fps: 10 });
      glyph(g, "浪迹", 980, 250, 140, seg(t, b, b + 0.35), { color: "#284a66", alpha: 0.8 });
      g.restore();
    }
    if (far > 0) {
      g.save();
      g.globalAlpha = far;
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#2f3f5c");
      sky.addColorStop(0.55, "#d98a5c");
      sky.addColorStop(1, "#f2c48a");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,230,180,0.95)";
      g.beginPath();
      g.arc(360, 470 + (t - c) * 12, 70, 0, TAU);
      g.fill();
      mountains(g, 600, 50, 5.2, "rgba(120,70,60,0.5)");
      // 崖
      g.fillStyle = "#1e1a1f";
      g.beginPath();
      g.moveTo(760, H);
      g.lineTo(790, 560);
      g.quadraticCurveTo(880, 520, 1010, 528);
      g.lineTo(1040, 560);
      g.lineTo(1280, 540);
      g.lineTo(W, H);
      g.fill();
      actor(g, "act_whale_idle", t - c, 900, 530, 1.1, { fps: 5, flip: true, tint: "#1e1a1f", ta: 0.75 });
      for (let i = 0; i < 7; i++) {
        const k = Math.abs(i - 3);
        goose(g, 700 - (t - c) * 80 - i * 36, 200 + k * 22, 10, t * 8 + i, "#2a2022");
      }
      glyph(g, "天涯", 200, 250, 120, seg(t, c + 0.1, c + 0.5), { color: "#fff1dc", alpha: 0.9, vertical: true });
      g.restore();
    }
  },
};

// ============ 第九镜：为我 / 泡杯 / 花茶 ============
const s9: Shot = {
  id: "09", t0: L0(8), t1: L0(9), line: 8,
  draw(g, t) {
    const a = W0(8, 0), b = W0(8, 1), c = W0(8, 2);
    const cu = ss(seg(t, c - 0.1, c + 0.3));
    paper(g, "#f3dfbd", "#d6ae7c");
    g.save();
    camera(g, lerp(640, 640, cu), lerp(360, 470, cu), lerp(1, 2.6, cu));
    // 屋内
    lattice(g, 120, 90, 260, 220, 0.6);
    pipa(g, 1080, 210, 80, 0.2);
    g.fillStyle = C.wood;
    g.fillRect(250, 520, 780, 30);
    g.fillRect(300, 550, 26, 170);
    g.fillRect(954, 550, 26, 170);
    actor(g, "act_whale_idle", t - a, 330, 530, 2.6, { fps: 6 });
    actor(g, "act_claude_tilt", t - a, 960, 530, 2.6, { fps: 6 });
    // 为我：茶壶自己浮起
    const lift = eo(seg(t, a, a + 0.45));
    const tilt = -ss(seg(t, b, b + 0.3)) * 0.75;
    const px = 760, py = lerp(500, 380, lift) + Math.sin(t * 3) * 4;
    teapot(g, px, py, 46, tilt);
    if (lift > 0) icon(g, "fx_sparkle", px - 60, py - 50, 2.5, 1, Math.floor(t * 8));
    // 泡杯
    const fillU = seg(t, b + 0.15, c + 0.5);
    pour(g, px + 70, py - 30, 640, 470, seg(t, b + 0.1, b + 0.3) * (1 - seg(t, c + 0.5, c + 0.7)), t);
    glassCup(g, 640, 520, 40, fillU, seg(t, c, c + 0.9));
    if (fillU > 0.2) steam(g, 640, 460, t, fillU * (1 - cu * 0.3), 0.5);
    g.restore();
    wordInk(g, t, 8, 0, 640, 140, 140, { alpha: 0.16 });
    glyph(g, "泡杯", 1100, 420, 110, seg(t, b, b + 0.3), { color: C.wood, alpha: 0.6 * (1 - cu), vertical: true });
    glyph(g, "花茶", 1120, 330, 130, seg(t, c, c + 0.35), { color: "#fff6e2", stroke: C.wood, alpha: 0.95, vertical: true });
    if (cu > 0.5) heart(g, 640, 160 - (t - c) * 40, 26, "rgba(255,255,255,0.7)");
  },
};

// ============ 第十镜：和你 / 有些 / 不搭 ============
const s10: Shot = {
  id: "10", t0: L0(9), t1: L0(10), line: 9,
  draw(g, t) {
    const a = W0(9, 0), b = W0(9, 1), c = W0(9, 2);
    const pz = ss(seg(t, b - 0.1, b + 0.25));
    // 斜劈两半
    g.save();
    g.fillStyle = "#3c4a56";
    g.fillRect(0, 0, W, H);
    rain(g, t, 0.5);
    g.beginPath();
    g.moveTo(W, 0);
    g.lineTo(W, H);
    g.lineTo(lerp(840, 720, eo(seg(t, a, a + 0.3))), H);
    g.lineTo(lerp(440, 560, eo(seg(t, a, a + 0.3))), 0);
    g.closePath();
    g.clip();
    paper(g, "#fbe3e6", "#f1bfc8");
    for (let i = 0; i < 6; i++) flower(g, 760 + rnd(i) * 520, 80 + rnd(i + 5) * 560, 22, "#f7a7b8", C.gold, 5, t + i);
    g.restore();
    g.strokeStyle = C.ink;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(lerp(440, 560, eo(seg(t, a, a + 0.3))), 0);
    g.lineTo(lerp(840, 720, eo(seg(t, a, a + 0.3))), H);
    g.stroke();
    if (pz < 1) {
      g.save();
      g.globalAlpha = 1 - pz;
      actor(g, "act_whale_sad", t - a, 330, 640, 3, { fps: 6, tint: "#2a4060", ta: 0.2 });
      actor(g, "act_claude_hop", t - a, 980, 640, 3, { fps: 8 });
      wordInk(g, t, 9, 0, 640, 160, 150, { alpha: 0.5, color: C.ink });
      g.restore();
    }
    if (pz > 0) {
      g.fillStyle = `rgba(239,230,210,${pz * 0.92})`;
      g.fillRect(0, 0, W, H);
      // 拼图：两块都是凸起，怎么也对不上
      const meet = eo(seg(t, b, c + 0.05));
      const bounce = t > c + 0.05 ? eo(seg(t, c + 0.05, c + 0.5)) : 0;
      const gap = lerp(330, 150, meet) + bounce * 120;
      const jit = t > c && t < c + 0.25 ? Math.sin(t * 90) * 8 : 0;
      g.save();
      g.globalAlpha = pz;
      const lx = 640 - gap - 20 + jit, rx = 640 + gap + 20 - jit;
      g.save();
      g.translate(lx, 380);
      g.rotate(-bounce * 0.25);
      puzzle(g, 0, 0, 110, "tab", "#9fc0d8");
      icon(g, "p_whale_neutral", -10, 0, 2.6);
      g.restore();
      g.save();
      g.translate(rx, 380);
      g.rotate(bounce * 0.25);
      g.scale(-1, 1);
      puzzle(g, 0, 0, 110, "tab", "#f2b8c4");
      g.scale(-1, 1);
      icon(g, "p_claude_neutral", 10, 0, 2.6);
      g.restore();
      // 裂缝
      const cr = seg(t, c + 0.05, c + 0.3);
      if (cr > 0) {
        g.strokeStyle = C.ink;
        g.lineWidth = 4;
        g.beginPath();
        const pts = [[640, 200], [620, 270], [660, 330], [628, 400], [652, 470], [636, 560]];
        pts.slice(0, 1 + Math.floor(cr * 5)).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.stroke();
        icon(g, "fx_question", lx, 220, 3.5, cr);
        icon(g, "fx_question", rx, 220, 3.5, cr);
      }
      glyph(g, "有些", 640, 110, 90, seg(t, b, b + 0.3), { color: C.ink2, alpha: 0.8 * (1 - seg(t, c, c + 0.2)) });
      if (t > c) {
        const k = back(seg(t, c, c + 0.3));
        g.save();
        g.translate(640, 620);
        g.scale(k, k);
        glyph(g, "不搭", 0, 0, 110, 1, { color: C.red, alpha: 0.95 });
        g.restore();
      }
      g.restore();
    }
  },
};

// ============ 第十一镜：气氛 / 开始 / 有一点 / 尴尬 ============
const s11: Shot = {
  id: "11", t0: L0(10), t1: 30.14, line: 10,
  draw(g, t) {
    const a = W0(10, 0), b = W0(10, 1), c = W0(10, 2), d = W0(10, 3);
    const z = lerp(1, 1.18, ss(seg(t, a, 29.4)));
    const freeze = seg(t, 29.35, 29.7);
    const tt = t > 29.4 ? 29.4 : t; // 定格：人物停在这一帧
    paper(g, "#e9dcc2", "#cdb48c");
    g.save();
    camera(g, 640, 420, z);
    // 墙与窗
    wall(g, 0, W, 0, 520, "#e6d7bc");
    g.fillStyle = C.wood2;
    g.fillRect(0, 500, W, 20);
    lattice(g, 500, 80, 280, 200, 0.5);
    g.save();
    g.beginPath();
    g.rect(500, 80, 280, 200);
    g.clip();
    // 窗外看热闹的哈基米
    actor(g, "act_gemini_lookaround", tt - a, 640, 330 - eo(seg(t, a + 0.6, a + 1.2)) * 70, 2, { fps: 6 });
    // 开始：一只乌鸦慢慢飞过
    if (t > b) crow(g, lerp(460, 820, seg(t, b, b + 1.6)), 130 + Math.sin(t * 3) * 6, 14, tt * 9);
    g.restore();
    pipa(g, 200, 220, 70, -0.25);
    g.fillStyle = "#cdb48c";
    g.fillRect(0, 520, W, 200);
    // 桌
    g.fillStyle = C.wood;
    g.beginPath();
    g.ellipse(640, 560, 240, 46, 0, 0, TAU);
    g.fill();
    g.fillRect(620, 560, 40, 130);
    teapot(g, 640, 516, 26, 0);
    glassCup(g, 560, 552, 18, 0.6, 1);
    glassCup(g, 720, 552, 18, 0.6, 1);
    actor(g, t > d ? "act_whale_nod" : "act_whale_idle", tt - a, 330, 640, 2.7, { fps: t > d ? 4 : 6 });
    actor(g, t > d ? "act_claude_sad" : "act_claude_tilt", tt - a, 950, 640, 2.7, { fps: 5 });
    // 角落里睡着的阔耳狐
    actor(g, "act_zai_doze", tt - a, 1150, 680, 1.6, { fps: 5 });
    icon(g, "fx_zzz", 1185, 520, 2.5, 1, Math.floor(tt * 3));
    g.restore();
    // 气氛：灰雾漫上来
    const fog = ss(seg(t, a, a + 1.4));
    for (let k = 0; k < 4; k++) {
      g.save();
      g.fillStyle = `rgba(150,150,160,${0.13 * fog})`;
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, H - fog * (180 + k * 70) + Math.sin(x / 90 + tt * (0.8 + k * 0.3) + k) * 18);
      g.lineTo(W, H);
      g.fill();
      g.restore();
    }
    wordInk(g, t, 10, 0, 640, 360, 300, { alpha: 0.14 });
    // 有一点：头顶一个点、两个点、三个点
    const dots = [c, c + 0.38, c + 0.76];
    for (const [hx, hy] of [[390, 300], [1010, 300]]) {
      dots.forEach((dt, i) => {
        const k = back(seg(t, dt, dt + 0.2));
        if (k <= 0) return;
        g.fillStyle = C.ink;
        g.beginPath();
        g.arc(hx - 40 + i * 40, hy - 90, 11 * k, 0, TAU);
        g.fill();
      });
    }
    // 尴尬
    if (t > d) {
      const k = seg(t, d, d + 0.3);
      icon(g, "fx_sweat", 420, 360, 4, k);
      icon(g, "fx_sweat", 1040, 360, 4, k);
      icon(g, "fx_question", 980, 250, 3, seg(t, d + 0.4, d + 0.6));
      const jit = (i: number) => (t < 29.4 ? Math.sin(t * 50 + i * 3) * 3 : 0);
      ["尴", "尬"].forEach((ch, i) => {
        const p = back(seg(t, d + i * 0.15, d + 0.35 + i * 0.15));
        if (p <= 0) return;
        g.save();
        g.translate(560 + i * 160 + jit(i), 345 + jit(i + 5));
        g.rotate(i ? 0.08 : -0.06);
        g.scale(p, p);
        glyph(g, ch, 0, 0, 150, 1, { color: "#3b4a5a", stroke: "#f3eadb", alpha: 0.95 });
        g.restore();
      });
    }
    // 定格成一幅墨画
    if (freeze > 0) {
      g.save();
      g.globalCompositeOperation = "saturation";
      g.fillStyle = `rgba(128,128,128,${freeze * 0.85})`;
      g.fillRect(0, 0, W, H);
      g.restore();
      g.fillStyle = `rgba(239,230,210,${freeze * 0.25})`;
      g.fillRect(0, 0, W, H);
      seal(g, "浪人琵琶", 1130, 600, 110, seg(t, 29.45, 29.8), -0.06);
    }
  },
};

function lerpCol(a: string, b: string, u: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(u)))).join(",")})`;
}

export const SHOTS: Shot[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11];
export { W, H };
