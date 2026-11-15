// 场景 B：宇宙与红豆 / 困兽 / 胶卷默片 / 演唱会 / 钢琴
import * as THREE from 'three';
import { ACTIONS, RECTS } from './generated';
import { ATLAS_IMG, Actor, C, LE, LS, LT, Particles, bump, decay, eBack, eIO, eIn, eOut, glowSprite, hash, lerp, mat, mesh, mix3, noteTex, path3, pulse, range, rng, rod, setCam, smooth } from './core';
import { Ctx, Scene, fog, light, stars, vinyl } from './scenesA';

// =====================================================================
// 宇宙：一整个宇宙，换一颗红豆
// =====================================================================
export class CosmosScene extends Scene {
  whale = this.actor('whale'); N = 5200; gal = new Particles(5200, { size: 0.1 }); base = new Float32Array(5200 * 3);
  bean = mesh(new THREE.SphereGeometry(0.15, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd6223b, emissive: 0xff1a3a, emissiveIntensity: 1.2, roughness: 0.3, flatShading: false }));
  beanGlow = glowSprite(0xff3b5c, 1.8, 0); beanL = new THREE.PointLight(0xff3b5c, 0, 5, 1.5);
  tree = new THREE.Group(); trunk: THREE.Mesh; branches: THREE.Mesh[] = []; fruits: THREE.Mesh[] = [];
  B = new THREE.Vector3(0, 1.72, 0.42); G = new THREE.Vector3(0, 4, -16);
  constructor() {
    super();
    const r = rng(23); const pal = [0x9ec5ff, 0xffd6f0, 0xffffff, 0xc4b5fd, 0xffe0a8];
    for (let i = 0; i < this.N; i++) {
      const arm = i % 3; const rr = Math.pow(r(), 0.6) * 19 + 1.2; this.base[i * 3] = rr; this.base[i * 3 + 1] = arm * 2.094 + rr * 0.42 + (r() - 0.5) * 0.7; this.base[i * 3 + 2] = (r() - 0.5) * Math.max(0.3, 2 - rr * 0.08);
      this.gal.color(i, C(pal[Math.floor(r() * pal.length)]), 0.6 + r() * 0.6); this.gal.size[i] = 0.4 + r() * 1.3;
    }
    this.bean.scale.set(1.25, 0.9, 0.9);
    const rock = mesh(new THREE.IcosahedronGeometry(1.2, 1), mat(0x6a5a8a)); this.group.add(rock, this.bean, this.beanGlow, this.beanL, this.gal.points);
    const bark = mat(0x8a4a3a); this.trunk = rod([0, 0, 0], [0, 1.7, 0], 0.07, bark); this.tree.add(this.trunk);
    const tips: number[][] = [];
    for (let k = 0; k < 6; k++) { const a = k * 1.05, h = 0.8 + (k % 3) * 0.3; const tip = [Math.cos(a) * 0.75, h + 0.55, Math.sin(a) * 0.75]; tips.push(tip); const b = rod([0, h, 0], tip, 0.035, bark); this.branches.push(b); this.tree.add(b); }
    for (let i = 0; i < 16; i++) { const tp = tips[i % 6]; const f = mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff2a4a, emissive: 0xff1a3a, emissiveIntensity: 1.5 }), [tp[0] * (0.7 + hash(i) * 0.4), tp[1] + (hash(i + 3) - 0.5) * 0.35, tp[2] * (0.7 + hash(i + 1) * 0.4)]); this.fruits.push(f); this.tree.add(f); }
    this.tree.position.set(0, 1.12, -0.1); this.group.add(this.tree);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    e.sky.set(0x05020f, 0x1a0b3a, 0x05020f, 0.0); e.sky.sun([0, 1, 0], 0, 0); fog(e, 0x0a0618, 30, 140); light(e, 0xb8a8ff, 0x201030, 0.7, 0xffd0e0, 0.8, [3, 6, 5]);
    let col = 0; let beanOn = 0; const B = this.B.clone();
    if (v === 'L6') {
      col = eIn(range(t, LT(6, 5) - 0.1, LT(6, 8))); beanOn = range(t, LT(6, 8) - 0.2, LT(6, 8) + 0.1);
      this.whale.at(0, 1.12, 0).show().cue(t, [[0, 'idle'], [LT(6, 5), 'surprise'], [LT(6, 8) + 0.3, 'nod']]);
      this.tree.visible = false; stars(e, 1 - col * 0.7);
      e.grade.flash = decay(t, LT(6, 8), 5) * 0.4; e.grade.flashCol = 0xffb0c0;
      setCam(e.cam, path3([[0, 7, 27], [0.5, 3.6, 12], [0.95, 2.05, 3.7]], eIO(p)), mix3([0, 3, -12], [0, 1.5, 0.2], eIO(p)), 42);
    } else {
      col = 1 - eOut(range(t, LT(20, 3), LE(20) + 0.4)); const plant = range(t, LS(20) - 0.3, LT(20, 2));
      beanOn = 1 - range(t, LT(20, 2), LT(20, 2) + 0.2); B.lerp(new THREE.Vector3(0, 1.15, -0.1), eIO(plant));
      this.whale.at(0.62, 0.95, 0.42).show().cue(t, [[0, 'bow'], [LT(20, 3), 'idle'], [LT(20, 8), 'hop']]);
      this.tree.visible = true; const grow = eOut(range(t, LT(20, 2), LT(20, 5))); this.tree.scale.setScalar(Math.max(0.001, grow));
      this.fruits.forEach((f, i) => { const tk = LT(20, 5) + (i / 16) * (LE(20) - LT(20, 5)); const s = eBack(range(t, tk, tk + 0.25)); f.scale.setScalar(Math.max(0.001, s * (1 + pulse(t) * 0.3))); });
      stars(e, 1 - col * 0.6);
      const a = lerp(-0.8, 0.8, eIO(p)); setCam(e.cam, [Math.sin(a) * 4.6, 2.2 + p * 0.8, Math.cos(a) * 4.6], [0, 1.85, 0], 42);
    }
    this.bean.position.copy(B); this.bean.rotation.y = t; this.bean.visible = beanOn > 0.01; this.bean.scale.set(1.25 * beanOn, 0.9 * beanOn, 0.9 * beanOn);
    this.beanGlow.position.copy(B); this.beanGlow.material.opacity = beanOn * (0.7 + pulse(t) * 0.3); this.beanL.position.copy(B); this.beanL.intensity = beanOn * 4;
    this.gal.mat.uniforms.uOpacity.value = col < 0.999 ? 1 : 0;
    const G = this.G, tilt = 0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let i = 0; i < this.N; i++) {
      const rr = this.base[i * 3], th = this.base[i * 3 + 1] + t * 0.06 / (0.4 + rr * 0.08) + col * 6, y = this.base[i * 3 + 2];
      const R2 = rr * (1 - col * 0.85);
      const x = Math.cos(th) * R2, z0 = Math.sin(th) * R2; const yy = y * ct - z0 * st, zz = y * st + z0 * ct;
      const k = eIn(col);
      this.gal.set(i, lerp(G.x + x, B.x, k), lerp(G.y + yy, B.y, k), lerp(G.z + zz, B.z, k));
    }
    this.gal.commit();
  }
}

