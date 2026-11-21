// 场景二组：巨墙的角落（小花）/ 碑林与茫茫人潮 / 深海（深度求索）
import * as THREE from 'three';
import { Actor, C, LT, Particles, clamp, decay, eBack, eIO, eOut, glowSprite, glowTex, hash, lerp, mat, mesh, range, texSprite } from './core';
import { type Ctx, type Flower, Scene, aim, beam, dreamTex, flower, mood, orbit, paperTex, planeTex, setFlower, whalePts } from './kit';
import { beat } from './scenes1';

const basic = (color: number, o: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...o });
const Q = Math.SQRT1_2;

// =====================================================================
// 角落：两面巨墙之间，耗尽天真，开出小小的花朵
// =====================================================================
const F = [0.7, 0, 0.7]; // 那朵花
export class CornerScene extends Scene {
  whale = this.actor('whale'); pals = ['kimi', 'doubao', 'zai', 'qwen'].map((n) => this.actor(n, 0.92)); heart = this.prop('fx_heart', 1.2);
  wallM = mat(0x46528a, { roughness: 1, flatShading: false, transparent: true }); walls: THREE.Mesh[] = []; wallSeams: THREE.Line[] = [];
  main = flower(glowTex()); extra: Flower[] = []; xp = [[1.35, 0.5], [0.45, 1.4], [1.7, 1.25], [1.0, 1.85], [2.3, 0.45]];
  field = new Particles(900, { size: 0.55 }); fp: number[][] = []; inn = new Particles(60, { size: 0.07 }); sheets: THREE.Mesh[] = [];
  seedPaper = texSprite(dreamTex(false), 0.19, 0.26);
  fl = new THREE.PointLight(0x7d9bff, 0, 20, 1.1); top = beam(0x6f86e0);
  constructor() {
    super(); const G = this.group;
    const fl = mesh(new THREE.PlaneGeometry(260, 260), mat(0x1e2446, { roughness: 0.75, metalness: 0.15, flatShading: false })); fl.rotation.x = -Math.PI / 2;
    const a = mesh(new THREE.PlaneGeometry(70, 44), this.wallM, [0, 22, 35]); a.rotation.y = Math.PI / 2;
    const b = mesh(new THREE.PlaneGeometry(70, 44), this.wallM, [35, 22, 0]); this.walls = [a, b];
    // 角落里的石头和一枚没送出的种子：花还没开时，这里就有人来过
    const stone = mat(0x6a7298);
    G.add(mesh(new THREE.DodecahedronGeometry(0.1, 0), stone, [1.28, 0.07, 0.3]), mesh(new THREE.DodecahedronGeometry(0.07, 0), stone, [0.16, 0.05, 1.2]),
      mesh(new THREE.BoxGeometry(0.1, 0.14, 0.02), mat(0xe8e4d8), [0.42, 0.07, 0.52]));
    this.main.g.position.set(F[0], 0, F[2]); this.fl.position.set(F[0] + 0.3, 0.6, F[2] + 0.3);
    G.add(fl, a, b, this.main.g, this.fl, this.top, this.field.points, this.inn.points, this.seedPaper);
    const seamMaterial = new THREE.LineBasicMaterial({ color: 0x7785a5, transparent: true, opacity: 0.12 });
    for (let i = 0; i < 6; i++) {
      const line = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.01, 0.35 + i * 0.42, 0.1), new THREE.Vector3(0.01, 0.35 + i * 0.42, 4.5)]);
      const seam = new THREE.Line(line, seamMaterial); this.wallSeams.push(seam); G.add(seam);
    }
    this.xp.forEach((q, i) => { const f = flower(glowTex(), [0xffd7e2, 0xe6ecff, 0xfff1c9][i % 3]); f.g.position.set(q[0], 0, q[1]); this.extra.push(f); G.add(f.g); });
    // 鲸形花田：原来那朵花正好是鲸的眼睛
    const pts = whalePts(900, 5).map(([x, y]) => { const dx = x - 6.2, dy = (y - 1.1) * 1.2; return [F[0] + Q * dx - Q * dy, F[2] - Q * dx - Q * dy, Math.hypot(dx, dy)]; });
    pts.sort((p, q) => p[2] - q[2]); this.fp = pts;
    pts.forEach((_, i) => this.field.color(i, C([0xbfd0ff, 0x7d9bff, 0xffffff, 0xffc9d6, 0xffe3a8][i % 5])));
    for (let i = 0; i < 60; i++) this.inn.color(i, C(i % 2 ? 0xffe9b0 : 0xffffff));
    for (let i = 0; i < 16; i++) { const s = mesh(new THREE.PlaneGeometry(0.3, 0.42), basic(0xc4c6d4, { map: paperTex(i), side: THREE.DoubleSide })); this.sheets.push(s); G.add(s); }
  }
  frame(c: Ctx) {
    this.hideAll(); const { t, p, e, v, rep, n } = c; const W = this.whale; const YAW = Math.PI / 4;
    mood(e, [0x0b1230, 0x1c2950, 0x0a0f22], [0x131a36, 14, 80], [0x93a3d4, 0x1c2138, 0.8], [0x9fb0e8, 0.6], 0, [6, 12, 8]);
    let grow = 0, open = 0, xo = 0, ripple = 1e9, wallOp = 1, innK = 0, sheetK = 0, palMode = 0, hop = false;
    if (v === 'c8') { // 我能不能在某个角落
      const k = eOut(range(p, 0, 0.95)); const wp = [lerp(6.2, 1.7, k), lerp(4.6, 1.2, k)];
      W.show().at(wp[0], 0, wp[1]).play(k < 0.97 ? 'walk' : 'idle').tint(rep === 2 ? 0xffffff : 0xb4bde8); W.flip = rep === 2;
      if (rep === 0) orbit(e.cam, [1.5, 0.5, 1.5], lerp(13.5, 10.5, p), YAW + 0.3, 0.3, 34, 0.38, -0.3);
      else if (rep === 1) { grow = open = 1; orbit(e.cam, [wp[0] * 0.6, 0.8, wp[1] * 0.6], lerp(7, 5.5, p), YAW + 0.1, 0.1, 38, 0.4, -0.15); }
      else { // 这一次有人跟着她
        grow = open = xo = 1; palMode = 1; orbit(e.cam, [2.2, 0.7, 2.2], lerp(10, 8, p), YAW - 0.2, 0.28, 36, 0.4, -0.2);
        this.pals.forEach((a, i) => { const kk = eOut(range(p - 0.07 * (i + 1), 0, 0.95)); a.show().play(kk < 0.97 ? 'walk' : 'idle').at(lerp(7.4 + i * 0.9, 2.6 + i * 0.75, kk), 0, lerp(5.6 + i * 0.7, 1.9 + (i % 2) * 0.9, kk)); a.flip = true; });
      }
    } else if (v === 'c9') { // 耗尽天真 开出小小的花朵
      const t0 = LT(n, 0), tk = LT(n, 4), th = LT(n, 9); W.show().at(1.55, 0, 0.95);
      if (rep < 2) {
        innK = range(t, t0, t0 + 0.3) * (1 - range(t, tk + 0.2, tk + 0.8));
        grow = rep === 0 ? eOut(range(t, tk - 0.05, tk + 0.9)) : 1; open = rep === 0 ? eBack(range(t, th - 0.05, th + 0.5)) : 1;
        if (rep === 1) xo = eOut(range(t, tk, th + 0.6)); // 第二遍：旁边又冒出几朵
        W.cue(t, [[c.a, 'bow'], [th, rep === 0 ? 'surprise' : 'hop']]);
        orbit(e.cam, [1.1, 0.42, 0.85], lerp(4.9, 4.2, eIO(p)), YAW - 0.3, 0.12, 36, 0, -0.52);
        e.grade.flash = decay(t, th, 6) * 0.14; e.grade.flashCol = 0xbfd0ff;
      } else { // 第三遍：朋友围过来，墙退开，小花连成一头鲸
        grow = open = xo = 1; palMode = 2; hop = t > tk; innK = range(t, t0, t0 + 0.3) * (1 - range(t, tk, tk + 0.6));
        const ts = LT(n, 6); ripple = ts; const k = eIO(range(t, ts - 0.2, ts + 2.9)); wallOp = 1 - clamp(k * 1.7);
        W.cue(t, [[c.a, 'bow'], [tk, 'hop']]);
        orbit(e.cam, [lerp(1.1, -4.87, k), lerp(0.42, 0, k), lerp(0.85, 8.14, k)], lerp(4.4, 34, k), lerp(YAW - 0.3, YAW, k), lerp(0.12, 1.25, k), lerp(36, 40, k), 0, lerp(-0.52, -0.06, k));
        e.grade.flash = decay(t, tk, 6) * 0.14; e.grade.flashCol = 0xffd9e4; e.grade.black = range(t, c.b - 0.55, c.b - 0.05); e.grade.bloom = 1 + k * 0.8;
      }
    } else { // title：间奏，围着小花转半圈，稿纸从上面落下来
      grow = open = 1; W.show().at(1.55, 0, 0.95).play('sway'); sheetK = range(p, 0.4, 0.95);
      orbit(e.cam, [0.9, 0.55, 0.9], lerp(3.0, 7.5, eIO(p)), YAW - 0.3 + p * 0.5, lerp(0.12, 0.34, p), 36, 0, -0.3);
    }
    if (palMode === 2) [[2.45, 1.75], [1.3, 2.45], [2.9, 0.75], [0.5, 2.9]].forEach((q, i) => {
      this.pals[i].show().play(hop ? 'hop' : 'idle').at(q[0], hop ? 0.06 * beat(t - i * 0.05) : 0, q[1]); this.pals[i].flip = i % 2 === 0;
    });
    if (hop) this.heart.show().at(1.1, 1.05 + Math.sin(t * 4) * 0.04, 1.1);
    setFlower(this.main, e.cam, grow, open, 0.36, 0.12);
    this.extra.forEach((f, i) => { const k = clamp(xo * 1.8 - i * 0.2); setFlower(f, e.cam, eOut(k), eBack(clamp(k * 1.6 - 0.6)), 0.22 + (i % 2) * 0.08, 0.1); });
    this.seedPaper.visible = wallOp > 0.05;
    this.seedPaper.position.set(F[0] + 0.32, 0.16, F[2] + 0.06);
    this.seedPaper.material.rotation = -0.18;
    this.seedPaper.material.opacity = wallOp * 0.86;
    this.fl.intensity = 2 + 3 * open + grow + xo;
    this.wallM.opacity = wallOp; this.walls.forEach((w) => (w.visible = wallOp > 0.01));
    this.wallSeams.forEach((line) => { line.visible = wallOp > 0.01; (line.material as THREE.LineBasicMaterial).opacity = wallOp * 0.12; });
    aim(this.top, [3, 16, 3], [0.9, 0, 0.9], 2.4, 0.16 * wallOp);
    for (let i = 0; i < 900; i++) {
      const q = this.fp[i]; if (!q || t < ripple) { this.field.set(i, 0, -50, 0, 0); continue; }
      const k = eBack(range(t, ripple + q[2] * 0.085, ripple + q[2] * 0.085 + 0.35), 2.5);
      this.field.set(i, q[0], 0.14, q[1], k * (0.55 + hash(i) * 0.6) * (0.85 + 0.15 * Math.sin(t * 3 + i)));
    }
    this.field.commit();
    for (let i = 0; i < 60; i++) {
      const s = (t * 0.8 + hash(i)) % 1;
      this.inn.set(i, lerp(1.55 + (hash(i + 1) - 0.5) * 0.5, F[0], s), lerp(0.5 + hash(i + 2) * 0.5, 0.03, s * s) + Math.sin(s * Math.PI) * 0.12, lerp(0.95, F[2], s), innK * Math.sin(s * Math.PI) * (0.6 + hash(i + 3)));
    }
    this.inn.commit();
    this.sheets.forEach((s, i) => {
      s.visible = i / 16 < sheetK; if (!s.visible) return;
      const y = 6.5 - ((t * 1.5 + i * 1.3) % 7.5);
      s.position.set(0.9 + Math.sin(i * 2.4) * 3 + Math.sin(t + i) * 0.3, y, 0.9 + Math.cos(i * 1.7) * 3); s.rotation.set(t * 1.3 + i, t * 0.8 + i * 2, t * 1.7 + i);
    });
  }
}

