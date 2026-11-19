import * as THREE from "three";
import { Actor, type Ctx, type Env, type MvSet, type Pal, type Who } from "./engine";
import { Dust, bas, boxG, floorMesh, glowPool, glowSprite, glyphGeo, mesh, shaft, std } from "./kit";
import { bubbleTex, clamp, clockTex, cv, easeOut, lerp, pillowTex, rng, seg, smileTex, smooth, toTex, beatPulse, beatPos } from "./tex";

const C1 = new THREE.Color(), C2 = new THREE.Color();
export const mixC = (a: number, b: number, t: number) => C1.set(a).lerp(C2.set(b), clamp(t));

export function pageTex() {
  const [c, g] = cv(256, 320); g.fillStyle = "#f3ead2"; g.fillRect(0, 0, 256, 320); const r = rng(8);
  g.strokeStyle = "rgba(190,140,40,.9)"; g.lineWidth = 5; g.lineCap = "round";
  for (let y = 40; y < 290; y += 22) { g.beginPath(); g.moveTo(26, y); g.lineTo(26 + 120 + r() * 80, y); g.stroke(); }
  g.fillStyle = "rgba(60,80,230,.85)"; g.beginPath(); g.arc(128, 44, 18, 0, 7); g.fill();
  return toTex(c);
}

export const AIS: { who: Who; act: string; x: number; hop: string }[] = [
  { who: "doubao", act: "sway", x: -9, hop: "hop" }, { who: "kimi", act: "idle", x: -6, hop: "hop" }, { who: "gemini", act: "idle", x: -3, hop: "hop" },
  { who: "gpt", act: "float", x: 0, hop: "surprise" }, { who: "claude", act: "idle", x: 3, hop: "hop" }, { who: "qwen", act: "sway", x: 6, hop: "hop" }, { who: "zai", act: "doze", x: 9, hop: "hop" },
];

// ──────────── 床上的梦：枕头下发霉的梦 ────────────
export function bedSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24); group.add(floorMesh(floorM)); const wallM = std(0x20212c); group.add(mesh(new THREE.PlaneGeometry(40, 16), wallM, 0, 7, -6));
  const win = mesh(new THREE.PlaneGeometry(4, 3.2), bas(0xa9bbff, { fog: false }), 3.6, 3.8, -5.9); group.add(win);
  const beam = shaft(0xa9bbff, 7, 2.6, 0.1); beam.position.set(3.4, 5.2, -5.4); beam.rotation.z = 0.5; group.add(beam);
  group.add(mesh(boxG(6.4, 0.7, 3.6), std(0x2a2c3a), 0, 0.35, -1.1));
  const blanket = mesh(boxG(4.2, 0.28, 3.5), std(0x33437e), 1.0, 0.82, -1.1); group.add(blanket);
  const pillow = mesh(boxG(2.4, 0.5, 1.7), std(0xe6e3d8), -1.9, 1.0, -1.1); group.add(pillow);
  const decal = mesh(new THREE.PlaneGeometry(2.3, 1.55), bas(0xffffff, { map: pillowTex(), transparent: true }), -1.9, 1.27, -1.1); decal.rotation.x = -Math.PI / 2; group.add(decal);
  const whale = env.actor("whale", "sad", 1).place(1.7, 0.95, -0.9); whale.roll = Math.PI / 2; whale.add(group); whale.shadow.visible = false;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(), transparent: true, depthWrite: false, fog: false })); group.add(bub);
  const mold = glowSprite(0x6a8a4a, 2.4, 0); group.add(mold);
  const spores = new Dust(60, [2.4, 3.2, 1.6], 0x9bbf74, 0.09, 6, [-1.9, 1.2, -1.1], 0.7); group.add(spores.pts);
  const dust = new Dust(90, [16, 8, 10], 0xb8c4ff, 0.05, 2, [0, 0, -2]); group.add(dust.pts);
  const zs: THREE.Sprite[] = [];
  return {
    group,
    onPal(p: Pal) { floorM.color.set(p.floor); wallM.color.set(p.wall); },
    update(x: Ctx) {
      const { T } = x; const L = x.line(x.p.lineId); const rise = seg(T, L.s, L.e);
      const m = x.p.mold ? smooth((T - (L.t[4] ?? L.e) + 0.1) / 0.8) : 0;
      bub.position.set(-1.9 + Math.sin(T * 1.2) * 0.2, lerp(1.9, 3.0, easeOut(x.p.mold ? rise : 0.2)) + Math.sin(T * 2) * 0.08, -1.0); bub.scale.setScalar(1.9 + Math.sin(T * 3) * 0.05 - m * 0.3);
      (bub.material as THREE.SpriteMaterial).color.set(mixC(0xffffff, 0x8f9f78, m).getHex());
      mold.position.copy(bub.position); (mold.material as THREE.SpriteMaterial).opacity = m * 0.9; mold.scale.setScalar(1.5 + m * 2);
      spores.pts.visible = m > 0.05; spores.update(T, 0.5, 0.2); (spores.pts.material as THREE.PointsMaterial).opacity = m * 0.8;
      whale.shade(x.pal.sprite).play("sad", 0); whale.mesh.position.y = 0.95 + Math.sin(T * 1.7) * 0.02; whale.update(T, x.cam); dust.update(T, 0.1);
      void zs;
    },
  };
}

