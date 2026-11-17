// 分镜：按歌词意思重新构造的画面（不照搬《情歌》）。每个镜头只读时间 t，每帧重新摆人、摆景、摆镜头。
import * as THREE from 'three';
import { BEAT, DURATION } from './data';
import { LE, LS, LT, barStart, beatOf, beatPulse, bump, clamp, decay, eBack, eIO, eOut, hash, hopAt, jelly, lerp, path3, range, setCam, smooth, timeOfBeat, type V3 } from './core';
import { ROAD_PTS, STAGE_X, TEA_X, World, hillY } from './world';

export interface Grade { bloom: number; vig: number; warm: number; sway: number; flash: number; black: number; sat: number; grain: number; blur: number }
export interface Ctx { t: number; lt: number; p: number; dur: number; a: number; b: number }
let W: World; let cam: THREE.PerspectiveCamera; let G: Grade;
export function bindShots(w: World, c: THREE.PerspectiveCamera, g: Grade) { W = w; cam = c; G = g; }

// ---------- 小工具 ----------
const look = (p: number[], l: number[], fov = 40) => setCam(cam, p, l, fov);
function put(ch: string, x: number, z: number, act = 'idle', t0 = 0, y?: number) { const a = W.cast[ch]; a.show(); a.at(x, y ?? hillY(x, z), z); a.play(act, t0); return a; }
function prop(i: number, key: string, x: number, y: number, z: number, size = 0.6) { const p = W.props[i]; p.show(); p.still(key); p.at(x, y, z); p.size = size; return p; }
const roadAt = (u: number) => { const p = path3(ROAD_PTS, u); return p; };
const arc = (a: number[], b: number[], u: number, h: number): V3 => { const k = clamp(u); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(k * Math.PI) * h, lerp(a[2], b[2], k)]; };
function box(i: number, x: number, y: number, z: number, rz = 0, s = 1) { const b = W.boxes[i]; b.visible = true; b.position.set(x, y, z); b.rotation.set(0, 0.3 * (i % 3 - 1), rz); b.scale.setScalar(s); return b; }
function nearMoon(x: number, y: number, z: number, s = 2.6) { W.moon.visible = true; W.moon.position.set(x, y, z); W.moon.scale.setScalar(s); }
function bloomFlowers(t: number, t0: number, t1: number, cx = 0, cz = -3, glow = 0) {
  for (const f of W.flowers) { const d = Math.hypot(f.p.x - cx, f.p.z - cz); const at = lerp(t0, t1, clamp(d / 10) * 0.8 + f.t * 0.2); const s = jelly(Math.max(0, t - at) * 1.2, 6); f.g.scale.setScalar(Math.max(0.001, s)); f.g.rotation.z = 0; void glow; }
}
function swayFlowers(t: number, amp: number) { for (const f of W.flowers) { f.g.rotation.z = Math.sin(t * 2.2 + f.p.x * 0.5) * amp; f.g.rotation.x = Math.cos(t * 1.7 + f.p.z * 0.4) * amp * 0.5; } }
function fireflies(t: number, cx: number, cz: number, op = 1, rise = 0) {
  const P = W.fireflies; for (let i = 0; i < P.n; i++) { const a = hash(i) * 6.28 + t * (0.1 + hash(i + 1) * 0.2), r = 1 + hash(i + 2) * 9; P.set(i, cx + Math.cos(a) * r, 0.4 + ((hash(i + 3) * 3 + t * (0.2 + rise) * (0.3 + hash(i + 4))) % (3 + rise * 8)), cz + Math.sin(a) * r); }
  P.commit(); P.mat.opacity = op * (0.6 + Math.sin(t * 3) * 0.1);
}
function petals(t: number, cx: number, cz: number, op = 1, wind = 1) {
  const P = W.petals; for (let i = 0; i < P.n; i++) { const sp = 1.5 + hash(i) * 2; const x = ((hash(i + 1) * 30 + t * sp * wind) % 30) - 15; P.set(i, cx + x, 0.5 + hash(i + 2) * 5 + Math.sin(t * 2 + i) * 0.5 + Math.sin(x * 0.4 + i) * 0.6, cz + (hash(i + 3) - 0.5) * 14); }
  P.commit(); P.mat.opacity = op;
}
function lanterns(t: number, t0: number, cx: number, cz: number, n = 36, spread = 26) {
  for (let i = 0; i < Math.min(n, W.lanterns.length); i++) { const L = W.lanterns[i]; const st = t0 + hash(i * 3) * 6; const k = t - st; if (k < 0) continue; L.visible = true;
    L.position.set(cx + (hash(i) - 0.5) * spread + Math.sin(k * 0.5 + i) * 0.6, 0.6 + k * (0.5 + hash(i + 7) * 0.5), cz - 4 - hash(i + 5) * spread); L.rotation.y = k * 0.3; }
}
function clouds(t: number, near = 0, cx = 0, cz = -4) {
  W.clouds.forEach((c, i) => { if (near > 0 && i < 5) { const k = near; c.position.set(cx + (i - 2) * 5.5 + Math.sin(t * 0.3 + i) * 0.8 - (1 - k) * 25 * (i % 2 ? -1 : 1), 5.5 + (i % 2) * 1.6, cz - 8 - (i % 3) * 3); c.scale.setScalar(0.8); }
    else { c.position.x = ((hash(i * 17) - 0.5) * 120 + t * 0.6 + 60) % 120 - 60; c.position.y = 14 + hash(i * 19) * 10; c.position.z = -30 - hash(i * 23) * 50; c.scale.setScalar(1.2 + hash(i) * 1.4); } });
}
function gang(t: number, list: [string, number, number, string][]) { for (const [ch, x, z, act] of list) put(ch, x, z, act, t - (hash(x * 7) * 2)); }
const ALL = ['whale', 'claude', 'gpt', 'gemini', 'kimi', 'doubao', 'qwen', 'zai'];
const BEHIND: [string, number, number, string][] = [['claude', -2.4, -4.2, 'idle'], ['gpt', 2.6, -4.6, 'float'], ['gemini', -4.2, -2.6, 'sway'], ['kimi', 4.2, -2.6, 'idle'], ['doubao', -1.2, -2.3, 'sway'], ['qwen', 1.4, -2.2, 'sway'], ['zai', -5.6, -4.4, 'doze'], ['whale', 0.1, -3.4, 'idle']];

type ShotFn = (c: Ctx) => void;
export interface Shot { a: number; b: number; label: string; f: ShotFn; line?: number }
const L = (n: number) => LS(n) - 0.12;

