// 布景：每个布景 = 一套光照（Look）+ 往场景里添低多边形的 build()。全部按时间 T 算，不存状态。
import { blob, box, clamp, cone, drawSky, groundGrid, hash, hex, mix, prism, rgb, Scene, type Look, type RGB, type V3 } from './soft3d';

export const LOOKS = {
  night: { sky: ['#070b26', '#1d2a63', '#4e4f93'], fog: [58, 62, 118], fogNear: 10, fogFar: 70, light: [0.35, 0.8, -0.45], amb: 0.48, ground: [30, 46, 60] },
  bamboo: { sky: ['#050a1c', '#13284a', '#2f5568'], fog: [34, 66, 82], fogNear: 6, fogFar: 46, light: [0.4, 0.75, -0.5], amb: 0.42, ground: [18, 40, 38] },
  dusk: { sky: ['#2c2363', '#b8689a', '#ffc1a1'], fog: [236, 170, 170], fogNear: 12, fogFar: 80, light: [-0.5, 0.6, -0.4], amb: 0.62, ground: [120, 150, 110] },
  dawn: { sky: ['#6f9ae0', '#ffd0d8', '#fff1d8'], fog: [255, 226, 220], fogNear: 14, fogFar: 90, light: [0.6, 0.7, -0.3], amb: 0.66, ground: [140, 190, 120] },
  spring: { sky: ['#5fa6ee', '#a9dcf5', '#fff4e6'], fog: [230, 238, 240], fogNear: 16, fogFar: 100, light: [0.4, 0.85, 0.3], amb: 0.66, ground: [130, 196, 110] },
  sea: { sky: ['#060a24', '#16295e', '#3e5a92'], fog: [52, 76, 124], fogNear: 12, fogFar: 90, light: [0.2, 0.8, -0.6], amb: 0.5, ground: [210, 214, 220] },
  violet: { sky: ['#0d0626', '#3b1d63', '#9a4f8f'], fog: [110, 64, 120], fogNear: 10, fogFar: 70, light: [0.3, 0.8, -0.4], amb: 0.5, ground: [52, 40, 70] },
} satisfies Record<string, Look>;
export type LookId = keyof typeof LOOKS;

export type SetId = 'bamboo' | 'hill' | 'galaxy' | 'chime' | 'river' | 'stream' | 'bridge' | 'meadow' | 'window' | 'festival' | 'temple' | 'pond' | 'beach';
export interface SetCtx { T: number; pulse: number; k: number; hit: number; u: number }
export interface SetDef { look: LookId; sky: { stars?: number; galaxy?: number; moon?: { dir: V3; r: number; crescent?: boolean } | null }; build: (sc: Scene, c: SetCtx) => void }

const MOON: V3 = [0.35, 0.42, -0.84];
const near = (sc: Scene, x: number, z: number, r: number) => Math.hypot(x - sc.pos[0], z - sc.pos[2]) < r;