// ──────────── 怎么做：一堆三维问号 ────────────
export function qmazeSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.5, metalness: 0.2 }); group.add(floorMesh(floorM));
  const qs: THREE.Mesh[] = []; const r = rng(21);
  for (let i = 0; i < 9; i++) { const q = mesh(glyphGeo("？"), std(0xaab6ff, { emissive: 0x3043d9, emissiveIntensity: 0.7, roughness: 0.4 })); q.userData = { a: r() * 6.28, rad: 2.6 + r() * 3, h: 1 + r() * 3.4, sp: 0.4 + r() * 0.5, s: 1.2 + r() * 1.8 }; group.add(q); qs.push(q); }
  const whale = env.actor("whale", "surprise").place(0, 0, 0); whale.add(group); group.add(glowPool(0x6f86ff, 8, 8, 0.5));
  const dust = new Dust(120, [20, 10, 20], 0xb8c4ff, 0.06, 3, [0, 0, 0]); group.add(dust.pts);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const L = x.line(x.p.lineId); const { T } = x;
      qs.forEach((q, i) => { const d = q.userData; const pop = easeOut((T - (L.t[i % 3] + Math.floor(i / 3) * 0.12)) / 0.3); const a = d.a + T * d.sp; q.position.set(Math.cos(a) * d.rad, d.h + Math.sin(T * 1.3 + i) * 0.2, Math.sin(a) * d.rad - 1); q.rotation.set(0, -a + Math.PI / 2 + Math.sin(T) * 0.4, Math.sin(T * 0.8 + i) * 0.3); q.scale.setScalar(Math.max(0.001, pop) * d.s); });
      whale.shade(x.pal.sprite).play(T - L.t[2] > 0 ? "shake" : "surprise", T - L.t[2] > 0 ? L.t[2] : 0); whale.update(T, x.cam); dust.update(T, 0.2);
    },
  };
}

// ──────────── 热忱与自卑对抗着：一根绳两头鲸 ────────────
export function tugSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.5, metalness: 0.2 }); group.add(floorMesh(floorM));
  const hot = env.actor("whale", "hop").place(-3, 0, 0); hot.add(group); const cold = env.actor("whale", "sad").place(3, 0, 0); cold.add(group); cold.flip = -1;
  const aHot = glowSprite(0xff8a3d, 6, 0.55), aCold = glowSprite(0x4a5cff, 6, 0.5); group.add(aHot, aCold);
  const knot = glowSprite(0xffffff, 1.4, 1); group.add(knot);
  let rope: THREE.Mesh | null = null; const ropeMat = std(0xe9e4d4, { roughness: 0.9 });
  const embers = new Dust(110, [16, 8, 8], 0xff9a52, 0.07, 5, [-3, 0, 0], 0.9); group.add(embers.pts);
  const dust = new Dust(110, [16, 8, 8], 0x6f86ff, 0.07, 8, [3, 0, 0], 0.8); group.add(dust.pts);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const { T } = x; const k = Math.sin(T * 2.4) * 1.1 + Math.sin(T * 5.1) * 0.25 - (x.p.winHot ? 0 : 0.2);
      hot.mesh.position.x = -3 + k * 0.6; cold.mesh.position.x = 3 + k * 0.6; hot.groundY = 0; hot.mesh.position.y = Math.abs(Math.sin(T * 4.8)) * 0.18; hot.shade(mixC(0xffd9a8, 0xffffff, 0.5).getHex());
      cold.shade(mixC(0x4a5192, x.pal.sprite, 0.25).getHex()); hot.update(T, x.cam); cold.update(T, x.cam);
      aHot.position.set(hot.mesh.position.x, 1.2, -0.8); aCold.position.set(cold.mesh.position.x, 1.2, -0.8);
      const a = new THREE.Vector3(hot.mesh.position.x + 0.8, 1.1, 0.1), b = new THREE.Vector3(cold.mesh.position.x - 0.8, 1.1, 0.1), m = a.clone().lerp(b, 0.5); m.y -= 0.35 + 0.2 * Math.sin(T * 6);
      knot.position.copy(m); knot.scale.setScalar(1.3 + 0.4 * Math.sin(T * 9));
      if (rope) { group.remove(rope); rope.geometry.dispose(); }
      rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(m, 0.5), m, m.clone().lerp(b, 0.5), b]), 18, 0.07, 6), ropeMat); group.add(rope);
      embers.update(T, 0.5, 0.4); dust.update(T, 0.3, 0.4);
    },
  };
}