// ---------- 片头：大家都在赶 ----------
const introA: ShotFn = ({ t, p }) => {
  W.setTOD(0.06, 0.35); clouds(t);
  const u = lerp(0.2, 0.085, p); const r = roadAt(u);
  const wh = put('whale', r[0], r[2], 'walk', 0, 0); wh.body.position.y = Math.abs(Math.sin(t * 9)) * 0.08;
  for (let i = 0; i < 3; i++) box(i, r[0] + Math.sin(t * 9 + i) * 0.04, 1.8 + i * 0.5, r[2] + 0.1, Math.sin(t * 6 + i) * 0.08, 0.9);
  prop(0, 'fx_sweat', r[0] + 0.55, 2.1 + Math.sin(t * 8) * 0.05, r[2] + 0.2, 0.5);
  W.clock.visible = true; W.clock.position.set(r[0] - 3.5, 3.6, r[2] - 6); W.clock.rotation.set(0, 0.35, Math.sin(t * 9) * 0.05);
  W.clockHands[0].rotation.z = -t * 3; W.clockHands[1].rotation.z = -t * 36;
  const s = 1 + decay(t, timeOfBeat(Math.floor(beatOf(t))), 8) * 0.06; W.clock.scale.setScalar(s);
  put('gemini', r[0] - 2.2, r[2] - 7 + p * 3, 'walk', 0, 0).flip = true; put('zai', r[0] + 2.5, r[2] - 10 + p * 4, 'walk', 0, 0);
  look([r[0] + 1.2, 1.6, r[2] + 6.5 - p * 0.6], [r[0], 1.6, r[2] - 2], 42); W.focus(r[0], r[2]);
  G.black = 1 - range(t, 0, 1.6);
};
const introB: ShotFn = ({ t, p, lt }) => {
  W.setTOD(0.08, 0.4); clouds(t);
  const x = TEA_X - 12 + p * 9; const wh = put('whale', x, 6, 'walk', 0, 0); wh.flip = true; wh.body.position.y = Math.abs(Math.sin(t * 9)) * 0.08;
  for (let i = 0; i < 4; i++) box(i, x + Math.sin(t * 9 + i) * 0.05 * (i + 1), 1.8 + i * 0.5, 6.1, Math.sin(t * 5 + i) * 0.06 * (i + 1), 0.9);
  prop(0, 'fx_sweat', x + 0.6, 2.2, 6.2, 0.5); if (lt > 3.6) prop(1, 'fx_exclaim', x, 4.6 + Math.sin(t * 10) * 0.05, 6, 0.6);
  W.clock.visible = true; W.clock.position.set(x - 3.2, 3.0, 2.5); W.clock.rotation.set(0, 0.3, 0); W.clock.scale.setScalar(0.75 + decay(t, timeOfBeat(Math.floor(beatOf(t))), 8) * 0.08);
  W.clockHands[0].rotation.z = -t * 5; W.clockHands[1].rotation.z = -t * 60;
  put('kimi', x - 4, 3 - p * 2, 'walk', 0, 0).flip = true; put('doubao', x + 4, 2.5, 'walk', 0, 0);
  const sh = Math.sin(t * 23) * 0.04 + Math.sin(t * 31) * 0.03;
  look([x - 0.5 + sh, 1.8 + sh, 13], [x + 0.5, 1.9, 6], 38); W.focus(x, 6);
};
const introC: ShotFn = ({ t, lt, p }) => {
  W.setTOD(0.1, 0.4);
  const x = TEA_X - 3; const wh = put('whale', x, 6, 'surprise', 0, 0); wh.still(p < 0.5 ? 'act_whale_surprise_2' : 'act_whale_surprise_4'); wh.spin = Math.sin(lt * 8) * 0.15;
  for (let i = 0; i < 4; i++) { const q = arc([x, 1.85 + i * 0.5, 6], [x + (i - 1.5) * 1.6, 0.25, 6 + (i % 2 ? 1 : -0.6)], lt / 1.2, 1.8 + i * 0.4); box(i, q[0], q[1], q[2], lt * (3 + i), 0.9); }
  prop(1, 'fx_exclaim', x, 4.4, 6, 0.7);
  look([x + Math.sin(lt * 30) * 0.05, 1.6, 11 - p * 1.5], [x, 1.6, 6], 40); W.focus(x, 6);
  G.flash = decay(t, LS(1) - 0.5, 5) * 0.25;
};

