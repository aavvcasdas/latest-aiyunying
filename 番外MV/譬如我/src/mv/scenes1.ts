// 场景一组：远处的领奖台 / 虚空里的两个自己 / 阁楼书桌
import * as THREE from 'three';
import { Actor, C, LT, Particles, bump, clamp, decay, eIO, eIn, eOut, glowSprite, hash, lerp, mat, mesh, pulse, range, rod, texSprite } from './core';
import { BEAT, BEAT0, RECTS } from './generated';
import { type Ctx, type Flower, Scene, aim, beam, charTex, dreamTex, flower, inFront, mixHex, mood, orbit, paperTex, planeTex, rankTex, setFlower, smileTex, tagTex } from './kit';
import { glowTex } from './core';

/** 每拍一下，指数回落 */
export const beat = (t: number) => { let x = ((t - BEAT0) / BEAT) % 1; if (x < 0) x += 1; return Math.exp(-x * 4); };
const basic = (color: number, o: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...o });

// =====================================================================
// 领奖台：聚光灯下是天才，暗处是「那些没有天赋的人」
// =====================================================================
export class StageScene extends Scene {
  whale = this.actor('whale'); gpt = this.actor('gpt', 0.63); claude = this.actor('claude', 1.25); gemini = this.actor('gemini'); kimi = this.actor('kimi');
  hg = this.prop('prop_hourglass', 1.5); q = this.prop('fx_question', 1.1);
  crowd: Actor[] = []; cp: number[][] = [];
  beams = [0, 1, 2, 3, 4].map(() => beam(0xffd9a0)); wb = beam(0x8fa6ff);
  conf = new Particles(260, { size: 0.09 }); fw = new Particles(270, { size: 0.17 });
  papers = [0, 1, 2, 3, 4, 5].map((i) => texSprite(paperTex(i), 0.5, 0.68, 0xd6daea, false));
  plane = texSprite(planeTex(), 0.62, 0.31);
  crown = new THREE.Group();
  haloM = basic(0xffc65a, { transparent: true, side: THREE.DoubleSide });
  rayM = basic(0xffb84a, { transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  rays = new THREE.Group(); wglow = glowSprite(0x5b7bff, 2.6, 0); sglow = glowSprite(0xffc878, 16, 0.5); sl = new THREE.PointLight(0xffd28a, 40, 26, 1.5);
  constructor() {
    super();
    const fl = mesh(new THREE.PlaneGeometry(160, 160), mat(0x252b4a, { roughness: 0.5, metalness: 0.4, flatShading: false })); fl.rotation.x = -Math.PI / 2; this.group.add(fl);
    const pm = mat(0x4a4370), gm = basic(0xffc65a);
    const podiums: [number, number, number, string, string][] = [[0, 1.5, 2.3, '小克', '一'], [-2.3, 0.95, 2.1, '龙娘', '二'], [2.3, 0.65, 2.1, '双子', '三']];
    for (const [x, h, w, name, rank] of podiums) {
      this.group.add(mesh(new THREE.BoxGeometry(w, h, 2), pm, [x, h / 2, -8]), mesh(new THREE.BoxGeometry(w + 0.08, 0.06, 2.08), gm, [x, h, -8]));
      this.group.add(mesh(new THREE.PlaneGeometry(0.78, 0.26), basic(0xffffff, { map: rankTex(name, rank) }), [x, h * 0.48, -6.99]));
    }
    const shape = new THREE.Shape().moveTo(-0.17, 0).lineTo(-0.2, 0.2).lineTo(-0.09, 0.12).lineTo(0, 0.27).lineTo(0.09, 0.12).lineTo(0.2, 0.2).lineTo(0.17, 0).closePath();
    this.crown.add(mesh(new THREE.ShapeGeometry(shape), basic(0xe8c16b, { side: THREE.DoubleSide })));
    this.crown.add(mesh(new THREE.CircleGeometry(0.025, 8), basic(0x758bc6), [0, 0.07, 0.002]));
    this.group.add(this.crown);
    const halo = mesh(new THREE.RingGeometry(2.7, 2.95, 72), this.haloM, [0, 3.3, -10]);
    for (let i = 0; i < 14; i++) { const r = mesh(new THREE.PlaneGeometry(0.18, 10), this.rayM); r.rotation.z = (i / 14) * Math.PI; this.rays.add(r); }
    this.rays.position.set(0, 3.3, -10.2); this.sl.position.set(0, 4, -5.5); this.sglow.position.set(0, 3, -10.5);
    this.group.add(halo, this.rays, this.sl, this.sglow, this.wglow, this.wb, this.conf.points, this.fw.points, ...this.beams, ...this.papers, this.plane);
    const names = ['kimi', 'doubao', 'qwen', 'zai'];
    for (let i = 0; i < 20; i++) { this.crowd.push(this.actor(names[i % 4], 0.9)); this.cp.push([(i / 19 - 0.5) * 12 + (hash(i) - 0.5) * 0.5, 0, -4.9 + (i % 3) * 1.25 + hash(i + 9) * 0.4]); }
    for (let i = 0; i < 260; i++) this.conf.color(i, C([0xffd76a, 0xffffff, 0xff9fb0, 0xffb53d][i % 4]));
  }
  frame(c: Ctx) {
    this.hideAll(); const { t, p, e, v, rep, n } = c; const W = this.whale; const bt = beat(t);
    mood(e, [0x0b1332, 0x1e2d56, 0x101a30], [0x171f3a, 16, 70], [0x9db0e4, 0x262638, 0.6], [0xffd9a0, 0.65], 0.35, [0, 10, -2]);
    let lit = 1, crowdK = 0, wbOp = 0, wGlow = 0, confK = 0.5, settled = false, cheer = 0.5, stars3 = true, crowdOn = true; const fwT: number[] = [];
    const tg: number[][] = [[0, 2.4, -8], [-2.3, 1.6, -8], [2.3, 1.3, -8], [Math.sin(t * 0.7) * 5, 0.4, -4], [Math.cos(t * 0.6) * 5, 0.4, -3.4]];
    this.gpt.play('float'); this.claude.play('idle'); this.gemini.play('sway');
    W.show().play('idle').tint(0x95a1d8).at(3.2, 0, -1.4);
    if (v === 'c1') {
      if (rep === 0) { // 远处的光，暗处的她
        orbit(e.cam, [0, 1.7, -8], lerp(19.5, 17.5, eOut(p)), 0, 0.01, 34, -0.3, 0.1);
        const q = inFront(e.cam, -0.74, 4.4); W.at(q[0], 0, q[2]); W.size = 1.3;
      } else { // 从台上往下看：暗处其实站着很多人
        stars3 = false; cheer = 0.15; lit = 0.4; crowdK = rep === 2 ? 0.2 + p * 1.1 : 0.42;
        orbit(e.cam, [lerp(-1.5, 1.5, eIO(p)), 0.6, -2.8], 7.4, Math.PI + lerp(-0.12, 0.12, p), 0.42, 40, -0.2, 0.05);
        W.at(3.0, 0, 1.0).tint(rep === 2 ? 0xffffff : 0x97a4dc); if (rep === 2) { W.play('hop'); wGlow = 0.6; }
      }
    } else if (v === 'c6') {
      const t1 = LT(n, 11), t2 = LT(n, 12);
      if (rep === 0) { // 烟花是别人的
        orbit(e.cam, [0, 2.4, -8], lerp(21, 18.5, eOut(p)), -0.1, 0.02, 36, 0.3, -0.12);
        const q = inFront(e.cam, 0.78, 4.8); W.at(q[0], 0, q[2]); W.size = 1.25; fwT.push(t1, t2); confK = 0.8; cheer = 1;
      } else if (rep === 1) { // 散场以后，一个人等
        lit = 0.08; stars3 = false; crowdOn = false; settled = true; wbOp = 0.1;
        W.at(2.3, 0.68, -7.4).tint(0xaab4e6).play('sad', c.a); this.hg.show().at(1.55, 0.68, -7.3);
        orbit(e.cam, [2.0, 1.1, -7.5], lerp(6.5, 5.4, p), -0.3, 0.1, 36, 0.38, -0.05);
      } else { // 转身，往自己的方向走
        const z = lerp(-1.5, 2.2, p); W.at(1.2, 0, z).tint(0xffffff).play('walk'); wGlow = 0.7; fwT.push(t1, t2); cheer = 1; confK = 0.8;
        orbit(e.cam, [1.2, 0.8, z], 5, 0.25, 0.06, 36, 0.42, -0.2);
      }
    } else if (v === 'c7') {
      const tw = LT(n, 3), tn = LT(n, 7);
      if (rep === 0) { // 所有的光都打向那一个
        const k = eOut(range(t, tw - 0.12, tw + 0.3)); for (let i = 1; i < 5; i++) tg[i] = [lerp(tg[i][0], 0, k), lerp(tg[i][1], 2.4, k), lerp(tg[i][2], -8, k)];
        this.claude.play(t > tw ? 'curtsy' : 'idle', tw); cheer = 1; confK = 0.7; W.show(false);
        orbit(e.cam, [0, 2.0, -8], lerp(13, 9.5, eIO(p)), lerp(-0.12, 0.08, p), -0.06, 36, 0, -0.38);
      } else if (rep === 1) { // 光扫过她，又移开
        const bx = 3.2 + (t - tn) * 4.5; tg[3] = [bx, 0.4, -1.4]; W.tint(mixHex(0x6f7cb4, 0xffffff, Math.exp(-((bx - 3.2) ** 2) * 2))); crowdK = 0.2; cheer = 0.6;
        orbit(e.cam, [2.4, 0.9, -1.8], lerp(7.5, 6.5, p), 0.45, 0.1, 36, 0, -0.38);
      } else { // 灯灭了，她自己亮着
        lit = 1 - eOut(range(t, tn - 0.1, tn + 0.35)) * 0.94; wGlow = 0.3 + 0.7 * (1 - lit); crowdK = 1; cheer = 0.3;
        W.at(0, 0, -0.6).tint(0xffffff).play(t > tn ? 'nod' : 'idle', tn);
        orbit(e.cam, [0, 0.85, -0.6], lerp(7, 5.6, eIO(p)), 0.15, 0.06, 36, 0, -0.4);
      }
    } else { // b20 传颂有关天才的故事
      const t0 = LT(n, 0), t4 = LT(n, 4); fwT.push(t0, t0 + BEAT, t4, t4 + BEAT * 2); cheer = 1.2; confK = 1;
      this.gpt.play('cast'); this.claude.play('curtsy', t0); this.gemini.play('spin');
      orbit(e.cam, [0, 1.9, -8], lerp(8, 15.5, eIO(p)), Math.sin(p * 2.2 - 1.1) * 0.08, -0.03, 36, 0, -0.45);
      W.at(1.5, 0, 1.2).tint(0x5a669c);
      if (rep === 1) { // 有人回头看了她一眼
        W.tint(0x97a4dc); this.kimi.show().at(0.3, 0, 0.8).play(p > 0.55 ? 'lookaround' : 'idle');
        if (p > 0.62) this.q.show().at(0.3, 1.25 + Math.sin(t * 5) * 0.03, 0.82);
      }
    }
    if (stars3) { this.claude.show().at(0, 1.56, -8); this.gpt.show().at(-2.3, 0.98 + Math.sin(t * 1.4) * 0.04, -8); this.gemini.show().at(2.3, 0.68, -8); }
    this.crown.visible = stars3;
    if (stars3) {
      const frame = RECTS[this.claude.frame(t)];
      this.crown.position.set(0, 1.56 + (frame[3] / 88) * this.claude.size - 0.04, -7.95);
      this.crown.lookAt(e.cam.position);
    }
    if (crowdOn) this.crowd.forEach((a, i) => {
      const q = this.cp[i]; const k = clamp(crowdK * 1.7 - (i / 20) * 0.7);
      a.show().play(cheer > 0.8 ? 'hop' : 'idle').at(q[0], cheer * 0.1 * beat(t - hash(i) * 0.08), q[2]).tint(mixHex(0x303860, 0xffffff, k));
    });
    // 空中飘着的稿纸与一架纸飞机：被传颂的故事是纸，想改写命运的诗也是纸
    const papK = cheer > 0.5 ? 0.55 : 0.22;
    this.papers.forEach((pp, i) => {
      const s = (t * 0.018 + hash(i + 31)) % 1;
      pp.position.set(-9 + s * 18, 2.3 + Math.sin(t * 0.5 + i * 2.1) * 0.9, -5.5 - i * 0.9);
      pp.material.rotation = Math.sin(t * 0.35 + i) * 0.7;
      pp.material.opacity = papK;
    });
    const ps = (t * 0.05) % 1;
    this.plane.position.set(-11 + ps * 22, 3.6 + Math.sin(ps * Math.PI) * 0.7, -4);
    this.plane.material.rotation = 0.18 * Math.sin(t * 2.2);
    this.plane.material.opacity = settled ? 0.25 : 0.9;
    const B0 = [[0, 11, -5], [-4, 11, -4.5], [4, 11, -4.5], [-6, 11, -3], [6, 11, -3]];
    this.beams.forEach((b, i) => aim(b, B0[i], tg[i], 1.25, (0.2 + 0.1 * bt) * lit * (i > 2 ? 0.7 : 1)));
    const wp = W.mesh.position;
    aim(this.wb, [wp.x + 0.6, 9, wp.z + 0.5], [wp.x, 0, wp.z], 1.0, wbOp);
    this.haloM.opacity = 0.12 + 0.88 * lit; this.rayM.opacity = (0.07 + 0.05 * bt) * lit; this.rays.rotation.z = t * 0.08;
    this.sl.intensity = 24 * lit; this.sglow.material.opacity = 0.24 * lit;
    this.wglow.position.set(wp.x, wp.y + 0.55, wp.z - 0.05); this.wglow.material.opacity = wGlow * 0.55;
    for (let i = 0; i < 260; i++) {
      const sp = 0.7 + hash(i + 1) * 0.8; const y = settled ? 0.03 : 7.5 - ((t * sp + hash(i + 2) * 7.5) % 7.5);
      this.conf.set(i, (hash(i) - 0.5) * 13 + Math.sin(t * 1.3 + i) * 0.15, y, -7.5 + (hash(i + 3) - 0.5) * 6, (0.6 + hash(i + 4)) * (settled ? 0.6 : confK * lit));
    }
    this.conf.commit();
    const FC = [0xffd76a, 0xff9fb0, 0xbfd0ff, 0xffb53d];
    for (let i = 0; i < 270; i++) {
      if (!fwT.length) { this.fw.set(i, 0, -50, 0, 0); continue; }
      const b = i % fwT.length; const age = t - fwT[b];
      if (age < 0 || age > 1.8) { this.fw.set(i, 0, -50, 0, 0); continue; }
      const th = hash(i * 3) * Math.PI * 2, ph = Math.acos(2 * hash(i * 3 + 1) - 1); const r = 3.4 * (1 - Math.exp(-age * 3.2)) * (0.6 + 0.4 * hash(i * 3 + 2));
      this.fw.set(i, -4.2 + b * 2.8 + Math.sin(ph) * Math.cos(th) * r, 7.2 + (b % 2) * 1.3 + Math.cos(ph) * r - age * age * 0.45, -11.5 + Math.sin(ph) * Math.sin(th) * r, (1 - age / 1.8) * 1.4);
      this.fw.color(i, C(FC[b % 4]));
    }
    this.fw.commit();
    for (const ft of fwT) e.grade.flash = Math.max(e.grade.flash, decay(t, ft, 9) * 0.1);
    e.grade.flashCol = 0xffe2a8; e.grade.bloom = 0.8;
  }
}

// =====================================================================
// 虚空：譬如我 / 热忱与自卑 / 笑容的下落 / 平庸二字
// =====================================================================
export class VoidScene extends Scene {
  w1 = this.actor('whale'); w2 = this.actor('whale');
  heart = this.prop('fx_heart', 1.3); spark = this.prop('fx_sparkle_0', 1.4);
  warmM = basic(0x5c3120, { transparent: true }); coldM = basic(0x1a2a70, { transparent: true });
  crackM = basic(0xffffff, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  warm: THREE.Mesh; cold: THREE.Mesh; crack: THREE.Mesh; pit = new THREE.Group(); smile = texSprite(smileTex(), 0.46, 0.46);
  sb = beam(0x9fb2ff); sparks = new Particles(90, { size: 0.12 }); dust = new Particles(120, { size: 0.5, additive: false });
  slabs: THREE.Mesh[] = []; wg = glowSprite(0xff9d5c, 3.2, 0); cg = glowSprite(0x4058e0, 3.2, 0); sg = glowSprite(0xffffff, 1.3, 0);
  constructor() {
    super();
    const fl = mesh(new THREE.PlaneGeometry(120, 120), mat(0x191d34, { roughness: 0.7, metalness: 0.2, flatShading: false })); fl.rotation.x = -Math.PI / 2;
    this.warm = mesh(new THREE.PlaneGeometry(14, 28), this.warmM, [-7, 0.01, 0]); this.cold = mesh(new THREE.PlaneGeometry(14, 28), this.coldM, [7, 0.01, 0]);
    this.warm.rotation.x = this.cold.rotation.x = -Math.PI / 2;
    this.crack = mesh(new THREE.PlaneGeometry(0.05, 6), this.crackM, [0, 3, -0.3]);
    const hole = mesh(new THREE.CircleGeometry(0.85, 48), basic(0x000000)), ring = mesh(new THREE.RingGeometry(0.85, 0.93, 48), basic(0x8fa6ff));
    hole.rotation.x = ring.rotation.x = -Math.PI / 2; this.pit.add(hole, ring); this.pit.position.set(-1.2, 0.012, 0);
    const side = mat(0x3a4058);
    for (const ch of ['平', '庸']) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.5).translate(0, 1.7, 0), [side, side, side, side, new THREE.MeshStandardMaterial({ map: charTex(ch), roughness: 0.9 }), side]);
      this.slabs.push(s); this.group.add(s);
    }
    for (let i = 0; i < 120; i++) this.dust.color(i, C(0x6a7084));
    this.group.add(fl, this.warm, this.cold, this.crack, this.pit, this.smile, this.sb, this.sparks.points, this.dust.points, this.wg, this.cg, this.sg);
  }
  frame(c: Ctx) {
    this.hideAll(); const { t, p, e, v, rep, n } = c; const A = this.w1, B = this.w2;
    mood(e, [0x0b1029, 0x151c3f, 0x090d20], [0x10152c, 8, 40], [0x9aa8d8, 0x171930, 0.8], [0xdde6ff, 1.1], 0.25, [2, 8, 6]);
    let duel = 0, crackOp = 0, sbOp = 0, pitOn = false, smileOp = 0, mid = 0, sparkT = -99, wgOp = 0, cgOp = 0, sgOp = 0; let dustT = [-99, -99];
    this.slabs.forEach((s) => (s.visible = false));
    if (v === 'c2') { // 譬如我
      const tm = LT(n, 2); const on = eOut(range(t, tm - 0.05, tm + 0.25));
      A.show().at(0, 0, 0).tint(mixHex(0x4d578f, 0xffffff, on)).play(t < tm ? 'idle' : rep === 0 ? 'point' : rep === 1 ? 'wave' : 'hop', tm);
      sbOp = 0.3 * on; if (rep === 2 && t > tm) this.spark.show().at(0.55, 1.0 + Math.sin(t * 6) * 0.04, 0.1);
      orbit(e.cam, [0, 0.62, 0], lerp(3.9, 3.3, eOut(p)), 0.22, 0.04, 34, -0.42, -0.05);
    } else if (v === 'c4') { // 热忱与自卑对抗着
      const tc = LT(n, 5); const lunge = bump(t, tc - 0.12, 0.34) * 0.4; const tr = Math.sin(t * 43) * 0.012;
      let ax = -0.9 + lunge + tr, bx = 0.9 - lunge - tr, k = 0;
      if (rep === 1) { const sh = -0.75 * eIO(p); ax += sh; bx += sh * 0.8; B.size = 1.3; } // 自卑占了上风
      if (rep === 2) { k = eIO(range(p, 0.2, 0.85)); ax = lerp(-0.9, -0.1, k); bx = lerp(0.9, 0.1, k); } // 不打了，抱一下
      mid = (ax + bx) / 2; duel = 1 - k; crackOp = (0.45 + 0.55 * pulse(t)) * (1 - k); wgOp = cgOp = 0.5 * (1 - k);
      A.show().at(ax, 0, 0).tint(mixHex(0xffcfa6, 0xffffff, k)).play(rep === 2 && k > 0.5 ? 'nod' : 'idle', c.a);
      B.show(!(rep === 2 && k > 0.97)).at(bx, 0, -0.02).tint(mixHex(0x4d63d6, 0xffffff, k)).play(rep === 2 ? 'sad' : 'idle', c.a); B.flip = true;
      if (rep < 2) sparkT = tc; else if (k > 0.97) { this.heart.show().at(0, 1.32 + Math.sin(t * 5) * 0.03, 0.1); sgOp = 0.5; this.sg.position.set(0, 0.6, -0.1); }
      orbit(e.cam, [mid * 0.5, 0.7, 0], lerp(5.4, 4.5, p), Math.sin(p * 1.4 - 0.7) * 0.22, 0.06, 36, 0, 0.32);
      e.grade.ca = 0.002 + lunge * 0.012;
    } else if (v === 'c5') { // 笑容却已不知下落
      const td = LT(n, 6); pitOn = true; A.show().at(1.2, 0, 0);
      const face = [1.12, 0.72, 0.14], apex = [-0.5, 1.7, 0.1], hole = [-1.2, -1.3, 0]; let sp: number[];
      if (rep === 0) { // 笑从脸上飘走，掉进井里
        A.play('sad', c.a).tint(0xc4cbee); const k1 = eOut(range(t, c.a + 0.1, td)), k2 = eIn(range(t, td, td + 0.75));
        sp = [lerp(lerp(face[0], apex[0], k1), hole[0], k2), lerp(lerp(face[1], apex[1], k1), hole[1], k2), 0.1]; smileOp = 1; this.smile.material.rotation = k2 * 2.5;
        orbit(e.cam, [0, 0.75, 0], 5.6, -0.12, lerp(0.06, 0.16, p), 36, 0, -0.32);
      } else if (rep === 1) { // 从上往下看，它一圈一圈沉下去
        A.play('sad', c.a).tint(0xaab2de); const a = p * 9, r = lerp(1.5, 0.1, eIn(p));
        sp = [-1.2 + Math.cos(a) * r, lerp(0.9, -0.3, eIn(p)), Math.sin(a) * r]; smileOp = 1 - eIn(p) * 0.6; this.smile.material.rotation = a;
        orbit(e.cam, [-0.3, 0.2, 0], 6.2, 0.1, 0.7, 38, 0.1, -0.2);
      } else { // 它自己从井里回来了
        const k = eIO(range(t, c.a + 0.1, td)); const u = 1 - k; const back = k > 0.98;
        sp = [lerp(face[0], hole[0], u), lerp(face[1], hole[1], u) + Math.sin(k * Math.PI) * 1.4, 0.14]; smileOp = back ? 0 : 1; this.smile.material.rotation = u * 3;
        A.tint(0xffffff).play(back ? 'hop' : 'idle'); if (back) this.heart.show().at(1.75, 1.2 + Math.sin(t * 5) * 0.03, 0.1);
        sgOp = back ? 0 : 0.7; this.sg.position.set(sp[0], sp[1], sp[2] - 0.05);
        orbit(e.cam, [0.2, 0.75, 0], lerp(5.6, 4.6, eIO(p)), -0.12, 0.08, 36, 0.1, -0.32);
      }
      this.smile.position.set(sp[0], sp[1], sp[2]);
    } else { // v14 不愿担待平庸二字
      const tp = [LT(n, 4), LT(n, 5)], t2 = LT(n, 6); const push = eOut(range(t, t2, t2 + 0.5));
      this.slabs.forEach((s, i) => {
        s.visible = true; const k = eIn(range(t, tp[i] - 0.4, tp[i]));
        s.position.set(i ? 1.55 : -1.55, (1 - k) * 10, -1.5);
        s.rotation.set(t > tp[i] ? lerp(0.34, 0.04, push) * eOut(range(t, tp[i], tp[i] + 0.5)) : 0, i ? -0.18 : 0.18, 0);
      });
      dustT = tp; const hit = Math.max(decay(t, tp[0], 7), decay(t, tp[1], 7));
      A.show().at(0, 0, 0.3).play(t < tp[0] ? 'idle' : t < t2 ? 'surprise' : 'idle', tp[0]).tint(0xffffff);
      cgOp = push * 0.7; this.cg.position.set(0, 0.6, 0.1);
      orbit(e.cam, [Math.sin(t * 60) * hit * 0.06, 1.7 + Math.cos(t * 53) * hit * 0.06, -0.6], lerp(10.6, 9.6, p), lerp(-0.18, 0.12, p), -0.04, 38, 0, 0.45);
      e.fog.near = 14; e.fog.far = 70; e.hemi.intensity = 1.2; e.sun.intensity = 1.6;
      e.grade.ca = hit * 0.012;
    }
    this.warm.position.x = mid - 7; this.cold.position.x = mid + 7; this.warmM.opacity = this.coldM.opacity = duel * 0.9; this.warm.visible = this.cold.visible = duel > 0.01;
    this.crack.position.x = mid; this.crackM.opacity = crackOp; this.crack.visible = crackOp > 0.01;
    this.pit.visible = pitOn; this.smile.visible = smileOp > 0.01; this.smile.material.opacity = smileOp;
    aim(this.sb, [0.6, 8, 0.8], [0, 0, 0], 1.0, sbOp);
    if (v === 'c4') { this.wg.position.set(A.mesh.position.x - 0.3, 0.6, -0.5); this.cg.position.set(B.mesh.position.x + 0.3, 0.6, -0.5); }
    this.wg.material.opacity = wgOp; this.cg.material.opacity = cgOp; this.sg.material.opacity = sgOp;
    for (let i = 0; i < 90; i++) {
      const age = t - sparkT; if (age < 0 || age > 0.9) { this.sparks.set(i, 0, -50, 0, 0); continue; }
      const th = hash(i) * Math.PI * 2, sp = 1.5 + hash(i + 1) * 3.5;
      this.sparks.set(i, mid + Math.cos(th) * sp * age * 0.6, 0.85 + Math.sin(th) * sp * age - age * age * 2.5, 0.1 + (hash(i + 2) - 0.5) * age * 2, (1 - age / 0.9) * 1.2);
      this.sparks.color(i, C(i % 2 ? 0xffb070 : 0x8fa6ff));
    }
    this.sparks.commit();
    for (let i = 0; i < 120; i++) {
      const s = i % 2; const age = t - dustT[s]; if (age < 0 || age > 1.6) { this.dust.set(i, 0, -50, 0, 0); continue; }
      const th = hash(i) * Math.PI * 2, r = (0.8 + hash(i + 1) * 2.2) * (1 - Math.exp(-age * 3));
      this.dust.set(i, (s ? 1.55 : -1.55) + Math.cos(th) * r, 0.1 + hash(i + 2) * 0.5 * age, -1.3 + Math.sin(th) * r * 0.6, (1 - age / 1.6) * (0.7 + hash(i + 3)));
    }
    this.dust.commit(); this.dust.mat.uniforms.uOpacity.value = 0.35;
  }
}

