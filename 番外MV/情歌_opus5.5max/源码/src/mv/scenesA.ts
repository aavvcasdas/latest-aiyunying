// 场景 A：家园小星球 / 琥珀 / 沙漏 / 河流 / 命运
import * as THREE from 'three';
import {
  Actor, C, LE, LS, LT, Particles, Sky, bubbleTex, bump, decay, eBack, eIO, eIn, eOut, glowSprite, hash, lerp, mat, mesh, mix3,
  noteTex, pageTex, path3, pulse, range, rng, rod, setCam, smooth, suitTex, vinylTex,
} from './core';

export interface Grade { sepia: number; bw: number; vig: number; grain: number; flash: number; flashCol: number; black: number; warm: number; flick: number; ca: number; bloom: number }
export interface Env { scene: THREE.Scene; cam: THREE.PerspectiveCamera; sky: Sky; stars: Particles; hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; fog: THREE.Fog; grade: Grade }
export interface Ctx { t: number; lt: number; p: number; dur: number; v: string; e: Env; a: number; b: number }

export abstract class Scene {
  group = new THREE.Group(); actors: Actor[] = []; actorTime: number | null = null;
  actor(ch: string, size = 1) { const a = new Actor(ch, size); this.actors.push(a); this.group.add(a.mesh); return a; }
  prop(key: string, size = 1) { const a = new Actor('whale', size).still(key); this.actors.push(a); this.group.add(a.mesh); return a; }
  hideAll() { for (const a of this.actors) a.show(false).tint(0xffffff, 1); }
  abstract frame(c: Ctx): void;
  post(c: Ctx) { const t = this.actorTime ?? c.t; for (const a of this.actors) a.update(t, c.e.cam); this.actorTime = null; }
}
export function light(e: Env, sky: number, ground: number, hi: number, sunCol: number, si: number, sp: number[] = [5, 10, 6]) {
  e.hemi.color.setHex(sky); e.hemi.groundColor.setHex(ground); e.hemi.intensity = hi;
  e.sun.color.setHex(sunCol); e.sun.intensity = si; e.sun.position.set(sp[0], sp[1], sp[2]);
}
export function fog(e: Env, col: number, near: number, far: number) { e.fog.color.setHex(col); e.fog.near = near; e.fog.far = far; }
export const stars = (e: Env, o: number) => { e.stars.mat.uniforms.uOpacity.value = o; };
export function vinyl(r: number, h: number) {
  const side = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.4 });
  const a = new THREE.MeshStandardMaterial({ map: vinylTex('#d9364f'), roughness: 0.35, metalness: 0.1 });
  const b = new THREE.MeshStandardMaterial({ map: vinylTex('#3b6fd9'), roughness: 0.35, metalness: 0.1 });
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 56), [side, a, b]);
}
const tmpV = new THREE.Vector3();

