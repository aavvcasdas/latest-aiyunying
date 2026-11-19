// 五块布景，全部用代码画（不生成、不引用任何背景图片）。
// 世界坐标：地平线 y=560，角色脚底大约在 y=600–640。
import {
  C, G, Cam, H, W, TAU, TONES, ToneName, blossomTree, clamp, disc, glow, htext, lantern, layer, moon, mountains, paper, rnd, rr, span,
  umbrellaClosed, willow,
} from "./core";

export function sky(g: G, c: Cam, tone: ToneName, seed = 0) {
  paper(g, tone);
  const T = TONES[tone];
  layer(g, c, 0.12, () => {
    const [a, b] = span(c, 0.12);
    mountains(g, 1.3 + seed, a, b, 440, 180, T.mt, T.dark ? 0.32 : 0.4);
  });
  layer(g, c, 0.3, () => {
    const [a, b] = span(c, 0.3);
    mountains(g, 4.1 + seed, a, b, 500, 120, T.mt, T.dark ? 0.5 : 0.62);
  });
}

export function ground(g: G, c: Cam, tone: ToneName, y = 560) {
  const T = TONES[tone];
  const [a, b] = span(c, 1);
  const gr = g.createLinearGradient(0, y, 0, y + 200);
  gr.addColorStop(0, T.ground);
  gr.addColorStop(1, T.ground2);
  g.fillStyle = gr;
  g.fillRect(a - 200, y, b - a + 400, 600);
  g.strokeStyle = T.dark ? "rgba(200,215,245,0.2)" : "rgba(60,40,20,0.32)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(a - 200, y);
  g.lineTo(b + 200, y);
  g.stroke();
  // 草
  g.strokeStyle = T.dark ? "rgba(150,175,220,0.3)" : "rgba(80,100,60,0.5)";
  g.lineWidth = 1.6;
  for (let i = Math.floor(a / 70); i <= Math.ceil(b / 70); i++) {
    const x = i * 70 + rnd(i * 1.7) * 50, yy = y + 8 + rnd(i * 2.9) * 120;
    for (let j = -1; j <= 1; j++) {
      g.beginPath();
      g.moveTo(x, yy);
      g.lineTo(x + j * 5, yy - 9 - rnd(i + j) * 6);
      g.stroke();
    }
  }
}

function roof(g: G, x0: number, x1: number, y: number, th: number, col: string, tile: string) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x0 - 52, y + th - 6);
  g.quadraticCurveTo(x0 - 6, y + th - 10, x0 + 14, y);
  g.lineTo(x1 - 14, y);
  g.quadraticCurveTo(x1 + 6, y + th - 10, x1 + 52, y + th - 6);
  g.lineTo(x1 + 44, y + th + 12);
  g.lineTo(x0 - 44, y + th + 12);
  g.closePath();
  g.fill();
  g.fillRect(x0 + 6, y - 10, x1 - x0 - 12, 13);
  g.strokeStyle = tile;
  g.lineWidth = 2;
  const mid = (x0 + x1) / 2;
  for (let x = x0 + 26; x < x1 - 20; x += 24) {
    g.beginPath();
    g.moveTo(x, y + 5);
    g.lineTo(x + (x - mid) * 0.16, y + th + 6);
    g.stroke();
  }
}