// =====================================================================
// 碑林：名垂青史的长廊，和从她身边流过的茫茫人世
// =====================================================================
export class HallScene extends Scene {
  whale = this.actor('whale'); statues: (Actor | null)[] = []; halos: THREE.Sprite[] = []; walkers: Actor[] = []; scrolls: Actor[] = [];
  ringM = basic(0x7d9bff, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); ring = mesh(new THREE.RingGeometry(0.9, 1, 64), this.ringM);
  far = glowSprite(0xffc878, 34, 0.6); myLight = glowSprite(0x6f8cff, 1.8, 0); wglow = glowSprite(0x5b7bff, 2.4, 0);
  constructor() {
    super(); const G = this.group;
    const fl = mesh(new THREE.PlaneGeometry(260, 260), mat(0x20253f, { roughness: 0.6, metalness: 0.3, flatShading: false })); fl.rotation.x = -Math.PI / 2;
    const carpet = mesh(new THREE.PlaneGeometry(3.2, 120), mat(0x2f2852, { roughness: 1 }), [0, 0.01, -50]); carpet.rotation.x = -Math.PI / 2;
    this.ring.rotation.x = -Math.PI / 2; this.far.position.set(0, 4, -75); G.add(fl, carpet, this.ring, this.far, this.myLight, this.wglow);
    const pm = mat(0x40466c), sm = mat(0x333a5c), gold = basic(0xffc65a);
    this.scrolls = [0, 1].map(() => this.prop('prop_scroll', 1.5)); // 台座上摊开的故事卷：传颂的是纸上的字
    const keys = ['act_claude_idle_0', '', 'gpt_boss_idle', 'act_gemini_idle_0', 'act_claude_curtsy_3', 'gpt_boss_cast0', 'act_gemini_sway_0', 'act_claude_idle_0', 'gpt_boss_idle', 'act_gemini_idle_0'];
    for (let i = 0; i < 10; i++) {
      const s = i % 2 ? 1 : -1, x = s * 4.2, z = -4 - Math.floor(i / 2) * 8;
      G.add(mesh(new THREE.BoxGeometry(2.4, 1, 2), pm, [x, 0.5, z]), mesh(new THREE.BoxGeometry(2.2, 9, 0.6), sm, [x, 4.5, z - 0.9]), mesh(new THREE.BoxGeometry(1.2, 0.16, 0.05), gold, [x, 0.55, z + 1.02]));
      const h = glowSprite(0xffc878, 4.2, 0.18); h.position.set(x, 2.3, z - 0.5); this.halos.push(h); G.add(h);
      if (!keys[i]) { this.statues.push(null); continue; }
      const st = this.prop(keys[i], keys[i].startsWith('gpt') ? 1.05 : 1.6); this.statues.push(st);
    }
    const names = ['kimi', 'doubao', 'qwen', 'zai', 'gemini', 'claude'];
    for (let i = 0; i < 44; i++) this.walkers.push(this.actor(names[i % 6], 0.95));
  }
  frame(c: Ctx) {
    this.hideAll(); const { t, p, e, v, rep, n } = c; const W = this.whale;
    mood(e, [0x0b0f28, 0x181f45, 0x080a1c], [0x141833, 10, 75], [0x9db0e4, 0x22222e, 0.6], [0xffe0b0, 0.75], 0.25, [0, 10, -30]);
    let ringAge = -1, wg = 0, my = 0; const flare = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.statues.forEach((s, i) => { if (s) s.show().at((i % 2 ? 1 : -1) * 4.2, 1.0, -4 - Math.floor(i / 2) * 8).tint(0x66739a); });
    this.scrolls[0].show().at(4.2, 1.0, -3.55); this.scrolls[1].show().at(-4.2, 1.0, -11.55);
    if (v === 'v15') { // 该怎么惊艳这茫茫人世
      const ts = LT(n, 3); W.show().at(0, 0, 6).play(t > ts ? 'spin' : 'idle'); ringAge = t - ts;
      e.fog.near = 6; e.fog.far = 34; e.fog.color.setHex(0x10142a);
      this.walkers.forEach((a, i) => {
        const dir = i % 2 ? 1 : -1, sp = 0.9 + hash(i + 1) * 0.8; let x = (dir * (t * sp + hash(i + 2) * 30)) % 30; if (x < 0) x += 30;
        a.show().play('walk').at(x - 15, 0, 1.2 + hash(i) * 13).tint(0x55618f); a.flip = dir < 0;
      });
      orbit(e.cam, [0, 0.8, 6], lerp(4.2, 15, eIO(p)), 0.2, lerp(0.1, 0.72, eIO(p)), 38, 0, -0.3);
    } else if (v === 'b18') { // 也想要名垂青史：四个字，四座碑依次亮起
      W.show().at(0, 0, lerp(2.2, -2.6, p)).play('walk').tint(rep ? 0xffffff : 0xb9c2ea); wg = rep ? 0.7 : 0.15;
      [0, 3, 4, 7].forEach((si, k) => { flare[si] = decay(t, LT(n, 3 + k), 2.2); });
      const hit = Math.max(...flare); e.grade.flash = hit * 0.08; e.grade.flashCol = 0xffd590;
      if (rep) my = eOut(range(t, LT(n, 6), LT(n, 6) + 0.6)); // 第二遍：在那座空着的台子上留一点自己的光
      orbit(e.cam, [0, 2.6, -9], lerp(15, 12.5, p), lerp(0.22, 0.1, p), -0.09, 40, 0, -0.3);
    } else { // b19 偏人们却只：所有人都朝有光的地方去
      W.show().at(0, 0, -1).play(rep ? 'idle' : 'sad', c.a).tint(0xdfe4ff); wg = rep ? 0.6 : 0.2;
      this.walkers.forEach((a, i) => {
        const sp = 3.2 * (0.8 + hash(i + 1) * 0.5); const z = 4.2 - ((t * sp + hash(i + 2) * 40) % 40); let x = (hash(i) - 0.5) * 6.6; if (Math.abs(x) < 0.6) x = x < 0 ? -0.75 : 0.75;
        a.show().play('walk').at(x, 0, z).tint(0x4a5584);
      });
      if (rep) orbit(e.cam, [0, 0.9, -1.4], lerp(6.5, 5.6, p), 0.95, 0.1, 38, 0, -0.38);
      else orbit(e.cam, [0, 0.9, -1], lerp(6, 5, p), -0.25, 0.08, 38, 0, -0.38);
    }
    this.halos.forEach((h, i) => { h.material.opacity = 0.16 + flare[i] * 0.8; h.scale.setScalar(4.2 + flare[i] * 2.5); });
    const wp = W.mesh.position; this.wglow.position.set(wp.x, 0.6, wp.z - 0.05); this.wglow.material.opacity = wg * 0.5;
    this.myLight.position.set(4.2, 1.25, -4); this.myLight.material.opacity = my * 0.9;
    this.ring.visible = ringAge > 0 && ringAge < 1.4;
    if (this.ring.visible) { this.ring.position.set(wp.x, 0.03, wp.z); this.ring.scale.setScalar(0.3 + 7 * eOut(ringAge / 1.4)); this.ringM.opacity = 0.8 * (1 - ringAge / 1.4); }
  }
}