// =====================================================================
// 家园小星球：片头唱片、夕阳副歌、B 面、四季、长镜头、篝火、片尾
// =====================================================================
const R = 5;
const sy = (x: number, z: number) => Math.sqrt(Math.max(0, R * R - x * x - z * z)) - R;
export class PlanetScene extends Scene {
  pmat = mat(0x7cc96a, { roughness: 1 });
  whale = this.actor('whale'); claude = this.actor('claude'); gemini = this.actor('gemini'); kimi = this.actor('kimi');
  doubao = this.actor('doubao'); qwen = this.actor('qwen'); zai = this.actor('zai'); gpt = this.actor('gpt', 0.6);
  clockL = this.prop('prop_catclock', 0.85); clockR = this.prop('prop_catclock', 0.85); scroll = this.prop('prop_scroll', 0.8);
  heart = this.prop('fx_heart', 1.5); spark = this.prop('fx_sparkle_0', 1.3); sweat = this.prop('fx_sweat', 0.9);
  player = new THREE.Group(); flipG = new THREE.Group(); platter = vinyl(0.21, 0.022); arm = new THREE.Group();
  disc = vinyl(0.33, 0.02); discGlow = glowSprite(0xffc070, 2.4, 0);
  lampLight = new THREE.PointLight(0xffc27a, 5, 8, 1.4); fire = new THREE.Group(); flames: THREE.Mesh[] = [];
  fireLight = new THREE.PointLight(0xff8a3a, 0, 8, 1.3); fireGlow = glowSprite(0xff8a3a, 3, 0.8);
  embers = new Particles(70, { size: 0.07 }); flies = new Particles(40, { size: 0.08 }); snow = new Particles(420, { size: 0.06, additive: false });
  gold = new Particles(180, { size: 0.09 }); notes = new Particles(18, { size: 0.13, additive: false, tex: noteTex() });
  pages: THREE.Mesh[] = []; rp = new THREE.Vector3(0.95, 0, 0.35); baseTop = 0;
  constructor() {
    super();
    const g = new THREE.SphereGeometry(R, 72, 48); const pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      const k = smooth(range(R - y, 0.7, 2.4));
      const n = (Math.sin(x * 2.1 + z * 1.3) * Math.cos(z * 2.7 - y * 1.1) + Math.sin(y * 3.3 + x)) * 0.14 * k;
      const s = 1 + n / R; pa.setXYZ(i, x * s, y * s, z * s);
    }
    g.computeVertexNormals();
    this.group.add(mesh(g, this.pmat, [0, -R, 0]));
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), mat(0xffffff, { emissive: 0x222222 }), 80);
    const r = rng(7); const m4 = new THREE.Matrix4(); const pal = [0xff9ebd, 0xffe066, 0xffffff, 0xc8b6ff, 0xff7a7a];
    for (let i = 0; i < 80; i++) {
      const a = r() * Math.PI * 2, d = 0.6 + r() * 2.6; const x = Math.cos(a) * d, z = Math.sin(a) * d;
      m4.makeTranslation(x, sy(x, z) + 0.03, z); fl.setMatrixAt(i, m4); fl.setColorAt(i, C(pal[i % pal.length]));
    }
    this.group.add(fl);
    const tx = -2.0, tz = -1.0, ty = sy(tx, tz);
    this.group.add(rod([tx, ty, tz], [tx, ty + 0.85, tz], 0.08, mat(0x7a4a2a)));
    for (let k = 0; k < 3; k++) this.group.add(mesh(new THREE.ConeGeometry(0.62 - k * 0.14, 0.75, 7), mat(0x3f9a4f), [tx, ty + 0.95 + k * 0.38, tz]));
    const lx = 1.9, lz = -0.9, ly = sy(lx, lz);
    this.group.add(rod([lx, ly, lz], [lx, ly + 1.75, lz], 0.035, mat(0x2a2a3a)));
    this.group.add(mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), [lx, ly + 1.82, lz]));
    const lg = glowSprite(0xffc070, 1.6, 0.8); lg.position.set(lx, ly + 1.82, lz); this.group.add(lg);
    this.lampLight.position.set(lx, ly + 1.8, lz); this.group.add(this.lampLight);
    // 唱片机
    const by = sy(this.rp.x, this.rp.z); this.baseTop = by + 0.15;
    this.player.add(mesh(new THREE.BoxGeometry(0.62, 0.15, 0.5), mat(0x8a5a3c), [0, by + 0.075, 0]));
    this.flipG.position.set(0, this.baseTop + 0.014, 0); this.flipG.add(this.platter); this.player.add(this.flipG);
    this.arm.position.set(0.24, this.baseTop + 0.05, -0.18);
    this.arm.add(mesh(new THREE.BoxGeometry(0.018, 0.018, 0.3), mat(0xd8d8e0, { metalness: 0.6, roughness: 0.3 }), [0, 0, 0.15]));
    this.arm.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), mat(0x9090a0), [0, -0.02, 0]));
    this.player.add(this.arm); this.player.position.set(this.rp.x, 0, this.rp.z); this.group.add(this.player);
    this.group.add(this.disc, this.discGlow);
    // 篝火
    const fy = sy(0, -0.25);
    this.fire.add(rod([-0.28, fy + 0.04, -0.35], [0.28, fy + 0.08, -0.15], 0.05, mat(0x5a3a22)));
    this.fire.add(rod([-0.28, fy + 0.08, -0.15], [0.28, fy + 0.04, -0.35], 0.05, mat(0x5a3a22)));
    for (let k = 0; k < 3; k++) {
      const f = mesh(new THREE.ConeGeometry(0.16 - k * 0.04, 0.6 - k * 0.12, 8), new THREE.MeshBasicMaterial({ color: [0xff5a1a, 0xff9a2a, 0xffe07a][k], transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), [0, fy + 0.3, -0.25]);
      this.flames.push(f); this.fire.add(f);
    }
    this.fireGlow.position.set(0, fy + 0.4, -0.25); this.fireLight.position.set(0, fy + 0.6, -0.25); this.fire.add(this.fireGlow, this.fireLight); this.group.add(this.fire);
    for (const p of [this.embers, this.flies, this.snow, this.gold, this.notes]) this.group.add(p.points);
    for (let i = 0; i < 16; i++) { const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.93), new THREE.MeshBasicMaterial({ map: pageTex(), side: THREE.DoubleSide, transparent: true, fog: false })); this.pages.push(pg); this.group.add(pg); }
  }
  place(a: Actor, x: number, z: number, dy = 0) { return a.at(x, sy(x, z) + dy, z).show(); }
  night(e: Env, k = 1) {
    e.sky.set(0x060920, 0x1c1f4d, 0x3a2a5a, 0.0); e.sky.sun([0.5, 0.3, -1], 0xaabbff, 0.15); stars(e, k);
    fog(e, 0x161a38, 25, 110); light(e, 0x8090ff, 0x302040, 0.65, 0xaabbee, 0.7, [-5, 8, 4]);
  }
  sunset(e: Env) {
    e.sky.set(0x3b2a6b, 0xff9a62, 0x5a2a3a, 0.02); e.sky.sun([0.6, 0.07, -1], 0xffb070, 1.3); stars(e, 0);
    fog(e, 0xd8826a, 25, 110); light(e, 0xffc8a0, 0x553344, 0.85, 0xffa060, 1.5, [8, 3, -10]);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; const cam = e.cam;
    this.hideAll(); this.fire.visible = false; this.player.visible = true; this.disc.visible = false; this.discGlow.material.opacity = 0;
    this.lampLight.intensity = 5; this.pmat.color.setHex(0x7cc96a);
    for (const pg of this.pages) pg.visible = false;
    this.snow.mat.uniforms.uOpacity.value = 0; this.embers.mat.uniforms.uOpacity.value = 0; this.gold.mat.uniforms.uOpacity.value = 0; this.notes.mat.uniforms.uOpacity.value = 0;
    this.flies.mat.uniforms.uOpacity.value = 0.9;
    // 唱片转速 / 唱臂
    let spin = 0, armA = 0.95, flip = 0, lift = 0;
    const rp = this.rp; const top = [rp.x, this.baseTop + 0.02, rp.z];
    this.place(this.whale, 0, 0.6).play('idle');
    if (v === 'introA') {
      this.night(e); e.grade.black = 1 - range(t, 0.2, 3.2); e.grade.vig = 0.55;
      setCam(cam, path3([[0.5, 6, 26], [1.6, 3.0, 14], [2.4, 1.5, 6.4]], eIO(p)), [0.4, 0.45, 0]);
      if (t > 5.6) this.whale.play('nod', 5.6);
    } else if (v === 'introB') {
      this.night(e); spin = range(t, 9.4, 10.6) * 3.2; armA = lerp(0.95, 0.38, eIO(range(t, 9.8, 10.8)));
      const a = lerp(-0.6, 0.5, eIO(p));
      setCam(cam, [rp.x + Math.sin(a) * 1.25, this.baseTop + 0.72 - p * 0.12, rp.z + Math.cos(a) * 1.25], [rp.x, this.baseTop, rp.z], 38);
      this.notes.mat.uniforms.uOpacity.value = range(t, 10.8, 11.6);
      e.grade.flash = decay(t, 10.8, 5) * 0.25; e.grade.flashCol = 0xffe2b0;
    } else if (v === 'introC') {
      this.night(e); spin = 3.2; armA = 0.38;
      const k = eIO(p);
      setCam(cam, path3([[rp.x + 1.0, this.baseTop + 0.9, rp.z + 1.1], [rp.x + 0.5, this.baseTop + 2.3, rp.z + 0.6], [rp.x + 0.03, this.baseTop + 0.3, rp.z + 0.06]], k), [rp.x, this.baseTop, rp.z], lerp(40, 55, k));
      this.gold.mat.uniforms.uOpacity.value = range(t, 17.6, 19);
      if (t > 19) this.whale.play('surprise', 19);
      e.grade.flash = Math.pow(range(t, 25.0, 25.84), 2); e.grade.flashCol = 0xffcf7a;
    } else if (v === 'L16' || v === 'L17' || v === 'L18') {
      this.sunset(e); this.player.visible = false; this.lampLight.intensity = 1.5;
      this.disc.visible = true; this.disc.position.set(0.66, 0.8 + Math.sin(t * 1.4) * 0.04, 0.82); this.disc.scale.setScalar(0.6); this.disc.rotation.set(Math.PI / 2 - 0.3, t * 1.6, 0.3);
      this.discGlow.position.copy(this.disc.position); this.discGlow.material.opacity = 0.45 + pulse(t) * 0.4;
      this.notes.mat.uniforms.uOpacity.value = 1;
      if (v === 'L16') {
        this.whale.cue(t, [[0, 'idle'], [LT(16, 2), 'nod'], [LT(16, 8), 'wave']]);
        const a = lerp(0.55, -0.15, eIO(p)); setCam(cam, [Math.sin(a) * 2.7, 0.95, 0.6 + Math.cos(a) * 2.7], [0, 0.62, 0.6]);
      } else if (v === 'L17') {
        this.whale.cue(t, [[0, 'sway'], [LT(17, 7), 'sad'], [LT(17, 9), 'hop']]);
        if (t > LT(17, 7) && t < LT(17, 9) + 0.3) { const k = (t - LT(17, 7)) % 0.7 / 0.7; this.sweat.at(0.18, 0.95 - k * 0.6, 0.75).show(); this.sweat.tint(0xffffff, 1 - k); }
        if (t > LT(17, 9)) { this.spark.at(-0.45, 1.1 + Math.sin(t * 6) * 0.05, 0.7).show().still(`fx_sparkle_${Math.floor(t * 8) % 3}`); }
        setCam(cam, path3([[1.7, 0.85, 2.4], [0.2, 0.7, 2.3], [-1.5, 0.8, 2.3]], eIO(p)), [0, 0.6, 0.6]);
      } else {
        const k = range(t, LS(18) - 0.3, 126.0);
        this.whale.cue(t, [[0, 'wave'], [LT(18, 2), 'hop']]);
        e.sky.lerpTo(0x161a48, 0xc8607a, 0x2a1a3a, smooth(k)); e.sky.sun([0.6, lerp(0.07, -0.02, k), -1], 0xff9060, lerp(1.3, 0.6, k)); stars(e, smooth(range(k, 0.5, 1)));
        setCam(cam, path3([[0.6, 0.9, 2.8], [1.6, 3.4, 8.5], [0, 8.5, 17]], eIO(k)), mix3([0, 0.6, 0.6], [0, -1.6, 0], eIO(k)), lerp(40, 46, k));
      }
    } else if (v === 'sideB') {
      this.night(e); this.lampLight.intensity = 3; spin = t < 126.9 ? 2 : t > 129.8 ? 3 : 0;
      armA = t < 126.8 ? lerp(0.38, 0.95, range(t, 126.3, 126.8)) : lerp(0.95, 0.38, eIO(range(t, 129.2, 129.9)));
      flip = eIO(range(t, 127.0, 128.6)); lift = Math.sin(flip * Math.PI) * 0.4;
      const a = lerp(-0.2, 0.35, eIO(p));
      setCam(cam, [rp.x + Math.sin(a) * 1.55, this.baseTop + 0.9, rp.z + Math.cos(a) * 1.55], [rp.x, this.baseTop + 0.22, rp.z], 38);
      e.grade.flash = decay(t, 129.9, 6) * 0.35; e.grade.flashCol = 0x9ec5ff;
      this.notes.mat.uniforms.uOpacity.value = range(t, 129.9, 130.6);
    } else if (v === 'seasons') {
      const k = range(t, 131.6, 136.4); const s = k * 4; spin = 3; armA = 0.38;
      const seas = [0x8bd06a, 0x4caf50, 0xe0a040, 0xeef3ff, 0x8bd06a]; const si = Math.min(3, Math.floor(s));
      this.pmat.color.setHex(seas[si]).lerp(C(seas[si + 1]), smooth(s - si));
      const day = 0.5 + 0.5 * Math.sin(k * Math.PI * 5 - 1.2);
      e.sky.set(0x0a0f2a, 0x24305a, 0x2a2140).lerpTo(0x3d7bd9, 0xa8d8ff, 0x86b0d8, day); stars(e, 1 - day);
      e.sky.sun([Math.cos(k * 30), 0.3, Math.sin(k * 30)], 0xfff0c0, day);
      fog(e, 0x334466, 30, 120); light(e, 0xc8d8ff, 0x445566, 0.6 + day * 0.4, 0xfff0d0, 0.4 + day * 1.0, [Math.cos(k * 30) * 8, 6, Math.sin(k * 30) * 8]);
      this.snow.mat.uniforms.uOpacity.value = smooth(range(s, 2.6, 3.0)) * (1 - smooth(range(s, 3.7, 4)));
      this.place(this.gemini, -0.85, 0.25).play('lookaround');
      this.clockL.at(-1.45, sy(-1.45, 0.25) + 0.75, 0.3).show(); this.clockR.at(-0.25, sy(-0.25, 0.25) + 0.75, 0.3).show();
      this.clockL.spin = -t * 5; this.clockR.spin = t * 3;
      this.place(this.kimi, 0.85, -0.2).play('think'); this.scroll.at(1.25, sy(1.25, -0.1) + 0.7, -0.1).show();
      const a = k * Math.PI * 1.25 - 0.3; setCam(cam, [Math.sin(a) * 6.4, 3.0, Math.cos(a) * 6.4], [0, 0.05, 0], 42);
    } else if (v === 'L23' || v === 'L24') {
      this.player.visible = false; this.lampLight.intensity = 2;
      e.sky.set(0x4a6fb0, 0xf0c090, 0x6a4a6a, 0.01); e.sky.sun([-0.7, 0.12, -1], 0xffd0a0, 1.0);
      fog(e, 0xd8b090, 40, 200); light(e, 0xdde6ff, 0x554466, 0.8, 0xffd6a8, 1.3, [-8, 6, -6]); stars(e, 0);
      this.place(this.whale, 0, 0.3).cue(t, [[0, 'wave'], [LT(23, 4), 'idle'], [LT(24, 4), 'sad']]);
      if (v === 'L23') {
        setCam(cam, mix3([0.4, 0.9, 2.6], [0, 6.5, 30], smooth(p)), mix3([0, 0.5, 0.3], [0, -1.6, 0], smooth(p)), 40);
      } else {
        const k = eIO(p);
        e.sky.lerpTo(0x02030c, 0x0b1030, 0x101030, smooth(range(p, 0.1, 0.8))); stars(e, smooth(range(p, 0.2, 0.9)));
        e.sky.sun([-0.7, 0.12, -1], 0xffd0a0, 1 - p);
        setCam(cam, mix3([0, 6.5, 30], [0, 22, 100], k), mix3([0, -1.6, 0], [0, -4, 0], k), 40);
        cam.updateMatrixWorld();
        const t0 = LT(24, 4) - 0.4;
        this.pages.forEach((pg, i) => {
          const u = (t - t0 - i * 0.16) / 1.6; if (u < 0 || u > 1) return;
          pg.visible = true;
          tmpV.set((hash(i) - 0.5) * 7, (hash(i + 9) - 0.5) * 4, -lerp(14, 0.5, u)); cam.localToWorld(tmpV);
          pg.position.copy(tmpV); pg.quaternion.copy(cam.quaternion); pg.rotateZ(u * 4 * (hash(i + 3) - 0.5)); pg.rotateX(u * 2);
        });
      }
    } else if (v === 'L33' || v === 'L34') {
      this.night(e, 1); this.player.visible = false; this.lampLight.intensity = 1; this.fire.visible = true;
      const fl = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7.3) + pulse(t) * 0.3;
      this.fireLight.intensity = 9 * fl; this.fireGlow.material.opacity = 0.55 * fl;
      this.flames.forEach((f, k) => f.scale.set(1, 0.85 + 0.3 * Math.sin(t * (11 + k * 4) + k), 1));
      this.embers.mat.uniforms.uOpacity.value = 1; e.grade.warm = 0.45;
      const ring: [Actor, string][] = [[this.whale, 'sway'], [this.gemini, 'sway'], [this.kimi, 'idle'], [this.doubao, 'sway'], [this.qwen, 'sway'], [this.zai, 'idle'], [this.gpt, 'float']];
      ring.forEach(([a, act], i) => { const ang = i * (Math.PI * 2 / ring.length); this.place(a, Math.sin(ang) * 1.4, Math.cos(ang) * 1.4 - 0.25).play(act); });
      if (v === 'L33') {
        const a = lerp(-0.45, 0.75, eIO(p)); setCam(cam, [Math.sin(a) * 4.4, 1.7, Math.cos(a) * 4.4 - 0.25], [0, 0.45, -0.25]);
      } else {
        this.whale.cue(t, [[0, 'sway'], [LT(34, 7), 'nod']]);
        const hk = range(t, LT(34, 7) - 0.15, LT(34, 7) + 0.2);
        if (hk > 0) { this.heart.at(0, sy(0, 1.15) + 1.25 + Math.sin(t * 3) * 0.04, 1.3).show(); this.heart.size = 1.3 * eBack(hk) * (1 + 0.15 * decay(t, LT(34, 9), 4) + pulse(t) * 0.12); }
        e.grade.bloom = 1 + decay(t, LT(34, 9), 2) * 0.8;
        setCam(cam, path3([[1.2, 0.95, 3.4], [0.6, 0.85, 2.9], [0.2, 0.8, 2.6]], eIO(p)), [0, 0.65, 1.1]);
      }
    } else if (v === 'outroA' || v === 'outroB') {
      this.night(e, 1); e.sky.set(0x0a0f30, 0x3a3170, 0xff9a8a, 0.0); this.player.visible = v === 'outroA';
      spin = 2; armA = 0.38;
      const cast: [Actor, number, number, string][] = [[this.whale, 0, 0.7, 'wave'], [this.claude, 0.75, 0.55, 'curtsy'], [this.gemini, -0.8, 0.35, 'hop'], [this.kimi, 1.5, 0.05, 'nod'],
        [this.doubao, -1.5, 0.0, 'step'], [this.qwen, 0.6, -0.6, 'sway'], [this.zai, -0.55, -0.6, 'hop'], [this.gpt, 0, -1.2, 'float']];
      cast.forEach(([a, x, z, act]) => this.place(a, x, z).play(act, 247.4));
      if (v === 'outroA') setCam(cam, mix3([0, 1.3, 4.6], [0, 4.8, 15], eIO(p)), mix3([0, 0.6, 0], [0, -0.2, 0], eIO(p)));
      else { const a = p * 0.6; setCam(cam, [Math.sin(a) * 15, 4.8 + p, Math.cos(a) * 15], [0, -0.4, 0]); e.grade.black = range(t, 259.0, 261.3); }
    }
    // 唱片机
    const pr = this.platter; pr.rotation.y = t * spin * 2.2; this.flipG.rotation.x = flip * Math.PI; this.flipG.position.y = this.baseTop + 0.014 + lift; this.arm.rotation.y = armA;
    // 粒子
    for (let i = 0; i < 40; i++) {
      const a = i * 2.39 + t * (0.2 + hash(i) * 0.3);
      this.flies.set(i, Math.cos(a) * (1.2 + hash(i + 1) * 2), 0.4 + hash(i + 2) * 1.6 + Math.sin(t * 1.3 + i) * 0.2, Math.sin(a) * (1.2 + hash(i + 1) * 2), 0.6 + 0.4 * Math.sin(t * 3 + i));
      this.flies.color(i, C(0xd8ff8a));
    }
    this.flies.commit();
    if (this.embers.mat.uniforms.uOpacity.value > 0) {
      for (let i = 0; i < 70; i++) { const u = (t * 0.5 + hash(i)) % 1; this.embers.set(i, Math.sin(i * 3 + t) * 0.25 * (1 + u), sy(0, -0.25) + 0.2 + u * 2.4, -0.25 + Math.cos(i * 5 + t) * 0.25 * (1 + u), (1 - u) * 1.2); this.embers.color(i, C(u < 0.5 ? 0xffb050 : 0xff6a2a)); }
      this.embers.commit();
    }
    if (this.snow.mat.uniforms.uOpacity.value > 0) {
      for (let i = 0; i < 420; i++) { const u = (t * 0.15 + hash(i)) % 1; this.snow.set(i, (hash(i + 1) - 0.5) * 9, 4.5 - u * 6, (hash(i + 2) - 0.5) * 9, 1); }
      this.snow.commit();
    }
    if (this.gold.mat.uniforms.uOpacity.value > 0) {
      for (let i = 0; i < 180; i++) { const u = ((t - 17.5) * 0.25 + hash(i)) % 1; const a = u * 9 + i; const rr = 0.1 + u * 1.4; this.gold.set(i, top[0] + Math.cos(a) * rr, top[1] + u * 3, top[2] + Math.sin(a) * rr, 1 - u * 0.6); this.gold.color(i, C(i % 3 ? 0xffc35a : 0xfff0c0)); }
      this.gold.commit();
    }
    if (this.notes.mat.uniforms.uOpacity.value > 0) {
      const src = this.disc.visible ? this.disc.position : tmpV.set(top[0], top[1], top[2]);
      for (let i = 0; i < 18; i++) { const u = (t * 0.32 + hash(i)) % 1; this.notes.set(i, src.x + Math.sin(u * 6 + i) * 0.5 * u + (hash(i + 4) - 0.5) * 0.6, src.y + u * 1.8, src.z + (hash(i + 5) - 0.5) * 0.6, (1 - u) * 1.1 + 0.2); this.notes.color(i, C([0xffe08a, 0xffb4c8, 0xbfe3ff][i % 3])); }
      this.notes.commit();
    }
  }
}