// ---------- 一：茶舍外景 ----------
export interface HouseOpt {
  t: number;
  tone: ToneName;
  door?: number; // 门开了几成
  glow?: number; // 屋里的灯
  lantern?: number; // 檐下灯笼（不传 = 没挂）
  umb?: boolean; // 门边靠着那把花伞
  win?: (g: G) => void; // 圆窗里的内容
  tree?: boolean;
}
export const WIN = { x: 360, y: 402, r: 66 };
export function house(g: G, c: Cam, o: HouseOpt) {
  const T = TONES[o.tone], t = o.t, gl = o.glow ?? 0;
  sky(g, c, o.tone);
  layer(g, c, 1, () => {
    ground(g, c, o.tone);
    // 出门的那条路
    g.fillStyle = T.dark ? "rgba(200,215,245,0.07)" : "rgba(255,249,232,0.55)";
    g.beginPath();
    g.moveTo(110, 584);
    g.bezierCurveTo(520, 590, 900, 610, 2600, 610);
    g.lineTo(2600, 690);
    g.bezierCurveTo(900, 690, 520, 640, 110, 610);
    g.fill();
    // 墙
    g.fillStyle = T.wall;
    g.fillRect(40, 262, 430, 298);
    g.fillStyle = T.dark ? "#182040" : "#b9ab90";
    g.fillRect(40, 528, 430, 32);
    g.strokeStyle = T.roof;
    g.lineWidth = 3;
    g.strokeRect(40, 262, 430, 298);
    // 圆窗
    const { x: wx, y: wy, r: wr } = WIN;
    g.save();
    g.beginPath();
    g.arc(wx, wy, wr, 0, TAU);
    g.clip();
    g.fillStyle = T.dark ? "#121a34" : "#e6d8b8";
    g.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
    if (gl > 0) {
      g.fillStyle = `rgba(255,198,112,${gl})`;
      g.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
    }
    o.win?.(g);
    g.restore();
    g.strokeStyle = C.wood;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(wx, wy, wr, 0, TAU);
    g.stroke();
    if (gl > 0 && T.dark) glow(g, wx, wy, 190, "255,190,110", 0.3 * gl);
    // 门
    const dx = 108, dw = 116, dy = 348, dh = 212, op = clamp(o.door ?? 0);
    g.fillStyle = T.dark ? "#090e1e" : "#4a3a2c";
    g.fillRect(dx, dy, dw, dh);
    if (gl > 0) {
      g.fillStyle = `rgba(255,198,112,${gl * 0.9})`;
      g.fillRect(dx, dy, dw, dh);
    }
    const lw = (dw / 2) * (1 - op);
    g.fillStyle = C.wood;
    g.fillRect(dx, dy, lw, dh);
    g.fillRect(dx + dw - lw, dy, lw, dh);
    g.strokeStyle = "rgba(30,18,10,0.5)";
    g.lineWidth = 2;
    if (lw > 12) {
      g.strokeRect(dx + 6, dy + 10, lw - 12, dh - 20);
      g.strokeRect(dx + dw - lw + 6, dy + 10, lw - 12, dh - 20);
    }
    g.strokeStyle = T.roof;
    g.lineWidth = 7;
    g.strokeRect(dx, dy, dw, dh);
    if (gl > 0 && op > 0 && T.dark) glow(g, dx + dw / 2, 560, 200, "255,190,110", 0.22 * gl * op);
    // 檐
    roof(g, 40, 470, 200, 70, T.roof, T.dark ? "rgba(120,140,190,0.25)" : "rgba(240,230,210,0.2)");
    if (o.tone === "snow") {
      g.fillStyle = "#e9eef8";
      g.fillRect(46, 186, 418, 8);
    }
    // 石阶
    g.fillStyle = T.dark ? "#27304e" : C.stone;
    g.fillRect(92, 560, 148, 12);
    g.fillStyle = T.dark ? "#1d2540" : "#8f8572";
    g.fillRect(80, 572, 172, 12);
    if (o.lantern !== undefined) lantern(g, 268, 286, 1.15, t, o.lantern, 1);
    if (o.umb) umbrellaClosed(g, 296, 578, 1.05, -0.2);
    if (o.tree !== false) blossomTree(g, 650, 572, 1.2, -1, t, T.dark ? "#a77c98" : C.pink, T.dark ? "#0a0e1c" : "#3a2a22", 3);
  });
}