// ---------- 主歌前副歌 ----------
const L1: ShotFn = ({ t, p }) => { // 慌啥子嘛 慢慢来
  W.setTOD(0.12, 0.42); clouds(t);
  const x = TEA_X - 3;
  const wh = put('whale', x, 6, 'idle', 0, 0); wh.cue(t, [[0, 'act_whale_surprise_4'], [LT(1, 2), 'idle'], [LT(1, 5), 'nod']]);
  const q = put('qwen', x - 2 + (1 - eOut(range(t, LS(1) - 0.3, LT(1, 1)))) * -3, 6.3, 'walk', 0, 0); if (t > LT(1, 1)) q.play('tilt', LT(1, 1)); if (t > LT(1, 4)) q.play('sway', LT(1, 4));
  prop(2, 'prop_fan', q.root.position.x + 0.55, 1.15 + Math.sin(t * 4) * 0.08, 6.5, 0.55).spin = Math.sin(t * 4) * 0.3;
  for (let i = 0; i < 4; i++) box(i, x + (i - 1.5) * 1.6, 0.25, 6 + (i % 2 ? 1 : -0.6), 0, 0.9);
  // 「慢慢来」：钟慢下来、停住
  W.clock.visible = true; W.clock.position.set(x + 2.6, 2.4, 4.5); W.clock.rotation.set(0, -0.3, 0); W.clock.scale.setScalar(0.75);
  const slow = range(t, LT(1, 4), LT(1, 6) + 0.6); const sp = lerp(60, 0.3, eOut(slow));
  W.clockHands[1].rotation.z = -(t - LS(1)) * sp * 0.6 - 3; W.clockHands[0].rotation.z = -(t - LS(1)) * sp * 0.05;
  look([x - 0.5 + p * 0.4, 1.7, 11.5 - p * 2.5], [x - 0.4, 1.3, 6], 36); W.focus(x, 6);
  G.warm = 0.15 * slow;
};
const L2: ShotFn = ({ t, p }) => { // 太阳下山有月亮爬上来
  const sink = range(t, LS(2), LT(2, 4)); const rise = range(t, LT(2, 5), LE(2));
  W.setTOD(lerp(0.2, 0.78, smooth(p)), lerp(0.22, -0.25, smooth(sink * 0.8 + rise * 0.2)), -0.5, 0.15); clouds(t);
  put('whale', -0.7, -3.4, 'idle').flip = true; put('qwen', 0.7, -3.5, 'sway');
  const my = lerp(-3.5, 4.5, eOut(rise)); nearMoon(4, my, -24, 3.2);
  const k = put('kimi', 4, -24, rise > 0.6 ? 'bow' : 'idle', LT(2, 8), my + 3.1); k.size = 1.1; k.shadow.visible = false;
  look([lerp(-1.5, -0.8, p), 2.1, 4.5], [1.5, lerp(1.6, 2.6, rise), -12], 44); W.focus(0, -4);
  G.warm = 0.2 * sink;
};
const L3: ShotFn = ({ t, p }) => { // 云会在 花会开
  W.setTOD(0.1, 0.5); const ci = eOut(range(t, LS(3) - 0.3, LT(3, 2) + 0.4)); clouds(t, ci, 0, -4);
  bloomFlowers(t, LT(3, 3), LT(3, 5) + 0.5, -1.5, -3); swayFlowers(t, 0.08);
  put('claude', -1.5, -3, t > LT(3, 3) ? 'curtsy' : 'read', LT(3, 3));
  if (t > LT(3, 5)) prop(3, 'fx_sparkle_' + (Math.floor(t * 8) % 3), -1.2, 2.5, -2.8, 0.6);
  petals(t, 0, -3, range(t, LT(3, 4), LT(3, 5)) * 0.9, 0.5);
  look([lerp(1.6, 0.6, p), lerp(1.2, 1.5, p), 1.4], [-1.4, lerp(1.9, 1.7, p), -3], 40); W.focus(-1, -3);
};
const L4: ShotFn = ({ t, p }) => { // 好运总会为你而等待
  W.setTOD(0.3, 0.2); clouds(t);
  put('doubao', 2.2, -2.2, 'sway');
  const wh = put('whale', lerp(-3.2, -0.6, eOut(range(t, LS(4), LT(4, 5)))), -2.6, t < LT(4, 5) ? 'walk' : 'surprise', LT(4, 5));
  if (t > LT(4, 7)) wh.play('hop', LT(4, 7));
  const wait = range(t, LT(4, 7), LE(4)); W.luckStar.visible = true;
  W.luckStar.position.set(lerp(0.9, wh.root.position.x + 0.1, eIO(wait)), lerp(2.8, wh.root.position.y + 2.5, eIO(wait)) + Math.sin(t * 3) * 0.1, -2.4);
  W.luckStar.rotation.set(0, t * 1.4, Math.sin(t * 2) * 0.2); W.luckStar.scale.setScalar(0.42 * (1 + beatPulse(t, 1, 6) * 0.12));
  prop(3, 'fx_sparkle_' + (Math.floor(t * 8) % 3), W.luckStar.position.x + 0.4, W.luckStar.position.y + 0.3, -2.3, 0.5);
  look([lerp(0.5, 0.2, p), 1.5, 4.8 - p], [0, 1.6, -2.5], 40); W.focus(0, -2.5);
};
// ---------- 主歌一 ----------
const L5: ShotFn = ({ t, p }) => { // 卸下一身的疲惫
  W.setTOD(0.42, 0.06, -0.4); clouds(t);
  const wh = put('whale', 0, -3.2, t < LT(5, 5) ? 'sad' : 'sway', t < LT(5, 5) ? LS(5) : LT(5, 5));
  const y0 = wh.root.position.y;
  for (let i = 0; i < 6; i++) { const at = LT(5, Math.min(6, i)); const k = range(t, at, at + 0.45);
    const tgt = [lerp(-2, 2, i / 5), hillY(lerp(-2, 2, i / 5), -2.3) + 0.25, -2.3 + (i % 2) * 0.4];
    const q = arc([0, y0 + 1.8 + i * 0.48, -3.1], tgt, k, 0.6); const b = box(i, q[0], q[1], q[2], k < 1 ? k * 2 : 0, 0.85);
    if (k >= 1) { const sq = decay(t, at + 0.45, 9) * 0.3; b.scale.set(0.85 * (1 + sq), 0.85 * (1 - sq), 0.85); } }
  wh.squash = -range(t, LT(5, 5), LT(5, 6)) * 0.06 + decay(t, LT(5, 1), 6) * 0.08;
  look([lerp(1.2, 0.4, p), 1.8, 5.5 - p * 1.2], [0, 1.9, -3], 38); W.focus(0, -3);
};
const L6: ShotFn = ({ t, p }) => { // 今夜枕着星光再入睡
  W.setTOD(0.92); clouds(t);
  W.bed.visible = true; W.bed.position.set(0, 2.6 + Math.sin(t * 0.9) * 0.15, -4); W.bed.rotation.set(0, 0.2, Math.sin(t * 0.7) * 0.03);
  const wh = put('whale', -1.4, -4, 'idle', 0, W.bed.position.y + 1.2); wh.lay = Math.PI / 2; wh.shadow.visible = false; wh.root.position.x = 0.1; wh.body.position.x = -0.6;
  if (t > LT(6, 6)) prop(4, 'fx_zzz_' + (Math.floor(t * 3) % 3), 0.9, W.bed.position.y + 1.6 + Math.sin(t) * 0.1, -3.6, 0.5);
  nearMoon(-6, 9, -26, 3); put('kimi', -6, -26, 'think', 0, 12.1).shadow.visible = false;
  fireflies(t, 0, -4, 0.7);
  W.stars.mat.opacity = 0.7 + Math.sin(t * 5) * 0.2 + range(t, LT(6, 4), LT(6, 5)) * 0.3;
  look([lerp(2.8, 2.0, p), lerp(7.6, 6.8, p), 0.8], [-0.4, 3.4, -4], 42); W.focus(0, -4);
};
const L7: ShotFn = ({ t, p }) => { // 风啊轻轻吹
  W.setTOD(0.68, -0.2, 0.7); clouds(t);
  swayFlowers(t, 0.25 + Math.sin(t * 1.3) * 0.1); petals(t, 0, -3, 0.9, 1.4);
  const g = put('gpt', lerp(-8, 8, smooth(p)), -6, 'float', 0, 4.2 + Math.sin(t * 2) * 0.4); g.flip = false; g.shadow.visible = false;
  put('whale', 0.5, -2.5, 'sway');
  nearMoon(2, 9, -30, 3.4);
  look([-0.8, 0.8, 3.2], [0.4, lerp(2.3, 3.2, p), -4], 46); W.focus(0, -3);
};
const L8: ShotFn = ({ t, p }) => { // 这一刻就忘了你是谁
  W.setTOD(0.86); clouds(t); nearMoon(0, 6, -30, 6);
  const sil = range(t, LT(8, 4), LE(8));
  ALL.forEach((ch, i) => { const x = (i - 3.5) * 1.25; const a = put(ch, x, -3.5 - Math.abs(i - 3.5) * 0.2, ch === 'gpt' ? 'hover' : ch === 'zai' ? 'doze' : 'idle', -i * 0.4); a.tint(new THREE.Color(0xffffff).lerp(new THREE.Color(0x3a2f6a), sil).getHex());
    const tag = W.tags[i]; tag.visible = true; const up = range(t, LT(8, 3) + i * 0.12, LE(8) + 0.8); tag.position.set(x + Math.sin(t + i) * up * 0.6, a.root.position.y + 2.5 + eIO(up) * 4, a.root.position.z + 0.1);
    tag.rotation.set(0, 0, Math.sin(t * 2 + i) * 0.2 * up); (tag.material as THREE.MeshBasicMaterial).opacity = 1 - range(up, 0.5, 1); tag.scale.setScalar(0.9); tag.lookAt(cam.position); });
  fireflies(t, 0, -3.5, 0.6 + sil * 0.4, sil);
  look([0, 2.4, lerp(7.5, 10, p)], [0, 2.3, -4], 42); W.focus(0, -4);
};
const L9: ShotFn = ({ t, p }) => { // 有时清醒有时醉
  W.setTOD(0.74); clouds(t);
  const drunk = range(t, LT(9, 5), LT(9, 6) + 0.3);
  const q = put('qwen', TEA_X - 3, 0.1, drunk > 0 ? 'sway' : 'idle', 0, 0.5); prop(2, 'prop_teacup', q.root.position.x + 0.5, 1.6, 0.3, 0.45);
  const wh = put('whale', TEA_X - 1.2, 0.2, drunk > 0 ? 'spin' : 'nod', LT(9, 1), 0.5); void wh;
  put('gemini', TEA_X + 2.2, -0.2, 'sway', 0, 0.5);
  if (drunk > 0) prop(5, 'fx_dizzy_' + (Math.floor(t * 8) % 4), TEA_X - 1.2, 2.9, 0.4, 0.55);
  if (t < LT(9, 4)) prop(6, 'fx_bulb', TEA_X - 3, 3.0, 0.3, 0.5);
  const sw = drunk * 0.25;
  look([TEA_X - 1.5 + Math.sin(t * 1.6) * sw, 3.0 + Math.sin(t * 2.1) * sw * 0.5, 5.2 - p * 0.8], [TEA_X - 1.2, 1.5, 0], 42); cam.rotateZ(Math.sin(t * 1.3) * 0.08 * drunk);
  G.sway = drunk * 0.6; G.warm = 0.2 + drunk * 0.15; G.bloom = 1 + drunk * 0.6; W.focus(TEA_X, 0);
};
const L10: ShotFn = ({ t, p }) => { // 别把所有压力自己背
  W.setTOD(0.4, 0.05, -0.4); clouds(t);
  const wh = put('whale', 0, -3, 'sad', LS(10)); const y0 = wh.root.position.y;
  const helpers: [string, number, number][] = [['gpt', -3.2, -3.4], ['gemini', 3, -3.2], ['kimi', -2, -1.8], ['zai', 2, -1.8], ['doubao', -4, -2.2], ['claude', 4, -2.4]];
  const nTaken = helpers.filter((_, i) => t >= LT(10, 2 + i)).length;
  helpers.forEach(([ch, hx, hz], i) => { const at = LT(10, 2 + i); const k = range(t, at - 0.35, at); const a = put(ch, lerp(hx * 1.6, hx, eOut(k)), hz, k < 1 ? 'walk' : (ch === 'gpt' ? 'float' : 'hop'), at); a.flip = hx > 0;
    const take = range(t, at, at + 0.4); const top: number[] = [0, y0 + 1.8 + Math.max(0, i - nTaken + (t >= at ? 1 : 0)) * 0.48, -2.9]; const dst: number[] = [hx, a.root.position.y + 1.8, hz + 0.1];
    const q = arc(top, dst, take, 0.7); box(i, q[0], q[1], q[2], Math.sin(t * 4 + i) * 0.08 * (1 - take), 0.85); });
  for (let i = 6; i < 8; i++) box(i, Math.sin(t * 5 + i) * 0.03 * (i - 5), y0 + 1.8 + (i - nTaken) * 0.48, -2.9, Math.sin(t * 4 + i) * 0.05, 0.85);
  if (t > LT(10, 7)) wh.play('wave', LT(10, 7));
  look([0, 2.4, lerp(7, 8.6, p)], [0, 2.2, -3], 44); W.focus(0, -3);
};
const L11: ShotFn = ({ t, p }) => { // 人生路还远
  W.setTOD(0.34, 0.08, -0.3, 0.1); clouds(t);
  const u0 = 0.06 + p * 0.035;
  ['whale', 'claude', 'gemini', 'kimi', 'zai'].forEach((ch, i) => { const r = roadAt(u0 + (i % 2) * 0.004 - Math.floor(i / 2) * 0.006); put(ch, r[0] + (i % 2 ? 0.7 : -0.7), r[2], 'walk', i * 0.1, 0); W.cast[ch].flip = true; });
  const g = put('gpt', roadAt(u0 - 0.006)[0], roadAt(u0 - 0.006)[2], 'float', 0, 3); g.shadow.visible = false; g.flip = true;
  const r = roadAt(u0 - 0.01); const h = lerp(2.4, 11, eIO(p));
  look([r[0] + 1, h, r[2] + lerp(5, 9, p)], [r[0], lerp(1.4, 0, p), r[2] - lerp(5, 16, p)], 46); W.focus(r[0], r[2]);
};
const L12: ShotFn = ({ t, p }) => { // 你不必事事都完美
  W.setTOD(0.28, 0.25); clouds(t);
  W.ring.visible = true; W.ring.position.set(0.1, 2.5, -2.4); W.ring.rotation.set(0, -0.2, Math.sin(t) * 0.05);
  const draw = range(t, LS(12), LT(12, 6)); W.ringGeo.setDrawRange(0, Math.floor(W.ringGeo.index!.count * draw / 6) * 6);
  const wb = 1 + Math.sin(t * 6) * 0.03 * range(t, LT(12, 6), LE(12)); W.ring.scale.set(wb, 2 - wb, 1);
  const z = put('zai', -2.6, -3.4, t < LT(12, 6) ? 'nod' : 'alert', LS(12)); prop(2, 'prop_brush', z.root.position.x + 0.6, z.root.position.y + 1.1, -3.2, 0.5);
  const wh = put('whale', 2.6, -3.3, t < LT(12, 6) ? 'idle' : 'hop', LT(12, 6)); wh.flip = true;
  if (t > LT(12, 6)) { prop(3, 'fx_heart', 1.6 + Math.sin(t * 3), 4 + (t - LT(12, 6)) * 0.8, -3.2, 0.5); prop(4, 'fx_heart', -0.5, 4.5 + (t - LT(12, 6)) * 0.6, -3.3, 0.4); }
  look([0.2, 2.2, lerp(5.6, 4.9, p)], [0.1, 2.1, -3], 46); W.focus(0, -3.5);
};
// ---------- 副歌 × 2 ----------
const L13: ShotFn = ({ t, p }) => { // 慌啥子嘛 慢慢来（金色午后，大家都躺平）
  W.setTOD(0.3, 0.2, -0.4); clouds(t);
  gang(t, BEHIND); const q = W.cast.qwen; prop(2, 'prop_fan', q.root.position.x + 0.5, q.root.position.y + 1.1 + Math.sin(t * 4) * 0.07, -2.1, 0.5).spin = Math.sin(t * 4) * 0.3;
  prop(4, 'fx_zzz_' + (Math.floor(t * 3) % 3), -5.2, W.cast.zai.root.position.y + 2.3, -4.2, 0.45);
  bloomFlowers(t, -10, -9); swayFlowers(t, 0.06);
  const a = lerp(-0.5, 0.2, p); look([Math.sin(a) * 10, 3.2, -3.5 + Math.cos(a) * 10], [0, 1.6, -3.5], 40); W.focus(0, -3.5);
};
const L14: ShotFn = ({ t, p }) => { // 太阳下山有月亮爬上来（围着山坡转一圈的延时）
  const sink = range(t, LS(14), LT(14, 4)); const rise = range(t, LT(14, 5), LE(14));
  W.setTOD(lerp(0.32, 0.8, smooth(p)), lerp(0.2, -0.25, sink), lerp(-0.3, 0.8, rise), 0); clouds(t * 3);
  gang(t, BEHIND);
  const my = lerp(-4, 5.5, eBack(rise, 1.2)); nearMoon(-7, my, -22, 3.2); const k = put('kimi', -7, -22, rise > 0.5 ? 'hop' : 'idle', LT(14, 8), my + 3.1); k.shadow.visible = false;
  const a = lerp(0.6, -0.4, smooth(p)); look([Math.sin(a) * 11, 2.8, -3.5 + Math.cos(a) * 11], [-1, lerp(1.6, 3, rise), -8], 42); W.focus(0, -3.5);
};
const L15: ShotFn = ({ t, p }) => { // 云会在 花会开（月光下）
  W.setTOD(0.74); const ci = eOut(range(t, LS(15) - 0.4, LT(15, 2) + 0.4)); clouds(t, ci, 0, -4);
  bloomFlowers(t, LT(15, 3) - 0.1, LT(15, 5) + 0.6, 0, -3); swayFlowers(t, 0.08); fireflies(t, 0, -3, 0.9);
  put('claude', -1, -3, 'curtsy', LT(15, 3)); put('gemini', 1.2, -3.4, 'spin', LT(15, 3));
  petals(t, 0, -3, range(t, LT(15, 4), LT(15, 5)) * 0.8, 0.6);
  look([lerp(-2.5, 2.5, p), 0.9, 2.8], [0, 1.8, -3.5], 44); W.focus(0, -3);
};
const L16: ShotFn = ({ t, p }) => { // 好运总会为你而等待（灯开始升起来）
  W.setTOD(0.82); clouds(t); lanterns(t, LS(16) - 1, 0, -8, 18);
  put('doubao', 1.6, -2.6, 'sway'); const wh = put('whale', -1.2, -2.6, t < LT(16, 7) ? 'idle' : 'hop', LT(16, 7));
  W.luckStar.visible = true; const d = range(t, LS(16), LT(16, 7)); W.luckStar.position.set(lerp(3, wh.root.position.x + 0.1, eIO(d)), lerp(7, wh.root.position.y + 2.5, eIO(d)) + Math.sin(t * 3) * 0.1, -2.5);
  W.luckStar.rotation.set(0, t * 1.8, 0); W.luckStar.scale.setScalar(0.42 * (1 + beatPulse(t, 1, 6) * 0.15));
  prop(3, 'fx_sparkle_' + (Math.floor(t * 8) % 3), W.luckStar.position.x - 0.4, W.luckStar.position.y + 0.3, -2.4, 0.5);
  look([0.2, 1.7, 5 - p * 0.8], [0, lerp(2.6, 1.9, p), -3], 42); W.focus(0, -3);
};
const L17: ShotFn = ({ t, p }) => { // 慌啥子嘛 慢慢来（排队慢慢走）
  W.setTOD(0.6, -0.1, 0.4); clouds(t); lanterns(t, LS(16) - 1 - 4, 0, -8, 18);
  ALL.forEach((ch, i) => { const x = lerp(-9, 6, p * 0.5) + (3.5 - i) * 1.5; const a = put(ch, x, -3.2 + (i % 2) * 0.5, ch === 'gpt' ? 'float' : 'walk', i * 0.1); a.flip = true; if (ch === 'gpt') a.body.position.y = 0.6; });
  look([lerp(-6, -2.5, p), 1.6, 4], [lerp(-6, -2.5, p), 1.5, -3.2], 40); W.focus(-3, -3);
};
const L18: ShotFn = ({ t, p }) => { // 每个人都有自己的节拍
  W.setTOD(0.72); clouds(t); lanterns(t, LS(18) - 8, STAGE_X, -4, 24);
  const subs = [1, 2, 0.5, 1, 4, 2, 1, 0.5]; const ph = [0, 0.5, 0, 0.25, 0, 0, 0.5, 0.5];
  ALL.forEach((ch, i) => { const a0 = (i / 8) * Math.PI * 2; const x = STAGE_X + Math.cos(a0) * 5.5, z = Math.sin(a0) * 5.5; const h = hopAt(t, subs[i], ph[i]);
    const a = put(ch, x, z, ch === 'gpt' ? 'float' : 'idle', 0, 1.0 + h * (0.5 / Math.sqrt(subs[i]))); a.squash = (1 - h) * 0.08;
    const dr = W.drums[i]; dr.scale.y = 0.5 - (1 - h) * 0.12; W.drumMats[i].emissiveIntensity = 0.1 + Math.pow(1 - h, 6) * 1.4; });
  const a = lerp(0.2, 1.4, p); look([STAGE_X + Math.sin(a) * 13, 5.5, Math.cos(a) * 13], [STAGE_X, 1.2, 0], 42); W.focus(STAGE_X, 0);
};
const L19: ShotFn = ({ t }) => { // 得不到 就放开
  W.setTOD(0.78); clouds(t);
  const reach = t < LT(19, 3); const wh = put('whale', 0, -3, reach ? 'point' : 'wave', reach ? LS(19) : LT(19, 3)); const y0 = wh.root.position.y;
  W.luckStar.visible = true; W.luckStar.position.set(1.6, 9 + Math.sin(t) * 0.2, -6); W.luckStar.rotation.set(0, t, 0); W.luckStar.scale.setScalar(0.5);
  const up = range(t, LT(19, 3), LE(19) + 1); const b = W.balloons[0]; b.visible = true;
  b.position.set(0.55 + Math.sin(t * 2) * 0.05 + up * 0.8, y0 + 0.9 + eIO(up) * 7, -2.9); b.rotation.z = Math.sin(t * 1.6) * 0.12;
  put('claude', -2.4, -2.6, 'tilt', LS(19)); put('gemini', 2.5, -2.6, 'lookaround', LS(19)).flip = true;
  if (up > 0.2) prop(3, 'fx_sparkle_' + (Math.floor(t * 8) % 3), 1.6, 9.6, -6, 0.6);
  look([0.2, lerp(1.6, 2.4, up), 6], [0.4, lerp(2.6, 5.5, eIO(up)), -3.5], 46); W.focus(0, -3);
};
const L20: ShotFn = ({ t, p }) => { // 一切都是最好的安排
  W.setTOD(0.86); clouds(t); lanterns(t, LS(20) - 2, 0, -2, 30);
  const k = eOut(range(t, LS(20) - 0.2, LT(20, 4)));
  ALL.forEach((ch, i) => { const tx = (i - 3.5) * 1.15, tz = -3.4 - Math.abs(i - 3.5) * 0.15; const sx = tx * 3 + (hash(i) - 0.5) * 6, sz = tz + 4;
    const a = put(ch, lerp(sx, tx, k), lerp(sz, tz, k), k < 1 ? (ch === 'gpt' ? 'float' : 'walk') : (ch === 'gpt' ? 'hover' : ch === 'claude' ? 'curtsy' : 'wave'), LT(20, 4)); a.flip = sx > tx; });
  fireflies(t, 0, -3, 0.7, 0.3);
  look([0, lerp(2.2, 7, eIO(p)), lerp(8, 12, p)], [0, lerp(2, 4, p), -4], 42); W.focus(0, -3.5);
};
// ---------- 间奏：夜 → 新的一天 ----------
const I1: ShotFn = ({ t, p }) => {
  W.setTOD(0.95); clouds(t); lanterns(t, LS(20) - 2, TEA_X - 20, 0, 36, 40);
  put('zai', TEA_X - 3, 0.1, 'doze', 0, 0.5); prop(4, 'fx_zzz_' + (Math.floor(t * 3) % 3), TEA_X - 2.6, 2.8, 0.3, 0.5);
  put('kimi', TEA_X + 3, 0.1, 'think', 0, 0.5); prop(2, 'prop_scroll', TEA_X + 3.5, 1.4, 0.3, 0.5);
  put('qwen', TEA_X + 0.2, 2.2, 'idle', 0, 0.5);
  const x = lerp(TEA_X - 22, TEA_X - 2, eIO(p)); look([x, lerp(12, 4, eIO(p)), lerp(26, 10, eIO(p))], [TEA_X, 1.6, 0], 40); W.focus(TEA_X, 0);
};
const I2: ShotFn = ({ t, p }) => {
  const d = smooth(range(p, 0.1, 0.85)); W.setTOD(lerp(0.95, 0.06, d), lerp(-0.25, 0.35, d), lerp(0.8, -0.3, d), -0.2); clouds(t * 2);
  W.bed.visible = true; W.bed.position.set(0, 2.2, -4); W.bed.rotation.set(0, 0.2, 0);
  const wake = range(t, barStart(55), barStart(55) + 0.4);
  const wh = put('whale', 0, -4, wake > 0 ? 'wave' : 'idle', barStart(55), 3.35); wh.lay = (1 - wake) * Math.PI / 2; wh.shadow.visible = false; wh.body.position.x = (1 - wake) * -0.6;
  if (wake > 0) prop(1, 'fx_shine', 0.8, 5.2, -3.6, 0.6);
  bloomFlowers(t, -10, -9); swayFlowers(t, 0.05);
  const a = lerp(-0.8, 0.3, eIO(p)); look([Math.sin(a) * 8, lerp(5.6, 5, p), -4 + Math.cos(a) * 8], [0, 3.6, -4], 42); W.focus(0, -4);
};
// ---------- 主歌二（同一段词，换一种画） ----------
const L21: ShotFn = ({ t, p }) => { // 卸下一身的疲惫（茶馆，放下背篓）
  W.setTOD(0.16, 0.45); clouds(t);
  const wh = put('whale', TEA_X - 1.5, 0.2, t < LT(21, 5) ? 'walk' : 'bow', LT(21, 5), 0.5); wh.root.position.x = lerp(TEA_X - 6, TEA_X - 1.5, eOut(range(t, LS(21), LT(21, 4))));
  const x0 = wh.root.position.x;
  for (let i = 0; i < 5; i++) { const at = LT(21, 1 + i); const k = range(t, at, at + 0.4); const q = arc([x0, 2.3 + i * 0.48, 0.2], [TEA_X - 3.6 + (i % 3) * 0.75, 1.75 + Math.floor(i / 3) * 0.5, -1.8], k, 0.8); box(i, q[0], q[1], q[2], 0, 0.75); }
  const q = put('qwen', TEA_X + 0.6, 0.1, t > LT(21, 5) ? 'bow' : 'idle', LT(21, 5), 0.5); q.flip = true; prop(2, 'prop_teacup', TEA_X + 0.1, 1.6, 0.3, 0.45);
  prop(5, 'fx_steam_' + (Math.floor(t * 4) % 3), TEA_X + 0.1, 2.1, 0.3, 0.45);
  look([TEA_X - 1.5, 2.8, 6 - p], [TEA_X - 1.8, 1.5, -0.6], 42); W.focus(TEA_X, 0);
};
const L22: ShotFn = ({ t, p }) => { // 今夜枕着星光再入睡（躺在草坡上看星星）
  W.setTOD(0.95); clouds(t);
  const wh = put('whale', -0.7, -3.0, 'idle'); wh.flat = true; wh.lay = 0.25 + Math.sin(t * 0.8) * 0.03; wh.body.position.y = 0.08; wh.shadow.visible = false;
  const c = put('claude', 0.8, -3.0, 'idle'); c.flat = true; c.lay = -0.25; c.body.position.y = 0.08; c.shadow.visible = false;
  // 流星
  const sh = range(t, LT(22, 4), LT(22, 4) + 0.9); if (sh > 0 && sh < 1) prop(6, 'fx_shine', lerp(-6, 6, sh), lerp(9, 6, sh), -10, 0.7);
  W.stars.mat.opacity = 0.8 + Math.sin(t * 6) * 0.2; fireflies(t, 0, -4, 0.5);
  look([0.05, lerp(7.5, 6, p), -2.3], [0.05, 0.9, -3.9], 44); cam.rotateZ(lerp(0.1, -0.1, p)); W.focus(0, -4);
};
const L23: ShotFn = ({ t, p }) => { // 风啊轻轻吹（清晨的风把花瓣吹成一条河）
  W.setTOD(0.14, 0.4); clouds(t * 2);
  swayFlowers(t, 0.3); petals(t, 0, -3, 1, 2);
  const g = put('gpt', lerp(-6, 4, p), -5, 'cast', 0, 2.8 + Math.sin(t * 2) * 0.3); g.shadow.visible = false; g.flip = true;
  put('gemini', 1.5, -2.6, 'sway'); put('whale', -0.2, -2.4, 'sway', 0.4);
  look([lerp(3, 1, p), 1, 3.2], [0, 2, -3.5], 44); W.focus(0, -3);
};
const L24: ShotFn = ({ t, p }) => { // 这一刻就忘了你是谁（大月亮前的剪影）
  W.setTOD(0.88); nearMoon(0, 4.5, -20, 6.5);
  const sil = range(t, LS(24), LT(24, 4));
  ['whale', 'claude', 'kimi', 'gemini'].forEach((ch, i) => { const x = (i - 1.5) * 1.5; const a = put(ch, x, -4.5, i === 0 ? 'idle' : 'sway', i * 0.5); a.tint(new THREE.Color(0xffffff).lerp(new THREE.Color(0x221a44), sil).getHex());
    const tag = W.tags[[0, 1, 4, 3][i]]; tag.visible = true; const up = range(t, LT(24, 3) + i * 0.15, LE(24) + 0.6); tag.position.set(x + Math.sin(t + i) * up, a.root.position.y + 2.4 + eIO(up) * 5, -4.4); (tag.material as THREE.MeshBasicMaterial).opacity = 1 - range(up, 0.4, 1); tag.lookAt(cam.position); });
  fireflies(t, 0, -4, 0.8, 0.6);
  look([0, lerp(0.8, 1.3, p), 6], [0, 2.8, -10], 44); W.focus(0, -4);
};
const L25: ShotFn = ({ t, p }) => { // 有时清醒有时醉（茶馆里大家碰杯）
  W.setTOD(0.78); lanterns(t, LS(25) - 6, TEA_X, 3, 12);
  const drunk = range(t, LT(25, 5), LT(25, 6) + 0.3);
  const crew: [string, number, number][] = [['qwen', -4.2, 0.1], ['whale', -2.4, 0.3], ['doubao', 2.4, 0.3], ['gemini', 4.2, 0.1], ['zai', 0, -2.2]];
  crew.forEach(([ch, x, z], i) => { const a = put(ch, TEA_X + x, z, drunk > 0 ? (ch === 'zai' ? 'doze' : 'sway') : 'idle', i * 0.3, 0.5); a.flip = x > 0; if (i < 4) prop(i, 'prop_teacup', TEA_X + x + (x > 0 ? -0.45 : 0.45), 1.7 + bump(t, LT(25, 3), 0.5) * 0.5, z + 0.2, 0.42); });
  if (drunk > 0) prop(5, 'fx_dizzy_' + (Math.floor(t * 8) % 4), TEA_X - 2.4, 2.9, 0.5, 0.55);
  const sw = drunk * 0.3; look([TEA_X + Math.sin(t * 1.5) * sw * 2, 3 + Math.sin(t * 2) * sw, 6.5 - p], [TEA_X, 1.6, -1.2], 42); cam.rotateZ(Math.sin(t * 1.2) * 0.09 * drunk);
  G.sway = drunk * 0.7; G.warm = 0.25 + drunk * 0.2; G.bloom = 1 + drunk * 0.7; W.focus(TEA_X, 0);
};
const L26: ShotFn = ({ t, p }) => { // 别把所有压力自己背（大家一起抬一个大箱子）
  W.setTOD(0.22, 0.35); clouds(t);
  const join = (i: number) => range(t, LT(26, 1 + i * 2) - 0.3, LT(26, 1 + i * 2));
  const x0 = lerp(-3, 1.5, p);
  const bx = box(0, x0, 2.6 + Math.sin(t * 7) * 0.04 * (1 - join(3)), -3, Math.sin(t * 3) * 0.08 * (1 - join(3)), 3.2); void bx;
  put('whale', x0, -2.9, 'walk', 0).squash = 0.06 * (1 - join(3));
  ['gpt', 'claude', 'kimi', 'doubao'].forEach((ch, i) => { const j = join(i); const tx = x0 + (i % 2 ? 1 : -1) * (0.9 + Math.floor(i / 2) * 0.6); const a = put(ch, lerp(tx + (i % 2 ? 6 : -6), tx, eOut(j)), -2.7 - Math.floor(i / 2) * 0.4, 'walk', i * 0.2); a.flip = i % 2 === 1 ? j < 1 : false; if (ch === 'gpt') a.body.position.y = 0.4; });
  if (t > LT(26, 7)) prop(3, 'fx_heart', x0, 4.6 + (t - LT(26, 7)) * 0.7, -3, 0.5);
  look([x0 + 0.5, 2.4, 8.5], [x0, 2, -3], 42); W.focus(x0, -3);
};
const L27: ShotFn = ({ t, p }) => { // 人生路还远（夜里的长路，路桩亮着）
  W.setTOD(0.7, -0.2, 0.6, 0.15); clouds(t);
  const u0 = 0.16 + p * 0.03; ['whale', 'gemini', 'kimi'].forEach((ch, i) => { const r = roadAt(u0 + i * 0.004); put(ch, r[0] + (i - 1) * 0.8, r[2], 'walk', i * 0.2, 0); W.cast[ch].flip = true; });
  for (let i = 0; i < 12; i++) { const L = W.lanterns[i]; L.visible = true; const r = roadAt(0.1 + i * 0.07); L.position.set(r[0] + (i % 2 ? 2 : -2), 1.6 + Math.sin(t * 2 + i) * 0.1, r[2]); }
  const r = roadAt(u0 + 0.06); look([r[0] + 2, lerp(6, 3, p), r[2]], roadAt(u0 - 0.01).map((v, i) => (i === 1 ? 1.4 : v)), 46); W.focus(r[0], r[2]);
};
const L28: ShotFn = ({ t }) => { // 你不必事事都完美（一张歪歪扭扭的合照）
  W.setTOD(0.3, 0.25); clouds(t);
  const snap = LT(28, 6);
  const poses: [string, number, number, string][] = [['whale', 0, -3.4, 'hop'], ['gpt', -1.3, -3.9, 'float'], ['claude', 1.3, -3.8, 'tilt'], ['gemini', -2.6, -3.5, 'lookaround'], ['zai', 2.6, -3.5, 'doze'], ['qwen', -3.8, -3.2, 'spin'], ['doubao', 3.8, -3.1, 'step'], ['kimi', 0.7, -4.6, 'nod']];
  poses.forEach(([ch, x, z, act], i) => { const a = put(ch, x, z, act, i * 0.2); if (ch === 'gpt') { a.spin = Math.PI * eOut(range(t, LT(28, 3), LT(28, 4))); a.body.position.y = 2.2 * eOut(range(t, LT(28, 3), LT(28, 4))); } if (t > snap) a.still(a.frame(snap)); });
  W.ring.visible = true; W.ring.position.set(0, 2.2, -3.0); W.ring.scale.set(2.6, 1.5, 1); W.ring.rotation.set(0, 0, Math.sin(t) * 0.04);
  look([0, 2.1, 8.5], [0, 2, -3.5], 42); G.flash = decay(t, snap, 5) * 0.9; W.focus(0, -3.5);
};
// ---------- 终段副歌：夜里的灯会 ----------
const L29: ShotFn = ({ t, p }) => { W.setTOD(0.75); clouds(t); lanterns(t, LS(29) - 10, STAGE_X, -2, 30);
  ALL.forEach((ch, i) => { const a0 = (i / 8) * Math.PI * 2 + t * 0.1; put(ch, STAGE_X + Math.cos(a0) * 3.2, Math.sin(a0) * 3.2, ch === 'gpt' ? 'float' : 'sway', i * 0.3, 0.5); });
  look([STAGE_X + lerp(-4, 4, p), 3.5, 11], [STAGE_X, 1.7, 0], 40); W.focus(STAGE_X, 0); };
