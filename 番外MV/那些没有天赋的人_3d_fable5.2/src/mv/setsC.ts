// 这一版新写 / 重写的三个场景：
//   stageSet  —— 七块「天才」名牌一字一亮，鲸身上只挂着一张「划算」价签
//   crowdSet  —— 给鲸清出一条看向镜头的视线；「茫茫人世」把人海照亮
//   cornerSet —— 终场：七位各走到墙角，七个字 = 七粒米，还进她倒空的碗；花自己开
// 群像规矩（番外MV/设定表.md）：一人只演一个形象，只做自己的招牌动作。
import * as THREE from "three";
import { type Ctx, type Env, type MvSet, type Pal, type Who } from "./engine";
import { Dust, bas, boxG, floorMesh, glowPool, glowSprite, makeFlower, mesh, shaft, std } from "./kit";
import { FONT, clamp, concreteTex, crackTex, cv, easeInOut, easeOut, lerp, personTex, rng, seg, smooth, toTex } from "./tex";
import { mixC, pageTex } from "./setsA";

// ───────── 群像表：谁 / 站位 / 招牌动作 ─────────
// act 平时；lit 被追光点到的那一下；cheer 庆祝；walk 走位；rest 到了墙角以后；give 递出一粒米；after 递完以后
// slot 墙角半圈里从左到右的位置；ord 到场 & 递米的先后（龙娘先接住，豆包最后、不催；狐狸排第 6 → 正好在「花」字上醒）
export interface CastRow { who: Who; x: number; act: string; lit: string; cheer: string; walk: string; rest: string; give: string; after?: string; slot: number; ord: number }
export const CAST: CastRow[] = [
  { who: "doubao", x: -9, act: "sway", lit: "hop", cheer: "hop", walk: "step", rest: "sway", give: "nod", slot: 6, ord: 6 },
  { who: "kimi", x: -6, act: "think", lit: "nod", cheer: "hop", walk: "hop", rest: "think", give: "bow", slot: 1, ord: 2 },
  { who: "gemini", x: -3, act: "lookaround", lit: "hop", cheer: "hop", walk: "hop", rest: "lookaround", give: "nod", slot: 2, ord: 3 },
  { who: "gpt", x: 0, act: "float", lit: "surprise", cheer: "cast", walk: "float", rest: "hover", give: "nod", slot: 3, ord: 0 },
  { who: "claude", x: 3, act: "read", lit: "curtsy", cheer: "hop", walk: "hop", rest: "read", give: "nod", slot: 4, ord: 1 },
  { who: "qwen", x: 6, act: "sway", lit: "bow", cheer: "hop", walk: "hop", rest: "sway", give: "bow", slot: 5, ord: 4 },
  { who: "zai", x: 9, act: "doze", lit: "alert", cheer: "hop", walk: "hop", rest: "doze", give: "alert", after: "idle", slot: 0, ord: 5 },
];