// ---------- 二：茶舍内景 ----------
export interface RoomOpt {
  t: number;
  tone: "day" | "dusk" | "night" | "dawn";
  win?: (g: G) => void;
  table?: boolean;
  umb?: boolean;
  lamp?: number;
}
export const RWIN = { x: 850, y: 296, r: 174 };
export function room(g: G, c: Cam, o: RoomOpt) {
  const dark = o.tone === "night";
  paper(g, dark ? "night" : o.tone);
  g.fillStyle = dark ? "rgba(52,40,50,0.72)" : o.tone === "dusk" ? "rgba(214,170,120,0.35)" : "rgba(226,206,160,0.42)";
  g.fillRect(0, 0, W, H);
  layer(g, c, 0.86, () => {
    const { x: wx, y: wy, r: wr } = RWIN;
    // 月洞窗
    g.save();
    g.beginPath();
    g.arc(wx, wy, wr, 0, TAU);
    g.clip();
    const sk = g.createLinearGradient(0, wy - wr, 0, wy + wr);
    if (dark) {
      sk.addColorStop(0, "#0d1632");
      sk.addColorStop(1, "#24386a");
    } else if (o.tone === "dusk") {
      sk.addColorStop(0, "#f0b98a");
      sk.addColorStop(1, "#f6e2bd");
    } else {
      sk.addColorStop(0, "#fbf6e6");
      sk.addColorStop(1, "#f3e6c8");
    }
    g.fillStyle = sk;
    g.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
    if (o.win) o.win(g);
    else {
      mountains(g, 2.2, wx - wr, wx + wr, wy + 110, 90, dark ? "120,150,200" : "100,116,120", 0.4);
      plumBranch(g, wx - wr - 10, wy - 60, o.t, dark);
    }
    g.restore();
    g.strokeStyle = dark ? "#2a1c18" : C.wood;
    g.lineWidth = 16;
    g.beginPath();
    g.arc(wx, wy, wr, 0, TAU);
    g.stroke();
    g.strokeStyle = dark ? "#4a3428" : C.wood2;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(wx, wy, wr - 13, 0, TAU);
    g.stroke();
    // 挂轴
    g.fillStyle = dark ? "#b9ae9c" : "#faf4e4";
    g.fillRect(300, 120, 104, 300);
    g.save();
    g.beginPath();
    g.rect(300, 120, 104, 300);
    g.clip();
    mountains(g, 7.7, 300, 404, 330, 120, "50,50,50", 0.55);
    disc(g, 372, 172, 12, "rgba(181,53,43,0.75)");
    g.restore();
    g.fillStyle = C.wood;
    g.fillRect(292, 112, 120, 10);
    g.fillRect(292, 418, 120, 10);
    // 门洞
    g.fillStyle = dark ? "#0e1730" : o.tone === "dusk" ? "#f6d9aa" : "#fdf8ea";
    g.fillRect(48, 176, 150, 400);
    g.strokeStyle = dark ? "#2a1c18" : C.wood;
    g.lineWidth = 12;
    g.strokeRect(48, 176, 150, 420);
    // 墙裙
    g.fillStyle = dark ? "rgba(20,12,10,0.4)" : "rgba(107,70,48,0.2)";
    g.fillRect(-400, 470, W + 800, 220);
    if (o.lamp) glow(g, 660, 470, 420, "255,190,110", 0.34 * o.lamp);
  });
  layer(g, c, 1, () => {
    const fl = g.createLinearGradient(0, 560, 0, 760);
    fl.addColorStop(0, dark ? "#3a2a24" : "#a17650");
    fl.addColorStop(1, dark ? "#1f1612" : "#74502f");
    g.fillStyle = fl;
    g.fillRect(-500, 560, W + 1000, 500);
    g.strokeStyle = "rgba(30,18,10,0.35)";
    g.lineWidth = 2;
    for (let i = -9; i <= 9; i++) {
      g.beginPath();
      g.moveTo(W / 2 + i * 96, 560);
      g.lineTo(W / 2 + i * 168, 800);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(-500, 560);
    g.lineTo(W + 500, 560);
    g.stroke();
    if (o.umb) umbrellaClosed(g, 196, 610, 1.2, -0.17);
    if (o.table !== false) {
      g.fillStyle = "rgba(20,12,8,0.25)";
      g.beginPath();
      g.ellipse(660, 628, 150, 12, 0, 0, TAU);
      g.fill();
      g.fillStyle = dark ? "#3f2a20" : C.wood;
      g.fillRect(540, 568, 14, 58);
      g.fillRect(766, 568, 14, 58);
      g.fillStyle = dark ? "#55392a" : C.wood2;
      rr(g, 520, 552, 280, 18, 4);
      g.fill();
      g.fillStyle = "rgba(30,18,10,0.35)";
      g.fillRect(534, 570, 252, 6);
    }
  });
}
export function plumBranch(g: G, x: number, y: number, t: number, dark = false) {
  g.save();
  g.strokeStyle = dark ? "#05070f" : "#2e221c";
  g.lineCap = "round";
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(x, y);
  g.bezierCurveTo(x + 90, y - 30, x + 150, y + 30, x + 250, y - 20);
  g.stroke();
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(x + 120, y + 4);
  g.quadraticCurveTo(x + 160, y + 60, x + 210, y + 70);
  g.stroke();
  g.beginPath();
  g.moveTo(x + 180, y - 6);
  g.quadraticCurveTo(x + 200, y - 60, x + 250, y - 80);
  g.stroke();
  for (let i = 0; i < 18; i++) {
    const u = rnd(i * 1.9);
    const px = x + 40 + u * 220, py = y - 20 + Math.sin(u * 6) * 26 + (rnd(i * 3.7) - 0.5) * 90;
    disc(g, px, py, 7 + rnd(i * 5.3) * 6 + Math.sin(t + i) * 0.8, i % 3 ? (dark ? "#a77c98" : C.pink) : C.pink2);
  }
  g.restore();
}

// ---------- 三：夜市 / 酒肆「忘归楼」 ----------
export interface StreetOpt {
  t: number;
  tone: "night" | "rain" | "snow";
}
export const TAVERN = { x0: 1000, x1: 1560, door: 1280 };
export function street(g: G, c: Cam, o: StreetOpt) {
  const T = TONES[o.tone], t = o.t;
  sky(g, c, o.tone, 2);
  layer(g, c, 0.06, () => moon(g, 1000, 150, 40));
  layer(g, c, 0.5, () => {
    const [a, b] = span(c, 0.5);
    for (let i = Math.floor(a / 190) - 1; i <= Math.ceil(b / 190); i++) {
      const x = i * 190 + rnd(i * 2.3) * 40, h = 150 + rnd(i * 3.1) * 110, w = 150;
      g.fillStyle = o.tone === "snow" ? "#1a2442" : "#0a1026";
      g.fillRect(x, 580 - h, w, h);
      roof(g, x, x + w, 580 - h - 30, 34, g.fillStyle as string, "rgba(0,0,0,0)");
      if (rnd(i * 7.7) > 0.35) {
        g.fillStyle = `rgba(243,200,120,${0.35 + rnd(i * 5.1) * 0.4})`;
        g.fillRect(x + 30 + rnd(i) * 50, 580 - h + 40, 22, 28);
      }
    }
  });
  layer(g, c, 1, () => {
    ground(g, c, o.tone);
    // 石板路
    g.fillStyle = o.tone === "snow" ? "rgba(255,255,255,0.25)" : "rgba(200,215,245,0.06)";
    const [a, b] = span(c, 1);
    g.fillRect(a - 100, 592, b - a + 200, 80);
    // 酒摊
    g.fillStyle = "#3a2418";
    g.fillRect(236, 380, 8, 180);
    g.fillRect(452, 380, 8, 180);
    g.fillStyle = "#7c2a22";
    g.beginPath();
    g.moveTo(214, 392);
    g.lineTo(482, 392);
    g.lineTo(470, 360);
    g.lineTo(226, 360);
    g.closePath();
    g.fill();
    g.fillStyle = C.gold;
    for (let x = 222; x < 480; x += 22) {
      g.beginPath();
      g.moveTo(x, 392);
      g.lineTo(x + 11, 404);
      g.lineTo(x + 22, 392);
      g.fill();
    }
    g.fillStyle = "#5a3a26";
    g.fillRect(240, 496, 216, 64);
    g.fillStyle = "#7a5236";
    g.fillRect(232, 486, 232, 12);
    for (const [jx, jr] of [[276, 20], [322, 24], [500, 26], [546, 20]]) {
      const base = jx > 470 ? 560 : 486;
      g.fillStyle = "#2a1c1a";
      g.beginPath();
      g.ellipse(jx, base - jr, jr, jr * 1.05, 0, 0, TAU);
      g.fill();
      g.fillStyle = C.red;
      g.fillRect(jx - jr * 0.5, base - jr * 2.1, jr, 7);
    }
    lantern(g, 252, 392, 1, t, 1, 4);
    glow(g, 350, 500, 240, "255,170,90", 0.16);
    // 酒旗
    g.fillStyle = "#3a2418";
    g.fillRect(598, 300, 6, 260);
    const fw = Math.sin(t * 1.6) * 4;
    g.fillStyle = "#8a2f25";
    g.beginPath();
    g.moveTo(604, 306);
    g.lineTo(662 + fw, 310);
    g.lineTo(660 + fw * 1.6, 384);
    g.lineTo(604, 380);
    g.closePath();
    g.fill();
    htext(g, "酒", 632 + fw * 0.6, 346, 44, C.gold2);
    // 忘归楼
    const { x0, x1, door } = TAVERN;
    g.fillStyle = "#241a30";
    g.fillRect(x0, 250, x1 - x0, 310);
    // 二层窗
    for (let i = 0; i < 5; i++) {
      const x = x0 + 44 + i * 100;
      g.fillStyle = `rgba(255,196,110,${0.75 + 0.15 * Math.sin(t * 2 + i)})`;
      g.fillRect(x, 276, 72, 70);
      g.strokeStyle = "#241a30";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + 24, 276);
      g.lineTo(x + 24, 346);
      g.moveTo(x + 48, 276);
      g.lineTo(x + 48, 346);
      g.moveTo(x, 311);
      g.lineTo(x + 72, 311);
      g.stroke();
    }
    // 腰檐与栏杆
    roof(g, x0 - 10, x1 + 10, 352, 30, "#0b0f20", "rgba(120,140,190,0.2)");
    // 一层：门与窗
    g.fillStyle = "rgba(255,200,116,0.95)";
    g.fillRect(door - 86, 412, 172, 148);
    for (const wx of [x0 + 40, x0 + 120, x1 - 190, x1 - 110]) {
      g.fillStyle = "rgba(255,196,110,0.7)";
      g.fillRect(wx, 430, 66, 86);
      g.strokeStyle = "#241a30";
      g.lineWidth = 4;
      g.strokeRect(wx + 12, 442, 42, 62);
      g.beginPath();
      g.moveTo(wx + 33, 430);
      g.lineTo(wx + 33, 516);
      g.stroke();
    }
    g.fillStyle = "#3a2418";
    g.fillRect(door - 96, 404, 10, 156);
    g.fillRect(door + 86, 404, 10, 156);
    // 门帘（半卷）
    g.fillStyle = "#8a2f25";
    for (let i = 0; i < 4; i++) g.fillRect(door - 84 + i * 43, 412, 40, 34 + (i % 2) * 8 + Math.sin(t * 1.4 + i) * 3);
    // 匾
    g.fillStyle = "#1a100c";
    rr(g, door - 92, 392 - 44, 184, 46, 5);
    g.fill();
    g.strokeStyle = C.gold;
    g.lineWidth = 2;
    g.stroke();
    htext(g, "忘归楼", door, 392 - 20, 34, C.gold2);
    // 顶檐
    roof(g, x0 - 6, x1 + 6, 214, 40, "#070b18", "rgba(120,140,190,0.22)");
    if (o.tone === "snow") {
      g.fillStyle = "#e9eef8";
      g.fillRect(x0, 202, x1 - x0, 7);
    }
    for (let i = 0; i < 7; i++) lantern(g, x0 + 40 + i * 80, 394, 0.95, t, 1, i * 1.3);
    glow(g, door, 590, 330, "255,180,100", 0.24);
    g.fillStyle = T.dark ? "#27304e" : C.stone;
    g.fillRect(door - 110, 560, 220, 10);
    // 远处的柳
    g.fillStyle = "#070b18";
    g.fillRect(1820, 300, 14, 260);
    willow(g, 1826, 250, t, 16, 250, "rgba(110,150,130,0.55)", 5);
  });
}