const L30: ShotFn = ({ t, p }) => { const sink = range(t, LS(30), LT(30, 4)); const rise = range(t, LT(30, 5), LE(30));
  W.setTOD(lerp(0.45, 0.85, p), lerp(0.18, -0.25, sink), -0.5, 0.1); clouds(t); lanterns(t, LS(29) - 14, STAGE_X, -2, 30);
  ALL.forEach((ch, i) => { const a0 = (i / 8) * Math.PI * 2; put(ch, STAGE_X + Math.cos(a0) * 3.2, Math.sin(a0) * 3.2, 'idle', i * 0.3, 0.5); });
  const my = lerp(-4, 6, eBack(rise, 1.3)); nearMoon(STAGE_X, my, -20, 4); const k = put('kimi', STAGE_X, -20, 'bow', LT(30, 8), my + 4); k.shadow.visible = false; k.size = 1.3;
  look([STAGE_X, 2, 12], [STAGE_X, lerp(2, 5, rise), -8], 44); W.focus(STAGE_X, 0); };
const L31: ShotFn = ({ t, p }) => { W.setTOD(0.78); const ci = eOut(range(t, LS(31) - 0.4, LT(31, 2) + 0.4)); clouds(t, ci, 0, -4); lanterns(t, LS(29) - 18, 0, -4, 30);
  bloomFlowers(t, LT(31, 3) - 0.1, LT(31, 5) + 0.5, 0, -3); swayFlowers(t, 0.1); petals(t, 0, -3, range(t, LT(31, 3), LT(31, 5)), 0.8); fireflies(t, 0, -3, 0.9);
  gang(t, BEHIND);
  const a = lerp(-0.6, 0.6, p); look([Math.sin(a) * 8, lerp(1, 2.6, p), -3 + Math.cos(a) * 8], [0, 1.8, -3.5], 44); W.focus(0, -3.5); };