// =====================================================================
// 困兽：回忆如困兽，寂寞太久而渐渐温柔 / 放开了拳头，反而更自由
// =====================================================================
export class CageScene extends Scene {
  whale = this.actor('whale'); boss = this.actor('gpt', 1.05); dragon = this.actor('gpt', 0.72);
  anger = this.prop('fx_anger', 1.1); heart = this.prop('fx_heart', 1.0); spk = this.prop('fx_sparkle_0', 1.3);
  cage = new THREE.Group(); bars: { m: THREE.Mesh; p: THREE.Vector3; q: THREE.Quaternion; i: number }[] = []; iron = mat(0x3a3550, { metalness: 0.5, roughness: 0.4, emissive: 0x000000 });
  redL = new THREE.PointLight(0xff3344, 0, 9, 1.3); softL = new THREE.PointLight(0xc4b5fd, 0, 9, 1.3); lanterns: THREE.Mesh[] = []; trail = new Particles(140, { size: 0.09 });
  constructor() {
    super();
    this.group.add(mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.24, 40), mat(0x4a5068), [0, -0.12, 0]), mesh(new THREE.PlaneGeometry(300, 300).rotateX(-Math.PI / 2), mat(0x141a2e), [0, -0.2, 0]));
    const rune = mesh(new THREE.TorusGeometry(3.6, 0.04, 6, 64), new THREE.MeshBasicMaterial({ color: 0x8a7aff })); rune.rotation.x = Math.PI / 2; rune.position.y = 0.01; this.group.add(rune);
    const moon = mesh(new THREE.SphereGeometry(5, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false }), [-24, 22, -60]); const mg = glowSprite(0xfff0c0, 34, 0.45); mg.position.copy(moon.position); this.group.add(moon, mg);
    const add = (m: THREE.Mesh, i: number) => { this.bars.push({ m, p: m.position.clone(), q: m.quaternion.clone(), i }); this.cage.add(m); };
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; add(rod([Math.cos(a) * 1.5, 0.05, Math.sin(a) * 1.5], [Math.cos(a) * 1.5, 3.2, Math.sin(a) * 1.5], 0.045, this.iron), i); add(rod([Math.cos(a) * 1.5, 3.2, Math.sin(a) * 1.5], [0, 4.05, 0], 0.035, this.iron), i); }
    const ring1 = mesh(new THREE.TorusGeometry(1.5, 0.06, 6, 40), this.iron, [0, 0.1, 0]); ring1.rotation.x = Math.PI / 2; const ring2 = ring1.clone(); ring2.position.y = 3.2; add(ring1, 0); add(ring2, 9);
    this.group.add(this.cage);
    this.redL.position.set(0, 1.6, 0.4); this.softL.position.set(0.4, 2.2, 1.2); this.group.add(this.redL, this.softL, this.trail.points);
    for (let i = 0; i < 30; i++) { const l = mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), new THREE.MeshStandardMaterial({ color: 0xffb04a, emissive: 0xff8a1a, emissiveIntensity: 1.8 })); this.lanterns.push(l); this.group.add(l); }
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    e.sky.set(0x070a1e, 0x1e2452, 0x0a0c1a, 0.0); e.sky.sun([-0.4, 0.35, -1], 0xfff0c0, 0.2); stars(e, 1);
    fog(e, 0x10142a, 14, 70); light(e, 0x8a90ff, 0x1a1a2a, 0.6, 0xc8d0ff, 0.9, [-6, 9, -4]);
    this.cage.visible = v === 'L7' || v === 'L8'; this.lanterns.forEach((l) => (l.visible = false)); this.trail.mat.uniforms.uOpacity.value = 0;
    this.bars.forEach((b) => { b.m.position.copy(b.p); b.m.quaternion.copy(b.q); b.m.scale.setScalar(1); b.m.visible = true; });
    this.redL.intensity = 0; this.softL.intensity = 0; this.iron.emissive.setHex(0);
    this.whale.at(2.35, 0, 1.75).show();
    if (v === 'L7') {
      const calm = range(t, LT(7, 5), LT(7, 8)); const warm = range(t, LT(7, 9), LT(7, 12));
      const rage = 1 - calm;
      if (t < LT(7, 5)) this.boss.still(pulse(t) > 0.45 || Math.floor(t * 6) % 2 ? 'gpt_boss_rage' : 'gpt_boss_cast0');
      else this.boss.still(Math.floor(t * 1.3) % 4 === 0 ? 'gpt_boss_blink' : 'gpt_boss_idle');
      const jit = rage * 0.05; this.boss.at(Math.sin(t * 41) * jit, 0.12 + Math.cos(t * 37) * jit, 0).show(t < LT(7, 12));
      this.dragon.at(0, 0.12, 0).show(t >= LT(7, 12)).play('float', LT(7, 12));
      if (rage > 0.3) this.anger.at(0.75 + Math.sin(t * 9) * 0.05, 2.05, 0.3).show().size = 1.1 * (0.8 + pulse(t) * 0.5);
      this.redL.intensity = rage * (7 + pulse(t) * 8); this.softL.intensity = warm * 6; this.softL.color.setHex(0xd8b4fe);
      this.iron.emissive.setHex(0x5a0010).multiplyScalar(rage * (0.5 + pulse(t)));
      e.grade.ca = rage * 0.004; e.grade.flash = pulse(t) * 0.12 * rage; e.grade.flashCol = 0xff2244;
      e.hemi.intensity = 0.6 - calm * 0.25 + warm * 0.35;
      if (warm > 0) { this.spk.at(-0.7, 2.2 + Math.sin(t * 3) * 0.1, 0.4).show().still(`fx_sparkle_${Math.floor(t * 8) % 3}`); }
      this.whale.cue(t, [[0, 'surprise'], [LT(7, 2), 'idle'], [LT(7, 12), 'nod']]);
      const a = lerp(-0.4, 0.38, eIO(p)); setCam(e.cam, [Math.sin(a) * 5.8, 1.9, Math.cos(a) * 5.8], [0.5, 1.45, 0], 42);
    } else if (v === 'L8') {
      const fly = range(t, LT(8, 7), LE(8) + 0.6);
      this.whale.cue(t, [[0, 'wave'], [LT(8, 7), 'hop']]);
      this.bars.forEach((b) => {
        const ts = LT(8, 0) + (b.i / 18) * (LT(8, 4) - LT(8, 0)); const u = range(t, ts, ts + 1.7); if (u <= 0) return;
        const out = b.p.clone().setY(0).normalize();
        b.m.position.copy(b.p).addScaledVector(out, u * 4).add(new THREE.Vector3(0, u * u * 7, 0)); b.m.rotateOnAxis(new THREE.Vector3(1, 0, 0), u * 3); b.m.scale.setScalar(Math.max(0.001, 1 - u)); b.m.visible = u < 1;
      });
      this.dragon.at(Math.sin(fly * 3) * 1.2 * fly, 0.12 + eIO(fly) * 6.5, -fly * 1.5).show().play(fly > 0 ? 'hover' : 'float', LT(8, 7)); this.dragon.flip = Math.cos(fly * 3) < 0;
      this.softL.intensity = 5; this.softL.color.setHex(0xe9d5ff);
      this.trail.mat.uniforms.uOpacity.value = fly > 0 ? 1 : 0;
      const dp = this.dragon.mesh.position;
      for (let i = 0; i < 140; i++) { const lag = i * 0.012; const f2 = range(t - lag, LT(8, 7), LE(8) + 0.6); this.trail.set(i, Math.sin(f2 * 3) * 1.2 * f2 + (hash(i) - 0.5) * 0.3, 0.9 + eIO(f2) * 6.5 + (hash(i + 1) - 0.5) * 0.3, -f2 * 1.5, (1 - i / 140) * 1.2); this.trail.color(i, C(i % 2 ? 0xfff1a8 : 0xd8b4fe)); }
      this.trail.commit();
      e.grade.flash = decay(t, LT(8, 8), 4) * 0.3; e.grade.flashCol = 0xfff4d0;
      setCam(e.cam, mix3([0.3, 1.6, 6.2], [0.6, 2.6, 7.6], eIO(p)), [dp.x * 0.5, lerp(1.4, 5.4, eIO(fly)), dp.z * 0.5], 44);
    } else if (v === 'L21') {
      const warm = smooth(range(t, LT(21, 8), LE(21)));
      this.dragon.at(-0.75, 0.05, -0.15).show().cue(t, [[0, 'float'], [LT(21, 12), 'nod']]);
      this.whale.at(0.65, 0, 0.5).cue(t, [[0, 'idle'], [LT(21, 5), 'sad'], [LT(21, 9), 'idle'], [LT(21, 12), 'nod']]);
      this.softL.intensity = 4 + warm * 5; this.softL.color.setHex(0x9ab4ff).lerp(C(0xffc8a8), warm); e.grade.warm = warm * 0.4;
      if (t > LT(21, 12)) this.heart.at(0, 1.55 + Math.sin(t * 2.5) * 0.06, 0.3).show().size = eBack(range(t, LT(21, 12), LT(21, 12) + 0.35));
      const a = lerp(0.6, -0.4, eIO(p)); setCam(e.cam, [Math.sin(a) * 4.6, 1.6, Math.cos(a) * 4.6], [0, 1.0, 0], 40);
    } else {
      const fly = range(t, LT(22, 6), LE(22) + 0.8);
      this.whale.at(0.3, 0, 0.6).cue(t, [[0, 'idle'], [LT(22, 0), 'wave'], [LT(22, 8), 'hop']]);
      this.dragon.at(-0.6 + fly * 1.5, 0.1 + eIO(fly) * 7, -0.3 - fly * 1.2).show().play(fly > 0 ? 'hover' : 'float', LT(22, 6));
      this.lanterns.forEach((l, i) => {
        const ts = LS(22) - 0.3 + (i / 30) * (LT(22, 6) - LS(22)); const u = Math.max(0, t - ts); if (u <= 0) return;
        l.visible = true; l.position.set(0.3 + (hash(i) - 0.5) * (0.4 + u * 1.6) + Math.sin(t + i) * 0.1, 0.9 + u * (0.9 + hash(i + 2) * 0.6), 0.6 + (hash(i + 1) - 0.6) * (0.4 + u * 1.4)); l.rotation.y = t * 0.4 + i;
      });
      this.softL.intensity = 6; this.softL.color.setHex(0xffc890); e.grade.warm = 0.35; e.grade.bloom = 1.3;
      setCam(e.cam, mix3([0, 1.5, 5.6], [0, 6.2, 9.5], eIO(p)), mix3([0, 1.2, 0], [0, 7.2, -2], eIO(p)), 44);
    }
  }
}