// =====================================================================
// 琥珀：时光是琥珀，泪一滴滴被反锁 / 可是那然后呢
// =====================================================================
export class AmberScene extends Scene {
  A = new THREE.Vector3(0, 1.75, 0); RA = 1.55;
  amat = new THREE.MeshStandardMaterial({ color: 0xffa62b, emissive: 0x8a3c00, emissiveIntensity: 0.7, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.42, depthWrite: false });
  amber = new THREE.Mesh(new THREE.SphereGeometry(1.55, 48, 32), this.amat); inner = glowSprite(0xffa040, 5, 0.6);
  memW = this.actor('whale'); memC = this.actor('claude'); whale = this.actor('whale'); q = this.prop('fx_question', 1.2);
  beads: THREE.Mesh[] = []; tears: THREE.Mesh[] = []; lock = new THREE.Group(); shackle: THREE.Mesh;
  dust = new Particles(140, { size: 0.07 }); shards = new Particles(70, { size: 0.08 });
  constructor() {
    super();
    this.amber.position.copy(this.A); this.amber.renderOrder = 3; this.inner.position.copy(this.A); this.group.add(this.amber, this.inner);
    const r = rng(11);
    for (let i = 0; i < 40; i++) {
      const b = mesh(new THREE.SphereGeometry(0.08 + r() * 0.36, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0x9a4a00, emissiveIntensity: 0.6, roughness: 0.15, transparent: true, opacity: 0.6 }));
      b.position.set((r() - 0.5) * 16, -1 + r() * 7, -2 - r() * 12); b.userData.ph = r() * 6; this.beads.push(b); this.group.add(b);
    }
    for (let k = 0; k < 3; k++) { const d = mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x2a6aa0, roughness: 0.1 })); d.scale.set(1, 1.4, 1); this.tears.push(d); this.group.add(d); }
    const gold = mat(0xffcf5a, { metalness: 0.8, roughness: 0.25, emissive: 0x4a3000, flatShading: false });
    this.lock.add(mesh(new THREE.BoxGeometry(0.4, 0.32, 0.12), gold));
    this.shackle = mesh(new THREE.TorusGeometry(0.13, 0.035, 8, 20, Math.PI), gold, [0, 0.16, 0]); this.lock.add(this.shackle);
    this.lock.position.set(0, this.A.y - 0.15, this.RA + 0.12); this.group.add(this.lock);
    const rock = mesh(new THREE.DodecahedronGeometry(0.9, 0), mat(0x5a3a2a)); rock.scale.set(1.3, 0.45, 1.1); rock.position.set(2.5, -0.42, 1.3); this.group.add(rock);
    this.group.add(this.dust.points, this.shards.points);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    e.sky.set(0x2a1406, 0xb8621a, 0x1a0c04, -0.1); e.sky.sun([0.3, 0.5, -1], 0xffc070, 0.4); stars(e, 0);
    fog(e, 0x4a2a10, 9, 42); light(e, 0xffd29a, 0x3a1a08, 0.95, 0xffc070, 1.2, [3, 6, 5]);
    e.grade.warm = 0.35; e.grade.vig = 0.5; e.grade.bloom = 1.1;
    const A = this.A;
    this.memW.at(-0.34, A.y - 0.78, 0.15).show().still('act_whale_wave_3').tint(0xffcf8a, 1);
    this.memC.at(0.38, A.y - 0.8, 0.15).show().still('act_claude_curtsy_4').tint(0xffcf8a, 1);
    this.whale.at(2.4, -0.02, 1.4).show();
    this.beads.forEach((b, i) => { b.position.y += Math.sin(t * 0.6 + b.userData.ph) * 0.002; b.rotation.y = t * 0.2 + i; });
    for (let i = 0; i < 140; i++) { const u = (t * 0.03 + hash(i)) % 1; this.dust.set(i, (hash(i + 1) - 0.5) * 10, -0.5 + u * 5, (hash(i + 2) - 0.2) * 6, 0.6 + 0.4 * Math.sin(t * 2 + i)); this.dust.color(i, C(0xffd28a)); }
    this.dust.commit();
    this.shards.mat.uniforms.uOpacity.value = 0; this.q.show(false);
    let lockS = 0, shY = 0.16;
    if (v === 'L1') {
      this.whale.cue(t, [[0, 'idle'], [LT(1, 4), 'sad'], [LT(1, 11) + 0.4, 'idle']]);
      this.amat.opacity = 0.42; this.inner.material.opacity = 0.55 + pulse(t) * 0.3;
      this.tears.forEach((d, k) => {
        const t0 = LT(1, 6 + k), u = range(t, t0 - 0.15, t0 + 0.5);
        d.visible = t > t0 - 0.15;
        const from = [2.45, 0.72, 1.5]; const ang = -0.6 + k * 0.5; const to = [A.x + Math.sin(ang) * this.RA * 0.98, A.y + 0.5 - k * 0.3, A.z + Math.cos(ang) * this.RA * 0.98];
        const pnt = mix3(from, to, eIO(u)); pnt[1] += Math.sin(u * Math.PI) * 0.6;
        d.position.set(pnt[0], pnt[1], pnt[2]);
        const m = d.material as THREE.MeshStandardMaterial; const g = range(t, t0 + 0.4, t0 + 0.9);
        m.color.setHex(0x9fd8ff).lerp(C(0xffb030), g); m.emissive.setHex(0x2a6aa0).lerp(C(0xa04a00), g);
      });
      lockS = eBack(range(t, LT(1, 10) - 0.1, LT(1, 10) + 0.25)); shY = t > LT(1, 11) ? 0.16 - 0.07 * eOut(range(t, LT(1, 11), LT(1, 11) + 0.12)) : 0.24;
      e.grade.flash = decay(t, LT(1, 11), 5) * 0.4; e.grade.flashCol = 0xffe0a0;
      const k = eIO(p);
      setCam(e.cam, path3([[-1.6, 2.2, 6.6], [0.2, 1.8, 5.6], [1.9, 1.4, 4.9]], k), mix3([0, 1.7, 0], [0.9, 1.25, 0.6], k));
    } else {
      this.whale.cue(t, [[0, 'sad'], [LT(29, 3), 'shake']]);
      const fade = smooth(range(t, LS(29), LE(29)));
      this.amat.opacity = 0.42 - fade * 0.22; this.inner.material.opacity = 0.6 * (1 - fade) + 0.06;
      this.memW.tint(0xffcf8a, 1 - fade); this.memC.tint(0xffcf8a, 1 - fade);
      this.tears.forEach((d) => (d.visible = false));
      lockS = 1 - range(t, LS(29), LS(29) + 0.8); shY = 0.24; this.lock.position.y = A.y - 0.15 - eIn(range(t, LS(29), LS(29) + 0.8)) * 2.5;
      this.shards.mat.uniforms.uOpacity.value = range(t, LT(29, 2), LT(29, 3));
      for (let i = 0; i < 70; i++) { const u = range(t, LT(29, 2) + hash(i) * 1.2, LT(29, 2) + hash(i) * 1.2 + 2.5); const d = this.RA + u * 3; const th = hash(i + 7) * 6.28, ph = hash(i + 8) * 3.14; this.shards.set(i, A.x + Math.sin(ph) * Math.cos(th) * d, A.y + Math.cos(ph) * d, A.z + Math.sin(ph) * Math.sin(th) * d, (1 - u)); this.shards.color(i, C(0xffc860)); }
      this.shards.commit();
      if (t > LT(29, 3)) this.q.at(2.4, 1.2 + Math.sin(t * 4) * 0.04, 1.42).show().size = eBack(range(t, LT(29, 3), LT(29, 3) + 0.3)) * 1.2;
      e.grade.sepia = 0.25; e.grade.warm = 0.1;
      setCam(e.cam, mix3([1.2, 1.6, 6.0], [0.6, 1.5, 3.9], eIO(p)), mix3([0.6, 1.4, 0.4], [1.0, 1.2, 0.6], p));
    }
    if (v === 'L1') this.lock.position.y = A.y - 0.15;
    this.lock.scale.setScalar(Math.max(0.001, lockS)); this.shackle.position.y = shY;
    this.amber.rotation.y = t * 0.1;
  }
}