const L32: ShotFn = ({ t, p }) => { W.setTOD(0.84); clouds(t); lanterns(t, LS(29) - 22, 0, -4, 30);
  gang(t, BEHIND); const d = range(t, LS(32), LT(32, 7)); W.luckStar.visible = true; W.luckStar.position.set(0, lerp(9, 4.3, eIO(d)), -3.4); W.luckStar.rotation.set(0, t * 2, 0); W.luckStar.scale.setScalar(0.5 + decay(t, LT(32, 7), 3) * 0.3);
  if (t > LT(32, 7)) for (let i = 0; i < 5; i++) prop(i, 'fx_sparkle_' + ((Math.floor(t * 8) + i) % 3), Math.cos(i * 1.26 + t) * 1.6, 4.3 + Math.sin(i * 1.26 + t) * 1.2, -3.2, 0.5);
  G.flash = decay(t, LT(32, 7), 4) * 0.3;
  look([0, lerp(2, 2.8, p), lerp(9, 7.5, p)], [0, lerp(4, 2.6, d), -3.5], 44); W.focus(0, -3.5); };
const L33: ShotFn = ({ t, p }) => { W.setTOD(0.82, -0.2, 0.6, 0.15); clouds(t);
  const u0 = 0.05 + p * 0.025; ALL.forEach((ch, i) => { const r = roadAt(u0 + Math.floor(i / 2) * 0.006); const a = put(ch, r[0] + (i % 2 ? 0.7 : -0.7), r[2], ch === 'gpt' ? 'float' : 'walk', i * 0.1, 0); a.flip = true; if (ch === 'gpt') { a.body.position.y = 2.2; a.root.position.z -= 1.5; } });
  for (let i = 0; i < 14; i++) { const L = W.lanterns[i]; const lu = 0.03 + i * 0.03; if (Math.abs(lu - (0.05 + p * 0.025 - 0.04)) < 0.03) continue; L.visible = true; const r = roadAt(lu); L.position.set(r[0] + (i % 2 ? 2 : -2), 1.6 + Math.sin(t * 2 + i) * 0.1, r[2]); }
  const r = roadAt(u0 + 0.01); const c = roadAt(u0 - 0.045); look([c[0] - 2.5, 3.4, c[2] + 1], [r[0], 1.5, r[2]], 44); W.focus(r[0], r[2]); };