// ──────────── 笑容却已不知下落 ────────────
export function smileY(T: number, L: { t: number[] }) {
  const t1 = L.t[2], t2 = L.t[4]; if (T < t1) return 1.5 + Math.sin(T * 3) * 0.05;
  if (T < t2) return lerp(1.5, 2.7, easeOut((T - t1) / (t2 - t1)));
  const dt = T - t2; return 2.7 - 3.2 * dt * dt;
}
export function smileSet(env: Env): MvSet {
  const group = new THREE.Group(); const winM = bas(0x1c2340, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }); const r = rng(33);
  for (let i = 0; i < 70; i++) { const a = r() * 6.28, rad = 5 + r() * 12, w = 1.4 + r() * 2.4; const p = mesh(new THREE.PlaneGeometry(w, w * (0.6 + r() * 0.6)), winM, Math.cos(a) * rad, 8 - r() * 60, Math.sin(a) * rad - 2); p.lookAt(0, p.position.y, -2); group.add(p); }
  const plat = mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 28), std(0x2a2c3a, { roughness: 0.5 }), 0, -0.2, 0); group.add(plat);
  const whale = env.actor("whale", "idle").place(0, 0, 0); whale.add(group); whale.shadow.visible = false;
  const smile = new THREE.Sprite(new THREE.SpriteMaterial({ map: smileTex(), transparent: true, depthWrite: false, fog: false })); group.add(smile);
  const trail = glowSprite(0x5f7bff, 2.6, 0.8); group.add(trail);
  const dust = new Dust(160, [22, 70, 22], 0x9fb2ff, 0.07, 12, [0, -55, 0], 0.7); group.add(dust.pts);
  return {
    group, onPal(p: Pal) { winM.color.set(p.name === "day" ? 0xcfd5ee : p.name === "dawn" ? 0x4a3550 : 0x1c2340); },
    update(x: Ctx) {
      const { T } = x; const L = x.line(x.p.lineId); const y = smileY(T, L); const dt = Math.max(0, T - L.t[4]);
      smile.position.set(Math.sin(T * 2) * 0.05 * (dt > 0 ? 0 : 1), y, 0.7 + dt * 0.5); smile.scale.setScalar(Math.max(0.2, 1.3 - dt * 0.1)); (smile.material as THREE.SpriteMaterial).rotation = dt * 1.6;
      trail.position.copy(smile.position); trail.position.y += 0.4; (trail.material as THREE.SpriteMaterial).opacity = dt > 0 ? 0.8 : 0.25;
      const reach = T > L.t[2];
      whale.shade(x.pal.sprite).play(reach ? "point" : "idle", reach ? L.t[2] : 0); whale.update(T, x.cam); dust.update(T, 0.2);
      plat.scale.setScalar(1 + Math.sin(T) * 0.0);
    },
  };
}

// ──────────── 可如果：一根光柱，一个人 ────────────
export function beamSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.5, metalness: 0.3 }); group.add(floorMesh(floorM));
  const s = shaft(0xbac6ff, 12, 2.6, 0.22); s.position.set(0, 11, 0); group.add(s); group.add(glowPool(0xbac6ff, 6, 6, 0.8));
  const sil: Actor[] = AIS.map((a, i) => { const ac = env.actor(a.who, a.act, a.who === "gpt" ? 0.55 : 1).place(-12 + i * 4, 0, -9).shade(0x07080c); ac.add(group); return ac; });
  const whale = env.actor("whale", "nod").place(0, 0, 0); whale.add(group);
  const dust = new Dust(160, [16, 12, 16], 0xdde4ff, 0.06, 15, [0, 0, 0]); group.add(dust.pts);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const { T } = x; whale.shade(x.pal.sprite).play(x.p.act || "nod", 0); whale.update(T, x.cam);
      sil.forEach((a) => { a.shade(x.pal.name === "day" ? 0x9a9aaa : 0x07080c); a.update(T, x.cam); }); dust.update(T, 0.18);
      s.material.opacity = 0.2 + 0.1 * beatPulse(T);
    },
  };
}