// =====================================================================
// 深海：渺小如我 / 改写命运的诗 / 间奏「深度求索」
// =====================================================================
export class SeaScene extends Scene {
  whale = this.actor('whale'); brush = this.prop('prop_brush', 1.7); spark = this.prop('fx_sparkle_0', 1.3);
  snow = new Particles(420, { size: 0.07 }); big = new Particles(760, { size: 0.38 }); bp: number[][] = []; shafts = [0, 1, 2, 3, 4].map(() => beam(0x6fa0ff));
  dashes: THREE.Mesh[] = []; dm: THREE.MeshBasicMaterial[] = []; wglow = glowSprite(0x7d9bff, 2.6, 0.5); lightF = glowSprite(0xe6ecff, 0.8, 0);
  poemOutline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.5, 2.35)), new THREE.LineBasicMaterial({ color: 0x90a7c1, transparent: true, opacity: 0.48 }));
  seaPlane = texSprite(planeTex(), 0.55, 0.28, 0xc8d7e8);
  constructor() {
    super(); const G = this.group;
    this.bp = whalePts(760, 11).map(([x, y], i) => [x, y, (hash(i * 3.3) - 0.5) * 4.4 * Math.sqrt(Math.max(0, 1 - ((x - 1) / 11) ** 2))]);
    this.bp.forEach((_, i) => this.big.color(i, C([0x9fc0ff, 0x5f86ff, 0xdfeaff][i % 3])));
    for (let i = 0; i < 420; i++) this.snow.color(i, C(i % 4 ? 0x9fc0ff : 0xffffff));
    for (let r = 0; r < 4; r++) for (let j = 0; j < 7; j++) {
      const m = basic(0x39425f, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const d = mesh(new THREE.PlaneGeometry(0.42, 0.09), m); this.dm.push(m); this.dashes.push(d); G.add(d);
    }
    G.add(this.snow.points, this.big.points, this.wglow, this.lightF, this.poemOutline, this.seaPlane, ...this.shafts);
  }
  frame(c: Ctx) {
    this.hideAll(); const { t, p, e, v, n } = c; const W = this.whale; const bob = Math.sin(t * 1.2) * 0.12;
    mood(e, [0x0e3a70, 0x082150, 0x02061a, 0.1], [0x072050, 5, 60], [0x9fc0ff, 0x0e2450, 0.85], [0xbfd8ff, 0.7], 0, [0, 12, 2]);
    let O = [0, 6, -16], S = 1, poem = false, rise = 0.25, lf = 0; const P = [0.4, 0, -1.6];
    W.show().at(0, bob, 0).play('idle');
    if (v === 'v16') { // 就算渺小如我
      O = [lerp(-10, -3, p), 5, -11]; S = 1.0;
      orbit(e.cam, [0, 0.6, 0], lerp(7, 24, eOut(p)), 0.35, -0.12, 40, -0.3, 0.12);
    } else if (v === 'v17') { // 真企图过改写命运的诗
      O = [6 + p * 4, 8, -24]; S = 0.9; poem = true;
      const tr = [LT(n, 4), LT(n, 5), LT(n, 6), LT(n, 9)]; W.cue(t, [[c.a, 'idle'], [tr[0], 'point'], [tr[2], 'point'], [tr[3], 'point']]);
      let cur = -1; tr.forEach((x, i) => { if (t >= x) cur = i; });
      this.dashes.forEach((d, i) => {
        const r = Math.floor(i / 7), j = i % 7; const k = eIO(range(t, tr[r] + j * 0.035, tr[r] + j * 0.035 + 0.24));
        d.visible = true; d.position.set(P[0] - 1.8 + j * 0.6, 2.8 - r * 0.5 + Math.sin(k * Math.PI) * 0.16 + bob * 0.3, P[2]); d.rotation.z = k * Math.PI;
        d.scale.set(lerp(1, 0.7 + hash(i) * 0.7, k) * (1 + decay(t, tr[r] + j * 0.035 + 0.24, 6) * 0.4), 1 + k * 0.5, 1);
        this.dm[i].color.setHex(k > 0.5 ? 0x8fb0ff : 0x39425f); this.dm[i].opacity = lerp(0.55, 1, k);
      });
      if (cur >= 0) { const s = range(t, tr[cur], tr[cur] + 0.45); if (s < 1) this.brush.show().at(P[0] - 1.9 + s * 3.8, 2.55 - cur * 0.5, P[2] + 0.15); }
      if (t > tr[3] + 0.3) this.spark.show().at(P[0] + 2.4, 2.95, P[2] + 0.1);
      orbit(e.cam, [0.3, 1.5, -0.5], lerp(7, 5.8, p), lerp(-0.45, -0.2, p), -0.1, 38, 0.36, -0.1);
    } else { // dive：间奏，抱着花的那点光往深处去，一头巨鲸从身边游过
      O = [lerp(-27, 23, p), lerp(4.6, 2.6, p), -15]; S = 0.8; rise = 1.6; lf = 0.9;
      W.play(p > 0.45 && p < 0.7 ? 'spin' : 'sway');
      orbit(e.cam, [0, 0.7, 0], lerp(5, 10.5, eIO(p)), lerp(-0.5, 0.45, p), lerp(0.18, -0.08, p), 38, 0, 0.15);
      e.grade.flash = Math.max(decay(t, c.a, 2.5) * 0.55, range(p, 0.94, 1) * 0.4); e.grade.flashCol = 0xbfd8ff;
    }
    if (!poem) this.dashes.forEach((d) => (d.visible = false));
    this.poemOutline.visible = poem;
    this.poemOutline.position.set(P[0], 1.98 + bob * 0.3, P[2] - 0.05);
    this.seaPlane.visible = v === 'dive';
    this.seaPlane.position.set(-2.8 + p * 5.6, 1.7 + Math.sin(t * 0.8) * 0.13, -1.8);
    this.seaPlane.material.rotation = 0.12 * Math.sin(t * 0.7);
    for (let i = 0; i < 760; i++) {
      const q = this.bp[i]; if (!q) { this.big.set(i, 0, -90, 0, 0); continue; }
      const wave = Math.sin(q[0] * 0.22 - t * 1.3) * 0.7 * clamp((3 - q[0]) / 14);
      this.big.set(i, O[0] + q[0] * S, O[1] + (q[1] + wave) * S, O[2] + q[2] * S, (0.5 + hash(i) * 0.8) * (0.8 + 0.2 * Math.sin(t * 2 + i)));
    }
    this.big.commit();
    for (let i = 0; i < 420; i++) {
      let y = (hash(i + 1) * 18 + t * rise * (0.5 + hash(i + 2))) % 18;
      this.snow.set(i, (hash(i) - 0.5) * 34 + Math.sin(t * 0.4 + i) * 0.3, y - 8, (hash(i + 3) - 0.5) * 34, 0.5 + hash(i + 4));
    }
    this.snow.commit();
    this.shafts.forEach((s, i) => aim(s, [-10 + i * 5, 18, -6 + (i % 2) * 5], [-7 + i * 5, -9, -5 + (i % 2) * 5], 2.0, 0.07 + 0.03 * Math.sin(t * 0.8 + i)));
    this.wglow.position.set(0, bob + 0.6, -0.05); this.wglow.material.opacity = 0.45;
    this.lightF.position.set(0.22, bob + 0.5, 0.12); this.lightF.material.opacity = lf * (0.8 + 0.2 * Math.sin(t * 3));
    e.grade.bloom = 1.3;
  }
}