// =====================================================================
// 胶卷默片：慢动作缱绻胶卷 / 重播默片，定格一瞬间
// =====================================================================
function filmTexture() {
  const W = 2048, H = 256; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d')!;
  g.fillStyle = '#24170f'; g.fillRect(0, 0, W, H);
  const cells: [string, string][] = [['act_whale_hop_3', 'act_claude_idle_0'], ['act_whale_wave_2', 'act_claude_curtsy_3'], ['act_whale_sway_1', 'act_claude_read_2'], ['whale_big_idle', ''],
    ['act_whale_point_4', 'act_claude_nod_2'], ['act_claude_hop_2', 'act_whale_idle_0'], ['act_whale_spin_2', 'act_claude_lookaround_1'], ['act_whale_bow_4', 'act_claude_curtsy_6']];
  const bgs = ['#e9c99a', '#d8b48a', '#efd2a4', '#c9a57c', '#e2c095', '#f0d8b0', '#d2ae86', '#e8c8a0'];
  cells.forEach(([a, b], i) => {
    const x = i * 256; g.fillStyle = bgs[i]; g.fillRect(x + 18, 44, 220, 168);
    const draw = (k: string, cx: number, hgt: number) => { const r = RECTS[k]; if (!r || !ATLAS_IMG) return; const s = hgt / r[3]; g.imageSmoothingEnabled = false; g.drawImage(ATLAS_IMG, r[0], r[1], r[2], r[3], cx - (r[2] * s) / 2, 206 - r[3] * s, r[2] * s, r[3] * s); };
    if (b) { draw(a, x + 92, 140); draw(b, x + 168, 140); } else draw(a, x + 128, 160);
    g.fillStyle = 'rgba(80,40,10,0.25)'; g.fillRect(x + 18, 44, 220, 168);
    g.fillStyle = '#f3e6cf'; for (let k = 0; k < 8; k++) { g.fillRect(x + 8 + k * 31, 12, 18, 20); g.fillRect(x + 8 + k * 31, 224, 18, 20); }
  });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
export class FilmScene extends Scene {
  zai = this.actor('zai'); whale = this.actor('whale'); claude = this.actor('claude'); zzz = this.prop('fx_zzz_0', 0.9); ex = this.prop('fx_exclaim', 1.0);
  tex: THREE.CanvasTexture; strip: THREE.Mesh; reels: THREE.Mesh[] = []; frameG = new THREE.Group(); dust = new Particles(220, { size: 0.05 });
  projectorBeam: THREE.Mesh;
  constructor() {
    super();
    this.tex = filmTexture();
    const segs = 360, turns = 1.55, Rr = 3.5, w = 0.95, len = Math.PI * 2 * Rr * turns; const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= segs; i++) { const u = i / segs, th = u * Math.PI * 2 * turns, y = 0.2 + u * 2.8; const x = Math.cos(th) * Rr, z = Math.sin(th) * Rr; pos.push(x, y - w / 2, z, x, y + w / 2, z); const uu = (u * len) / (w * 8); uv.push(uu, 0, uu, 1); if (i < segs) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    this.strip = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.tex, side: THREE.DoubleSide, fog: false })); this.group.add(this.strip);
    this.group.add(mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), mat(0x1a120c), [0, -0.01, 0]));
    const metal = mat(0x2c2c34, { metalness: 0.6, roughness: 0.4 });
    this.group.add(mesh(new THREE.BoxGeometry(0.8, 0.55, 1.0), metal, [0, 0.55, 0]), mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), metal, [0, 0.25, 0]));
    const lens = mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.3, 16), metal, [0, 0.6, -0.62]); lens.rotation.x = Math.PI / 2; this.group.add(lens);
    for (const z of [-0.3, 0.32]) { const r = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), mat(0x6a6a74, { metalness: 0.7 }), [0, 1.15, z]); r.rotation.z = Math.PI / 2; this.reels.push(r); this.group.add(r); }
    const S = new THREE.Vector3(0, 1.6, -5.2), Lp = new THREE.Vector3(0, 0.6, -0.78); const dir = Lp.clone().sub(S); const h = dir.length();
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.75, h, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.025, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.projectorBeam = beam;
    beam.position.copy(S).add(Lp).multiplyScalar(0.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); this.group.add(beam);
    this.group.add(mesh(new THREE.PlaneGeometry(3.6, 2.1), new THREE.MeshBasicMaterial({ color: 0xa69d89, fog: false }), [0, 1.6, -5.25]));
    const wf = new THREE.MeshBasicMaterial({ color: 0xd5c9b0, fog: false });
    this.frameG.add(mesh(new THREE.BoxGeometry(3.9, 0.15, 0.04), wf, [0, 2.72, -5.2]), mesh(new THREE.BoxGeometry(3.9, 0.5, 0.04), wf, [0, 0.33, -5.2]), mesh(new THREE.BoxGeometry(0.15, 2.5, 0.04), wf, [-1.88, 1.5, -5.2]), mesh(new THREE.BoxGeometry(0.15, 2.5, 0.04), wf, [1.88, 1.5, -5.2]));
    this.group.add(this.frameG, this.dust.points);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    e.sky.set(0x0c0805, 0x1e140c, 0x080503, 0.0); e.sky.sun([0, 1, 0], 0, 0); stars(e, 0); fog(e, 0x140e08, 8, 30);
    light(e, 0xffe2b8, 0x1a120c, 0.7, 0xffd8a0, 0.8, [2, 5, 3]); e.grade.vig = 0.7; e.grade.grain = 0.09;
    this.zai.at(0.95, 0, 0.3).show();
    for (let i = 0; i < 220; i++) { const u = (t * 0.02 + hash(i)) % 1; const k = hash(i + 1); this.dust.set(i, (hash(i + 2) - 0.5) * 2.4 * (0.3 + k), 0.7 + k * 0.9 + Math.sin(t * 0.3 + i) * 0.1, -0.8 - u * 4.3, 0.6); this.dust.color(i, C(0xfff0c8)); }
    this.dust.commit();
    this.strip.visible = v === 'L9';
    this.projectorBeam.visible = v === 'L9';
    if (v === 'L9') {
      e.grade.sepia = 0.7; this.tex.offset.x = -t * 0.035; this.reels.forEach((r) => (r.rotation.x = t * 0.4));
      this.zai.play('doze'); this.zzz.at(1.35, 1.25 + Math.sin(t * 1.5) * 0.06, 0.35).show().still(`fx_zzz_${Math.floor(t * 2) % 3}`);
      this.frameG.visible = false;
      const a = lerp(-1.0, 0.25, eIO(p)); setCam(e.cam, [Math.sin(a) * 5.9, 1.65 + p * 0.35, Math.cos(a) * 5.9], [0, 1.3, 0], 42);
    } else {
      const fz = LT(10, 4); const frozen = t >= fz;
      e.grade.bw = 0.9; e.grade.flick = frozen ? 0 : 0.025; e.grade.grain = 0.065; e.grade.bloom = 0.35; e.grade.flash = decay(t, fz, 10) * 0.25; e.grade.flashCol = 0xe5d8c1;
      const te = Math.min(t, fz); this.actorTime = te; this.tex.offset.x = -te * 0.6; this.reels.forEach((r) => (r.rotation.x = te * 3));
      this.whale.at(-0.55, 0.62, -5.0).show().cue(te, [[0, 'hop'], [LT(10, 2), 'spin']]);
      this.claude.at(0.6, 0.62, -5.0).show().cue(te, [[0, 'curtsy'], [LT(10, 2), 'hop']]);
      this.zai.cue(t, [[0, 'doze'], [fz, 'alert']]); if (frozen) { this.ex.at(1.35, 1.35, 0.35).show(); this.actorTime = null; }
      this.frameG.visible = frozen; this.frameG.scale.setScalar(frozen ? lerp(1.15, 1, eOut(range(t, fz, fz + 0.3))) : 1);
      const k = eIO(range(t, LS(10) - 0.3, fz)), z2 = eIO(range(t, fz + 0.4, LE(10) + 0.6));
      setCam(e.cam, mix3(mix3([1.3, 1.5, 1.4], [0.2, 1.55, -0.6], k), [0, 1.5, -2.4], z2), [0, 1.45, -5.2], 42);
    }
    if (v === 'L10' && t >= LT(10, 4)) { const fz = LT(10, 4); for (const a of [this.whale, this.claude]) a.update(fz, e.cam); this.whale.mesh.visible = this.claude.mesh.visible = true; this.zai.update(t, e.cam); }
  }
  post(c: Ctx) {
    if (c.v === 'L10' && c.t >= LT(10, 4)) { const fz = LT(10, 4); for (const a of this.actors) a.update(a === this.zai || a === this.ex ? c.t : fz, c.e.cam); this.actorTime = null; return; }
    super.post(c);
  }
}