// ---------- 四：月下河岸 ----------
export interface RiverOpt {
  t: number;
  tone: "night" | "snow" | "dawn";
  moonA?: number;
}
export const MOON = { x: 900, y: 214, r: 112 };
export function river(g: G, c: Cam, o: RiverOpt) {
  const T = TONES[o.tone], t = o.t;
  sky(g, c, o.tone, 5);
  layer(g, c, 0.06, () => moon(g, MOON.x, MOON.y, MOON.r, o.moonA ?? 1));
  layer(g, c, 0.5, () => {
    const [a, b] = span(c, 0.5);
    const wg = g.createLinearGradient(0, 470, 0, 640);
    wg.addColorStop(0, T.dark ? "rgba(20,34,70,0.9)" : "rgba(214,214,208,0.9)");
    wg.addColorStop(1, T.dark ? "rgba(8,14,34,0.95)" : "rgba(190,196,198,0.9)");
    g.fillStyle = wg;
    g.fillRect(a - 100, 470, b - a + 200, 300);
    for (let i = 0; i < 30; i++) {
      const y = 478 + i * 5.2, w = (26 + rnd(i * 1.3) * 120) * (0.4 + i / 30);
      const x = 760 + (rnd(i * 2.9) - 0.5) * (80 + i * 9) + Math.sin(t * 1.2 + i) * 8;
      g.fillStyle = `rgba(247,226,170,${(0.5 - i * 0.012) * (o.moonA ?? 1)})`;
      g.fillRect(x - w / 2, y, w, 2);
    }
  });
  layer(g, c, 0.8, () => {
    // 拱桥
    g.fillStyle = T.dark ? "#0a1026" : "#6a6a72";
    g.beginPath();
    g.moveTo(700, 560);
    g.quadraticCurveTo(1000, 380, 1300, 560);
    g.lineTo(1300, 600);
    g.lineTo(1150, 600);
    g.quadraticCurveTo(1000, 440, 850, 600);
    g.lineTo(700, 600);
    g.closePath();
    g.fill();
    g.strokeStyle = g.fillStyle;
    g.lineWidth = 4;
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, x = 730 + u * 540, y = 560 - Math.sin(u * Math.PI) * 88 - 12;
      g.beginPath();
      g.moveTo(x, y + 14);
      g.lineTo(x, y - 12);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(722, 548);
    g.quadraticCurveTo(1000, 370, 1278, 548);
    g.stroke();
  });
  layer(g, c, 1, () => {
    const [a, b] = span(c, 1);
    const gr = g.createLinearGradient(0, 580, 0, 760);
    gr.addColorStop(0, T.ground);
    gr.addColorStop(1, T.ground2);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(a - 200, 600);
    g.bezierCurveTo(300, 572, 700, 600, 1000, 606);
    g.bezierCurveTo(1300, 612, 1500, 590, b + 200, 596);
    g.lineTo(b + 200, 1000);
    g.lineTo(a - 200, 1000);
    g.closePath();
    g.fill();
    // 柳
    g.strokeStyle = T.dark ? "#060a16" : "#3a2a22";
    g.lineWidth = 22;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(96, 600);
    g.bezierCurveTo(110, 420, 60, 300, 180, 150);
    g.stroke();
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(150, 190);
    g.quadraticCurveTo(260, 110, 380, 120);
    g.stroke();
    willow(g, 250, 120, t, 24, 330, T.dark ? "rgba(120,160,140,0.6)" : "rgba(90,120,80,0.7)", 9);
    // 芦苇
    g.strokeStyle = T.dark ? "rgba(150,175,220,0.4)" : "rgba(90,80,60,0.6)";
    g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const x = 1380 + i * 15 + rnd(i) * 10, sw = Math.sin(t * 1.1 + i * 0.5) * 8;
      g.beginPath();
      g.moveTo(x, 604);
      g.quadraticCurveTo(x + sw * 0.4, 560, x + sw, 520 - rnd(i * 2.3) * 40);
      g.stroke();
    }
    if (o.tone === "snow") {
      g.fillStyle = "rgba(240,244,252,0.55)";
      g.fillRect(a - 200, 598, b - a + 400, 10);
    }
  });
}