const L34: ShotFn = ({ t, p }) => { const f = L18; f({ t, p, lt: 0, dur: 0, a: 0, b: 0 });
  look([STAGE_X + Math.sin(t * 0.3) * 2, lerp(16, 12, p), 2], [STAGE_X, 0.5, 0], 44); };
const L35: ShotFn = ({ t, p }) => { W.setTOD(0.84); clouds(t); lanterns(t, LS(35) - 8, 0, -4, 30);
  const go = LT(35, 3);
  ALL.forEach((ch, i) => { const x = (i - 3.5) * 1.2; const a = put(ch, x, -3.4 - Math.abs(i - 3.5) * 0.15, t < go ? (ch === 'gpt' ? 'float' : 'idle') : (ch === 'gpt' ? 'hover' : 'wave'), go); void a;
    const b = W.balloons[i]; b.visible = true; const up = range(t, go + hash(i) * 0.3, LE(35) + 2); b.position.set(x + 0.5 + Math.sin(t * 1.4 + i) * 0.4 * up, a.root.position.y + 0.9 + eIO(up) * 9, -3.3 - up * 2); b.rotation.z = Math.sin(t * 1.5 + i) * 0.15; });
  look([0, lerp(2, 2.6, p), 9], [0, lerp(2.4, 5, eIO(range(t, go, LE(35)))), -4], 46); W.focus(0, -3.5); };