// =====================================================================
// 沙漏：情书再不朽，也磨成沙漏
// =====================================================================
export class HourglassScene extends Scene {
  claude = this.actor('claude'); whale = this.actor('whale');
  H = new THREE.Vector3(1.7, 1.5, -1.2); glass = new THREE.Group(); topSand: THREE.Mesh; botSand: THREE.Mesh; stream: THREE.Mesh;
  letter = new THREE.Group(); sand = new Particles(520, { size: 0.05, additive: false });
  constructor() {
    super();
    const dg = new THREE.PlaneGeometry(160, 160, 90, 90); dg.rotateX(-Math.PI / 2);
    const pa = dg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); const d = Math.hypot(x - 0.5, z + 0.5); const k = smooth(range(d, 4, 12)); pa.setY(i, (Math.sin(x * 0.17) * 1.1 + Math.cos(z * 0.13 + x * 0.06) * 1.5 + Math.sin(x * 0.5 + z * 0.4) * 0.25) * k - 0.02); }
    dg.computeVertexNormals(); this.group.add(mesh(dg, mat(0xe6b47c)));
    const wood = mat(0x7a4a26); const glassM = new THREE.MeshStandardMaterial({ color: 0xd8f3ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false });
    this.glass.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 24), wood, [0, 1.35, 0]), mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 24), wood, [0, -1.35, 0]));
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; this.glass.add(rod([Math.cos(a) * 0.82, -1.3, Math.sin(a) * 0.82], [Math.cos(a) * 0.82, 1.3, Math.sin(a) * 0.82], 0.05, wood)); }
    const tb = mesh(new THREE.ConeGeometry(0.8, 1.25, 28, 1, true), glassM, [0, 0.64, 0]); tb.rotation.x = Math.PI; this.glass.add(tb, mesh(new THREE.ConeGeometry(0.8, 1.25, 28, 1, true), glassM, [0, -0.64, 0]));
    const sm = mat(0xf2c27b, { flatShading: false });
    const tg = new THREE.ConeGeometry(0.62, 0.95, 24); tg.rotateX(Math.PI); tg.translate(0, 0.475, 0); this.topSand = mesh(tg, sm, [0, 0.03, 0]);
    const bg = new THREE.ConeGeometry(0.68, 0.8, 24); bg.translate(0, 0.4, 0); this.botSand = mesh(bg, sm, [0, -1.27, 0]);
    this.stream = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), sm, [0, -0.6, 0]);
    this.glass.add(this.topSand, this.botSand, this.stream); this.glass.position.copy(this.H); this.group.add(this.glass);
    this.letter.add(mesh(new THREE.BoxGeometry(0.58, 0.38, 0.02), mat(0xfff6e6)));
    const tri = new THREE.Shape(); tri.moveTo(-0.29, 0.19); tri.lineTo(0, -0.03); tri.lineTo(0.29, 0.19); tri.closePath();
    this.letter.add(mesh(new THREE.ShapeGeometry(tri), mat(0xf3e2c6, { side: THREE.DoubleSide }), [0, 0, 0.012]));
    this.letter.add(mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshBasicMaterial({ color: 0xd62a4a }), [0, 0.0, 0.016]));
    this.group.add(this.letter, this.sand.points);
  }
  frame(c: Ctx) {
    const { t, p, e } = c; this.hideAll();
    e.sky.set(0x2d2557, 0xf3a467, 0x6b4632, 0.02); e.sky.sun([-0.45, 0.06, -1], 0xffb070, 1.3); stars(e, 0.25);
    fog(e, 0xd99a72, 16, 75); light(e, 0xffd2b0, 0x6b4632, 0.85, 0xffb07a, 1.5, [-6, 4, -8]); e.grade.warm = 0.3;
    this.claude.at(-1.55, 0, 0.25).show().play('read');
    this.whale.at(0.35, 0, 0.95).show().cue(t, [[0, 'idle'], [LT(2, 6), 'sad']]);
    const T0 = LT(2, 5); const cr = range(t, T0, T0 + 1.3);
    const L = [-1.0, 1.15 + Math.sin(t * 1.5) * 0.05, 0.6];
    this.letter.position.set(L[0], L[1], L[2]); this.letter.rotation.set(0.1, Math.sin(t * 0.8) * 0.4, Math.sin(t) * 0.05);
    this.letter.scale.setScalar(Math.max(0.001, 1 - eIn(cr))); this.letter.visible = cr < 1;
    const H = this.H; const topO = [H.x, H.y + 1.4, H.z];
    for (let i = 0; i < 520; i++) {
      const d = hash(i) * 1.2; const u = range(t, T0 + d, T0 + d + 1.3);
      if (u <= 0 || u >= 1) { this.sand.set(i, 0, -50, 0, 0); continue; }
      const s0 = [L[0] + (hash(i + 1) - 0.5) * 0.5, L[1] + (hash(i + 2) - 0.5) * 0.3, L[2]]; const mid = mix3(s0, topO, 0.5); mid[1] += 1.4;
      const a = mix3(mix3(s0, mid, u), mix3(mid, topO, u), u);
      this.sand.set(i, a[0], a[1], a[2], 1); this.sand.color(i, C(i % 4 ? 0xf2c27b : 0xfff0d0));
    }
    this.sand.commit();
    const fillTop = 0.25 + 0.75 * smooth(range(t, T0 + 0.6, T0 + 2.4));
    const flow = range(t, T0 + 1.6, LE(2) + 0.6);
    this.topSand.scale.setScalar(Math.max(0.05, fillTop - flow * 0.35)); this.botSand.scale.setScalar(0.25 + flow * 0.45);
    this.stream.visible = flow > 0 && flow < 1;
    const fl = eBack(range(t, LT(2, 8), LT(2, 8) + 0.7), 1.2); this.glass.rotation.z = fl * Math.PI;
    e.grade.flash = decay(t, LT(2, 8) + 0.45, 6) * 0.25; e.grade.flashCol = 0xfff0d0;
    setCam(e.cam, path3([[-0.5, 1.3, 3.4], [0.3, 1.55, 4.3], [1.3, 1.75, 5.4]], eIO(p)), mix3([-1.0, 1.0, 0.5], [1.5, 1.45, -1.0], smooth(range(p, 0.2, 0.85))));
  }
}