// ---------- 五：天涯路 ----------
export interface RoadOpt {
  t: number;
  tone: ToneName;
}
export function road(g: G, c: Cam, o: RoadOpt) {
  const T = TONES[o.tone];
  sky(g, c, o.tone, 9);
  if (T.dark) layer(g, c, 0.06, () => moon(g, 330, 150, 34, o.tone === "rain" ? 0.25 : 1));
  layer(g, c, 0.62, () => {
    const [a, b] = span(c, 0.62);
    for (let i = Math.floor(a / 430) - 1; i <= Math.ceil(b / 430); i++) {
      const x = i * 430 + rnd(i * 4.3) * 160, s = 0.8 + rnd(i * 6.1) * 0.5;
      const col = T.dark ? "rgba(8,12,28,0.75)" : "rgba(60,70,60,0.5)";
      g.strokeStyle = col;
      g.lineWidth = 10 * s;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x, 580);
      g.quadraticCurveTo(x + 14 * s, 480, x - 6 * s, 400 * (1 + (1 - s) * 0.3));
      g.stroke();
      for (let j = 0; j < 5; j++) {
        g.fillStyle = o.tone === "snow" && j % 2 ? "rgba(235,240,250,0.7)" : col;
        g.beginPath();
        g.ellipse(x - 6 * s + (rnd(i + j * 1.7) - 0.5) * 120 * s, 430 - j * 26 * s + rnd(i * j) * 30, 62 * s, 22 * s, 0, 0, TAU);
        g.fill();
      }
    }
  });
  layer(g, c, 1, () => {
    ground(g, c, o.tone);
    const [a, b] = span(c, 1);
    g.fillStyle = T.dark ? (o.tone === "snow" ? "rgba(255,255,255,0.3)" : "rgba(200,215,245,0.07)") : "rgba(255,249,232,0.55)";
    g.fillRect(a - 200, 596, b - a + 400, 78);
    for (let i = Math.floor(a / 900) - 1; i <= Math.ceil(b / 900); i++) {
      const x = i * 900 + 300;
      g.fillStyle = T.dark ? "#27304e" : C.stone;
      rr(g, x - 13, 548, 26, 44, 8);
      g.fill();
    }
  });
}
/** 路口的木牌 */
export function signpost(g: G, x: number, y: number, left: string, right: string, dark: boolean) {
  g.fillStyle = dark ? "#1a1420" : C.wood;
  g.fillRect(x - 5, y - 190, 10, 190);
  const board = (bx: number, by: number, s: string, dir: number) => {
    g.fillStyle = dark ? "#3a2c30" : C.wood2;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx + dir * 112, by);
    g.lineTo(bx + dir * 134, by + 20);
    g.lineTo(bx + dir * 112, by + 40);
    g.lineTo(bx, by + 40);
    g.closePath();
    g.fill();
    htext(g, s, bx + dir * 60, by + 21, 30, dark ? C.gold2 : "#f6ecd6");
  };
  board(x - 4, y - 182, left, -1);
  board(x + 4, y - 130, right, 1);
}
export { H };