const L36: ShotFn = ({ t, p }) => { W.setTOD(0.9); clouds(t); lanterns(t, LS(36) - 3, 0, -2, 36, 34);
  ALL.forEach((ch, i) => { const x = (i - 3.5) * 1.15; put(ch, x, -3.4 - Math.abs(i - 3.5) * 0.15, ch === 'gpt' ? 'hover' : ch === 'claude' ? 'curtsy' : ch === 'zai' ? 'nod' : 'wave', LT(36, 4) + i * 0.1); });
  fireflies(t, 0, -3, 0.8, 0.5); nearMoon(0, lerp(14, 18, p), -40, 7);
  look([0, lerp(2.4, 10, eIO(p)), lerp(8, 14, p)], [0, lerp(2.2, 9, eIO(p)), -6], 44); W.focus(0, -3.5); };
// ---------- 尾声：坐在月亮上 ----------
const O1: ShotFn = ({ t, p }) => { W.setTOD(0.95); clouds(t);
  nearMoon(0, 24, -6, 3.2); const w = put('whale', -0.8, -6, 'sway', 0, 27); w.shadow.visible = false; const k = put('kimi', 0.8, -6, 'idle', 0, 27); k.shadow.visible = false; k.flip = true;
  if (t > barStart(91)) prop(4, 'fx_zzz_' + (Math.floor(t * 3) % 3), -0.3, 29.4, -5.8, 0.45);
  for (let i = 0; i < 20; i++) { const L = W.lanterns[i]; L.visible = true; L.position.set((hash(i) - 0.5) * 30, 10 + ((hash(i + 3) * 20 + t * 0.6) % 20), -6 - hash(i + 5) * 26); }
  const a = lerp(-0.6, 0.5, p); look([Math.sin(a) * 9, 27.5, -6 + Math.cos(a) * 9], [0, 27.4, -6], 42); };