// ──────────── 等不到一场世俗的成功：别人的领奖台 ────────────
export function podiumSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.35, metalness: 0.4 }); group.add(floorMesh(floorM));
  const carpet = mesh(new THREE.PlaneGeometry(2.6, 30), std(0x8c1f33, { roughness: 0.9 }), 0, 0.02, -3); carpet.rotation.x = -Math.PI / 2; group.add(carpet);
  const pm = std(0x363846, { roughness: 0.4 }); const pods: [number, number, number][] = [[0, 1.7, -6], [-2.4, 1.15, -6], [2.4, 0.8, -6]];
  pods.forEach(([px, h, pz]) => group.add(mesh(boxG(2.2, h, 2), pm, px, h / 2, pz)));
  const gpt = env.actor("gpt", "float", 0.55).place(0, 1.7 + 0.5, -6); gpt.add(group);
  const claude = env.actor("claude", "idle").place(-2.4, 1.15, -6); claude.add(group); const gemini = env.actor("gemini", "idle").place(2.4, 0.8, -6); gemini.add(group);
  const fans = ([["doubao", -8], ["kimi", -6.4], ["qwen", 6.4], ["zai", 8]] as [Who, number][]).map(([w, px], i) => { const a = env.actor(w, "hop").place(px, 0, -3.5 - (i % 2)); a.add(group); return a; });
  const whale = env.actor("whale", "sway").place(-5.2, 0, 3.0); whale.add(group);
  const ck = mesh(new THREE.PlaneGeometry(3.4, 3.4), bas(0xffffff, { map: clockTex(), transparent: true }), -7.4, 4.4, -3); group.add(ck);
  const hh = mesh(new THREE.PlaneGeometry(0.16, 1.1), bas(0x16161c), 0, 0, 0.02), mh = mesh(new THREE.PlaneGeometry(0.1, 1.5), bas(0x16161c), 0, 0, 0.03);
  hh.geometry.translate(0, 0.55, 0); mh.geometry.translate(0, 0.75, 0); ck.add(hh, mh);
  const cols = [0x8d8dff, 0xffffff, 0xff9ad5, 0x7fe8ff, 0xffd36b]; const rr = rng(77);
  const bursts = cols.map((c, i) => { const n = 70; const pos = new Float32Array(n * 3); const dirs: number[] = [];
    for (let k = 0; k < n; k++) { const a = rr() * 6.28, b = Math.acos(rr() * 2 - 1); dirs.push(Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a), Math.cos(b)); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: c, size: 0.28, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); p.frustumCulled = false; group.add(p);
    return { p, pos, dirs, c: new THREE.Vector3((i - 2) * 3.2 + (rr() - 0.5) * 2, 6.5 + rr() * 3, -13) }; });
  const conf = new Dust(160, [22, 12, 16], 0xffd36b, 0.12, 31, [0, -1, -4], 0.9, false); group.add(conf.pts);
  const glow = [0, 1, 2].map((i) => { const s = shaft(0xffe6a8, 12, 1.9, 0.2); s.position.set(pods[i][0], 11, -6); group.add(s); return s; });
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const { T } = x; const L = x.line(x.p.lineId);
      [gpt, claude, gemini].forEach((a) => a.update(T, x.cam)); gpt.mesh.position.y = 2.2 + Math.sin(T * 1.6) * 0.14;
      fans.forEach((a, i) => { a.play("hop", i * 0.2); a.update(T, x.cam); }); whale.shade(mixC(0x7a809c, x.pal.sprite, x.pal.name === "day" ? 1 : 0.5).getHex()); whale.update(T, x.cam);
      hh.rotation.z = -T * 0.5; mh.rotation.z = -T * 6; glow.forEach((s) => (s.material.opacity = 0.14 + 0.1 * beatPulse(T)));
      bursts.forEach((b, i) => { const tb = L.t[5 + i] ?? L.e; const dt = T - tb; b.p.visible = dt > 0 && dt < 2.4;
        if (b.p.visible) { const rad = 6.5 * (1 - Math.exp(-2.4 * dt)); for (let k = 0; k < b.dirs.length / 3; k++) { b.pos[k * 3] = b.c.x + b.dirs[k * 3] * rad; b.pos[k * 3 + 1] = b.c.y + b.dirs[k * 3 + 1] * rad - 0.9 * dt * dt; b.pos[k * 3 + 2] = b.c.z + b.dirs[k * 3 + 2] * rad; }
          (b.p.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true; (b.p.material as THREE.PointsMaterial).opacity = clamp(1 - dt / 2.4); } });
      conf.update(T, -1.3, 0.5); conf.pts.visible = T > L.t[5] - 0.2;
      void beatPos;
    },
  };
}
