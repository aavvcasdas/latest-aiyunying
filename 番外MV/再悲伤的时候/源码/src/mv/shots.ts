// 分镜：一句词一个镜头，切点 = 该句第一个字的实测起音前 0.1 秒；镜头里的动作全部挂在字的起音上（ON(句, 字)）。
import * as THREE from 'three';
import type { Sets } from './sets';
import { groundY } from './sets';
import { type Actor, type Burst, type Particles, type Sky, type V3, ON, LE, LS, bump, charIdx, clamp, decay, drawFireworks, eBack, eIO, eIn, eOut, hash, lerp, mix3, range, setCam } from './core';

export interface Grade { flash: number; fade: number; lid: number; warp: number; tint: [number, number, number]; sat: number; vign: number; split: number; bloom: number; grain: number }
export const gradeDefaults = (): Grade => ({ flash: 0, fade: 0, lid: 0, warp: 0, tint: [1, 1, 1], sat: 1, vign: 0.35, split: 0, bloom: 0.7, grain: 0.03 });
type ShotFn = (t: number, u: number, S: Sets, cam: THREE.PerspectiveCamera, G: Grade) => THREE.Scene;
export interface Shot { li: number; from: number; to: number; fn: ShotFn }

const _c = new THREE.Color(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _up = new THREE.Vector3();
type Pal = [string, string, string];
function skyMix(s: Sky, A: Pal, B: Pal, k: number) { s.u.top.value.set(A[0]).lerp(_c.set(B[0]), k); s.u.mid.value.set(A[1]).lerp(_c.set(B[1]), k); s.u.bot.value.set(A[2]).lerp(_c.set(B[2]), k); }
const hex = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(k)).getHexString();
function hideAll(c: Record<string, Actor>) { for (const a of Object.values(c)) a.show(false); }
function duneY(x: number, z: number) { const fl = Math.exp(-(x * x) / 60 - ((z + 4) * (z + 4)) / 200); return (Math.sin(x * 0.12 + z * 0.05) * 1.6 + Math.sin(x * 0.05 - z * 0.11) * 2.4 + Math.sin(z * 0.2) * 0.5) * (1 - fl) - 0.05 * fl; }