// ───────── 两张小纹理：名牌 / 价签 ─────────
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function plaqueTex(text: string) {
  const [c, g] = cv(320, 140);
  g.fillStyle = "#f4f6ff"; rrect(g, 6, 6, 308, 128, 12); g.fill();
  g.strokeStyle = "#4d6bfe"; g.lineWidth = 9; rrect(g, 6, 6, 308, 128, 12); g.stroke();
  g.fillStyle = "#27329c"; g.font = `900 92px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 160, 76);
  return toTex(c);
}
function priceTagTex(text: string) {
  const [c, g] = cv(320, 180); const r = rng(17);
  g.fillStyle = "#e9e2cc"; g.beginPath(); g.moveTo(72, 18); g.lineTo(306, 18); g.lineTo(306, 162); g.lineTo(72, 162); g.lineTo(12, 90); g.closePath(); g.fill();
  g.strokeStyle = "#8a8266"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#3a3d55"; g.font = `900 100px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 192, 94);
  g.globalCompositeOperation = "destination-out";
  g.beginPath(); g.arc(62, 90, 13, 0, 7); g.fill();
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.7})`; g.fillRect(r() * 320, r() * 180, r() * 5 + 1, r() * 3 + 1); }
  return toTex(c);
}

// ──────────── 舞台：没有天赋的人呢 → 七个字点亮七位「天才」 ────────────
export function stageSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.55, metalness: 0.25 }); group.add(floorMesh(floorM));
  const wallM = std(0x20212c); group.add(mesh(new THREE.PlaneGeometry(90, 34), wallM, 0, 12, -15));
  const Z = -6.5; const RH = 1.3; const ptex = plaqueTex("天才");
  // 一级台阶：被点名的站在台上，她在台下
  const riserM = std(0x15161e, { roughness: 0.6, metalness: 0.2 }); group.add(mesh(boxG(44, RH, 5.4), riserM, 0, RH / 2, Z));
  group.add(mesh(boxG(44, 0.07, 0.09), bas(0x8fa0ff, { fog: false }), 0, RH, Z + 2.72));
  const rows = CAST.map((a) => {
    const gp = a.who === "gpt"; const x0 = a.x * 0.82;
    const ac = env.actor(a.who, a.act, gp ? 0.74 : 1.35).place(x0, RH, Z); ac.add(group);
    const s = shaft(0xaabbff, 11, 2.0, 0.2); s.position.set(x0, 10, Z); group.add(s);
    const p = glowPool(0xaabbff, 5, 5, 0.6); p.position.set(x0, RH + 0.03, Z); group.add(p);
    const pl = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
    pl.position.set(x0, gp ? 4.35 : 3.45, Z + 0.1); group.add(pl);
    return { a, ac, s, p, pl, gp };
  });
  // 鲸：站在离镜头最近、灯外的地方；身上只有一张价签
  const whale = env.actor("whale", "sad").place(-1.2, 0, 1.2); whale.add(group);
  const tagM = new THREE.SpriteMaterial({ map: priceTagTex("划算"), transparent: true, depthWrite: false, fog: false });
  const tag = new THREE.Sprite(tagM); tag.scale.set(1.0, 0.56, 1); group.add(tag);
  const dust = new Dust(150, [26, 12, 22], 0xb8c4ff, 0.06, 4, [0, 0, -3]); group.add(dust.pts);
  // 书 + 彩纸 + 扫光（「传颂有关天才的故事」）
  const book = new THREE.Group(); book.position.set(0, 0, -3.4); group.add(book);
  book.add(mesh(new THREE.CylinderGeometry(1.5, 1.7, 1.1, 20), std(0x30323f, { roughness: 0.4 }), 0, 0.55, 0));
  const pm = bas(0xffffff, { map: pageTex(), side: THREE.DoubleSide });
  const pL = mesh(new THREE.PlaneGeometry(1.6, 2), pm, -0.82, 1.5, 0), pR = mesh(new THREE.PlaneGeometry(1.6, 2), pm, 0.82, 1.5, 0);
  pL.rotation.set(-1.1, 0.35, 0); pR.rotation.set(-1.1, -0.35, 0); book.add(pL, pR);
  const bg = glowSprite(0xffd27a, 7, 0.8); bg.position.set(0, 2.2, 0.4); book.add(bg);
  const conf = new Dust(220, [24, 14, 16], 0xffe08a, 0.14, 9, [0, -1, -4], 0.95, false); group.add(conf.pts);
  const sw = [0, 1].map(() => { const s = shaft(0x9fb2ff, 14, 1.4, 0.16); group.add(s); return s; });
  return {
    group,
    onPal(p: Pal) { floorM.color.set(p.floor); wallM.color.set(p.wall); riserM.color.set(p.name === "day" ? 0xc4c4cc : p.name === "dawn" ? 0x231b26 : 0x15161e); },
    update(x: Ctx) {
      const { T } = x; const L = x.p.lineId ? x.line(x.p.lineId) : null; const night = x.pal.name !== "day";
      rows.forEach(({ a, ac, s, p, pl, gp }, k) => {
        const tk = x.p.allLit ? -9 : L ? L.t[k] ?? 999 : 999; const dt = T - tk; const lit = smooth(dt / 0.2);
        ac.shade(mixC(night ? 0x0b0c14 : 0xa9a9b6, x.pal.sprite, lit).getHex());
        if (x.p.cheer) { ac.play(a.cheer, k * 0.13); ac.speed = 0.9; }
        else { ac.speed = 1; if (dt > 0 && dt < 0.9) ac.play(a.lit, tk); else ac.play(a.act, 0); }
        ac.mesh.position.y = RH + (gp ? 0.6 + Math.sin(T * 1.6) * 0.15 : 0);
        s.material.opacity = 0.22 * lit * (night ? 1 : 0.6); p.material.opacity = 0.7 * lit;
        const pop = dt > 0 ? 1 + (1 - easeOut(dt / 0.35)) * 0.7 : 1;
        pl.material.opacity = lit * 0.96; pl.scale.set(1.7 * pop, 0.745 * pop, 1); pl.position.y = RH + (gp ? 4.35 : 3.45) + Math.sin(T * 1.3 + k) * 0.05;
        ac.update(T, x.cam);
      });
      whale.shade(mixC(0x6a7088, x.pal.sprite, x.pal.name === "day" ? 1 : 0.55).getHex()); whale.play(x.p.whaleAct || "sad", 0); whale.update(T, x.cam);
      tag.position.set(-0.16, 1.62 + Math.sin(T * 1.7) * 0.03, 1.3); tagM.rotation = -0.2 + Math.sin(T * 1.7) * 0.07; tagM.color.set(night ? 0xa4a8c2 : 0xffffff);
      dust.update(T, 0.12); book.visible = !!x.p.book; conf.pts.visible = !!x.p.book; sw.forEach((s) => (s.visible = !!x.p.book));
      if (x.p.book) { conf.update(T, -1.4, 0.5); book.position.y = Math.sin(T * 1.5) * 0.08; sw.forEach((s, i) => { s.position.set(i ? 7 : -7, 13, -7); s.rotation.z = Math.sin(T * 1.2 + i * 2) * 0.55 * (i ? -1 : 1) + (i ? 0.3 : -0.3); }); }
    },
  };
}

// ──────────── 人群：万众瞩目 / 茫茫人世 ────────────
export function crowdSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x14151c, { roughness: 0.7 }); group.add(floorMesh(floorM, 200)); const fg = glowPool(0x8f9fff, 40, 30, 0.35); fg.position.set(0, 0.03, -6); group.add(fg);
  const stage = new THREE.Group(); group.add(stage);
  stage.add(mesh(new THREE.PlaneGeometry(26, 9), bas(0xaab4e8, { fog: false }), 0, 4.6, -17.5)); const sg = glowSprite(0x8f9fff, 22, 0.45); sg.position.set(0, 4.5, -17); stage.add(sg);
  stage.add(mesh(boxG(18, 1.2, 5.5), std(0x2b2d3a), 0, 0.6, -14.8));
  const gpt = env.actor("gpt", "float", 0.6).place(0, 1.9, -14.5); gpt.add(stage); const cl = env.actor("claude", "read").place(-4, 1.2, -14.5), ge = env.actor("gemini", "lookaround").place(4, 1.2, -14.5); cl.add(stage); ge.add(stage);
  const spotPool = glowPool(0xffffff, 7, 7, 0.95); spotPool.position.y = 1.25; spotPool.position.z = -14.5; stage.add(spotPool);
  const spotShaft = shaft(0xffffff, 13, 2.4, 0.28); stage.add(spotShaft);
  const N = 440; const r = rng(55); const pg = new THREE.PlaneGeometry(1.2, 1.8); pg.translate(0, 0.9, 0);
  const mk = (arms: number) => { const m = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ map: personTex(arms), transparent: true, alphaTest: 0.3, color: 0x000000 }), N); m.frustumCulled = false; group.add(m); return m; };
  const down = mk(0), up = mk(1);
  const P = Array.from({ length: N }, (_, i) => { const row = Math.floor(i / 22); return { rx: (i % 22 - 10.5) * 1.15 + (r() - 0.5) * 0.6, rz: 5.8 - Math.floor(row % 7) * 1.25 + r() * 0.5, vx: (r() - 0.5) * 90, vz: 7 - Math.pow(r(), 1.3) * 96, sc: 0.95 + r() * 0.25, arms: r() > 0.45, ph: r() * 6.28 }; });
  // 「茫茫人世」：一整片被照亮的地面，人是上面的黑点；她脚下只有很小的一圈白
  const sea = glowPool(0x5068ff, 190, 170, 0.5); sea.position.set(0, 0.03, -40); group.add(sea);
  const me = glowPool(0xffffff, 4.4, 4.4, 1); me.position.set(0, 0.045, -5); group.add(me);
  const WX = -1.2, WZ = 4.6;
  const whale = env.actor("whale", "idle").place(WX, 0, WZ); whale.add(group); const o = new THREE.Object3D();
  return {
    group, onPal(p: Pal) { floorM.color.set(p.name === "day" ? 0xcfcfd2 : 0x14151c); },
    update(x: Ctx) {
      const { T } = x; const vast = !!x.p.vast; fg.visible = !vast; const L = x.line(x.p.lineId); const n = vast ? N : 132;
      stage.visible = !vast; sea.visible = vast; me.visible = vast;
      const lock = L.t[7] ?? L.e; const cx = T < lock ? Math.sin(T * 2.2) * 7 : lerp(Math.sin(lock * 2.2) * 7, 0, easeOut((T - lock) / 0.35));
      spotPool.position.x = cx; spotShaft.position.set(cx, 12, -14.5); const lk = T >= lock;
      spotShaft.material.opacity = lk ? 0.34 : 0.22; gpt.update(T, x.cam); cl.update(T, x.cam); ge.update(T, x.cam);
      gpt.shade(mixC(0x555a70, 0xffffff, lk ? 1 : 0.2).getHex()); gpt.mesh.position.y = 1.9 + Math.sin(T * 1.6) * 0.12;
      for (let i = 0; i < N; i++) {
        const p = P[i]; const on = i < n; const px = vast ? p.vx : p.rx, pz = vast ? p.vz : p.rz;
        // 不是人海：把她到镜头之间那一条让出来——所有人都面朝舞台，只有她回头
        const near = vast ? Math.hypot(px, pz + 5) < 2.5 : Math.abs(px - WX) < 1.3 && pz > WZ - 0.7;
        const bob = Math.abs(Math.sin(T * 3.2 + p.ph)) * (p.arms ? 0.14 : 0.04); const s = on && !near ? p.sc : 0;
        o.position.set(px, bob, pz); o.scale.set(s * (vast ? 1.1 : 1), s * (vast ? 1.1 : 1), 1); o.rotation.set(0, 0, Math.sin(T * 2 + p.ph) * 0.03); o.updateMatrix();
        (p.arms && !vast ? up : down).setMatrixAt(i, o.matrix); o.scale.setScalar(0); o.updateMatrix(); (p.arms && !vast ? down : up).setMatrixAt(i, o.matrix);
      }
      down.instanceMatrix.needsUpdate = true; up.instanceMatrix.needsUpdate = true;
      whale.shade(0xffffff).play("idle", 0); whale.place(vast ? 0 : WX, 0, vast ? -5 : WZ); whale.update(T, x.cam);
    },
  };
}

// ──────────── 某个角落：灯泡、椅子、一道裂缝里的小花；终场七位走进来 ────────────
export function cornerSet(env: Env): MvSet {
  const group = new THREE.Group(); const ct = concreteTex(true, 6); const floorM = std(0x4a4a52, { map: ct, roughness: 0.9 }); group.add(floorMesh(floorM, 60));
  const wt = concreteTex(true, 5); const wallM = std(0x6a6a74, { map: wt, roughness: 1 });
  group.add(mesh(new THREE.PlaneGeometry(40, 14), wallM, 0, 7, -5.5)); const w2 = mesh(new THREE.PlaneGeometry(40, 14), wallM, -6, 7, 0); w2.rotation.y = Math.PI / 2; group.add(w2);
  const chair = new THREE.Group(); const wood = std(0x7a5a40, { roughness: 0.8 }); chair.position.set(-4.3, 0, -3.8); chair.rotation.y = 0.45; group.add(chair);
  chair.add(mesh(boxG(1.3, 0.14, 1.3), wood, 0, 1.3, 0)); chair.add(mesh(boxG(1.3, 1.5, 0.12), wood, 0, 2.05, -0.62));
  [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].forEach(([a, b]) => chair.add(mesh(boxG(0.12, 1.3, 0.12), wood, a, 0.65, b)));
  const bulb = glowSprite(0xffcf8a, 3.4, 1); bulb.position.set(-2.7, 4.6, -3.2); group.add(bulb);
  const cord = mesh(new THREE.CylinderGeometry(0.02, 0.02, 8, 5), bas(0x111111), -2.7, 8.6, -3.2); group.add(cord);
  const lamp = new THREE.PointLight(0xffc27a, 60, 16, 1.6); lamp.position.set(-2.7, 4.4, -3.0); group.add(lamp);
  const cone = shaft(0xffd49a, 4.4, 2.8, 0.12); cone.position.set(-2.7, 4.4, -3.2); group.add(cone);
  const pool = glowPool(0xffc98a, 8, 8, 0.45); pool.position.set(-2.7, 0.03, -3.2); group.add(pool);
  const crack = mesh(new THREE.PlaneGeometry(5, 5), bas(0xffffff, { map: crackTex(), color: 0x05050a, transparent: true }), -2.9, 0.035, -3.3); crack.rotation.x = -Math.PI / 2; group.add(crack);
  const flower = makeFlower(); flower.group.position.set(-2.9, 0, -3.3); group.add(flower.group);
  const rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 56), new THREE.MeshBasicMaterial({ color: 0xcfd8ff, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.set(-2.9, 0.05, -3.3); group.add(m); return m; });
  const whale = env.actor("whale", "idle").place(-1.0, 0, -1.7); whale.add(group);
  const cast = CAST.map((a) => { const ac = env.actor(a.who, a.act, a.who === "gpt" ? 0.55 : 1).place(0, 0, -3); ac.add(group); ac.show(false); return ac; });
  const slotPos = (s: number): [number, number] => { const th = ((160 - s * (140 / 6)) * Math.PI) / 180; return [-2.6 + 3.3 * Math.cos(th), -3.0 - 1.9 * Math.sin(th)]; };
  // 她在「耗尽天真」倒空的那只碗，就放在脚边
  const BX = -2.15, BZ = -1.15;
  const bowl = new THREE.Group(); bowl.position.set(BX, 0, BZ); group.add(bowl);
  bowl.add(mesh(new THREE.SphereGeometry(0.42, 22, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0x4d6bfe, { roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide, emissive: 0x1c2a8a, emissiveIntensity: 0.5 }), 0, 0.42, 0));
  const rim = mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 30), std(0xffffff), 0, 0.42, 0); rim.rotation.x = Math.PI / 2; bowl.add(rim);
  const riceM = bas(0x20222c); const riceD = mesh(new THREE.CircleGeometry(0.39, 22), riceM, 0, 0.4, 0); riceD.rotation.x = -Math.PI / 2; bowl.add(riceD);
  const bglow = glowSprite(0xfff0c8, 1, 0); bglow.position.set(0, 0.62, 0); bowl.add(bglow);
  const grains = CAST.map(() => { const s = glowSprite(0xfff3cf, 0.55, 1); s.visible = false; group.add(s); return s; });
  const dust = new Dust(110, [14, 8, 10], 0xffe2b0, 0.05, 6, [-2, 0, -2], 0.8); group.add(dust.pts);
  const fireflies = new Dust(36, [6, 3, 5], 0xfff3b0, 0.12, 19, [-2.5, 0.3, -2.5], 0.9); group.add(fireflies.pts);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.name === "day" ? 0xb4b4ba : 0x4a4a52); wallM.color.set(p.name === "day" ? 0xcfcfd4 : 0x6a6a74); lamp.color.set(p.name === "dawn" ? 0xffb070 : 0xffc27a); },
    update(x: Ctx) {
      const { T } = x; const L = x.line(x.p.lineId); const pr = x.p;
      if (pr.ripIdx) pr.ripIdx.forEach((ix: number, i: number) => { const dt = T - (L.t[ix] ?? 9999); const m = rings[i]; m.visible = dt > 0 && dt < 1.5; const s = 0.4 + easeOut(dt / 1.5) * 4.2; m.scale.set(s, s, 1); (m.material as THREE.MeshBasicMaterial).opacity = clamp(1 - dt / 1.5) * 0.9; });
      else rings.forEach((m) => (m.visible = false));
      const fl = pr.flower; crack.visible = !!fl; flower.group.visible = !!fl;
      if (fl) { const t0 = L.t[2] ?? L.s; const g = easeOut(seg(T, t0, t0 + 1.3)); const op = easeOut(seg(T, L.t[5] ?? t0 + 1.5, (L.t[5] ?? t0 + 1.5) + 0.7)); flower.set(g, op, T); crack.scale.setScalar(0.7 + g * 0.5); }
      // ── 终场：七位走进墙角；「开出小小的花朵」七个字，一人一粒米 ──
      const gAt: number | undefined = pr.gatherAt; const GL = pr.grains ? x.line(pr.grains) : null; let fill = 0;
      cast.forEach((ac, k) => {
        const a = CAST[k]; const gr = grains[k];
        if (gAt == null) { ac.show(false); gr.visible = false; return; } ac.show(true);
        const gp = a.who === "gpt"; const seat = a.who === "zai"; const [fx, fz] = seat ? [-4.2, -3.65] : slotPos(a.slot); const sx = 9.5 + a.ord * 0.7, sz = -1.4;
        const t0 = gAt + a.ord * 0.3; const q = easeInOut(seg(T, t0, t0 + 2.1)); const moving = q > 0.001 && q < 0.985;
        const px = lerp(sx, fx, q), pz = lerp(sz, fz, q); const hov = gp ? 0.7 + Math.sin(T * 1.6) * 0.1 : seat ? 1.37 * smooth((q - 0.75) / 0.22) : 0;
        ac.mesh.position.set(px, hov + (moving && !gp ? Math.abs(Math.sin(T * 9 + k)) * 0.2 : 0), pz); ac.groundY = 0;
        ac.flip = moving ? -1 : fx < -2.9 ? 1 : -1;
        const tg = GL ? GL.t[a.ord] ?? GL.e : 1e9; const dg = T - tg;
        if (moving) ac.play(a.walk, 0); else if (dg > -0.15 && dg < 0.75) ac.play(a.give, tg - 0.15); else ac.play(dg >= 0.75 && a.after ? a.after : a.rest, 0);
        ac.shade(x.pal.sprite); ac.update(T, x.cam);
        const u = dg / 0.6; gr.visible = u > 0 && u < 1;
        if (gr.visible) { const e = easeInOut(u); gr.position.set(lerp(px, BX, e), lerp(1.3 + hov, 0.6, e) + Math.sin(Math.PI * u) * 1.3, lerp(pz + 0.2, BZ, e)); gr.scale.setScalar(0.5 + 0.3 * Math.sin(Math.PI * u)); }
        if (u >= 1) fill += 1 / 7;
      });
      bowl.visible = gAt != null && !!fl; riceM.color.copy(mixC(0x20222c, 0xfff7e6, fill));
      (bglow.material as THREE.SpriteMaterial).opacity = fill * 0.85; bglow.scale.setScalar(0.8 + fill * 2.0 + (fill > 0 ? Math.sin(T * 3) * 0.08 : 0));
      const bowAt: number = pr.bowAt ?? 1e9; const bowed = T >= bowAt;
      whale.shade(x.pal.sprite).play(bowed ? "bow" : pr.act || "idle", bowed ? bowAt : 0); whale.update(T, x.cam);
      dust.update(T, 0.15); fireflies.pts.visible = !!fl; fireflies.update(T, 0.25, 0.5);
      bulb.scale.setScalar(3.4 + Math.sin(T * 13) * 0.05 + Math.sin(T * 31) * 0.04); cone.material.opacity = 0.11;
    },
  };
}