// =====================================================================
// 演唱会：告别 / 不再见 / 怀念 / 吻别 / 第一首歌 / 大合唱 / 烟花 / 落幕 / 下一首
// =====================================================================
export class ConcertScene extends Scene {
  whale = this.actor('whale'); claude = this.actor('claude'); doubao = this.actor('doubao'); gemini = this.actor('gemini'); kimi = this.actor('kimi'); qwen = this.actor('qwen'); zai = this.actor('zai'); gpt = this.actor('gpt', 0.62);
  heart = this.prop('fx_heart', 1.1); spk = this.prop('fx_sparkle_0', 1.2); sweat = this.prop('fx_sweat', 0.8);
  led: THREE.InstancedMesh; spots: THREE.Group[] = []; spotM: THREE.MeshBasicMaterial[] = []; edge: THREE.Mesh[] = [];
  crowd = new Particles(820, { size: 0.13 }); conf = new Particles(420, { size: 0.08, additive: false }); fw = new Particles(600, { size: 0.34 }); notes = new Particles(24, { size: 0.2, additive: false, tex: noteTex() });
  curtL: THREE.Mesh; curtR: THREE.Mesh; staff: THREE.Mesh[] = []; curve: THREE.CatmullRomCurve3; rec = vinyl(0.42, 0.03); recGlow = glowSprite(0xffd28a, 2.4, 0);
  constructor() {
    super();
    this.group.add(mesh(new THREE.BoxGeometry(11.5, 0.8, 4.4), mat(0x2a1f2e), [0, -0.4, -3]), mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), mat(0x120e1a), [0, -0.8, 0]));
    for (let i = 0; i < 22; i++) { const m = mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }), [-5.25 + i * 0.5, 0.02, -0.78]); this.edge.push(m); this.group.add(m); }
    this.led = new THREE.InstancedMesh(new THREE.BoxGeometry(0.31, 0.31, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }), 280); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 280; i++) { m4.makeTranslation(-4.6 + (i % 28) * 0.34, 0.55 + Math.floor(i / 28) * 0.34, -5.1); this.led.setMatrixAt(i, m4); this.led.setColorAt(i, C(0x000000)); }
    this.group.add(this.led);
    const truss = mat(0x5a5a66, { metalness: 0.6, roughness: 0.4 });
    this.group.add(mesh(new THREE.BoxGeometry(0.22, 5.2, 0.22), truss, [-5.4, 1.8, -3]), mesh(new THREE.BoxGeometry(0.22, 5.2, 0.22), truss, [5.4, 1.8, -3]), mesh(new THREE.BoxGeometry(11, 0.26, 0.26), truss, [0, 4.5, -3]));
    for (let i = 0; i < 4; i++) {
      const pv = new THREE.Group(); pv.position.set(-3.6 + i * 2.4, 4.45, -2.4);
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      pv.add(mesh(new THREE.ConeGeometry(1.15, 5.4, 28, 1, true), m, [0, -2.7, 0])); this.spotM.push(m); this.spots.push(pv); this.group.add(pv);
    }
    const cg = new THREE.PlaneGeometry(5.9, 5.2, 60, 1); const ca = cg.attributes.position as THREE.BufferAttribute; for (let i = 0; i < ca.count; i++) ca.setZ(i, Math.sin(ca.getX(i) * 6) * 0.12); cg.computeVertexNormals();
    const vel = new THREE.MeshStandardMaterial({ color: 0x9a1830, roughness: 0.85, side: THREE.DoubleSide });
    this.curtL = mesh(cg, vel, [-8.4, 2.4, -0.7]); this.curtR = mesh(cg, vel, [8.4, 2.4, -0.7]); this.group.add(this.curtL, this.curtR);
    this.curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-9, 3.4, 4), new THREE.Vector3(-4, 4.4, 1), new THREE.Vector3(0, 3.5, -1.2), new THREE.Vector3(4, 4.5, 1), new THREE.Vector3(9, 3.3, 4)]);
    for (let k = 0; k < 5; k++) { const pts = this.curve.getPoints(80).map((q) => q.clone().add(new THREE.Vector3(0, k * 0.13, 0))); const tm = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.014, 5), new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false })); this.staff.push(tm); this.group.add(tm); }
    this.rec.rotation.x = Math.PI / 2; this.group.add(this.rec, this.recGlow);
    for (const pp of [this.crowd, this.conf, this.fw, this.notes]) this.group.add(pp.points);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    e.sky.set(0x050416, 0x1c1240, 0x0a0618, 0.0); e.sky.sun([0, 1, 0], 0, 0); stars(e, 0.8); fog(e, 0x0c0a1c, 14, 60);
    light(e, 0xa898ff, 0x1a1020, 0.55, 0xffd6f0, 0.7, [0, 6, 6]);
    const nost = v === 'L25' || v === 'L26'; const pl = pulse(t);
    if (nost) { e.grade.sepia = v === 'L25' ? 0.55 : 0.35; e.grade.warm = 0.35; }
    const pal = nost ? [0xffc070, 0xffa860, 0xffe0a0] : [0xff5fb0, 0x5fd8ff, 0xffe066, 0xb48cff];
    let crowdOn = 1, ledK = 1, spotK = 1, curtain = 0, confOn = 0, fwOn = 0, staffOn = 0; let dawn = 0;
    this.rec.visible = false; this.recGlow.material.opacity = 0;
    const stageY = 0;
    if (v === 'L11') {
      this.whale.at(-0.5, stageY, -1.8).show().play('sway'); this.claude.at(0.55, stageY, -1.85).show().play('idle');
      this.doubao.at(1.9, -0.8, 0.4).show().play('step');
      setCam(e.cam, mix3([0, 2.3, 12], [0.2, 1.3, 4.3], eIO(p)), [0, 0.9, -2], 42);
    } else if (v === 'L12') {
      this.whale.at(-0.5, stageY, -1.8).show().cue(t, [[0, 'idle'], [LT(12, 1), 'wave']]);
      const wk = range(t, LT(12, 2), LE(12) + 1.4);
      this.claude.at(0.55 + wk * 5.5, stageY, -1.85).show().cue(t, [[0, 'curtsy'], [LT(12, 2), 'walk']]); this.claude.flip = false;
      spotK = 1 - range(t, LT(12, 3), LT(12, 4) + 0.3) * 0.7;
      setCam(e.cam, mix3([1.6, 1.25, 2.8], [2.6, 1.2, 2.3], eIO(p)), mix3([0.3, 0.85, -1.9], [1.8, 0.85, -1.9], eIO(p)), 40);
    } else if (v === 'L25') {
      this.whale.at(0, stageY, -1.8).show().cue(t, [[0, 'idle'], [LT(25, 3), 'sway']]);
      setCam(e.cam, mix3([0, 3.2, 15.5], [0, 2.3, 9.5], eIO(p)), [0, 1.0, -2], 42);
    } else if (v === 'L26') {
      this.whale.at(-0.4, stageY, -1.8).show().cue(t, [[0, 'idle'], [LT(26, 0), 'bow']]);
      this.claude.at(0.65, stageY, -1.85).show().cue(t, [[0, 'idle'], [LT(26, 1), 'curtsy']]);
      const hk = range(t, LT(26, 3) - 0.1, LT(26, 3) + 0.25); if (hk > 0) { this.heart.at(0.12, 1.25 + (t - LT(26, 3)) * 0.12, -1.7).show(); this.heart.size = eBack(hk) * 1.1; this.heart.tint(0xffffff, 1 - range(t, LE(26) - 0.3, LE(26) + 0.5)); }
      crowdOn = 0.6; setCam(e.cam, mix3([0.5, 1.0, 1.7], [0.25, 0.95, 1.15], eIO(p)), [0.12, 0.62, -1.82], 38);
    } else if (v === 'L27') {
      this.whale.at(0, stageY, -1.8).show().cue(t, [[0, 'hop'], [LT(27, 4), 'sway'], [LT(27, 6), 'hop']]);
      staffOn = 1; setCam(e.cam, path3([[-3, 1.0, 9], [0, 3.3, 7], [2.5, 2.4, 4.5]], eIO(p)), [0, 1.7, -1.5], 44);
    } else if (v === 'L30' || v === 'L31') {
      const row: [THREE.Object3D, Actor, string][] = [];
      const list: [Actor, string][] = [[this.qwen, 'sway'], [this.gemini, 'sway'], [this.doubao, 'sway'], [this.whale, 'sway'], [this.kimi, 'hop'], [this.zai, 'hop']];
      list.forEach(([a, act], i) => { a.at(-2.8 + i * 1.12, stageY, -1.9 - (i % 2) * 0.25).show().play(v === 'L30' ? 'hop' : act); row.push([a.mesh, a, act]); });
      this.gpt.at(0, stageY, -3.1).show().play('float'); confOn = 1;
      if (v === 'L31') {
        this.whale.cue(t, [[0, 'sway'], [LT(31, 7), 'sad'], [LT(31, 9), 'hop']]);
        if (t > LT(31, 7) && t < LT(31, 9)) { const k = (t - LT(31, 7)) % 0.6 / 0.6; this.sweat.at(0.5 + 0.15, 0.95 - k * 0.5, -1.7).show(); this.sweat.tint(0xffffff, 1 - k); }
        if (t > LT(31, 9)) this.spk.at(0.5 - 0.45, 1.15, -1.7).show().still(`fx_sparkle_${Math.floor(t * 8) % 3}`);
        setCam(e.cam, [lerp(-3, 3, p), 1.0, 2.1], [lerp(-1.6, 1.6, p), 0.75, -1.9], 40);
      } else setCam(e.cam, mix3([0, 0.55, 2.3], [0, 0.8, 3.6], eIO(p)), [0, 0.95, -2], 42);
    } else if (v === 'L32') {
      fwOn = 1; confOn = 0.5;
      [this.qwen, this.gemini, this.doubao, this.whale, this.kimi, this.zai].forEach((a, i) => a.at(-2.8 + i * 1.12, stageY, -1.9).show().play('hop'));
      setCam(e.cam, mix3([0, 1.8, 6.5], [0, 3.4, 16], eIO(p)), mix3([0, 1.5, -2], [0, 3.8, -6], eIO(p)), 44);
    } else if (v === 'L35') {
      this.whale.at(0, stageY, -1.8).show().cue(t, [[0, 'idle'], [LT(35, 3), 'bow']]);
      curtain = eIO(range(t, LT(35, 2), LE(35) + 0.2)); crowdOn = 1 - curtain * 0.7; ledK = 1 - curtain * 0.8; spotK = 0.5;
      setCam(e.cam, [0, 1.3, 5.6], [0, 1.1, -1.5], 40);
    } else if (v === 'L36') {
      curtain = 1 - eIO(range(t, LS(36) - 0.3, LS(36) + 1.0)); dawn = 1;
      this.whale.at(-0.9, stageY, -1.7).show().cue(t, [[0, 'idle'], [LT(36, 5), 'hop']]);
      this.rec.visible = true; this.rec.position.set(0.5, 1.15 + Math.sin(t * 1.5) * 0.05, -1.75); this.rec.rotation.set(Math.PI / 2 - 0.15, t * 1.4, 0);
      this.recGlow.position.copy(this.rec.position); this.recGlow.material.opacity = 0.55 + pl * 0.3;
      setCam(e.cam, mix3([0, 1.3, 5.6], [0, 1.2, 3.3], eIO(p)), [0, 1.0, -1.6], 40);
    }
    if (dawn) { e.sky.set(0x4a5aa8, 0xffb08a, 0xffe0c0, 0.0); stars(e, 0); light(e, 0xffe0d0, 0x40304a, 0.9, 0xffd0a0, 1.2, [0, 4, -8]); fog(e, 0xe8b8a0, 20, 80); }
    // 幕布
    this.curtL.position.x = lerp(-8.4, -2.9, curtain); this.curtR.position.x = lerp(8.4, 2.9, curtain);
    // LED 墙
    for (let i = 0; i < 280; i++) {
      const cx = (i % 28) - 13.5, cy = Math.floor(i / 28);
      let k = 0.5 + 0.5 * Math.sin(cx * 0.45 + t * 3 - cy * 0.6) * Math.cos(cy * 0.5 - t * 1.7);
      k = k * (0.35 + pl * 0.9);
      if (dawn) { this.led.setColorAt(i, C(0xff9a60).clone().lerp(C(0xffe8a0), cy / 10).multiplyScalar(0.5 + k * 0.4)); continue; }
      this.led.setColorAt(i, C(pal[(Math.floor(cx / 4 + t) % pal.length + pal.length) % pal.length]).clone().multiplyScalar(k * ledK * 1.2));
    }
    if (this.led.instanceColor) this.led.instanceColor.needsUpdate = true;
    this.edge.forEach((m, i) => (m.material as THREE.MeshBasicMaterial).color.setHex(pal[(i + Math.floor(t * 4)) % pal.length]).multiplyScalar(0.6 + pl));
    this.spots.forEach((s, i) => { s.rotation.z = Math.sin(t * 0.9 + i * 1.3) * 0.38; s.rotation.x = Math.cos(t * 0.7 + i) * 0.2; this.spotM[i].color.setHex(pal[i % pal.length]); this.spotM[i].opacity = (0.1 + pl * 0.1) * spotK; });
    if (v === 'L12') { this.spots[2].rotation.z = -0.15 - range(t, LT(12, 2), LE(12)) * 0.6; }
    // 观众荧光棒
    this.crowd.mat.uniforms.uOpacity.value = crowdOn;
    for (let i = 0; i < 820; i++) {
      const x = (hash(i) - 0.5) * 19, z = 0.6 + hash(i + 1) * 16; const ph = hash(i + 2) * 6;
      this.crowd.set(i, x + Math.sin(t * 2.2 + ph) * 0.12, -0.8 + 1.15 + hash(i + 3) * 0.3 + Math.abs(Math.sin(t * 3.2 + ph + x * 0.2)) * (0.12 + pl * 0.22), z, 0.8 + hash(i + 4) * 0.6);
      this.crowd.color(i, C(pal[i % pal.length]));
    }
    this.crowd.commit();
    this.conf.mat.uniforms.uOpacity.value = confOn;
    if (confOn) { for (let i = 0; i < 420; i++) { const u = (t * 0.12 + hash(i)) % 1; this.conf.set(i, (hash(i + 1) - 0.5) * 12 + Math.sin(t * 2 + i) * 0.3, 6 - u * 7, -2 + (hash(i + 2) - 0.5) * 9, 1); this.conf.color(i, C([0xff5fb0, 0x5fd8ff, 0xffe066, 0x8affc1, 0xffffff][i % 5])); } this.conf.commit(); }
    this.fw.mat.uniforms.uOpacity.value = fwOn;
    if (fwOn) {
      for (let k = 0; k < 5; k++) {
        const t0 = LS(32) - 0.4 + k * 0.62; const age = t - t0; const cx = -5 + k * 2.5, cy = 7 + hash(k) * 2.5, cz = -10 - hash(k + 3) * 4;
        for (let j = 0; j < 120; j++) {
          const i = k * 120 + j; if (age < 0 || age > 2.2) { this.fw.set(i, 0, -99, 0, 0); continue; }
          const th = hash(i) * Math.PI * 2, ph = Math.acos(2 * hash(i + 7) - 1); const sp = 4.8 * (1 - Math.exp(-age * 3));
          this.fw.set(i, cx + Math.sin(ph) * Math.cos(th) * sp, cy + Math.cos(ph) * sp - age * age * 0.5, cz + Math.sin(ph) * Math.sin(th) * sp, 1.6 * (1 - age / 2.2));
          this.fw.color(i, C([0xff7eb6, 0xffe066, 0x7dd3fc, 0xb4ff9a, 0xffb86b][k]));
        }
      }
      this.fw.commit(); e.grade.bloom = 1.4;
    }
    this.staff.forEach((s) => (s.visible = staffOn > 0)); this.notes.mat.uniforms.uOpacity.value = staffOn;
    if (staffOn) { for (let i = 0; i < 24; i++) { const u = (t * 0.07 + i / 24) % 1; const q = this.curve.getPoint(u); this.notes.set(i, q.x, q.y + 0.26 + (i % 5) * 0.06, q.z, 1 + pl * 0.3); this.notes.color(i, C([0xffe08a, 0xffb4c8, 0xbfe3ff][i % 3])); } this.notes.commit(); }
  }
}