// ---------- 小积木 ----------
function bambooStalk(sc: Scene, x: number, z: number, h: number, T: number, seed: number, col: RGB): void {
  const sway = Math.sin(T * 1.25 + z * 0.22 + seed) * 0.16 + Math.sin(T * 2.7 + seed * 3) * 0.04;
  const segs = 6; let px = x, py = 0;
  for (let i = 0; i < segs; i++) {
    const k = (i + 1) / segs, nx = x + sway * k * k * h, ny = h * k;
    sc.line([px, py, z], [nx, ny, z], 0.075 * (1 - k * 0.35), mix(col, [220, 240, 200], i * 0.03));
    sc.line([nx - 0.05, ny, z], [nx + 0.05, ny, z], 0.03, [20, 60, 40]);
    if (i >= 2) for (let l = 0; l < 2; l++) {
      const dir = hash(seed * 11 + i * 3 + l) > 0.5 ? 1 : -1, len = 0.55 + hash(seed + i + l) * 0.4, droop = 0.25 + 0.1 * Math.sin(T * 2 + seed + i);
      const a: V3 = [nx, ny, z], b: V3 = [nx + dir * len, ny - droop, z + (hash(seed + l * 5 + i) - 0.5) * 0.6], c: V3 = [nx + dir * len * 0.45, ny - droop * 0.2 + 0.12, z + 0.08];
      sc.poly([a, c, b], mix([60, 140, 80], col, 0.4), { emissive: false });
    }
    px = nx; py = ny;
  }
}
function lowTree(sc: Scene, x: number, z: number, h: number, col: RGB, seed: number): void {
  prism(sc, x, 0, z, 0.12 * h, h * 0.35, 5, [96, 66, 50], [0, 0], false);
  cone(sc, x, h * 0.28, z, h * 0.42, h * 0.55, 6, col, seed);
  cone(sc, x, h * 0.55, z, h * 0.32, h * 0.5, 6, mix(col, [255, 255, 255], 0.08), seed + 1);
}
function sakuraTree(sc: Scene, x: number, z: number, h: number, col: RGB, seed: number): void {
  prism(sc, x, 0, z, 0.1 * h, h * 0.55, 5, [110, 72, 62], [(hash(seed) - 0.5) * 0.4, 0], false);
  blob(sc, x, h * 0.75, z, h * 0.38, col, seed, 0.8);
  blob(sc, x + h * 0.25, h * 0.6, z + 0.2, h * 0.26, mix(col, [255, 255, 255], 0.15), seed + 2, 0.8);
  blob(sc, x - h * 0.25, h * 0.62, z - 0.1, h * 0.24, mix(col, [200, 90, 140], 0.15), seed + 4, 0.8);
}
/** 樱花草（报春花）：五瓣小花，广告牌 */
export function primrose(sc: Scene, p: V3, size: number, col: string, open = 1, sway = 0): void {
  if (open <= 0.01) return;
  sc.custom(p, (g, x, y, s) => {
    const r = size * s * open; if (r < 0.6) return;
    g.save(); g.translate(x, y); g.rotate(sway);
    g.strokeStyle = '#3f8a4a'; g.lineWidth = Math.max(1, r * 0.18); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 2.2); g.stroke();
    g.translate(0, -r * 2.2);
    g.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.52, r * 0.42, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffe36e'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, Math.PI * 2); g.fill();
    g.restore();
  });
}
const PRIM = ['#ff8fb8', '#ffb3cf', '#ff6f9f', '#ffd1e0', '#f7a6ff', '#ffffff'];
function flowerField(sc: Scene, T: number, cx: number, cz: number, r: number, n: number, seed: number, open = (_x: number, _z: number) => 1): void {
  for (let i = 0; i < n; i++) {
    const x = cx + (hash(i * 3.3 + seed) - 0.5) * 2 * r, z = cz + (hash(i * 7.1 + seed) - 0.5) * 2 * r;
    if (!near(sc, x, z, 34)) continue;
    primrose(sc, [x, 0, z], 0.07 + hash(i + seed) * 0.05, PRIM[i % PRIM.length], open(x, z), Math.sin(T * 1.6 + i) * 0.12);
  }
}
function fireflies(sc: Scene, T: number, cx: number, cz: number, r: number, n: number, seed: number, rise = 0.3, blink = 0, gold: RGB = [255, 220, 110]): void {
  for (let i = 0; i < n; i++) {
    const ph = hash(i + seed) * 100;
    const x = cx + (hash(i * 2.7 + seed) - 0.5) * 2 * r + Math.sin(T * 0.6 + ph) * 0.8;
    const z = cz + (hash(i * 5.9 + seed) - 0.5) * 2 * r + Math.cos(T * 0.5 + ph) * 0.8;
    const y = 0.3 + hash(i * 1.9) * 2.5 + ((T * rise + ph) % 4) * rise * 0.6 + Math.sin(T * 1.3 + ph) * 0.3;
    const a = 0.45 + 0.55 * Math.max(0, Math.sin(T * 3 + ph)) * (1 - blink) + blink * (i % 3 === 0 ? 1 : 0.4);
    sc.glow([x, y, z], 0.35, gold, a);
  }
}
function lanternString(sc: Scene, a: V3, b: V3, n: number, T: number, cols: string[]): void {
  let prev = a;
  for (let i = 1; i <= n; i++) {
    const k = i / (n + 1), p: V3 = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * 0.8, a[2] + (b[2] - a[2]) * k];
    sc.line(prev, p, 0.015, [40, 30, 30]); prev = p;
    const c = hex(cols[i % cols.length]);
    sc.glow([p[0], p[1] - 0.25, p[2]], 0.7, c, 0.5 + 0.2 * Math.sin(T * 2 + i));
    box(sc, p[0], p[1] - 0.45, p[2], 0.22, 0.32, 0.22, c, 0.3);
  }
  sc.line(prev, b, 0.015, [40, 30, 30]);
}
function water(sc: Scene, x0: number, x1: number, z0: number, z1: number, T: number, col: RGB, step = 2): void {
  for (let x = x0; x < x1; x += step) for (let z = z0; z < z1; z += step) {
    if (!near(sc, x, z, 60)) continue;
    const k = 0.9 + 0.1 * Math.sin(T * 1.5 + x * 0.7 + z * 0.5);
    sc.poly([[x, 0.02, z], [x + step, 0.02, z], [x + step, 0.02, z + step], [x, 0.02, z + step]], [col[0] * k, col[1] * k, col[2] * k], { bias: 0.25 });
  }
  for (let i = 0; i < 26; i++) {
    const x = x0 + hash(i * 3.1) * (x1 - x0), z = z0 + ((hash(i * 5.3) * (z1 - z0) + T * 0.6) % (z1 - z0));
    sc.line([x, 0.04, z], [x + 0.8, 0.04, z], 0.03, mix(col, [255, 255, 255], 0.6), 0.6);
  }
}
function pavilion(sc: Scene, x: number, z: number, s: number, col: RGB, roof: RGB): void {
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) prism(sc, x + dx * s, 0, z + dz * s, 0.09 * s, 2.4 * s, 5, col, [0, 0], false);
  box(sc, x, 0, z, s * 2.6, 0.18, s * 2.6, [150, 130, 120]);
  cone(sc, x, 2.4 * s, z, s * 2.0, s * 1.3, 4, roof, Math.PI / 4);
}
function chime(sc: Scene, p: V3, T: number, i: number, ring: number): void {
  const sw = Math.sin(T * 2.2 + i * 1.7) * 0.25 + ring * Math.sin(T * 18 + i) * 0.25;
  const b: V3 = [p[0] + Math.sin(sw) * 0.5, p[1] - Math.cos(sw) * 0.5, p[2]];
  sc.line(p, b, 0.008, [230, 230, 240], 0.8);
  sc.custom(b, (g, x, y, s) => {
    const r = 0.11 * s; g.save(); g.translate(x, y); g.rotate(-sw);
    g.fillStyle = 'rgba(190,230,255,0.85)'; g.beginPath(); g.moveTo(-r, r * 1.3); g.quadraticCurveTo(-r, -r * 0.6, 0, -r * 0.8); g.quadraticCurveTo(r, -r * 0.6, r, r * 1.3); g.closePath(); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, r * 0.12); g.stroke();
    g.fillStyle = '#ff9fc4'; g.fillRect(-r * 0.25, r * 1.4, r * 0.5, r * 1.6);
    g.restore();
  });
  if (ring > 0.05) sc.glow(b, 0.5, [200, 230, 255], ring * 0.6, false);
}