// =====================================================================
// 阁楼书桌：枕头下发霉的梦 / 涂破的稿纸 / 落入俗套的名字 / 倾注 / 坚持
// =====================================================================
export class RoomScene extends Scene {
  whale = this.actor('whale'); q = this.prop('fx_question', 1.1); sweat = this.prop('fx_sweat', 1.1); spark = this.prop('fx_sparkle_1', 1.3);
  pillow = new THREE.Group(); orbM = basic(0x7a8f6a); orb = mesh(new THREE.SphereGeometry(0.12, 16, 12), this.orbM); orbGlow = glowSprite(0x8fae7a, 1.1, 0.5);
  mold = new Particles(50, { size: 0.06, additive: false }); lamp = new THREE.PointLight(0xffc98a, 7, 7, 1.6); lampGlow = glowSprite(0xffc98a, 1.5, 0.8);
  moon = beam(0x8fa6ff); sheets: THREE.Mesh[] = []; balls: THREE.Mesh[] = []; flow = new Particles(140, { size: 0.07 }); tears = new Particles(14, { size: 0.07 });
  paperGlow = glowSprite(0x7d9bff, 1.5, 0); myTagM = basic(0xffffff, { map: tagTex(true) }); myTag = mesh(new THREE.PlaneGeometry(0.9, 0.34), this.myTagM); tagGlow = glowSprite(0x6f8cff, 1.6, 0);
  potF: Flower = flower(glowTex(), 0xfdf3cf); // 窗台上那盆还没长大的小花：角落开花之前的预告
  dreamPaper = texSprite(dreamTex(true), 0.43, 0.59);
  foldedPaper = texSprite(planeTex(), 0.4, 0.2);
  constructor() {
    super(); const G = this.group;
    const fl = mesh(new THREE.PlaneGeometry(10, 8), mat(0x40322a, { roughness: 0.9 })); fl.rotation.x = -Math.PI / 2;
    const wm = mat(0x303758, { roughness: 1 }); const left = mesh(new THREE.PlaneGeometry(8, 5), wm, [-3.4, 2.5, 0]); left.rotation.y = Math.PI / 2;
    const bar = basic(0x151828);
    G.add(fl, left, mesh(new THREE.PlaneGeometry(10, 5), wm, [0, 2.5, -2.3]), mesh(new THREE.PlaneGeometry(1.1, 1.3), basic(0x9db2ff), [-0.3, 2.3, -2.28]),
      mesh(new THREE.BoxGeometry(1.2, 0.05, 0.03), bar, [-0.3, 2.3, -2.26]), mesh(new THREE.BoxGeometry(0.05, 1.4, 0.03), bar, [-0.3, 2.3, -2.26]));
    // 床与枕头（枕头绕床头那条边掀起来）
    G.add(mesh(new THREE.BoxGeometry(2.5, 0.34, 1.2), mat(0x3a2c24), [-2.0, 0.17, -1.5]), mesh(new THREE.BoxGeometry(2.4, 0.2, 1.12), mat(0xcfd3ea), [-2.0, 0.44, -1.5]));
    this.pillow.add(mesh(new THREE.BoxGeometry(0.72, 0.16, 0.52), mat(0xf4f0e8), [0.36, 0.08, 0])); this.pillow.position.set(-3.1, 0.54, -1.5);
    // 书桌、台灯、纸堆
    const wood = mat(0x5f4736), paper = mat(0xe9e5da, { roughness: 1 });
    G.add(mesh(new THREE.BoxGeometry(2.4, 0.08, 0.9), wood, [1.4, 0.8, -1.5]), mesh(new THREE.BoxGeometry(2.32, 0.62, 0.04), wood, [1.4, 0.47, -1.08]));
    for (const [x, z] of [[0.3, -1.85], [2.5, -1.85], [0.3, -1.15], [2.5, -1.15]]) G.add(rod([x, 0, z], [x, 0.78, z], 0.04, wood));
    const metal = mat(0x2a2d3a, { metalness: 0.6, roughness: 0.4 });
    const shade = mesh(new THREE.ConeGeometry(0.17, 0.2, 12, 1, true), basic(0xffe2b0, { side: THREE.DoubleSide }), [2.08, 1.42, -1.68]); shade.rotation.z = 0.5;
    G.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), metal, [2.35, 0.86, -1.78]), rod([2.35, 0.86, -1.78], [2.2, 1.46, -1.72], 0.015, metal), shade);
    this.lamp.position.set(1.9, 1.3, -1.5); this.lampGlow.position.set(2.05, 1.36, -1.66);
    for (const [x, y, z, h] of [[0.5, 0.84, -1.75, 0.26], [0.75, 0.84, -1.3, 0.12], [2.3, 0.84, -1.3, 0.18], [0.1, 0, -0.9, 0.5], [2.95, 0, -1.0, 0.72], [3.4, 0, -1.6, 0.4]]) {
      const s = mesh(new THREE.BoxGeometry(0.3, h, 0.42), paper, [x, y + h / 2, z]); s.rotation.y = hash(x * 7) * 0.6 - 0.3; G.add(s);
    }
    const work = mesh(new THREE.PlaneGeometry(0.34, 0.46), basic(0xd8d8e0, { map: paperTex(0) }), [1.4, 0.845, -1.35]); work.rotation.x = -Math.PI / 2; G.add(work);
    for (let i = 0; i < 7; i++) { const s = mesh(new THREE.PlaneGeometry(0.3, 0.42), basic(0x8f93ad, { map: paperTex(i) }), [0.7 + i * 0.36, 1.75 + (i % 2) * 0.3 + hash(i) * 0.2, -2.28]); s.rotation.z = (hash(i + 4) - 0.5) * 0.4; G.add(s); }
    for (let i = 0; i < 14; i++) { const s = mesh(new THREE.PlaneGeometry(0.3, 0.42), basic(0xd8d8e0, { map: paperTex(i), side: THREE.DoubleSide })); this.sheets.push(s); G.add(s); }
    for (let i = 0; i < 12; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.07, 0), paper, [-0.2 + hash(i) * 3.2, 0.07, -1.0 + hash(i + 3) * 1.6]); this.balls.push(b); G.add(b); }
    // 窗台上的小花；桌上的铅笔、墨瓶与那本书
    G.add(mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), mat(0x9a5f4a), [0.12, 1.72, -2.1]));
    this.potF.g.position.set(0.12, 1.79, -2.1); G.add(this.potF.g);
    G.add(rod([1.62, 0.865, -1.18], [1.92, 0.865, -1.08], 0.014, mat(0xe2b64d)),
      mesh(new THREE.ConeGeometry(0.017, 0.05, 6), mat(0x303850), [1.97, 0.865, -1.06]),
      mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.09, 8), mat(0x1c2b4e), [2.2, 0.9, -1.62]),
      mesh(new THREE.BoxGeometry(0.3, 0.05, 0.22), mat(0x6a4a8a), [0.88, 0.87, -1.82]));
    for (let i = 0; i < 50; i++) this.mold.color(i, C(i % 3 ? 0x55704a : 0x8a9a6a));
    for (let i = 0; i < 140; i++) this.flow.color(i, C(i % 3 ? 0x7d9bff : 0xffffff));
    for (let i = 0; i < 14; i++) this.tears.color(i, C(0x9fc0ff));
    // 名牌墙（放在房间外很远的地方，单独取景）
    G.add(mesh(new THREE.PlaneGeometry(12, 6), basic(0x232a44), [40, 1.6, -0.06]));
    const tm = basic(0x9a9a96, { map: tagTex(false) });
    for (let cx = 0; cx < 9; cx++) for (let cy = 0; cy < 7; cy++) if (cx !== 4 || cy !== 3) G.add(mesh(new THREE.PlaneGeometry(0.9, 0.34), tm, [40 + (cx - 4) * 1.02, 1.6 + (cy - 3) * 0.46, 0]));
    this.tagGlow.position.set(40, 1.6, 0.05);
    G.add(this.pillow, this.orb, this.orbGlow, this.mold.points, this.lamp, this.lampGlow, this.moon, this.flow.points, this.tears.points, this.paperGlow, this.myTag, this.tagGlow, this.dreamPaper, this.foldedPaper);
  }
  frame(c: Ctx) {
    this.hideAll(); const { t, p, e, v, rep, n } = c; const W = this.whale; const pu = pulse(t);
    mood(e, [0x0b0f26, 0x161d40, 0x090b1a], [0x12152a, 6, 30], [0x93a3d4, 0x3a2c1e, 0.75], [0x9db2ff, 0.7], 0, [-1, 5, 2]);
    let lampK = 0.8, pil = 0, orbPos = [-2.75, 0.62, -1.5], orbK = 0, spore = 0, orbOn = false, flowK = 0, tearK = 0, fly = false, pgl = 0, tagGl = 0;
    const desk = [1.4, 0.87, -1.35];
    W.show().at(1.35, 0.36, -2.02).play('idle');
    if (v === 'c3') { // 枕头下发霉的梦怎么做
      const tf = LT(n, 3), tq = LT(n, 7); pil = 0.95 * eOut(range(t, tf - 0.1, tf + 0.4)); orbOn = true; lampK = 0.55;
      W.at(-1.6, 0, -0.75).play(rep === 0 ? 'sad' : rep === 1 ? 'surprise' : 'nod', rep === 0 ? c.a : tf).tint(rep === 2 ? 0xffffff : 0xb9c2ea);
      if (rep === 0 && t > tq) this.q.show().at(-1.6, 1.3 + Math.sin(t * 5) * 0.03, -0.7);
      if (rep >= 1) { // 第二遍：吹掉霉；第三遍：它干干净净地飘到她手里
        const k = eOut(range(t, tf, tf + 1.2)); const go = rep === 2 ? eIO(range(t, tf + 0.6, c.b - 0.3)) : 0;
        orbPos = [-2.75 + 1.15 * go, 0.62 + 0.55 * k - 0.4 * go, -1.5 + 0.8 * go]; spore = rep === 1 ? eOut(range(t, tq - 0.2, tq + 1.0)) : 1; orbK = rep === 1 ? k * 0.6 : 1;
      }
      orbit(e.cam, [-2.2, 0.7, -1.3], lerp(4.0, 3.3, eOut(p)), 0.3, 0.16, 36, 0.12, 0.04);
    } else if (v === 'v10') { // 一张张涂破的稿纸
      fly = true; lampK = 1; W.cue(t, [[c.a, 'idle'], [LT(n, 0), 'point'], [LT(n, 3), 'point'], [LT(n, 6), 'point']]);
      orbit(e.cam, [1.3, 1.0, -1.5], lerp(4.6, 3.7, p), lerp(-0.45, -0.2, p), 0.12, 36, -0.4, -0.15);
    } else if (v === 'v11') { // 和一个落入俗套的名字
      const tl = LT(n, 3), ts = LT(n, 5), tn = LT(n, 8); W.show(false); const k = eOut(range(t, tl - 0.35, tl + 0.05));
      this.myTag.position.set(40, 1.6 + (1 - k) * 3.2, 0.01); this.myTag.rotation.z = (1 - k) * 0.6 + decay(t, tl + 0.05, 8) * Math.sin(t * 40) * 0.08;
      this.myTagM.color.setHex(mixHex(0xffffff, 0x9a9a96, eIO(range(t, ts - 0.1, ts + 0.6)) * (1 - 0.7 * bump(t, tn, 1.0))));
      tagGl = bump(t, tn, 1.0) * 0.8;
      orbit(e.cam, [40, 1.6, 0], lerp(2.2, 5.8, eIO(p)), lerp(0.3, 0.12, p), 0, 36, 0.36, 0);
    } else if (v === 'v12') { // 倾注所有的那件事
      flowK = 1; pgl = 0.3 + p * 0.9; lampK = 0.6 + p * 0.6; W.play('sway').tint(mixHex(0xffffff, 0xaeb8e6, p * 0.8));
      orbit(e.cam, [1.35, 1.05, -1.7], lerp(3.6, 2.6, eIO(p)), 0.18, 0.14, 36, 0, 0.3);
    } else { // v13 哭了很多次还是想坚持
      const tk = LT(n, 5), tj = LT(n, 8); tearK = 1 - range(t, tk, tk + 0.4); W.cue(t, [[c.a, 'sad'], [tk, 'nod'], [tj, 'point']]);
      lampK = t < tk ? 0.3 + 0.2 * Math.sin(t * 31) * Math.sin(t * 7) : 0.5 + 0.7 * eOut(range(t, tj - 0.1, tj + 0.3)); pgl = 0.6 * range(t, tj, tj + 0.4);
      if (tearK > 0.3) this.sweat.show().at(1.66, 1.24, -1.95); if (t > tj) this.spark.show().at(1.95, 1.6 + Math.sin(t * 6) * 0.03, -1.9);
      orbit(e.cam, [1.35, 1.0, -1.7], lerp(3.0, 3.4, p), -0.25, 0.1, 36, -0.4, 0.25); e.grade.flash = decay(t, tj, 8) * 0.12; e.grade.flashCol = 0xffe2b0;
    }
    this.pillow.rotation.z = pil;
    this.dreamPaper.visible = v === 'c3';
    if (v === 'c3') {
      const reveal = eOut(range(t, LT(n, 3) - 0.08, LT(n, 3) + 0.5));
      this.dreamPaper.material.map = dreamTex(rep > 0);
      this.dreamPaper.material.opacity = reveal * 0.95;
      this.dreamPaper.material.rotation = -0.14 + 0.08 * Math.sin(t * 1.2);
      this.dreamPaper.position.set(orbPos[0] + 0.2, orbPos[1] + 0.1 + reveal * 0.18, orbPos[2] + 0.18);
    }
    this.foldedPaper.visible = v === 'v13' && t >= LT(n, 5);
    if (this.foldedPaper.visible) {
      const fly = eIO(range(t, LT(n, 5), c.b - 0.1));
      this.foldedPaper.position.set(lerp(1.45, 0.2, fly), lerp(0.95, 2.0, fly), lerp(-1.3, -2.0, fly));
      this.foldedPaper.material.rotation = -0.25 + 0.1 * Math.sin(t * 4);
      this.foldedPaper.material.opacity = 1 - range(fly, 0.8, 1);
    }
    this.orb.visible = this.orbGlow.visible = this.mold.points.visible = orbOn;
    this.orb.position.set(orbPos[0], orbPos[1], orbPos[2]); this.orbGlow.position.copy(this.orb.position);
    const oc = mixHex(0x6f8560, 0x7d9bff, orbK); this.orbM.color.setHex(oc); this.orbGlow.material.color.setHex(oc); this.orbGlow.material.opacity = 0.35 + 0.5 * orbK + 0.08 * Math.sin(t * 3);
    for (let i = 0; i < 50; i++) {
      const th = hash(i) * Math.PI * 2, ph = Math.acos(2 * hash(i + 1) - 1), r = 0.13 + spore * (0.4 + hash(i + 2) * 1.6);
      this.mold.set(i, orbPos[0] + Math.sin(ph) * Math.cos(th) * r, orbPos[1] + Math.cos(ph) * r + spore * 0.3, orbPos[2] + Math.sin(ph) * Math.sin(th) * r, orbOn ? (1 - spore) * (0.6 + hash(i + 3)) : 0);
    }
    this.mold.commit();
    this.lamp.intensity = 7 * lampK; this.lampGlow.material.opacity = 0.5 * lampK;
    setFlower(this.potF, e.cam, 1, 0.8 + 0.2 * Math.sin(t * 1.3), 0.26, 0.08);
    aim(this.moon, [-0.3, 2.95, -2.2], [-0.7, 0, 0.5], 1.1, v === 'v11' ? 0 : 0.13);
    for (let i = 0; i < 140; i++) {
      if (!flowK) { this.flow.set(i, 0, -50, 0, 0); continue; }
      const s = (t * 0.45 + hash(i)) % 1, k = eIn(s);
      this.flow.set(i, lerp(1.35 + (hash(i + 1) - 0.5) * 0.6, desk[0], k), lerp(1.05 + hash(i + 2) * 0.5, desk[1], k) + Math.sin(s * Math.PI) * 0.22, lerp(-1.95, desk[2], k), Math.sin(s * Math.PI) * (0.6 + hash(i + 3)));
    }
    this.flow.commit();
    for (let i = 0; i < 14; i++) {
      const s = (t * 0.9 + hash(i)) % 1;
      this.tears.set(i, 1.35 + (i % 2 ? 0.14 : -0.14) + (hash(i + 5) - 0.5) * 0.05, lerp(1.22, 0.86, s * s), -1.93, tearK * (1 - s) * 1.1);
    }
    this.tears.commit();
    this.paperGlow.position.set(desk[0], desk[1] + 0.05, desk[2]); this.paperGlow.material.opacity = pgl * 0.7;
    this.tagGlow.material.opacity = tagGl; this.myTag.visible = v === 'v11';
    this.sheets.forEach((s, i) => {
      const age = fly ? t - (LT(n, i % 8) + Math.floor(i / 8) * 0.22) : -1; s.visible = age > 0; if (age <= 0) return;
      s.position.set(desk[0] + (hash(i) - 0.3) * 2.0 * age, desk[1] + 1.7 * age - 1.0 * age * age, desk[2] + (0.5 + hash(i + 5) * 0.9) * age);
      s.rotation.set(age * 3 + i, age * 2.2, age * 4 + i * 0.7);
    });
    this.balls.forEach((b, i) => { b.position.y = 0.07 + Math.abs(Math.sin(t * 3 + i)) * 0.04 * pu; });
  }
}