const O2: ShotFn = ({ t, p }) => { W.setTOD(1); nearMoon(0, 24, -6, 3.2);
  const w = put('whale', -0.8, -6, 'idle', 0, 27); w.shadow.visible = false; w.lay = Math.PI / 2 * eOut(range(p, 0, 0.3)); w.body.position.y = 0.3; const k = put('kimi', 0.8, -6, 'idle', 0, 27); k.shadow.visible = false; k.flip = true;
  look([0, lerp(28, 36, eIO(p)), lerp(3, 14, eIO(p))], [0, 26, -6], 44); G.black = range(t, DURATION - 2.6, DURATION - 0.3); };

export const SHOTS: Shot[] = (() => {
  const D: [number, string, ShotFn, number?][] = [
    [0, '片头 · 大家都在赶', introA], [barStart(4), '片头 · 赶路的早晨', introB], [barStart(8), '片头 · 一跤', introC],
    [L(1), '千姐：慌啥子嘛', L1, 1], [L(2), '太阳下去，月亮上来', L2, 2], [L(3), '云在，花开', L3, 3], [L(4), '等你的幸运星', L4, 4],
    [L(5), '一件件卸下', L5, 5], [L(6), '枕着星光', L6, 6], [L(7), '龙娘带来的风', L7, 7], [L(8), '名牌飞走了', L8, 8],
    [L(9), '茶馆 · 半醉', L9, 9], [L(10), '大家分着背', L10, 10], [L(11), '路还长', L11, 11], [L(12), '歪歪的圈', L12, 12],
    [L(13), '金色午后', L13, 13], [L(14), '日落月升', L14, 14], [L(15), '月光下开花', L15, 15], [L(16), '灯升起来', L16, 16],
    [L(17), '排队慢慢走', L17, 17], [L(18), '各有各的拍子', L18, 18], [L(19), '放开气球', L19, 19], [L(20), '最好的安排', L20, 20],
    [LE(20) + 0.6, '间奏 · 茶馆的夜', I1], [barStart(53), '间奏 · 新的一天', I2],
    [L(21), '茶馆 · 放下背篓', L21, 21], [L(22), '躺着看星星', L22, 22], [L(23), '清晨的风', L23, 23], [L(24), '月亮前的剪影', L24, 24],
    [L(25), '碰杯', L25, 25], [L(26), '一起抬', L26, 26], [L(27), '夜路有灯', L27, 27], [L(28), '歪歪扭扭的合照', L28, 28],
    [L(29), '灯会', L29, 29], [L(30), '月亮爬上舞台', L30, 30], [L(31), '夜里的花', L31, 31], [L(32), '好运落下来', L32, 32],
    [L(33), '提灯慢慢走', L33, 33], [L(34), '俯看节拍', L34, 34], [L(35), '一起放开', L35, 35], [L(36), '一切刚刚好', L36, 36],
    [LE(36) + 0.4, '尾声 · 月亮上', O1], [barStart(93), '尾声 · 晚安', O2],
  ];
  return D.map(([a, label, f, line], i) => ({ a, b: D[i + 1] ? D[i + 1][0] : DURATION, label, f, line }));
})();
export const SECTIONS = [
  { t: 0, name: '片头' }, { t: L(1), name: '副歌' }, { t: L(5), name: '主歌一' }, { t: L(13), name: '副歌一' }, { t: LE(20) + 0.6, name: '间奏' },
  { t: L(21), name: '主歌二' }, { t: L(29), name: '副歌二' }, { t: LE(36) + 0.4, name: '尾声' },
];
export { BEAT };