export function hills(x: number, z: number): number { return 0.7 * Math.sin(x * 0.18) * Math.cos(z * 0.13) + 0.4 * Math.sin(x * 0.07 + z * 0.11) + Math.max(0, -z - 20) * 0.08; }

// ---------- 布景表 ----------
export const SETS: Record<SetId, SetDef> = {
  bamboo: {
    look: 'bamboo', sky: { stars: 140, moon: { dir: MOON, r: 46 } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 18, 60, 14, [26, 54, 50], [36, 70, 58], (x, z) => (Math.abs(x) < 1.2 ? 0 : 0.08 * Math.sin(x * 2 + z)), 3);
      for (let z = -60; z < 14; z += 2.5) sc.poly([[-0.9, 0.02, z], [0.9, 0.02, z], [0.9, 0.02, z + 2.5], [-0.9, 0.02, z + 2.5]], z % 5 === 0 ? [96, 110, 120] : [88, 102, 112], { bias: 0.2 });
      for (let i = 0; i < 150; i++) {
        const side = i % 2 ? 1 : -1, x = side * (1.7 + hash(i * 1.7) * 9), z = 12 - hash(i * 4.3) * 74;
        if (!near(sc, x, z, 48)) continue;
        bambooStalk(sc, x, z, 6 + hash(i) * 4, c.T, i, mix([70, 150, 90], [120, 190, 120], hash(i * 9)));
      }
      fireflies(sc, c.T, 0, -14, 9, 26, 5, 0.1);
      // 风：几道白色气流掠过竹林
      for (let i = 0; i < 6; i++) { const p = ((c.T * 0.5 + i / 6) % 1); const x = -10 + p * 20, y = 2 + i * 0.7, z = -6 - i * 3; sc.line([x, y, z], [x + 2.2, y + 0.2, z], 0.02, [220, 240, 255], 0.35 * Math.sin(p * Math.PI)); }
    },
  },
  hill: {
    look: 'night', sky: { stars: 200, moon: { dir: [-0.5, 0.35, -0.8], r: 34 } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 22, 76, 16, [36, 62, 66], [52, 82, 74], hills, 9);
      for (let i = 0; i < 26; i++) { const x = (hash(i * 3.7) - 0.5) * 60, z = -6 - hash(i * 1.3) * 50; if (Math.abs(x) < 3 && z > -16) continue; lowTree(sc, x, z, 2 + hash(i) * 2.5, [40, 90, 80], i); }
      fireflies(sc, c.T, 0, -12, 16, 130, 2, 0.35, c.hit, [255, 214, 90]);
      // 钱币：一些萤火在空中翻成金币
      for (let i = 0; i < 18; i++) {
        const ph = hash(i * 8.8) * 50, x = (hash(i * 6.1) - 0.5) * 14, z = -4 - hash(i * 2.2) * 16, y = 1 + ((c.T * 0.5 + ph) % 5);
        sc.custom([x, y, z], (g, sx, sy, s) => { const r = 0.16 * s, w = Math.abs(Math.cos(c.T * 3 + ph)) * r; g.fillStyle = '#ffd34d'; g.strokeStyle = '#b8860b'; g.lineWidth = Math.max(1, r * 0.15); g.beginPath(); g.ellipse(sx, sy, Math.max(0.6, w), r, 0, 0, 7); g.fill(); g.stroke(); });
      }
    },
  },
  galaxy: {
    look: 'violet', sky: { stars: 320, galaxy: 1 },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 20, 70, 12, [30, 26, 54], [44, 36, 72], hills, 4);
      for (let i = 0; i < 18; i++) lowTree(sc, (hash(i * 2.1) - 0.5) * 50, -14 - hash(i * 3.3) * 30, 2 + hash(i) * 2, [36, 30, 70], i);
      fireflies(sc, c.T, 0, -6, 10, 30, 8, 0.2, 0, [200, 190, 255]);
    },
  },
  chime: {
    look: 'night', sky: { stars: 160, moon: { dir: [0.6, 0.4, -0.7], r: 30 } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 14, 50, 12, [70, 76, 96], [82, 88, 108], () => 0, 7);
      pavilion(sc, 0, -4, 1.6, [160, 60, 50], [70, 40, 70]);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; chime(sc, [Math.cos(a) * 2.2, 3.7, -4 + Math.sin(a) * 2.2], c.T, i, c.hit); }
      for (let i = 0; i < 12; i++) sakuraTree(sc, (i % 2 ? 1 : -1) * (6 + hash(i) * 8), -2 - hash(i * 4) * 22, 3 + hash(i * 2) * 1.5, [230, 150, 190], i);
      fireflies(sc, c.T, 0, -6, 8, 22, 3, 0.2);
    },
  },
  river: {
    look: 'violet', sky: { stars: 300, galaxy: 0.8 },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 16, 64, 14, [40, 34, 70], [54, 44, 86], () => 0, 5);
      // 地上的银河：一条发光的河把两岸隔开
      for (let z = -50; z < 12; z += 1.6) {
        const w = 1.6 + Math.sin(z * 0.3) * 0.3;
        sc.poly([[-w, 0.03, z], [w, 0.03, z], [w, 0.03, z + 1.6], [-w, 0.03, z + 1.6]], mix([120, 120, 230], [210, 190, 255], 0.5 + 0.5 * Math.sin(c.T * 2 + z)), { emissive: true, bias: 0.2 });
      }
      for (let i = 0; i < 70; i++) { const z = 10 - ((hash(i * 2.3) * 60 + c.T * 1.2) % 60), x = (hash(i * 5.1) - 0.5) * 3; sc.glow([x, 0.15, z], 0.25, [230, 220, 255], 0.8); }
      for (let i = 0; i < 16; i++) lowTree(sc, (i % 2 ? 1 : -1) * (7 + hash(i) * 12), -6 - hash(i * 4) * 30, 2 + hash(i * 3) * 2, [50, 40, 90], i);
    },
  },
  stream: {
    look: 'dusk', sky: {},
    build: (sc, c) => {
      // 溪流沿 z 方向，两岸按段换季：春（粉）→ 夏（绿）→ 秋（橙）→ 冬（白）
      const season = (z: number) => clamp((-z) / 14, 0, 3.999);
      const SC: RGB[] = [[236, 160, 190], [96, 180, 100], [222, 140, 60], [236, 240, 250]];
      const GC: RGB[] = [[150, 196, 120], [90, 160, 90], [190, 150, 90], [230, 234, 244]];
      const sea = (z: number): RGB => { const s = season(z), i = Math.floor(s); return mix(GC[i], GC[Math.min(3, i + 1)], clamp((s - i - 0.7) / 0.3)); };
      const step = 2.5;
      for (let i = -12; i < 12; i++) for (let j = -26; j < 6; j++) {
        const x = i * step, z = j * step; if (Math.abs(x + step / 2) < 1.6 || !near(sc, x, z, 50)) continue;
        const cl = mix(sea(z), [255, 255, 255], hash(i * 7 + j) * 0.08);
        sc.poly([[x, 0, z], [x + step, 0, z], [x + step, 0, z + step], [x, 0, z + step]], cl, { bias: 0.3 });
      }
      water(sc, -1.6, 1.6, -64, 14, c.T, [110, 170, 220], 1.6);
      for (let i = 0; i < 40; i++) {
        const side = i % 2 ? 1 : -1, x = side * (3 + hash(i * 2.9) * 12), z = 10 - hash(i * 1.1) * 66; if (!near(sc, x, z, 50)) continue;
        const s = Math.floor(season(z));
        if (s === 0) sakuraTree(sc, x, z, 3 + hash(i) * 1.5, SC[0], i); else if (s === 3) cone(sc, x, 0, z, 1.2, 3.4, 6, SC[3], i); else lowTree(sc, x, z, 2.6 + hash(i) * 2, SC[s], i);
      }
      // 季节粒子：花瓣 / 萤火 / 落叶 / 雪
      for (let i = 0; i < 90; i++) {
        const z = 8 - hash(i * 4.1) * 60, x = (hash(i * 6.3) - 0.5) * 18, s = Math.floor(season(z));
        const y = 4 - ((c.T * (s === 3 ? 0.6 : 0.4) + hash(i) * 4) % 4);
        const col: RGB = [[255, 180, 210], [255, 230, 120], [240, 140, 60], [255, 255, 255]][s] as RGB;
        if (s === 1) sc.glow([x, y, z], 0.25, col, 0.8); else sc.custom([x + Math.sin(c.T + i) * 0.4, y, z], (g, sx, sy, sc2) => { g.fillStyle = rgb(col, 0.9); g.beginPath(); g.ellipse(sx, sy, 0.07 * sc2, 0.045 * sc2, c.T * 2 + i, 0, 7); g.fill(); });
      }
    },
  },
  bridge: {
    look: 'dusk', sky: { stars: 40 },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 16, 60, 14, [120, 160, 110], [140, 176, 120], () => 0, 6);
      water(sc, -30, 30, -3, 3, c.T, [120, 160, 220], 2);
      for (let i = -5; i <= 5; i++) { const x = i * 0.7, y = Math.cos((i / 6) * Math.PI / 2) * 1.1; box(sc, x, y - 0.3, 0, 0.72, 0.3, 1.6, [200, 190, 180]); }
      // 幸福在蔓延：以桥为中心，一圈圈开花
      flowerField(sc, c.T, 0, -2, 22, 340, 11, (x, z) => clamp((c.u * 24 - Math.hypot(x, z + 2)) / 2));
      for (let i = 0; i < 10; i++) sakuraTree(sc, (i % 2 ? 1 : -1) * (6 + hash(i) * 10), -6 - hash(i * 4) * 20, 3.2 + hash(i) * 1.5, [240, 160, 200], i);
    },
  },
  meadow: {
    look: 'dusk', sky: { stars: 20 },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 18, 70, 14, [120, 180, 110], [150, 200, 120], (x, z) => hills(x, z) * 0.6, 12);
      flowerField(sc, c.T, sc.pos[0], sc.pos[2] - 12, 22, 520, 21);
      for (let i = 0; i < 14; i++) sakuraTree(sc, (i % 2 ? 1 : -1) * (5 + hash(i) * 14), 4 - hash(i * 4) * 44, 3.4 + hash(i) * 2, [250, 170, 205], i);
    },
  },
  window: {
    look: 'night', sky: { stars: 260, moon: { dir: [-0.3, 0.5, -0.8], r: 40 } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 14, 50, 12, [40, 60, 70], [52, 72, 80], () => 0, 8);
      box(sc, 0, 0, -3, 5, 2.8, 3, [210, 190, 170]);
      cone(sc, 0, 2.8, -3, 3.8, 1.6, 4, [120, 60, 70], Math.PI / 4);
      sc.poly([[-0.8, 1.0, -1.48], [0.8, 1.0, -1.48], [0.8, 2.1, -1.48], [-0.8, 2.1, -1.48]], [255, 220, 140], { emissive: true, bias: 0.1 });
      sc.glow([0, 1.5, -1.3], 2.2, [255, 200, 120], 0.5, false);
      flowerField(sc, c.T, 0, 1, 6, 60, 31);
      fireflies(sc, c.T, 0, 0, 7, 20, 6, 0.2);
    },
  },
  festival: {
    look: 'violet', sky: { stars: 200, galaxy: 0.5 },
    build: (sc, c) => {
      // 舞台地砖：踩拍 / 逐字点亮
      const step = 1.4;
      for (let i = -8; i < 8; i++) for (let j = -12; j < 4; j++) {
        const x = i * step, z = j * step; if (!near(sc, x, z, 40)) continue;
        const on = hash(i * 13 + j * 7 + Math.floor(c.k)) > 0.72 ? c.pulse : 0;
        const base: RGB = (i + j) % 2 ? [70, 50, 100] : [86, 62, 120];
        sc.poly([[x, 0, z], [x + step, 0, z], [x + step, 0, z + step], [x, 0, z + step]], mix(base, [255, 160, 210], on * 0.8), { emissive: on > 0.1, bias: 0.3 });
      }
      const cols = ['#ff7aa8', '#ffd166', '#9ad0ff', '#c9a7ff'];
      lanternString(sc, [-11, 4.5, -10], [11, 4.5, -10], 9, c.T, cols);
      lanternString(sc, [-11, 4.2, -3], [11, 4.6, -16], 9, c.T + 1, cols);
      lanternString(sc, [-11, 4.6, -16], [11, 4.2, -3], 9, c.T + 2, cols);
      for (let i = 0; i < 8; i++) sakuraTree(sc, (i % 2 ? 1 : -1) * (12 + hash(i) * 6), -2 - hash(i * 4) * 20, 3.6, [240, 160, 210], i);
      // 孔明灯升空
      for (let i = 0; i < 14; i++) { const y = ((c.T * 0.35 + hash(i) * 10) % 10) + 1, x = (hash(i * 3.3) - 0.5) * 22, z = -8 - hash(i * 7.7) * 20; sc.glow([x, y, z], 1.0, [255, 190, 110], 0.55); box(sc, x, y - 0.25, z, 0.3, 0.45, 0.3, [255, 200, 130]); }
    },
  },
  temple: {
    look: 'night', sky: { stars: 220, moon: { dir: [0.2, 0.3, -0.9], r: 28 } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 22, 70, 14, [40, 56, 72], [50, 66, 82], hills, 13);
      // 远方钟楼：叠层塔
      const tz = -14;
      for (let k = 0; k < 4; k++) { const s = 2.4 - k * 0.45, y = k * 1.7; box(sc, 0, y, tz, s, 1.2, s, [190, 80, 60]); cone(sc, 0, y + 1.2, tz, s * 0.95, 0.6, 4, [60, 50, 80], Math.PI / 4); }
      cone(sc, 0, 6.8, tz, 0.3, 1.2, 4, [240, 200, 100]);
      // 钟声：地上一圈圈荡开的声波（落在每个字上）
      for (let r = 0; r < 4; r++) {
        const age = c.hit + r * 0.9; if (age > 3.6) continue;
        const R = age * 6, a = (1 - age / 3.6) * 0.7;
        const pts: V3[] = Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return [Math.cos(t) * R, 0.06, tz + Math.sin(t) * R] as V3; });
        for (let i = 0; i < pts.length; i++) sc.line(pts[i], pts[(i + 1) % pts.length], 0.06, [255, 230, 160], a);
      }
      sc.glow([0, 2, tz + 1.3], 1.4, [255, 210, 120], 0.6 + 0.4 * Math.exp(-c.hit * 3));
      for (let i = 0; i < 20; i++) lowTree(sc, (hash(i * 2.1) - 0.5) * 40, -4 - hash(i * 3.3) * 30, 2 + hash(i) * 2, [40, 80, 74], i);
    },
  },
  pond: {
    look: 'night', sky: { stars: 240, moon: { dir: [0.1, 0.45, -0.9], r: 34 } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], sc.pos[2] - 12, 50, 12, [40, 70, 60], [56, 90, 70], () => 0, 14);
      const R = 5;
      for (let i = 0; i < 18; i++) { const a0 = (i / 18) * Math.PI * 2, a1 = ((i + 1) / 18) * Math.PI * 2; sc.poly([[0, 0.03, -5], [Math.cos(a0) * R, 0.03, -5 + Math.sin(a0) * R * 0.7], [Math.cos(a1) * R, 0.03, -5 + Math.sin(a1) * R * 0.7]], [40, 70, 120], { bias: 0.25 }); }
      sc.glow([1.2, 0.05, -6], 1.6, [255, 240, 200], 0.4, false);
      for (let i = 0; i < 9; i++) {
        const a = hash(i * 3.1) * Math.PI * 2, rr = 1 + hash(i * 1.7) * 3, x = Math.cos(a) * rr, z = -5 + Math.sin(a) * rr * 0.7;
        sc.custom([x, 0.05, z], (g, sx, sy, s) => { g.fillStyle = '#3f9a5c'; g.beginPath(); g.ellipse(sx, sy, 0.45 * s, 0.14 * s, 0, 0.3, Math.PI * 2); g.lineTo(sx, sy); g.fill(); });
        if (i % 2 === 0) {
          const puff = Math.exp(-((c.hit + i * 0.13) % 1.2) * 4);
          sc.custom([x, 0.12, z], (g, sx, sy, s) => {
            const r = 0.18 * s; g.fillStyle = '#6bc46a'; g.beginPath(); g.ellipse(sx, sy - r * 0.6, r * 1.2, r * 0.8, 0, 0, 7); g.fill();
            g.fillStyle = '#fff'; g.beginPath(); g.arc(sx - r * 0.5, sy - r * 1.3, r * 0.3, 0, 7); g.arc(sx + r * 0.5, sy - r * 1.3, r * 0.3, 0, 7); g.fill();
            g.fillStyle = '#222'; g.beginPath(); g.arc(sx - r * 0.5, sy - r * 1.3, r * 0.14, 0, 7); g.arc(sx + r * 0.5, sy - r * 1.3, r * 0.14, 0, 7); g.fill();
            g.fillStyle = 'rgba(220,255,200,0.85)'; g.beginPath(); g.arc(sx, sy - r * 0.1, r * 0.7 * puff + 0.5, 0, 7); g.fill();
          });
        }
      }
      for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; const x = Math.cos(a) * (R + 0.4), z = -5 + Math.sin(a) * (R * 0.7 + 0.3); sc.line([x, 0, z], [x + Math.sin(c.T + i) * 0.1, 0.7 + hash(i) * 0.5, z], 0.04, [70, 130, 80]); }
      fireflies(sc, c.T, 0, -5, 7, 30, 12, 0.15);
    },
  },
  beach: {
    look: 'sea', sky: { stars: 260, moon: { dir: [0.0, 0.32, -0.95], r: 52, crescent: true } },
    build: (sc, c) => {
      groundGrid(sc, sc.pos[0], 4, 50, 12, [214, 214, 222], [226, 226, 234], (x, z) => 0.05 * Math.sin(x + z * 2), 15);
      for (let x = -40; x < 40; x += 3) for (let z = -70; z < -2; z += 3) {
        if (!near(sc, x, z, 80)) continue;
        const k = 0.85 + 0.15 * Math.sin(c.T * 1.2 + x * 0.4 + z * 0.6);
        sc.poly([[x, 0, z], [x + 3, 0, z], [x + 3, 0, z + 3], [x, 0, z + 3]], [40 * k, 70 * k, 130 * k], { bias: 0.3 });
      }
      // 浪花：一道道白线推上岸
      for (let w = 0; w < 4; w++) { const p = (c.T * 0.25 + w / 4) % 1, z = -10 + p * 8; sc.line([-40, 0.05, z], [40, 0.05, z], 0.06, [240, 248, 255], 0.6 * Math.sin(p * Math.PI)); }
      // 月光在海面上的路
      for (let i = 0; i < 40; i++) { const z = -60 + i * 1.4, x = Math.sin(c.T * 2 + i) * 0.6; sc.line([x - 0.6, 0.06, z], [x + 0.6, 0.06, z], 0.06, [255, 246, 210], 0.55); }
    },
  },
};

export function drawSet(g: CanvasRenderingContext2D, sc: Scene, id: SetId, c: SetCtx): void {
  const s = SETS[id];
  drawSky(g, sc, c.T, s.sky);
  s.build(sc, c);
}