// =====================================================================
// 河流：青春的上游 / 念头溜走 / 相拥的河 / 天长地久
// =====================================================================
const TH = 0.5;
function waterMat(len: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uLen: { value: len }, uSp: { value: 1.6 }, cA: { value: new THREE.Color(0x2f8fd0) }, cB: { value: new THREE.Color(0xbfeeff) }, uFog: { value: new THREE.Color() }, uN: { value: 10 }, uF: { value: 100 } },
    vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT; uniform float uLen; uniform float uSp; uniform vec3 cA; uniform vec3 cB; uniform vec3 uFog; uniform float uN; uniform float uF; varying vec2 vUv; varying float vD;
      void main(){ float y = vUv.y * uLen - uT * uSp; float x = vUv.x;
        float r = sin(y * 2.1 + sin(x * 9.0 + y * 0.35) * 1.4) * 0.5 + 0.5; float r2 = sin(y * 5.3 - x * 4.0 + uT * 0.7) * 0.5 + 0.5;
        float edge = smoothstep(0.0, 0.1, x) * smoothstep(1.0, 0.9, x);
        vec3 c = mix(cA, cB, pow(r * r2, 3.0) * 0.95); c = mix(vec3(0.85, 0.95, 1.0), c, edge);
        c = mix(c, uFog, smoothstep(uN, uF, vD)); gl_FragColor = vec4(c, 1.0); }`,
  });
}
function boat(color: number) {
  const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-0.78, 0.24); sh.lineTo(0.78, 0.24); sh.lineTo(0.46, -0.06); sh.lineTo(-0.46, -0.06); sh.closePath();
  g.add(mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.56, bevelEnabled: false }), mat(color), [0, 0, -0.28]));
  const tri = new THREE.Shape(); tri.moveTo(-0.46, 0.24); tri.lineTo(0, 0.66); tri.lineTo(0.46, 0.24); tri.closePath();
  g.add(mesh(new THREE.ShapeGeometry(tri), mat(color, { side: THREE.DoubleSide })));
  return g;
}
export class RiverScene extends Scene {
  whale = this.actor('whale'); claude = this.actor('claude');
  bulbs = [0, 1, 2, 3, 4].map(() => this.prop('fx_bulb', 0.9));
  waters: THREE.ShaderMaterial[] = []; branches: THREE.Object3D[] = []; boatW = boat(0xfdfbf5); boatC = boat(0xffe7d6);
  clouds: THREE.Group[] = []; dog = new THREE.Group(); dogA: number[][] = []; dogB: number[][] = []; birds: THREE.Group[] = []; lanterns: THREE.Mesh[] = [];
  constructor() {
    super();
    this.group.add(mesh(new THREE.PlaneGeometry(500, 500).rotateX(-Math.PI / 2), mat(0x84c76f), [0, -0.03, 0]));
    const mk = (w: number, len: number, pos: number[], ry: number, branch: boolean) => {
      const bank = mesh(new THREE.PlaneGeometry(w + 0.8, len).rotateX(-Math.PI / 2), mat(0xe8d9a8), [pos[0], 0.0, pos[2]]); bank.rotation.y = ry;
      const wm = waterMat(len); this.waters.push(wm);
      const wat = mesh(new THREE.PlaneGeometry(w, len).rotateX(-Math.PI / 2), wm, [pos[0], 0.015, pos[2]]); wat.rotation.y = ry;
      this.group.add(bank, wat); if (branch) this.branches.push(bank, wat);
    };
    mk(4, 300, [0, 0, -150], 0, false);
    mk(3, 80, [Math.sin(TH) * 40, 0, Math.cos(TH) * 40], TH, true); mk(3, 80, [-Math.sin(TH) * 40, 0, Math.cos(TH) * 40], -TH, true);
    const r = rng(5); const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6), mat(0x7a4a2a), 110); const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(0.75, 1.8, 7), mat(0x3f9a4f), 110);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 110; i++) {
      const side = r() < 0.5 ? -1 : 1; let x = side * (3.2 + r() * 16), z = -170 + r() * 200;
      if (z > 2) { x = side * (Math.abs(x) + z * Math.tan(TH) + 3); }
      const s = 0.7 + r() * 0.8; m4.makeScale(s, s, s).setPosition(x, 0.4 * s, z); trunk.setMatrixAt(i, m4); m4.makeScale(s, s, s).setPosition(x, 1.6 * s, z); crown.setMatrixAt(i, m4);
    }
    this.group.add(trunk, crown);
    const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x8090a0, roughness: 1, flatShading: true });
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group(); for (let k = 0; k < 7; k++) g.add(mesh(new THREE.IcosahedronGeometry(0.7 + r() * 0.7, 1), cm, [(r() - 0.5) * 3.6, (r() - 0.5) * 0.8, (r() - 0.5) * 1.6]));
      g.userData.base = [(r() - 0.5) * 40, 7 + r() * 6, -r() * 60]; this.clouds.push(g); this.group.add(g);
    }
    this.dogB = [[-0.8, 0, 0, 0.75], [0, 0.05, 0, 0.8], [0.8, 0, 0, 0.75], [1.6, 0.6, 0, 0.65], [2.2, 0.45, 0, 0.32], [1.45, 1.25, 0.2, 0.25], [1.75, 1.2, -0.2, 0.25], [-1.0, -0.8, 0.3, 0.3], [-0.6, -0.85, -0.3, 0.3], [0.7, -0.85, 0.3, 0.3], [1.0, -0.8, -0.3, 0.3], [-1.7, 0.55, 0, 0.3]];
    this.dogA = this.dogB.map((d) => [(r() - 0.5) * 3.4, (r() - 0.5) * 0.9, (r() - 0.5) * 1.4, d[3] * 1.15]);
    this.dogB.forEach((d) => this.dog.add(mesh(new THREE.IcosahedronGeometry(1, 2), cm, [d[0], d[1], d[2]])));
    this.group.add(this.dog);
    const wingM = mat(0xffffff, { side: THREE.DoubleSide });
    for (let i = 0; i < 8; i++) { const b = new THREE.Group(); const l = mesh(new THREE.BoxGeometry(0.36, 0.02, 0.12), wingM, [-0.18, 0, 0]); const rr = mesh(new THREE.BoxGeometry(0.36, 0.02, 0.12), wingM, [0.18, 0, 0]); b.add(l, rr); b.userData.w = [l, rr]; this.birds.push(b); this.group.add(b); }
    for (let i = 0; i < 28; i++) { const l = mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), new THREE.MeshStandardMaterial({ color: 0xffb04a, emissive: 0xff8a1a, emissiveIntensity: 1.6 })); this.lanterns.push(l); this.group.add(l); }
    this.group.add(this.boatW, this.boatC);
  }
  ride(b: THREE.Group, a: Actor, x: number, z: number, heading: number, t: number) {
    b.position.set(x, 0.02 + Math.sin(t * 2 + x) * 0.025, z); b.rotation.set(0, heading, Math.sin(t * 1.7 + z) * 0.03); b.visible = true;
    a.at(x, 0.26 + b.position.y, z).show();
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    this.waters.forEach((w) => { w.uniforms.uT.value = t; w.uniforms.uFog.value.copy(e.fog.color); w.uniforms.uN.value = e.fog.near; w.uniforms.uF.value = e.fog.far; });
    this.boatW.visible = this.boatC.visible = false; this.dog.visible = false; this.lanterns.forEach((l) => (l.visible = false)); this.birds.forEach((b) => (b.visible = false));
    const day = v === 'L3' || v === 'L4';
    if (day) {
      e.sky.set(0x2f7be0, 0x9fd3ff, 0xe0f2fe, 0.0); e.sky.sun([0.4, 0.6, 1], 0xfff6d0, 0.8); stars(e, 0);
      fog(e, 0xbfe3ff, 30, 140); light(e, 0xdff0ff, 0x6a8a5a, 1.0, 0xfff2d8, 1.6, [6, 12, 8]);
    } else if (v === 'L37') {
      e.sky.set(0x6d5ba8, 0xffb38a, 0xffe0c2, 0.0); e.sky.sun([0, 0.08, -1], 0xffd0a0, 1.4); stars(e, 0.15);
      fog(e, 0xf3c2a8, 30, 150); light(e, 0xffd8c8, 0x6a5a7a, 0.95, 0xffc8a0, 1.4, [0, 4, -10]); e.grade.warm = 0.25;
    } else {
      e.sky.set(0x4a3a7a, 0xffa860, 0xffd8a0, 0.0); e.sky.sun([0, 0.035, -1], 0xffc070, 1.8); stars(e, 0);
      fog(e, 0xf0b080, 30, 160); light(e, 0xffd0a0, 0x6a4a5a, 0.9, 0xffb070, 1.6, [0, 3, -12]); e.grade.warm = 0.4; e.grade.bloom = 1.25;
    }
    this.branches.forEach((b) => (b.visible = !day));
    this.clouds.forEach((g, i) => {
      const b = g.userData.base as number[]; const go = day ? eIn(range(t, LT(3, 7) - 0.2, LT(3, 7) + 2.5)) : 0;
      g.position.set(b[0] + Math.sin(t * 0.05 + i) * 2, b[1], (day ? -55 : -10) + b[2] - t * 0.3 - go * 40); g.visible = true;
    });
    if (v === 'L3' || v === 'L4') {
      const zb = v === 'L3' ? lerp(-68, -56, p) : lerp(-56, -50, p);
      this.ride(this.boatW, this.whale, 0, zb, Math.PI / 2, t); this.claude.at(0.02, this.whale.mesh.position.y, zb - 0.38).show(); this.whale.mesh.position.z = zb + 0.32;
      if (v === 'L3') {
        const by = this.whale.mesh.position.y; this.whale.mesh.position.set(-0.27, by, zb); this.claude.mesh.position.set(0.27, by, zb + 0.04);
        this.whale.play('wave'); this.claude.play('hop');
        const m = smooth(range(t, LT(3, 9) - 0.2, LT(3, 10) + 0.4)); this.dog.visible = true;
        this.dog.position.set(-3 + range(t, LT(3, 10), LE(3) + 0.5) * 6, 8.5, zb + 24); this.dog.scale.setScalar(1.45);
        this.dog.children.forEach((s, i) => { const a = this.dogA[i], b = this.dogB[i]; s.position.set(lerp(a[0], b[0], m), lerp(a[1], b[1], m), lerp(a[2], b[2], m)); s.scale.setScalar(lerp(a[3], b[3], m)); });
        this.birds.forEach((b, i) => {
          const u = range(t, LT(3, 12) - 0.3 + i * 0.08, LT(3, 12) + 3.2 + i * 0.08); if (u <= 0) return; b.visible = true;
          b.position.set((hash(i) - 0.5) * 3 + (hash(i + 4) - 0.5) * u * 10, 0.8 + u * 7 + hash(i + 2), zb + 1.5 + u * 18); b.rotation.set(0, Math.PI, 0);
          const w = b.userData.w as THREE.Mesh[]; const f = Math.sin(t * 12 + i) * 0.6; w[0].rotation.z = f; w[1].rotation.z = -f;
        });
        setCam(e.cam, path3([[1.5, 2.0, zb - 4.6], [1.0, 1.8, zb - 4.3], [0.5, 1.6, zb - 4.0]], p), mix3([0, 0.85, zb + 2.5], [0, 2.5, zb + 9], smooth(range(p, 0.35, 0.9))), 44);
      } else {
        this.whale.cue(t, [[0, 'idle'], [LT(4, 0), 'surprise'], [LT(4, 5), 'point'], [LT(4, 8), 'sad']]); this.claude.play('lookaround');
        const w = this.whale.mesh.position;
        this.bulbs.forEach((b, k) => {
          const tk = LT(4, k); if (t < tk - 0.1) return; b.show();
          const pop = eBack(range(t, tk - 0.1, tk + 0.15)); const fall = range(t, LT(4, 5) + k * 0.16, LT(4, 5) + k * 0.16 + 0.55); const land = LT(4, 5) + k * 0.16 + 0.55;
          let x = w.x - 0.55 + k * 0.28, y = w.y + 1.35 + Math.sin(k * 1.7) * 0.12, z = w.z;
          if (fall > 0) { x += 0.6 + k * 0.05; y = lerp(y, 0.12, eIn(fall)); z -= fall * 0.6; }
          if (t > land) { z -= (t - land) * 1.6; y = 0.12 + Math.sin(t * 3 + k) * 0.03; }
          b.at(x, y, z); b.size = 0.9 * pop; b.spin = Math.sin(t * 2 + k) * 0.2;
        });
        setCam(e.cam, [2.5 - p * 0.4, 1.25, zb + 0.4 - p * 0.8], [0, 1.0, zb - p * 0.6], 40);
      }
    } else {
      const meet = LT(37, 8); const gone = Math.max(0, t - meet) * 0.8;
      const d = Math.max(0, lerp(19, 0.9, eIO(range(t, LS(37) - 0.3, meet))));
      const lx = -Math.sin(TH) * d, lz = Math.cos(TH) * d;
      if (t < meet) {
        this.ride(this.boatW, this.whale, lx - 0.25, lz, Math.PI / 2 - TH, t); this.ride(this.boatC, this.claude, -lx + 0.25, lz, Math.PI / 2 + TH, t);
      } else {
        this.ride(this.boatW, this.whale, -0.42, -gone, Math.PI / 2, t); this.ride(this.boatC, this.claude, 0.42, -gone, Math.PI / 2, t);
      }
      this.whale.play(t > meet ? 'hop' : 'idle'); this.claude.play(t > meet ? 'hop' : 'idle');
      this.lanterns.forEach((l, i) => {
        l.visible = true; const s = ((t * 0.7 + hash(i) * 60) % 60) - 30; const br = i % 3;
        if (br < 2 && s < 0) { const sg = br === 0 ? -1 : 1; l.position.set(sg * Math.sin(TH) * -s + (hash(i + 1) - 0.5) * 1.6, 0.12 + Math.sin(t * 2 + i) * 0.03, Math.cos(TH) * -s); }
        else l.position.set((hash(i + 1) - 0.5) * 2.8, 0.12 + Math.sin(t * 2 + i) * 0.03, -Math.abs(s) * 1.4);
        l.rotation.y = t * 0.3 + i;
      });
      if (v === 'L37') {
        setCam(e.cam, path3([[0, 15, 30], [0, 9, 20], [0.6, 4.4, 11]], eIO(p)), mix3([0, 0, 10], [0, 0.5, 1.5], eIO(p)), 42);
      } else {
        const zb = -gone;
        this.birds.forEach((b, i) => { b.visible = true; b.position.set(-8 + ((t * 1.2 + i * 3) % 20), 6 + hash(i) * 3, zb - 25 - i * 2); const w = b.userData.w as THREE.Mesh[]; const f = Math.sin(t * 9 + i) * 0.5; w[0].rotation.z = f; w[1].rotation.z = -f; });
        setCam(e.cam, [1.4 + p * 1.2, 1.7 + eIO(p) * 4.5, zb + 5.5 + p * 5], [0, 1.2, zb - 30], 42);
      }
    }
  }
}

// =====================================================================
// 命运：疯帽子的茶会（命运好幽默）/ 爱丽丝的路口（第二遍）
// =====================================================================
export class FateScene extends Scene {
  tea = new THREE.Group(); fork = new THREE.Group();
  whale = this.actor('whale'); claude = this.actor('claude'); qwen = this.actor('qwen'); gemini = this.actor('gemini');
  fan = this.prop('prop_fan', 0.8); cups = [0, 1, 2, 3].map(() => this.prop('prop_teacup', 0.55));
  cards: THREE.Mesh[] = []; bubbles: THREE.Sprite[] = []; pop = new Particles(60, { size: 0.08 }); lamp = new THREE.PointLight(0xffc6f0, 6, 9, 1.4);
  paths: THREE.MeshBasicMaterial[] = []; flies = new Particles(60, { size: 0.08 });
  constructor() {
    super();
    this.tea.add(mesh(new THREE.CylinderGeometry(7, 7, 0.1, 40), mat(0x3b2a5a), [0, -0.05, 0]));
    this.tea.add(mesh(new THREE.BoxGeometry(5.7, 0.06, 1.42), mat(0xfaf5ff), [0, 0.68, 0]), mesh(new THREE.BoxGeometry(5.6, 0.1, 1.3), mat(0x6a3a2a), [0, 0.62, 0]));
    for (const [x, z] of [[-2.6, 0.5], [2.6, 0.5], [-2.6, -0.5], [2.6, -0.5]]) this.tea.add(rod([x, 0, z], [x, 0.6, z], 0.05, mat(0x5a2a1a)));
    this.tea.add(mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0xffd1e8, { flatShading: false }), [-0.9, 0.9, 0.2]), rod([-0.75, 0.9, 0.2], [-0.55, 1.05, 0.2], 0.03, mat(0xffd1e8)));
    this.lamp.position.set(0, 3, 0.5); this.tea.add(this.lamp);
    for (let i = 0; i < 16; i++) { const cd = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.43), new THREE.MeshBasicMaterial({ map: suitTex(i), side: THREE.DoubleSide, transparent: true })); this.cards.push(cd); this.tea.add(cd); }
    for (let i = 0; i < 2; i++) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(), transparent: true, depthWrite: false })); b.renderOrder = 7; this.bubbles.push(b); this.tea.add(b); }
    this.tea.add(this.pop.points);
    // 路口
    this.fork.add(mesh(new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2), mat(0x23422f), [0, -0.01, 0]));
    const pathM = (o: number) => { const m = new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: o, fog: true }); this.paths.push(m); return m; };
    const pa = 0.42;
    const pl = mesh(new THREE.PlaneGeometry(1.0, 26).rotateX(-Math.PI / 2), pathM(0.85), [-Math.sin(pa) * 13, 0.01, -Math.cos(pa) * 13]); pl.rotation.y = pa;
    const pr = mesh(new THREE.PlaneGeometry(1.0, 26).rotateX(-Math.PI / 2), pathM(0.85), [Math.sin(pa) * 13, 0.01, -Math.cos(pa) * 13]); pr.rotation.y = -pa;
    const pe = mesh(new THREE.PlaneGeometry(14, 1.0).rotateX(-Math.PI / 2), pathM(0.85), [-7, 0.01, 0.5]);
    this.fork.add(pl, pr, pe);
    const wood = mat(0x7a5232); this.fork.add(rod([0.9, 0, 0.9], [0.9, 1.5, 0.9], 0.05, wood));
    const b1 = mesh(new THREE.BoxGeometry(0.75, 0.17, 0.04), wood, [0.9, 1.3, 0.9]); b1.rotation.y = 0.45; const b2 = mesh(new THREE.BoxGeometry(0.75, 0.17, 0.04), wood, [0.9, 1.05, 0.9]); b2.rotation.y = -0.45; this.fork.add(b1, b2);
    const r = rng(19); const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.6, 7), mat(0x1d3b2a), 70); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 70; i++) { let x = (r() - 0.5) * 50, z = -r() * 40 + 8; if (Math.abs(x) < 3 + Math.abs(z) * 0.5) x += Math.sign(x || 1) * (4 + Math.abs(z) * 0.5); const s = 0.7 + r() * 0.9; m4.makeScale(s, s, s).setPosition(x, 1.3 * s, z); crown.setMatrixAt(i, m4); }
    this.fork.add(crown);
    const moon = mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false }), [14, 22, -70]); const mg = glowSprite(0xfff0c0, 22, 0.5); mg.position.copy(moon.position); this.fork.add(moon, mg, this.flies.points);
    this.group.add(this.tea, this.fork);
  }
  frame(c: Ctx) {
    const { t, p, e, v } = c; this.hideAll();
    const isTea = v === 'L5'; this.tea.visible = isTea; this.fork.visible = !isTea;
    if (isTea) {
      e.sky.set(0x140a2a, 0x3a1f5a, 0x1a0c2a, 0.0); stars(e, 0.5); e.sky.sun([0, 1, 0], 0, 0);
      fog(e, 0x24133a, 10, 40); light(e, 0xd8b8ff, 0x2a1a3a, 0.8, 0xffd6f0, 1.0, [2, 6, 4]);
      const silent = smooth(range(t, LT(5, 10), LE(5)));
      this.lamp.intensity = 6 * (1 - silent * 0.6) + pulse(t) * 3; e.grade.bw = silent * 0.6; e.grade.vig = 0.5 + silent * 0.2;
      this.whale.at(-3.25, 0, 0.1).show().cue(t, [[0, 'idle'], [LT(5, 5), 'wave'], [LT(5, 10), 'sad']]);
      this.claude.at(3.25, 0, 0.1).show().cue(t, [[0, 'idle'], [LT(5, 6), 'tilt'], [LT(5, 10), 'sad']]);
      this.qwen.at(0, 0.7, -0.1).show().cue(t, [[0, 'spin'], [LT(5, 3), 'tilt'], [LT(5, 5), 'sway'], [LT(5, 10), 'idle']]);
      this.fan.at(0.42, 1.25, 0.0).show(); this.fan.spin = Math.sin(t * 5) * 0.4;
      this.cups.forEach((cp, i) => cp.at(-2.1 + i * 1.4 + (i > 1 ? 0.4 : 0), 0.71, 0.35).show());
      let landed = 0; for (let k = 0; k < 12; k++) if (t >= LT(5, k)) landed += 1;
      const shuf = landed + (t >= LT(5, 0) ? eOut(range(t, LT(5, Math.max(0, landed - 1)), LT(5, Math.max(0, landed - 1)) + 0.25)) - 1 : 0);
      const up = bump(t, LT(5, 4) - 0.05, 0.9);
      this.cards.forEach((cd, i) => {
        const a = (i / 16) * Math.PI * 2 + shuf * 0.85 + t * 0.4; const rr = 1.15 + Math.sin(t * 1.5 + i) * 0.08;
        cd.position.set(Math.cos(a) * rr, 1.55 + Math.sin(a * 2 + t) * 0.18 + up * (0.6 + hash(i) * 1.2), -0.1 + Math.sin(a) * rr);
        cd.rotation.set(0, -a + Math.PI / 2, Math.sin(t * 2 + i) * 0.2); cd.visible = true;
      });
      this.bubbles.forEach((b, i) => {
        const tin = LT(5, 5 + i); const tout = LT(5, 10);
        const s = t < tout ? eBack(range(t, tin, tin + 0.3)) : Math.max(0, 1.25 - range(t, tout, tout + 0.15) * 1.25) * (t < tout + 0.15 ? 1 : 0);
        b.visible = s > 0.01; b.scale.set(0.9 * s, 0.68 * s, 1); b.position.set(i ? 2.9 : -2.9, 1.65, 0.2);
      });
      this.pop.mat.uniforms.uOpacity.value = 1 - range(t, LT(5, 10), LT(5, 10) + 0.7);
      for (let i = 0; i < 60; i++) { const u = range(t, LT(5, 10), LT(5, 10) + 0.7); const sx = i < 30 ? -2.9 : 2.9; const a = i * 0.7; this.pop.set(i, sx + Math.cos(a) * u * 0.9, 1.65 + Math.sin(a) * u * 0.7, 0.2, u > 0 ? 1 - u : 0); this.pop.color(i, C(0xfff0f8)); }
      this.pop.commit();
      setCam(e.cam, path3([[-4.6, 2.0, 5.0], [0, 2.7, 5.8], [3.9, 1.8, 4.4]], eIO(p)), [0, 1.0, 0], 42);
    } else {
      e.sky.set(0x0b1030, 0x2a3a6a, 0x1a2a3a, 0.0); stars(e, 1); e.sky.sun([0.2, 0.3, -1], 0xfff0c0, 0.2);
      fog(e, 0x142030, 12, 60); light(e, 0x9ab0ff, 0x1a2a20, 0.7, 0xd0d8ff, 0.8, [6, 10, -6]);
      for (let i = 0; i < 60; i++) { const a = i * 1.7 + t * 0.3 * (0.5 + hash(i)); this.flies.set(i, Math.cos(a) * (2 + hash(i) * 6), 0.3 + hash(i + 1) * 2 + Math.sin(t + i) * 0.2, -Math.abs(Math.sin(a)) * 8 + 2, 0.5 + 0.5 * Math.sin(t * 3 + i)); this.flies.color(i, C(0xe8ff9a)); }
      this.flies.commit();
      if (v === 'fork0') {
        const x = lerp(-6.5, -0.3, eOut(range(t, c.a, c.b - 0.6)));
        this.gemini.at(x, 0, 0.5).show().play(t < c.b - 0.6 ? 'walk' : 'idle');
        this.paths.forEach((m) => (m.opacity = 0.85));
        setCam(e.cam, mix3([-3.5, 1.5, 6.5], [0.3, 1.9, 5.2], eIO(p)), mix3([-3.5, 0.4, 0.3], [0, 0.35, -0.8], eIO(p)), 42);
      } else {
        this.gemini.at(-0.1, 0, 0.6).show().cue(t, [[0, 'choose'], [LS(19) + 1.6, 'idle']]);
        const ta = LT(19, 6), pa = 0.42; const d = Math.max(0, t - ta) * 0.95;
        const appear = t > LT(19, 5) - 0.2;
        if (appear) {
          this.whale.at(-0.45 - Math.sin(pa) * d, 0, 0.0 - Math.cos(pa) * d).show().play(t > ta ? 'walk' : 'idle'); this.whale.flip = true;
          this.claude.at(0.45 + Math.sin(pa) * d, 0, 0.0 - Math.cos(pa) * d).show().play(t > ta ? 'walk' : 'idle'); this.claude.flip = false;
        }
        const dim = smooth(range(t, LT(19, 10), LE(19))); this.paths.forEach((m) => (m.opacity = 0.85 - dim * 0.75));
        setCam(e.cam, mix3([0.3, 2.7, 5.8], [0, 3.5, 7.0], eIO(p)), mix3([0, 0.3, 0.3], [0, 0.15, -1.4], eIO(p)), 42);
      }
    }
  }
}