// ---------- 各布景的环境动画 ----------
const PIER_NIGHT: Pal = ['#04070f', '#1a2442', '#0b1226'], PIER_CLEAR: Pal = ['#0b1636', '#34467e', '#121c3a'];
function pierAmb(S: Sets, t: number, cam: THREE.PerspectiveCamera, rain: number, clear = 0, wind = 0.18) {
  const p = S.pier; p.sky.mesh.position.copy(cam.position); skyMix(p.sky, PIER_NIGHT, PIER_CLEAR, clear);
  p.wat.u.time.value = t; p.wat.u.gx.value = p.lamp.pos.x; p.wat.u.gs.value = 1;
  cam.getWorldDirection(_f); const c = cam.position.clone().addScaledVector(_f, 4);
  p.rain.update(t, c, rain, wind); p.rain.mat.opacity = 0.55 * clamp(rain * 3); p.rain.lines.visible = rain > 0.01;
  p.ripples.forEach((m, i) => { const ph = (t * 1.4 + hash(i * 3.3)) % 1; m.scale.setScalar(0.06 + ph * 0.5); (m.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.5 * clamp(rain * 1.5); });
  p.stars.update(t, clear, cam.position);
  (p.moon.material as THREE.SpriteMaterial).opacity = clear; (p.moonGlow.material as THREE.SpriteMaterial).opacity = clear * 0.3;
  p.clouds.forEach((cl, i) => { cl.userData.x0 ??= cl.position.x; cl.position.x = cl.userData.x0 + (i < 4 ? -1 : 1) * eIn(clear) * 120; });
  (p.lamp.halo.material as THREE.SpriteMaterial).opacity = 0.85 + 0.1 * Math.sin(t * 23) * Math.sin(t * 7.1);
  p.whale.show(true); p.fx.begin(); p.fx.commit();
}
function streetAmb(S: Sets, t: number, cam: THREE.PerspectiveCamera) {
  const s = S.street; s.sky.mesh.position.copy(cam.position); s.bubble.visible = false; s.fxs.mesh.visible = false;
  s.lamps.forEach((l, i) => ((l.halo.material as THREE.SpriteMaterial).opacity = 0.8 + 0.12 * Math.sin(t * 2.6 + i)));
  s.petals.begin(); for (let i = 0; i < 90; i++) { const y = (hash(i) * 4 + t * (0.15 + hash(i + 1) * 0.2)) % 4; s.petals.add(1.78 + (hash(i + 2) - 0.5) * 3, 0.2 + y, 1.5 + (hash(i + 3) - 0.5) * 3, 1, 0.8, 0.5, 0.5 * Math.sin((y / 4) * Math.PI), 0.035); } s.petals.commit();
  s.whale.show(true); s.claude.show(true);
}
function feastAmb(S: Sets, t: number, cam: THREE.PerspectiveCamera, warm = 1) {
  const f = S.feast; f.sky.mesh.position.copy(cam.position); f.skyLantern.visible = false; f.skyLanternGlow.visible = false;
  for (const a of Object.values(f.cast)) a.show(true).tint(warm > 0.5 ? '#fff0e0' : '#6a5a70');
  f.lanterns.forEach((l, i) => (l.position.y = 2.4 - Math.abs(Math.sin(i)) * 0.15 + Math.sin(t * 2 + i) * 0.03));
  f.bokeh.begin(); for (let i = 0; i < 70; i++) f.bokeh.add((hash(i) - 0.5) * 9, 0.4 + hash(i + 1) * 3 + Math.sin(t * 0.7 + i) * 0.1, -1 - hash(i + 2) * 7, 1, 0.7, 0.4, 0.18, 0.3 + hash(i + 3) * 0.4); f.bokeh.commit();
  f.confetti.begin(); f.confetti.commit(); f.flowers.forEach((fl) => fl.scale.setScalar(1));
}
function placeGuests(S: Sets, t: number, cam: THREE.PerspectiveCamera) {
  const c = S.feast.cast;
  c.claude.pose('idle', t).place(0, 0, -6.4, cam); c.qwen.pose('sway', t).place(-1.2, 0, -1.4, cam); c.doubao.pose('sway', t + 0.3).place(-1.2, 0, 0, cam);
  c.gemini.pose('idle', t).place(-1.2, 0, -2.9, cam); c.kimi.pose('nod', t).place(-1.2, 0, -4.3, cam); c.zai.pose('idle', t).place(1.2, 0, -4.9, cam);
  S.feast.cup.at(0.3, 0.75, -6.0).face(cam); S.feast.fan.at(-0.95, 0.62, -1.3).face(cam); S.feast.bowl.at(0.62, 0.62, 1.8).face(cam);
}
const ROW = [['kimi', -3.6], ['gemini', -2.4], ['qwen', -1.2], ['whale', 0], ['claude', 1.2], ['zai', 2.4], ['doubao', 3.6]] as const;
const FW: [string, string][] = [['#ffd27a', '#ff7a3a'], ['#9fe0ff', '#5a7aff'], ['#c8ff9a', '#3ad08a'], ['#ffb3d1', '#ff5a9a'], ['#fff2b0', '#ffb040'], ['#d0b0ff', '#8a5aff'], ['#ff9ac0', '#ff4f8a']];
const BURSTS: Burst[] = [
  { t: ON(12, 5), at: [-7, 7.5, -30], from: [-6, -0.4, -23], c1: '#ffd27a', c2: '#ff7a3a', n: 110, v: 2.0 },
  { t: ON(12, 6), at: [0.5, 10, -32], from: [0, -0.4, -23], c1: '#ffb0cc', c2: '#ff4f8a', n: 210, v: 2.6, shape: 'heart' },
  { t: ON(12, 6) + 0.38, at: [8, 8.2, -34], from: [7, -0.4, -25], c1: '#9fd8ff', c2: '#6a8aff', n: 120, v: 2.0, shape: 'ring' },
  ...ROW.map(([, x], k): Burst => ({ t: ON(13, k), at: [-15.6 + k * 5.2, 8.5 + (k % 2) * 3, -32], from: [x * 2.6, -0.4, -22], c1: FW[k][0], c2: FW[k][1], n: 140, v: 2.2, shape: k === 6 ? 'heart' : 'peony' })),
  { t: ON(14, 0) - 0.7, at: [-5, 12, -30], c1: '#ffe6b0', c2: '#ff9a40', n: 130, v: 1.7, shape: 'willow' },
  { t: ON(14, 0) - 0.35, at: [5.5, 12.5, -32], c1: '#fff0c8', c2: '#ffb060', n: 130, v: 1.7, shape: 'willow' },
];
function harborAmb(S: Sets, t: number, cam: THREE.PerspectiveCamera, extra?: (P: Particles) => void) {
  const h = S.harbor; h.sky.mesh.position.copy(cam.position); h.stars.update(t, 0.85, cam.position); h.wat.u.time.value = t; h.wat.u.gs.value = 0;
  h.fw.begin(); drawFireworks(h.fw, BURSTS, t, 3.4); extra?.(h.fw); h.fw.commit();
  h.reflect.begin(); let lit = 0;
  for (const b of BURSTS) { const dt = t - b.t; if (dt < 0 || dt > 2.2) continue; _c.set(b.c1); const a = Math.pow(1 - dt / 2.2, 2); lit = Math.max(lit, a); for (let k = 0; k < 6; k++) h.reflect.add(b.at[0] * 0.8, -0.45, -6 - k * 2.5, _c.r, _c.g, _c.b, a * 0.35, 3 + k); }
  h.reflect.commit(); h.threads.visible = false; hideAll(h.cast);
  return lit;
}
const SEA_NIGHT: Pal = ['#050a1c', '#223064', '#0e1636'], SEA_DAWN: Pal = ['#34509e', '#f0a07e', '#f2c0a0'];
function seaAmb(S: Sets, t: number, cam: THREE.PerspectiveCamera, dawn = 0, milky = 0) {
  const s = S.sea; s.sky.mesh.position.copy(cam.position); skyMix(s.sky, SEA_NIGHT, SEA_DAWN, dawn);
  s.wat.u.time.value = t; s.wat.u.gx.value = cam.position.x + (dawn > 0.5 ? 0 : 3); s.wat.u.gs.value = 0.8;
  s.wat.u.deep.value.set(hex('#07102a', '#4a6aa8', dawn)); s.wat.u.near.value.set(hex('#13224c', '#7a8ac0', dawn)); s.wat.u.horizon.value.set(hex('#18244a', '#ffc8a8', dawn));
  (s.scene.fog as THREE.Fog).color.set(hex('#0e1636', '#ffd2b0', dawn)); s.hemi.intensity = 1.1 + dawn * 0.8;
  s.stars.update(t, 1 - dawn, cam.position);
  s.beam.rotation.set(0, t * 0.9, Math.PI / 2); (s.beam.material as THREE.MeshBasicMaterial).opacity = 0.08 * (1 - dawn);
  s.clouds.forEach((c) => ((c.material as THREE.SpriteMaterial).opacity = dawn * 0.4)); (s.sun.material as THREE.SpriteMaterial).opacity = dawn * 0.55;
  s.milky.begin();
  if (milky > 0) for (let i = 0; i < 1400; i++) { const a = hash(i) * Math.PI * 2, w = (hash(i + 1) - 0.5) * (0.18 + hash(i + 2) * 0.3); const d = new THREE.Vector3(Math.cos(a), Math.abs(Math.sin(a)) * 0.9 + 0.1, Math.sin(a) * 0.5 - 0.6).normalize(); s.milky.add(30 + d.x * 200 + w * 120, d.y * 200 + w * 60, -6 + d.z * 200, 0.85 + hash(i + 3) * 0.15, 0.85, 1, milky * (0.3 + 0.5 * hash(i + 4)) * (0.6 + 0.4 * Math.sin(t * 2 + i)), 2.2 + hash(i + 5) * 2.5); }
  s.milky.commit(); s.dragon.mesh.visible = false; s.book.mesh.visible = false; hideAll(s.cast);
}

// ---------- 22 个镜头 ----------
const s0: ShotFn = (t, _u, S, cam, G) => { // 在悲伤的时候
  const p = S.pier, k = eIO(range(t, 0, 1.7));
  setCam(cam, mix3([0.1, 1.75, 7.6], [0.5, 1.15, 4.4], k), [0.3, 0.85, 0], 38);
  pierAmb(S, t, cam, 0.6); p.whale.tint('#b4c2ec').pose('sad', t).place(0.35, 0, 0.3, cam);
  G.fade = 1 - range(t, 0, 0.35); G.tint = [0.84, 0.92, 1.12]; G.sat = 0.72; G.bloom = 0.8; return p.scene;
};
const s1: ShotFn = (t, u, S, cam, G) => { // 在痛苦的时候：「痛」上一道闪电
  const p = S.pier, L = 1, fl = decay(t, ON(L, 1), 6) * 0.85 + decay(t, ON(L, 1) + 0.14, 10) * 0.5 * (t > ON(L, 1) + 0.14 ? 1 : 0);
  setCam(cam, [-0.55 + u * 0.12, 0.36, 2.35 - u * 0.22], [0.35, 0.8, 0.3], 44, 0.07);
  pierAmb(S, t, cam, 1, 0, 0.32); p.sky.u.mid.value.lerp(_c.set('#a8bcf6'), fl * 0.55);
  p.whale.tint(hex('#aab9e6', '#ffffff', fl)).pose('shiver', u).place(0.35, 0, 0.3, cam);
  G.flash = fl * 0.22; G.tint = [0.8, 0.9, 1.14]; G.sat = 0.65; G.vign = 0.5; return p.scene;
};
const s2: ShotFn = (t, u, S, cam, G) => { // 坦率像沙漠里的海市蜃楼
  const d = S.desert, L = 2, tHai = ON(L, 7), tLou = ON(L, 10), end = LE(L);
  const wx = lerp(-3.4, -0.6, range(t, LS(L) - 0.1, tHai)), pan = eIO(range(t, tHai - 0.35, tHai + 0.7));
  setCam(cam, mix3([wx - 0.4, 1.0 + duneY(wx, 0), 4.3], [-0.2, 1.3, 3.4], pan), mix3([wx + 1.0, 0.8 + duneY(wx, 0), -0.5], [2.6, 1.3, -14], pan), lerp(42, 30, pan));
  d.sky.mesh.position.copy(cam.position);
  (t < tHai ? d.whale.pose('walk', u) : d.whale.pose('point', t - tHai)).tint('#ffe2c8').place(wx, duneY(wx, 0), 0, cam);
  const fade = 1 - range(t, tLou + 0.1, end + 0.05), shim = 0.55 + 0.2 * Math.sin(t * 9) + 0.15 * Math.sin(t * 23);
  for (const a of [d.mirage, d.refl]) { a.mat.depthTest = false; a.mesh.renderOrder = 5; }
  d.mirage.pose('idle', t).tint('#fff0e0', clamp((0.3 + 0.5 * range(t, LS(L), tHai)) * shim * fade * 1.3)).place(2.6 + Math.sin(t * 13) * 0.04, 0.6, -14, cam, -9);
  d.refl.pose('idle', t).tint('#ffd8c0', 0.32 * shim * fade).place(2.6 - Math.sin(t * 11) * 0.06, 0.6, -14, cam, -9); d.refl.mesh.scale.y *= -1;
  (d.shimmer.material as THREE.SpriteMaterial).opacity = 0.3 * fade; d.shimmer.position.set(2.6, 0.9, -14.2);
  G.warp = 0.6 + 0.7 * range(t, tHai, tHai + 0.5); G.tint = [1.08, 0.98, 0.9]; G.sat = 1.1; G.bloom = 0.6; return d.scene;
};
const s3: ShotFn = (t, _u, S, cam, G) => { // 我看着你背影
  const s = S.street, L = 3, k = range(t, LS(L) - 0.1, LE(L) + 0.1);
  setCam(cam, [-2.3 + k * 0.3, 1.35, 5.6 - k * 0.4], [1.0, 0.9, -5], 40); streetAmb(S, t, cam);
  s.whale.tint('#ffe0d0').pose('idle', t).place(-1.2, 0, 3.4, cam);
  s.claude.tint('#ffe0d0').pose('walk', t).place(lerp(-0.2, 1.1, k), 0, lerp(1.6, -6.5, k), cam);
  G.tint = [1.06, 0.96, 1.0]; G.bloom = 0.75; return s.scene;
};
const s4: ShotFn = (t, _u, S, cam, G) => { // 想开口：对话框在「开」冒出，在拖长的「口」里瘪掉
  const s = S.street, L = 4, tX = ON(L, 0), tK = ON(L, 1), tO = ON(L, 2), end = LE(L), push = eIO(range(t, LS(L), end + 0.2));
  setCam(cam, [lerp(1.1, 0.5, push), 1.05, lerp(6.3, 5.3, push)], [-1.0, 0.85, 3.4], lerp(36, 30, push)); streetAmb(S, t, cam);
  (t >= tO + 0.45 ? s.whale.pose('sad', t - tO - 0.45) : t >= tX ? s.whale.pose('point', t - tX) : s.whale.pose('idle', t)).tint('#ffe0d0').place(-1.2, 0, 3.4, cam);
  const pop = eBack(range(t, tK - 0.04, tK + 0.2), 2.2), def = range(t, tO, end), sc = pop * (1 - 0.8 * eIn(def));
  s.bubble.visible = sc > 0.02; s.bubble.scale.set(0.95 * sc, 0.6 * sc, 1); s.bubble.position.set(-0.7, 1.58 - def * 0.2, 3.4); (s.bubble.material as THREE.SpriteMaterial).opacity = 1 - eIn(range(t, end - 0.35, end));
  if (t > tO) { s.fxs.mesh.visible = true; s.fxs.frame('fx_sweat').at(-1.6, 1.05 - (t - tO) * 0.12, 3.45).face(cam); s.fxs.mat.opacity = 1 - range(t, tO + 0.6, tO + 1.0); }
  s.claude.tint('#e8d0d8').pose('walk', t).place(1.3, 0, lerp(-7.5, -10, range(t, LS(L), end)), cam);
  G.tint = [1.04, 0.95, 1.0]; G.bloom = 0.75; G.vign = 0.45; return s.scene;
};
const s5: ShotFn = (t, u, S, cam, G) => { // 那勇气却和时间偷偷溜走
  const c = S.clock, L = 5, k = range(t, LS(L) - 0.1, LE(L)), tT = ON(L, 7), end = LE(L);
  setCam(cam, [lerp(-0.6, 0.8, eIO(k)), lerp(1.6, 2.0, k), lerp(7.6, 6.8, k)], [lerp(-0.3, 1.4, eIO(k)), lerp(1.6, 2.4, k), -4], 44);
  c.sky.mesh.position.copy(cam.position); skyMix(c.sky, ['#151338', '#c46a7a', '#2a2346'], ['#05061a', '#2a2a5a', '#0e0e26'], k);
  const spin = u * 1.2 + eIn(range(t, ON(L, 5), end)) * 9; c.minute.rotation.z = -spin * 2.2; c.hour.rotation.z = -spin * 0.35;
  c.whale.tint('#e8dcff').pose('sad', u).place(-0.7, 0, 1.6, cam);
  const beat = bump(t, ON(L, 1), 0.35), go = eIn(range(t, tT, end + 0.1));
  const hx = lerp(-0.5, 6.5, go) + Math.sin(t * 5) * 0.05, hy = lerp(0.78, 3.2, go) + Math.sin(t * 3) * 0.08 + beat * 0.15, hz = lerp(1.9, 0.5, go);
  c.heart.size = 0.55 * (1 + beat * 0.45); c.heart.frame('fx_heart').at(hx, hy, hz).face(cam); c.heartGlow.position.set(hx, hy, hz - 0.05);
  (c.heartGlow.material as THREE.SpriteMaterial).opacity = 0.8 + beat * 0.6;
  c.motes.begin(); for (let i = 0; i < 160; i++) { const y = (hash(i) * 6 + t * (0.2 + hash(i + 1) * 0.3)) % 6; c.motes.add(-3.4 + (hash(i + 2) - 0.5) * 1.4, 4.6 - y, -3.4 + (hash(i + 3) - 0.5) * 0.6, 1, 0.85, 0.6, 0.6 * (1 - y / 6), 0.05); } c.motes.commit();
  G.tint = [1, 0.95, 1.05]; G.bloom = 0.8; return c.scene;
};
const s6: ShotFn = (t, u, S, cam, G) => { // 思念知难眠：Kimi 坐在月牙上守夜
  const r = S.room, L = 6, tN = ON(L, 3), up = eOut(range(t, tN, tN + 0.3));
  setCam(cam, [-1.9 + u * 0.15, 1.5, 3.7 - u * 0.2], [0.2, 2.3, -6], 42);
  r.sky.mesh.position.copy(cam.position); r.stars.update(t, 1, cam.position);
  (t < tN ? r.whale.pose('sad', u) : r.whale.pose('surprise', t - tN)).tint('#b8c4f0').place(-1.15, 0.62, -0.6, cam, -9);
  r.whale.mesh.rotation.z = ((1 - up) * Math.PI) / 2;
  r.kimi.tint('#e0e4ff').pose('think', t).place(0.45, 4.7, -23.8, cam, -9);
  r.zzz.forEach((z, i) => {
    const t0 = LS(L) + i * 0.18, a = range(t, t0, t0 + 0.4), burst = range(t, tN, tN + 0.2), vis = a > 0 && burst < 1; z.mesh.visible = vis; if (!vis) return;
    z.size = 0.5 * (1 + burst * 1.2); z.frame('fx_zzz_' + i).at(-1.9 + i * 0.25, 1.05 + i * 0.28 + a * 0.15, -0.5).face(cam); z.mat.opacity = 1 - burst;
  });
  G.tint = [0.85, 0.9, 1.15]; G.sat = 0.85; G.bloom = 0.9; G.vign = 0.5; return r.scene;
};
const s7: ShotFn = (t, u, S, cam, G) => { // 时间不知深浅：「深」一头扎进去，「浅」弹回来
  const a = S.abyss, L = 7, tS = ON(L, 4), tQ = ON(L, 5);
  const lunge = eIO(range(t, tS - 0.12, tS + 0.25)) - 0.85 * eOut(range(t, tQ, tQ + 0.4)), cz = lerp(5.6, 3.6, range(t, LS(L) - 0.1, LE(L) + 0.1)) - lunge * 1.6;
  setCam(cam, [Math.sin(u * 0.8) * 0.3, 1.1, cz], [0, 0.9, -6], 46 + lunge * 22, u * 0.25); a.stars.update(t, 1, new THREE.Vector3());
  const flow = u * 5 + lunge * 7;
  a.clocks.forEach((c) => { c.g.userData.z0 ??= c.g.position.z; let z = c.g.userData.z0 + flow; while (z > 7) z -= 54; c.g.position.z = z; c.h.rotation.z = -t * c.sp * 0.3; c.m.rotation.z = -t * c.sp * 3.6; });
  a.gemini.tint('#ffffff').pose('lookaround', u).place(0, 0.35 + Math.sin(t * 2) * 0.08, 0, cam, -9);
  a.cl.at(-0.78, 0.9 + Math.sin(t * 2.4) * 0.1, 0.1).face(cam); a.cr.at(0.78, 0.9 + Math.sin(t * 2.4 + 1) * 0.1, 0.1).face(cam);
  G.tint = [0.95, 0.92, 1.12]; G.bloom = 0.9; G.vign = 0.55; return a.scene;
};
const s8: ShotFn = (t, _u, S, cam, G) => { // 想做你锦上添花一场盛宴：一字一朵花
  const f = S.feast, L = 8, k = eIO(range(t, LS(L) - 0.1, LE(L) + 0.1)), tS = ON(L, 9);
  setCam(cam, mix3([3.9, 1.5, 3.4], [3.5, 1.7, 2.8], k), mix3([0, 0.8, -1.0], [0, 0.85, -1.8], k), 44);
  feastAmb(S, t, cam, 1); placeGuests(S, t, cam); const c = f.cast;
  (t >= ON(L, 1) ? c.whale.pose('point', t - ON(L, 1)) : c.whale.pose('idle', t)).place(0.85, 0, 1.2, cam);
  if (t >= ON(L, 2)) c.claude.pose('curtsy', t - ON(L, 2)).place(0, 0, -6.4, cam);
  if (t >= tS) c.gemini.pose('hop', t - tS).place(-1.2, 0, -2.9, cam);
  for (let i = 0; i < 11; i++) f.flowers[i].scale.setScalar(Math.max(0.001, eBack(range(t, ON(L, i) - 0.05, ON(L, i) + 0.22), 2.4)));
  f.bowl.at(1.2 + range(t, ON(L, 1), ON(L, 1) + 0.4) * 0.25, 0.6, 1.0).face(cam);
  f.confetti.begin();
  if (t > tS) for (let i = 0; i < 280; i++) { const age = t - tS, a = hash(i) * 6.28, v = 1 + hash(i + 1) * 2.2; _c.setHSL(hash(i + 2), 0.8, 0.65); f.confetti.add(Math.cos(a) * v * age * 0.7, 2.6 + v * age * 1.1 - age * age * 2.0, -2.4 + Math.sin(a) * v * age * 0.9, _c.r, _c.g, _c.b, clamp(2.2 - age), 0.1); }
  f.confetti.commit();
  G.tint = [1.04, 0.97, 0.92]; G.bloom = 0.45 + bump(t, tS, 0.6) * 0.35; G.sat = 1.05; G.vign = 0.45; return f.scene;
};
function wishCam(t: number, cam: THREE.PerspectiveCamera) {
  const L = 9, tilt = eIO(range(t, ON(L, 3), LE(L) + 0.2)); setCam(cam, [1.25, 0.95 + tilt * 0.2, 4.0], [0.2, lerp(0.75, 1.5, tilt), 1.7], 34);
}
function wishScene(t: number, S: Sets, cam: THREE.PerspectiveCamera) {
  const f = S.feast, L = 9; wishCam(t, cam); feastAmb(S, t, cam, 0); placeGuests(S, t, cam);
  f.cast.whale.tint('#fff0e0').pose('bow', t - LS(L) + 0.1).place(0.2, 0, 1.75, cam);
  const ly = 0.75 + eIn(range(t, LS(L), LE(L) + 0.5)) * 2.8; f.skyLantern.visible = f.skyLanternGlow.visible = true;
  f.skyLantern.scale.set(0.26, 0.4, 1); f.skyLantern.position.set(0.85 + Math.sin(t * 2) * 0.04, ly, 1.6); f.skyLanternGlow.position.set(0.85, ly + 0.05, 1.55);
  return f.scene;
}
const s9: ShotFn = (t, _u, S, _cam, G) => { const sc = wishScene(t, S, _cam); G.tint = [1.04, 0.97, 0.92]; G.bloom = 0.5; G.vign = 0.6; return sc; }; // 是唯一心愿
const s10: ShotFn = (t, _u, S, cam, G) => { // 可睁眼：可=合眼，睁=半睁，眼=全睁 → 现实
  const p = S.pier, L = 10, tK = ON(L, 0), tZ = ON(L, 1), tY = ON(L, 2);
  let lid = eIn(range(t, tK - 0.08, tK + 0.12)); lid = lerp(lid, 0.5, eOut(range(t, tZ, tZ + 0.3))); lid = lerp(lid, 0.62, bump(t, tZ + 0.35, 0.3)); lid = lerp(lid, 0, eOut(range(t, tY, tY + 0.35)));
  G.lid = lid;
  if (t < tK + 0.12) { G.tint = [1.04, 0.97, 0.92]; G.bloom = 0.5; G.vign = 0.6; return wishScene(t, S, cam); }
  const push = range(t, tZ, LE(L) + 0.4);
  setCam(cam, [0.75, 1.0 - push * 0.05, 3.4 - push * 0.6], [0.95, 0.85, 0.3], 38); pierAmb(S, t, cam, 0.75);
  (t >= tY ? p.whale.pose(t < tY + 0.7 ? 'surprise' : 'sad', t - tY) : p.whale.pose('idle', t)).tint('#b4c2ec').place(0.35, 0, 0.3, cam);
  p.fx.begin(); for (let i = 0; i < 140; i++) { const st = tZ + hash(i) * 1.2, age = t - st; if (age < 0) continue; const y = 3.2 - age * (0.9 + hash(i + 1) * 0.6); if (y < 0) continue; p.fx.add((hash(i + 2) - 0.5) * 3 + Math.sin(age * 3 + i) * 0.2, y, 0.3 + (hash(i + 3) - 0.5) * 2.4, 1, 0.78, 0.35, 0.9, 0.06); } p.fx.commit();
  G.sat = lerp(0.4, 0.75, range(t, tY, tY + 0.5)); G.tint = [0.84, 0.92, 1.12]; G.flash = (lid > 0.3 && lid < 0.7 ? 0.08 : 0); return p.scene;
};
const DREAM = [0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1];
const s11: ShotFn = (t, u, S, cam, G) => { // 现实和梦啊原来都在一瞬间：每个字切一次世界，本鲸站在同一位置
  const L = 11, k = charIdx(L, t), dream = k >= 0 && DREAM[k] === 1, push = range(t, LS(L) - 0.1, LE(L) + 0.1);
  const frame = (x0: number, z0: number) => setCam(cam, [x0 + Math.sin(u * 1.3) * 0.05, 1.0, z0 + 3.2 - push * 0.9], [x0, 0.78, z0], 36 - push * 4);
  const cut = k >= 0 ? decay(t, ON(L, k), 14) : 0, tJ = ON(L, 11); let sc: THREE.Scene;
  if (dream) { frame(0.2, 1.75); feastAmb(S, t, cam, 1); placeGuests(S, t, cam); S.feast.cast.whale.pose('idle', t).place(0.2, 0, 1.75, cam); G.tint = [1.05, 0.97, 0.9]; G.bloom = 0.45; sc = S.feast.scene; }
  else { frame(0.35, 0.3); pierAmb(S, t, cam, 0.8); S.pier.whale.tint('#b4c2ec').pose('idle', t).place(0.35, 0, 0.3, cam); G.tint = [0.84, 0.92, 1.12]; G.sat = 0.75; sc = S.pier.scene; }
  G.flash = cut * 0.2 + (t >= tJ ? decay(t, tJ, 5) * 0.82 : 0); G.split = k >= 9 ? 0.5 + cut : 0; return sc;
};
const s12: ShotFn = (t, _u, S, cam, G) => { // 我们的心像烟火：「火」炸成一颗心
  const h = S.harbor, L = 12, tilt = eIO(range(t, LS(L) - 0.1, ON(L, 6) + 0.3)), tF = ON(L, 6);
  setCam(cam, [0.5, lerp(0.7, 0.9, tilt), 4.4], [0, lerp(1.2, 6.5, tilt), -20], 52); const lit = harborAmb(S, t, cam);
  const tc = hex('#b8c0f0', '#ffd8e8', lit);
  h.cast.whale.show(true).tint(tc).pose(t > tF ? 'hop' : 'idle', t - tF).place(0, 0, 1.6, cam); h.cast.claude.show(true).tint(tc).pose('idle', t).place(1.0, 0, 2.0, cam);
  G.flash = t >= ON(11, 11) ? decay(t, ON(11, 11), 5) * 0.82 : 0; G.bloom = 0.9; return h.scene;
};
const s13: ShotFn = (t, _u, S, cam, G) => { // 一朵连结着一朵：七个字七朵烟火，金线连起
  const h = S.harbor, L = 13, k = eIO(range(t, LS(L) - 0.1, LE(L) + 0.3));
  setCam(cam, [lerp(-1.2, 1.6, k), 2.1, 8.6], [lerp(-1.5, 1.5, k), 5.2, -24], 50); const lit = harborAmb(S, t, cam);
  ROW.forEach(([ch, x], i) => { const tb = ON(L, i); h.cast[ch].show(true).tint(hex('#b8c0f0', '#ffe8d8', lit)).pose(t > tb && t < tb + 0.75 ? 'hop' : 'idle', t - tb).place(x, 0, 1.6, cam); });
  const pos = h.threads.geometry.attributes.position as THREE.BufferAttribute, idx = 3; let n = 0;
  for (let i = 0; i < 6; i++) { const A = BURSTS[idx + i].at, B = BURSTS[idx + i + 1].at, p = eOut(range(t, ON(L, i + 1), ON(L, i + 1) + 0.25)); if (p <= 0) continue; const e = mix3(A, B, p); pos.setXYZ(n * 2, A[0], A[1], A[2]); pos.setXYZ(n * 2 + 1, e[0], e[1], e[2]); n++; }
  pos.needsUpdate = true; h.threads.geometry.setDrawRange(0, n * 2); h.threads.visible = n > 0; (h.threads.material as THREE.LineBasicMaterial).opacity = 0.85 * (1 - range(t, LE(L) - 0.2, LE(L) + 0.5));
  G.bloom = 1.15; return h.scene;
};
const s14: ShotFn = (t, _u, S, cam, G) => { // 不独自飘落：火星两两相随落下
  const h = S.harbor, L = 14, k = eIO(range(t, LS(L) - 0.1, ON(L, 4) + 0.3));
  setCam(cam, [0.3, lerp(3.2, 1.5, k), lerp(7, 6.2, k)], [0, lerp(8, 1.2, k), lerp(-24, -2, k)], 48);
  const lit = harborAmb(S, t, cam, (P) => {
    for (let i = 0; i < 40; i++) { const y = 11 + hash(i + 1) * 4 - (t - LS(L) + 0.4) * (1.6 + hash(i + 2)); if (y < 0.3) continue; const x = (hash(i) - 0.5) * 18, z = -4 - hash(i + 3) * 14, a = t * 2.6 + i;
      for (const sgn of [1, -1]) P.add(x + Math.cos(a) * 0.3 * sgn, y + Math.sin(a * 0.7) * 0.08 * sgn, z + Math.sin(a) * 0.3 * sgn, 1, 0.82, 0.5, 1, 0.34); }
  });
  ROW.forEach(([ch, x]) => h.cast[ch].show(true).tint(hex('#c0c4f0', '#ffe8d0', lit * 0.6)).pose(ch === 'doubao' || ch === 'qwen' ? 'sway' : 'idle', t + x).place(x, 0, 1.6, cam));
  G.bloom = 1.0; return h.scene;
};
const s15: ShotFn = (t, _u, S, cam, G) => { // 赶走了寂寞：雨停云开
  const p = S.pier, L = 15, clear = eIO(range(t, ON(L, 0), ON(L, 4) + 0.2)), cr = eIO(range(t, LS(L) - 0.1, LE(L) + 0.1));
  setCam(cam, [0.35, lerp(0.9, 2.1, cr), lerp(3.2, 5.4, cr)], [lerp(0.35, -1, cr), lerp(0.8, 1.7, cr), lerp(0.3, -30, cr)], 50);
  pierAmb(S, t, cam, 0.7 * (1 - clear), clear);
  p.whale.tint(hex('#b4c2ec', '#ffffff', clear)).pose(t > ON(L, 3) ? 'hop' : 'idle', t - ON(L, 3)).place(0.35, 0, 0.3, cam);
  G.tint = [lerp(0.84, 1, clear), lerp(0.92, 1, clear), lerp(1.12, 1.05, clear)]; G.sat = lerp(0.72, 1, clear); G.bloom = 0.9; return p.scene;
};
const s16: ShotFn = (t, _u, S, cam, G) => { // 转身你在原地等我：镜头绕半圈，路灯下的小克
  const s = S.street, L = 16, tZ = ON(L, 0), orbit = eIO(range(t, tZ, ON(L, 4) + 0.1)), th = orbit * Math.PI, R = 3.1;
  const W: V3 = [0.2, 0, -3.0], C: V3 = [1.5, 0, 1.55];
  setCam(cam, [W[0] + Math.sin(th) * R, 1.1 + Math.sin(th) * 0.3, W[2] + Math.cos(th) * R], mix3([W[0], 0.85, W[2]], [(W[0] + C[0]) / 2, 0.85, (W[2] + C[2]) / 2], orbit), 40);
  streetAmb(S, t, cam); const spin = t >= tZ && t < tZ + 0.8;
  (spin ? s.whale.pose('spin', t - tZ) : t >= ON(L, 7) ? s.whale.pose('hop', t - ON(L, 7)) : s.whale.pose('idle', t)).tint('#ffe8e0').place(W[0], 0, W[2], cam);
  (t >= ON(L, 6) ? s.claude.pose('curtsy', t - ON(L, 6)) : s.claude.pose('idle', t)).tint('#fff0e0').place(C[0], 0, C[2], cam);
  G.tint = [1.08, 0.98, 0.95]; G.bloom = 0.85; return s.scene;
};
const s17: ShotFn = (t, _u, S, cam, G) => { // 也许会偶尔停泊
  const s = S.sea, L = 17, tB = ON(L, 6), drift = eOut(range(t, LS(L) - 0.3, tB + 0.15));
  const bx = lerp(-5.5, 2.3, drift), by = -0.2 + Math.sin(t * 2) * 0.035 * (1 - drift * 0.6);
  setCam(cam, [lerp(-2.5, 1.2, eIO(range(t, LS(L), LE(L)))), 1.5, 8.4], [lerp(-2, 2.4, drift), 0.9, -1.2], 40); seaAmb(S, t, cam, 0);
  s.boat.position.set(bx, by, 0); s.boat.rotation.z = Math.sin(t * 1.6) * 0.03 * (1 - drift * 0.7);
  s.cast.whale.show(true).tint('#d8dcff').pose(t > tB ? 'nod' : 'idle', t - tB).place(bx - 0.4, by + 0.36, 0, cam, -9);
  s.cast.claude.show(true).tint('#ffe8e0').pose('idle', t).place(bx + 0.45, by + 0.36, 0.05, cam, -9);
  G.bloom = 0.95; G.tint = [0.95, 0.97, 1.08]; return s.scene;
};
const s18: ShotFn = (t, u, S, cam, G) => { // 结束向前的念头：向前的灯从远到近熄灭
  const s = S.sea, L = 18, tStop = ON(L, 1), tTurn = ON(L, 6), rx = -40, wz = lerp(-1.0, -4.2, range(t, LS(L) - 0.4, tStop));
  setCam(cam, [rx + 2.6, 1.35, wz + 3.8], [rx - 0.2, 0.9, wz - 6], 42); seaAmb(S, t, cam, 0);
  const walking = t < tStop;
  (walking ? s.cast.whale.pose('walk', u) : t > tTurn ? s.cast.whale.pose('spin', t - tTurn) : s.cast.whale.pose('idle', t - tStop)).show(true).tint('#e0e4ff').place(rx + 0.1, 0.06, wz, cam);
  s.cast.claude.show(true).tint('#ffe8e0').pose('read', t).place(rx - 0.5, 0.06, -0.4, cam);
  s.roadLamps.forEach((l, i) => { const t0 = ON(L, 2) + (13 - i) * 0.12, on = i < 1 ? 1 : 1 - range(t, t0, t0 + 0.12); (l.halo.material as THREE.SpriteMaterial).opacity = 0.9 * on; l.bulb.visible = on > 0.5; l.cone.visible = on > 0.5; });
  G.tint = [0.95, 0.95, 1.08]; G.bloom = 0.9; return s.scene;
};
const s19: ShotFn = (t, u, S, cam, G) => { // 也不畏寂寞：银河下的礁石
  const s = S.sea, L = 19; setCam(cam, [33.2 - u * 0.2, 0.7, 1.4 - u * 0.15], [30, 3.6, -30], 56); seaAmb(S, t, cam, 0, 1);
  s.roadLamps.forEach((l) => { (l.halo.material as THREE.SpriteMaterial).opacity = 0.9; l.bulb.visible = l.cone.visible = true; });
  s.cast.whale.show(true).tint('#d8e0ff').pose(t > ON(L, 1) ? 'nod' : 'idle', t - ON(L, 1)).place(30, 0.42, -6, cam);
  const ts = ON(L, 3), sp = range(t, ts, ts + 0.6);
  if (sp > 0 && sp < 1) { s.milky.begin(); for (let k = 0; k < 20; k++) { const e = Math.max(0, sp - k * 0.012); s.milky.add(10 + e * 50, 60 - e * 24, -90, 1, 1, 1, (1 - k / 20) * (1 - sp), 5 - k * 0.2); } }
  G.bloom = 1.0; G.tint = [0.92, 0.95, 1.1]; return s.scene;
};
const s20: ShotFn = (t, _u, S, cam, G) => { // 和天空海阔：拉远，龙影只从画面上方掠过
  const s = S.sea, L = 20, k = eIO(range(t, LS(L) - 0.1, LE(L) + 0.15));
  setCam(cam, mix3([0.5, 1.3, 7], [0, 9, 26], k), mix3([1.5, 1.6, -20], [0, 4, -80], k), lerp(48, 62, k)); seaAmb(S, t, cam, 0.35 + 0.65 * k);
  s.boat.position.set(2.3, -0.2 + Math.sin(t * 2) * 0.02, 0); s.boat.rotation.z = 0;
  s.cast.whale.show(true).tint('#fff0e8').pose('idle', t).place(1.9, 0.16, 0, cam, -9); s.cast.claude.show(true).tint('#fff0e8').pose('idle', t).place(2.75, 0.16, 0.05, cam, -9);
  cam.updateMatrixWorld(); cam.getWorldDirection(_f); _r.crossVectors(_f, cam.up).normalize(); _up.crossVectors(_r, _f).normalize();
  const D = 24, top = D * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), side = top * (16 / 9), px = lerp(side + 4, -side - 4, range(t, LS(L) - 0.1, LE(L) + 0.1));
  s.dragon.mesh.visible = true; s.dragon.frame(Math.floor(t * 6) % 2 ? 'gpt_fly_1' : 'gpt_fly_0');
  s.dragon.mesh.position.copy(cam.position).addScaledVector(_f, D).addScaledVector(_up, top + s.dragon.h * s.dragon.size * 0.18).addScaledVector(_r, px); s.dragon.mesh.lookAt(cam.position);
  s.dragon.tint('#2a3050', 0.85);
  G.bloom = 0.5; G.tint = [1.0, 0.98, 1.0]; return s.scene;
};
const FRIENDS = [['claude', 1.6, 2.5], ['kimi', -1.5, 3.6], ['gemini', -0.6, 3.95], ['qwen', 2.55, 3.6], ['zai', 3.3, 3.1], ['doubao', -2.35, 3.2]] as const;
const s21: ShotFn = (t, _u, S, cam, G) => { // 转身看见你灿烂的笑容 + 片尾
  const d = S.dawn, L = 21, tZ = ON(L, 0), tSee = ON(L, 2), tCan = ON(L, 5), tXiao = ON(L, 8), orbit = eIO(range(t, tZ, ON(L, 4) + 0.1)), th = orbit * Math.PI, R = 3.3;
  const wy = groundY(0, -1), crane = eIO(range(t, LE(L) - 0.1, 51.2)), look = mix3([0, wy + 0.9, -1], [0.8, wy + 0.9, 1.4], orbit);
  setCam(cam, [Math.sin(th) * R + 0.8 * orbit, wy + 1.15 + crane * 3.2, -1 + Math.cos(th) * R], [look[0], look[1] + crane * 2.6, look[2]], 42);
  d.sky.mesh.position.copy(cam.position);
  const spin = t >= tZ && t < tZ + 0.8;
  (spin ? d.cast.whale.pose('spin', t - tZ) : t >= tXiao ? d.cast.whale.pose('hop', t - tXiao) : d.cast.whale.pose('idle', t)).tint('#fff4ec').place(0, wy, -1, cam);
  FRIENDS.forEach(([ch, x, z], i) => {
    const gy = groundY(x, z), a = d.cast[ch]; a.tint('#fff4ec');
    if (ch === 'claude') (t >= tXiao ? a.pose('hop', t - tXiao) : t >= tSee ? a.pose('curtsy', t - tSee) : a.pose('idle', t)).place(x, gy, z, cam);
    else (t >= tCan + i * 0.07 ? a.pose('hop', t - tCan - i * 0.07) : a.pose('idle', t + i)).place(x, gy, z, cam);
  });
  d.petals.begin(); if (t > tCan) for (let i = 0; i < 360; i++) { const age = t - tCan - hash(i) * 1.5; if (age < 0) continue; _c.setHSL(0.93 + hash(i + 1) * 0.12, 0.8, 0.82); d.petals.add((hash(i + 2) - 0.5) * 10 + age * 0.8 + Math.sin(age * 2 + i) * 0.3, 4.5 - age * 0.9, 1.5 + (hash(i + 3) - 0.5) * 6, _c.r, _c.g, _c.b, clamp(4 - age) * 0.9, 0.09); } d.petals.commit();
  d.sparkle.begin(); if (t > tXiao) for (let i = 0; i < 160; i++) { const age = t - tXiao, a = hash(i) * 6.28, v = 0.6 + hash(i + 1) * 1.6; d.sparkle.add(1.6 + Math.cos(a) * v * age, groundY(1.6, 2.5) + 1.0 + Math.sin(a) * v * age * 0.8, 2.5, 1, 0.9, 0.6, clamp(1 - age / 1.6), 0.07); } d.sparkle.commit();
  G.bloom = 0.45 + 0.25 * bump(t, tXiao, 0.9); G.tint = [1.02, 0.98, 0.95]; G.vign = 0.42; G.fade = range(t, 50.35, 50.85) * 0.88; return d.scene;
};

const FNS: ShotFn[] = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21];
const cutAt = (i: number) => (i === 0 ? 0 : LS(i) - 0.1);
export const SHOTS: Shot[] = FNS.map((fn, i) => ({ li: i, from: cutAt(i), to: i < FNS.length - 1 ? cutAt(i + 1) : 999, fn }));
export function shotAt(t: number) { let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].from) i = k; return { shot: SHOTS[i], index: i }; }