// =====================================================================
// 钢琴：你写给我我的第一首歌 / 十指紧扣默写前奏 / 可是那然后呢
// =====================================================================
const MELODY = [7, 9, 11, 12, 11, 9, 7, 5, 4, 5, 7, 9, 12, 14, 12, 11, 9];
export class PianoScene extends Scene {
  whale = this.actor('whale'); claude = this.actor('claude'); book = this.prop('prop_book', 0.85); heart = this.prop('fx_heart', 1.1); q = this.prop('fx_question', 1.1);
  keys: THREE.Mesh[] = []; blacks: THREE.Mesh[] = []; staff: THREE.Mesh[] = []; curve: THREE.CatmullRomCurve3; notes = new Particles(14, { size: 0.16, additive: false, tex: noteTex() });
  amber = new Particles(160, { size: 0.08 }); warmL = new THREE.PointLight(0xffd6a8, 6, 10, 1.3);
  constructor() {
    super();
    const wm = new THREE.MeshStandardMaterial({ color: 0xf8f6f0, roughness: 0.35 }), bm = new THREE.MeshStandardMaterial({ color: 0x16141c, roughness: 0.3 });
    for (let i = 0; i < 22; i++) { const k = mesh(new THREE.BoxGeometry(0.45, 0.26, 2.4), wm, [-5.04 + i * 0.48, 0, 0]); this.keys.push(k); this.group.add(k); if ([0, 1, 3, 4, 5].includes(i % 7) && i < 21) { const b = mesh(new THREE.BoxGeometry(0.28, 0.24, 1.45), bm, [-5.04 + i * 0.48 + 0.24, 0.15, -0.46]); this.blacks.push(b); this.group.add(b); } }
    this.curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.9, 1.1, 0.25), new THREE.Vector3(-1.5, 2.2, 0.6), new THREE.Vector3(0.5, 1.7, 0.4), new THREE.Vector3(2.7, 1.25, 0.25)]);
    for (let k = 0; k < 5; k++) { const pts = this.curve.getPoints(60).map((q) => q.clone().add(new THREE.Vector3(0, k * 0.1, 0))); const tm = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.012, 5), new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false })); this.staff.push(tm); this.group.add(tm); }
    this.warmL.position.set(0, 3.2, 1.6); this.group.add(this.warmL, this.notes.points, this.amber.points);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    e.sky.set(0x080c26, 0x1a2550, 0x0a0a20, 0.0); e.sky.sun([0, 1, 0], 0, 0); stars(e, 1); fog(e, 0x0c1028, 12, 50);
    light(e, 0xb0c0ff, 0x1a1a2a, 0.65, 0xfff0e0, 0.9, [2, 6, 5]); this.warmL.intensity = 6; this.warmL.color.setHex(0xffd6a8);
    const line = v === 'L13' ? 13 : v === 'L14' ? 14 : v === 'L15' ? 15 : 28; const n = line === 13 ? 10 : line === 15 ? 6 : 11;
    this.keys.forEach((k, i) => { k.position.set(-5.04 + i * 0.48, 0, 0); k.rotation.set(0, 0, 0); k.visible = true; });
    this.blacks.forEach((b) => (b.visible = true));
    for (let j = 0; j < n; j++) { const ki = MELODY[j % MELODY.length] + (line === 13 ? -2 : 0); const k = this.keys[ki]; if (!k) continue; const d = decay(c.t, LT(line, j), 7) * 0.11; k.position.y -= d; k.rotation.x += d * 0.5; }
    let staffK = 0; this.amber.mat.uniforms.uOpacity.value = 0; this.notes.mat.uniforms.uOpacity.value = 0;
    if (v === 'L13') {
      this.claude.at(-3.2, 0.13, 0.15).show().play('read'); this.book.at(-2.75, 0.75 + Math.sin(t * 2) * 0.04, 0.45).show();
      this.whale.at(3.0, 0.13, 0.15).show().cue(t, [[0, 'idle'], [LT(13, 6), 'surprise'], [LT(13, 8), 'hop']]);
      staffK = range(t, LS(13) - 0.2, LE(13));
      setCam(e.cam, mix3([-1, 2.2, 6.6], [0.9, 1.8, 5.6], eIO(p)), [0, 0.95, 0], 42);
    } else if (v === 'L14' || v === 'L28') {
      this.claude.at(-0.62, 0.13, 0.15).show().play(line === 28 ? 'idle' : 'hop', LS(line)); this.whale.at(0.62, 0.13, 0.15).show().play(line === 28 ? 'sway' : 'hop', LS(line));
      if (line === 14) { this.claude.cue(t, [[0, 'idle'], [LT(14, 3), 'nod'], [LT(14, 7), 'idle']]); this.whale.cue(t, [[0, 'idle'], [LT(14, 3), 'nod'], [LT(14, 7), 'sway']]); }
      const hk = range(t, LT(line, 3), LT(line, 3) + 0.3); if (hk > 0) { this.heart.at(0, 1.35 + Math.sin(t * 3) * 0.05, 0.2).show(); this.heart.size = eBack(hk) * (1.1 + pulse(t) * 0.2); }
      staffK = 1;
      if (line === 28) {
        e.grade.sepia = 0.85; e.grade.vig = 0.75; e.grade.warm = 0.3; e.grade.flash = decay(t, LS(28) - 0.3, 4) * 0.5; e.grade.flashCol = 0xffd28a;
        this.amber.mat.uniforms.uOpacity.value = 1;
        for (let i = 0; i < 160; i++) { const u = (t * 0.05 + hash(i)) % 1; this.amber.set(i, (hash(i + 1) - 0.5) * 9, u * 4, (hash(i + 2) - 0.5) * 5, 0.8); this.amber.color(i, C(0xffc35a)); }
        this.amber.commit();
        setCam(e.cam, path3([[3.6, 1.25, 3.1], [1.7, 0.95, 2.7], [0.6, 0.85, 2.25]], eIO(p)), [0, 0.75, 0], 40);
      } else setCam(e.cam, path3([[-2.4, 1.1, 3.5], [-1.2, 1.0, 3.7], [-0.3, 1.0, 3.8]], eIO(p)), [0, 0.75, 0], 40);
    } else {
      const t0 = LS(15) - 0.1;
      this.keys.forEach((k, i) => { const d = Math.abs(i - 11) * 0.05; const u = range(t, t0 + d, t0 + d + 1.6); k.position.y -= eIn(u) * 7; k.rotation.z = u * (hash(i) - 0.5) * 2; k.rotation.x = u * (hash(i + 1) - 0.5) * 2; });
      this.blacks.forEach((b) => (b.visible = t < t0 + 0.2));
      this.claude.at(-0.36, 0.13, 0.15).show().play('sad', LS(15)); this.claude.tint(0xffffff, 1 - range(t, LS(15), LT(15, 2)));
      this.whale.at(0.36, 0.13, 0.15).show().cue(t, [[0, 'idle'], [LT(15, 1), 'shake'], [LT(15, 4), 'sad']]);
      if (t > LT(15, 3)) { this.q.at(0.45, 1.3 + Math.sin(t * 4) * 0.05, 0.25).show(); this.q.size = eBack(range(t, LT(15, 3), LT(15, 3) + 0.3)) * 1.1; }
      staffK = 1 - range(t, LS(15), LT(15, 2)); this.warmL.color.setHex(0x8ab4ff); this.warmL.intensity = 4; e.grade.bw = 0.3;
      setCam(e.cam, mix3([0.5, 1.2, 3.7], [0, 2.4, 8.2], eIO(p)), [0.3, 0.7, 0], 40);
    }
    this.staff.forEach((s) => { s.visible = staffK > 0.01; const ic = s.geometry.index ? s.geometry.index.count : 0; s.geometry.setDrawRange(0, Math.floor((ic * staffK) / 6) * 6); });
    if (staffK > 0) {
      this.notes.mat.uniforms.uOpacity.value = 1;
      for (let j = 0; j < 14; j++) {
        if (j >= n) { this.notes.set(j, 0, -99, 0, 0); continue; }
        const u = (j + 0.5) / n; const q = this.curve.getPoint(Math.min(u, staffK)); const s = eBack(range(t, LT(line, j) - 0.08, LT(line, j) + 0.18));
        this.notes.set(j, q.x, q.y + 0.2 + (j % 4) * 0.06, q.z, s * (u <= staffK + 0.02 ? 1 : 0)); this.notes.color(j, C([0xffe08a, 0xffb4c8, 0xbfe3ff][j % 3]));
      }
      this.notes.commit();
    }
  }
}

// 让 tree-shaking 不吃掉：引用一下（ACTIONS 用于动作存在性检查）
export const hasAction = (ch: string, a: string) => !!ACTIONS[ch]?.[a];
export { bump, smooth };
