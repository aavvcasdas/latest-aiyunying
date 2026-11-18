import * as THREE from "three";
import { Actor, type Ctx, type Env, type MvSet, type Pal, type Who } from "./engine";
import { Dust, bas, boxG, floorMesh, glowPool, glowSprite, makeFlower, mesh, shaft, std } from "./kit";
import { beatPos, clamp, clockTex, concreteTex, crackTex, easeIn, easeOut, lerp, nameTex, paperTex, personTex, popupTex, rng, scribbleTex, seg, smooth, stampTex } from "./tex";
import { AIS, mixC } from "./setsA";

// ──────────── 人群：万众瞩目 / 茫茫人世 ────────────
export function crowdSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x14151c, { roughness: 0.7 }); group.add(floorMesh(floorM, 200)); const fg = glowPool(0x8f9fff, 40, 30, 0.35); fg.position.set(0, 0.03, -6); group.add(fg);
  const stage = new THREE.Group(); group.add(stage);
  stage.add(mesh(new THREE.PlaneGeometry(26, 9), bas(0xaab4e8, { fog: false }), 0, 4.6, -17.5)); const sg = glowSprite(0x8f9fff, 22, 0.45); sg.position.set(0, 4.5, -17); stage.add(sg);
  stage.add(mesh(boxG(18, 1.2, 5.5), std(0x2b2d3a), 0, 0.6, -14.8));
  const gpt = env.actor("gpt", "float", 0.6).place(0, 1.9, -14.5); gpt.add(stage); const cl = env.actor("claude", "idle").place(-4, 1.2, -14.5), ge = env.actor("gemini", "idle").place(4, 1.2, -14.5); cl.add(stage); ge.add(stage);
  const spotPool = glowPool(0xffffff, 7, 7, 0.95); spotPool.position.y = 1.25; spotPool.position.z = -14.5; stage.add(spotPool);
  const spotShaft = shaft(0xffffff, 13, 2.4, 0.28); stage.add(spotShaft);
  const N = 440; const r = rng(55); const pg = new THREE.PlaneGeometry(1.2, 1.8); pg.translate(0, 0.9, 0);
  const mk = (arms: number) => { const m = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ map: personTex(arms), transparent: true, alphaTest: 0.3, color: 0x000000 }), N); m.frustumCulled = false; group.add(m); return m; };
  const down = mk(0), up = mk(1);
  const P = Array.from({ length: N }, (_, i) => { const row = Math.floor(i / 22); return { rx: (i % 22 - 10.5) * 1.15 + (r() - 0.5) * 0.6, rz: 5.8 - Math.floor(row % 7) * 1.25 + r() * 0.5, vx: (r() - 0.5) * 90, vz: 7 - Math.pow(r(), 1.3) * 96, sc: 0.95 + r() * 0.25, arms: r() > 0.45, ph: r() * 6.28 }; });
  const stars = new Dust(380, [140, 36, 140], 0xffffff, 0.16, 71, [0, 6, -40], 0.9); group.add(stars.pts);
  const whale = env.actor("whale", "idle").place(-2.6, 0, 3.7); whale.add(group); const o = new THREE.Object3D();
  return {
    group, onPal(p: Pal) { floorM.color.set(p.name === "day" ? 0xcfcfd2 : 0x14151c); },
    update(x: Ctx) {
      const { T } = x; fg.visible = !x.p.vast; const vast = !!x.p.vast; const L = x.line(x.p.lineId); const n = vast ? N : 132;
      stage.visible = !vast; stars.pts.visible = vast; if (vast) stars.update(T, 0, 0.1);
      const lock = L.t[7] ?? L.e; const cx = T < lock ? Math.sin(T * 2.2) * 7 : lerp(Math.sin(lock * 2.2) * 7, 0, easeOut((T - lock) / 0.35));
      spotPool.position.x = cx; spotShaft.position.set(cx, 12, -14.5); const lk = T >= lock;
      spotShaft.material.opacity = lk ? 0.34 : 0.22; gpt.update(T, x.cam); cl.update(T, x.cam); ge.update(T, x.cam);
      gpt.shade(mixC(0x555a70, 0xffffff, lk ? 1 : 0.2).getHex()); gpt.mesh.position.y = 1.9 + Math.sin(T * 1.6) * 0.12;
      for (let i = 0; i < N; i++) {
        const p = P[i]; const on = i < n; const px = vast ? p.vx : p.rx, pz = vast ? p.vz : p.rz;
        const near = Math.hypot(px + 2.6, pz - 3.7) < 1.2;
        const bob = Math.abs(Math.sin(T * 3.2 + p.ph)) * (p.arms ? 0.14 : 0.04); const s = on && !near ? p.sc : 0;
        o.position.set(px, bob, pz); o.scale.set(s * (vast ? 1.1 : 1), s * (vast ? 1.1 : 1), 1); o.rotation.set(0, 0, Math.sin(T * 2 + p.ph) * 0.03); o.updateMatrix();
        (p.arms && !vast ? up : down).setMatrixAt(i, o.matrix); o.scale.setScalar(0); o.updateMatrix(); (p.arms && !vast ? down : up).setMatrixAt(i, o.matrix);
      }
      down.instanceMatrix.needsUpdate = true; up.instanceMatrix.needsUpdate = true;
      whale.shade(x.pal.name === "day" ? 0xffffff : 0xffffff).play("idle", 0); whale.k = vast ? 0.75 : 1; whale.place(vast ? 0 : -2.6, 0, vast ? 6.2 : 3.7); whale.update(T, x.cam);
    },
  };
}

// ──────────── 某个角落：灯泡、椅子、一道裂缝里的小花 ────────────
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
  const crowd: Actor[] = AIS.map((a, i) => { const ac = env.actor(a.who, a.act, a.who === "gpt" ? 0.55 : 1).place(0, 0, -3); ac.add(group); void i; return ac; });
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
      const gather = pr.gather ? L.s : -1;
      crowd.forEach((a, k) => {
        if (gather < 0) { a.show(false); return; } a.show(true);
        const fx = -2.2 + (k - 3) * 1.45, fz = -3.9 - Math.abs(k - 3) * 0.15; const sx = (k < 3 ? -1 : 1) * (14 + k), sz = -2;
        const q = easeOut(seg(T, gather + k * 0.22, gather + k * 0.22 + 2.4)); const moving = q > 0 && q < 0.98;
        a.mesh.position.set(lerp(sx, fx, q), (moving ? Math.abs(Math.sin(T * 9 + k)) * 0.25 : 0) + (AIS[k].who === "gpt" ? 0.7 : 0), lerp(sz, fz, q)); a.groundY = 0; a.flip = k < 3 ? 1 : -1;
        a.play(moving ? (AIS[k].who === "gpt" ? "float" : "hop") : AIS[k].act, 0); a.shade(x.pal.sprite); a.update(T, x.cam);
      });
      whale.shade(x.pal.sprite).play(pr.act || "idle", 0); whale.update(T, x.cam);
      dust.update(T, 0.15); fireflies.pts.visible = !!fl; fireflies.update(T, 0.25, 0.5);
      bulb.scale.setScalar(3.4 + Math.sin(T * 13) * 0.05 + Math.sin(T * 31) * 0.04); cone.material.opacity = 0.11;
    },
  };
}

// ──────────── 饭盆：耗尽 / 倾注 ────────────
export function bowlSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.5, metalness: 0.3 }); group.add(floorMesh(floorM));
  const whale = env.actor("whale", "eat", 1.15).place(0, 0, 0); whale.add(group);
  const bowl = new THREE.Group(); group.add(bowl); const bm = std(0x4d6bfe, { roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide, emissive: 0x1c2a8a, emissiveIntensity: 0.5 });
  bowl.add(mesh(new THREE.SphereGeometry(0.8, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bm)); const rim = mesh(new THREE.TorusGeometry(0.8, 0.045, 8, 36), std(0xffffff)); rim.rotation.x = Math.PI / 2; bowl.add(rim);
  const riceInBowl = mesh(new THREE.CircleGeometry(0.74, 24), bas(0xfff7e6), 0, -0.02, 0); riceInBowl.rotation.x = -Math.PI / 2; bowl.add(riceInBowl);
  const n = 140; const pos = new Float32Array(n * 3); const ph = Array.from({ length: n }, (_, i) => ((i * 0.6180339) % 1));
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const rice = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0xfff3d0, size: 0.1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); rice.frustumCulled = false; group.add(rice);
  const book = new THREE.Group(); book.position.set(1.4, 0, 1.2); group.add(book);
  const bk = std(0xdce4ff, { emissive: 0x7f94ff, emissiveIntensity: 1.1, roughness: 0.5 });
  const b1 = mesh(boxG(1.1, 0.05, 1.5), bk, -0.55, 0.12, 0), b2 = mesh(boxG(1.1, 0.05, 1.5), bk, 0.55, 0.12, 0); b1.rotation.z = 0.12; b2.rotation.z = -0.12; book.add(b1, b2);
  const bg = glowSprite(0x7f94ff, 5, 0.9); bg.position.y = 0.6; book.add(bg); const bsh = shaft(0x7f94ff, 6, 1.2, 0.2); bsh.rotation.x = Math.PI; bsh.position.set(0, 6, 0); book.add(bsh);
  const dust = new Dust(110, [12, 8, 8], 0xdde4ff, 0.05, 25, [0, 0, 0]); group.add(dust.pts);
  const rr = rng(41); const vx = Array.from({ length: n }, () => (rr() - 0.5) * 0.5);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const { T } = x; const [t0, t1] = x.p.tilt as [number, number]; const tilt = easeOut(seg(T, t0, t1));
      bowl.position.set(1.5, 1.15 + tilt * 0.1, 0.9); bowl.rotation.z = tilt * 2.1; bowl.rotation.y = 0.2;
      const flow = clamp(tilt * 3); rice.visible = flow > 0.02; (rice.material as THREE.PointsMaterial).opacity = flow;
      const ex = 0.95, ey = 1.5; for (let i = 0; i < n; i++) { const dt = (((T * 1.0 + ph[i] * 1.3) % 1.3) + 1.3) % 1.3; pos[i * 3] = ex + vx[i] * dt - dt * 0.35; pos[i * 3 + 1] = Math.max(0.05, ey - 4.2 * dt * dt); pos[i * 3 + 2] = 1.0 + vx[i] * 0.4; }
      (rg.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      riceInBowl.visible = tilt < 0.6; book.visible = !!x.p.book; (bg.material as THREE.SpriteMaterial).opacity = 0.5 + 0.4 * flow; book.position.x = 0.7; rice.position.x = -0.0; bowl.position.x = 1.0 + (x.p.book ? 0.4 : 0.5);
      whale.shade(x.pal.sprite).play(x.p.act || "eat", 0); whale.update(T, x.cam); dust.update(T, 0.2);
    },
  };
}

// ──────────── 碎裂：地砖飞散，闪白，稿纸如雪 ────────────
export function shatterSet(env: Env): MvSet {
  const group = new THREE.Group(); const tiles = new THREE.InstancedMesh(boxG(1, 0.14, 1), std(0x3a3b46, { roughness: 0.7 }), 15 * 10); group.add(tiles);
  const rr = rng(88); const TL = Array.from({ length: 150 }, (_, i) => { const gx = i % 15, gz = Math.floor(i / 15); const x = (gx - 7) * 1.0, z = (gz - 6) * 1.0; const d = Math.hypot(x, z);
    return { x, z, vx: x * 0.7 + (rr() - 0.5) * 2, vy: 3 + rr() * 6 + Math.max(0, 8 - d) * 0.5, vz: z * 0.7 + (rr() - 0.5) * 2, rx: (rr() - 0.5) * 5, rz: (rr() - 0.5) * 5, delay: d * 0.03 }; });
  const crack = mesh(new THREE.PlaneGeometry(14, 14), bas(0xffffff, { map: crackTex(), color: 0xbfc9ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.12, 0); crack.rotation.x = -Math.PI / 2; group.add(crack);
  const flower = makeFlower(); group.add(flower.group); flower.group.position.set(-0.6, 0.07, -0.2);
  const whale = env.actor("whale", "shiver").place(0.6, 0.07, 0.2); whale.add(group);
  const sheets = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshBasicMaterial({ map: scribbleTex(2), side: THREE.DoubleSide, color: 0xa8adc4 }), 80); group.add(sheets);
  const sp = Array.from({ length: 80 }, () => ({ x: (rr() - 0.5) * 18, z: (rr() - 0.5) * 9 - 1, ph: rr(), sp: 0.4 + rr() * 0.4, rx: rr() * 6, ry: rr() * 6, s: 0.7 + rr() * 0.8 }));
  const dust = new Dust(140, [18, 10, 14], 0xdde4ff, 0.05, 29, [0, -2, 0]); group.add(dust.pts); const o = new THREE.Object3D();
  const sf = glowSprite(0xdfe6ff, 9, 0); sf.position.set(0, 1.6, -1); group.add(sf);
  return {
    group,
    update(x: Ctx) {
      const { T } = x; const T0 = 28.3, TB = 29.2, TF = 30.13; const void_ = T >= TF;
      crack.visible = !void_; crack.scale.setScalar(0.12 + 1.0 * easeOut(seg(T, T0, TB))); (crack.material as THREE.MeshBasicMaterial).opacity = T < TB ? 1 : clamp(1 - (T - TB) / 0.8);
      tiles.visible = !void_;
      for (let i = 0; i < 150; i++) { const t = TL[i]; const dt = Math.max(0, T - TB - t.delay); o.position.set(t.x + t.vx * dt, 0 + t.vy * dt - 7 * dt * dt, t.z + t.vz * dt); o.rotation.set(t.rx * dt, 0, t.rz * dt); o.scale.setScalar(dt > 0 ? Math.max(0, 1 - dt * 0.2) : 1); o.updateMatrix(); tiles.setMatrixAt(i, o.matrix); }
      tiles.instanceMatrix.needsUpdate = true;
      const shake = T > TB - 0.9 && T < TF ? Math.sin(T * 70) * 0.03 : 0; flower.group.position.x = -0.6 + shake; flower.set(1, 1, T); flower.group.visible = true;
      if (void_) { flower.group.position.set(0.5, 0.5 + Math.sin(T * 1.2) * 0.1, 0.8); flower.group.scale.setScalar(0.55); } else flower.group.scale.setScalar(1);
      whale.play(void_ ? "sad" : T > TB ? "surprise" : "shiver", 0); whale.mesh.position.y = void_ ? 0.4 + Math.sin(T * 1.2) * 0.12 : 0.07; whale.mesh.position.x = void_ ? -0.4 : 0.6; whale.shadow.visible = !void_; whale.shade(x.pal.sprite); whale.update(T, x.cam);
      sheets.visible = void_; if (void_) { const u = T - TF; for (let i = 0; i < 80; i++) { const s = sp[i]; const y = 9 - ((((s.ph * 14 + T * s.sp * 1.3) % 14) + 14) % 14); o.position.set(s.x + Math.sin(T * 0.7 + s.rx) * 0.8, y, s.z + Math.cos(T * 0.5 + s.ry) * 0.8); o.rotation.set(T * 0.6 * s.sp + s.rx, T * 0.9 * s.sp + s.ry, 0); o.scale.setScalar(s.s * smooth(u / 1.2)); o.updateMatrix(); sheets.setMatrixAt(i, o.matrix); } sheets.instanceMatrix.needsUpdate = true; }
      (sf.material as THREE.SpriteMaterial).opacity = void_ ? 0.35 : 0; dust.update(T, 0.3);
    },
  };
}

// ──────────── 书桌：一张张涂破的稿纸 ────────────
export function deskSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x2a2420, { roughness: 0.8 }); group.add(floorMesh(floorM, 60)); const wallM = std(0x24212c); group.add(mesh(new THREE.PlaneGeometry(40, 16), wallM, 0, 7, -5.2));
  const win = mesh(new THREE.PlaneGeometry(6, 4.4), bas(0x101a44, { fog: false }), 0, 4.6, -5.1); group.add(win);
  const disc = glowSprite(0xdfe6ff, 2.2, 1); disc.position.z = -5.0; group.add(disc);
  const wood = std(0x5a4636, { roughness: 0.7 }); group.add(mesh(boxG(7.4, 0.2, 2.6), wood, 0, 1.05, -1.2));
  [[-3.4, -2.3], [3.4, -2.3], [-3.4, -0.1], [3.4, -0.1]].forEach(([a, b]) => group.add(mesh(boxG(0.2, 1, 0.2), wood, a, 0.5, b)));
  const whale = env.actor("whale", "nod", 1.1).place(0, 0, -2.4); whale.add(group);
  const stackG = boxG(1.5, 0.05, 2); const stackM = std(0xb9b5a8, { roughness: 1 }); const stackL = new THREE.InstancedMesh(stackG, stackM, 60), stackR = new THREE.InstancedMesh(stackG, stackM, 60); group.add(stackL, stackR);
  const lampBase = mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.12, 14), std(0x222233), 2.5, 1.2, -1.6); group.add(lampBase);
  const lampArm = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), std(0x222233), 2.5, 2.1, -1.6); group.add(lampArm);
  const lampHead = mesh(new THREE.ConeGeometry(0.55, 0.6, 14, 1, true), std(0x2c3d9a, { side: THREE.DoubleSide }), 2.0, 3.1, -1.5); lampHead.rotation.z = 0.5; group.add(lampHead);
  const lsh = shaft(0xffd8a0, 3.4, 1.7, 0.2); lsh.position.set(1.9, 3.0, -1.5); group.add(lsh); const lg = glowSprite(0xffd8a0, 3, 0.9); lg.position.set(1.9, 2.9, -1.5); group.add(lg);
  const lamp = new THREE.PointLight(0xffd29a, 26, 12, 1.6); lamp.position.set(1.9, 2.8, -0.8); group.add(lamp);
  const flyM = new THREE.MeshBasicMaterial({ map: scribbleTex(5), side: THREE.DoubleSide, transparent: true, color: 0xb0aca0 }); const flies = Array.from({ length: 16 }, () => { const m = mesh(new THREE.PlaneGeometry(0.9, 1.2), flyM); m.visible = false; group.add(m); return m; });
  const plate = mesh(new THREE.PlaneGeometry(1.7, 0.64), bas(0x9a9a9a, { map: nameTex("小鱼") }), 0.1, 1.4, -0.4); plate.rotation.x = -0.35; plate.visible = false; group.add(plate);
  const o = new THREE.Object3D(); const rr = rng(63); const jit = Array.from({ length: 60 }, () => [(rr() - 0.5) * 0.2, (rr() - 0.5) * 0.2, (rr() - 0.5) * 0.3]);
  const dust = new Dust(100, [12, 8, 8], 0xffe6c0, 0.05, 33, [0, 0, -1], 0.7); group.add(dust.pts); const vel = Array.from({ length: 16 }, (_, j) => [((j % 2) ? 1 : -1) * (1.2 + rr() * 1.6), 4.5 + rr() * 2.5, 0.8 + rr() * 1.2]);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.name === "dawn" ? 0x3a2f2a : 0x2a2420); wallM.color.set(p.wall); },
    update(x: Ctx) {
      const { T } = x; const pr = x.p; const L = pr.lineId ? x.line(pr.lineId) : null;
      // 稿纸堆
      const lapse = !!pr.lapse; const beats = lapse ? Math.max(0, Math.floor(beatPos(T) - beatPos(pr.lapse))) : 0; const nL = lapse ? Math.min(60, 8 + beats * 2) : 22, nR = lapse ? Math.min(60, 10 + beats * 3) : 30;
      stackL.count = nL; stackR.count = nR;
      for (let i = 0; i < 60; i++) { const j = jit[i]; o.position.set(-2.6 + j[0], 1.17 + i * 0.05, -1.0 + j[1]); o.rotation.set(0, j[2], 0); o.updateMatrix(); stackL.setMatrixAt(i, o.matrix); o.position.set(2.7 + j[1], 1.17 + i * 0.05, -0.4 + j[0]); o.rotation.set(0, -j[2], 0); o.updateMatrix(); stackR.setMatrixAt(i, o.matrix); }
      stackL.instanceMatrix.needsUpdate = true; stackR.instanceMatrix.needsUpdate = true;
      // 飞出的稿纸
      let launches: number[] = []; if (lapse) { const k0 = Math.floor(beatPos(pr.lapse)); for (let k = 0; k < 40; k++) launches.push(15.45 + (k0 + k) * 0.8108); } else if (L) launches = L.t;
      flies.forEach((m, j) => { let best = -1; for (let i = j; i < launches.length; i += 16) if (launches[i] <= T) best = launches[i]; const u = T - best; m.visible = best >= 0 && u < 2.6; if (!m.visible) return;
        const v = vel[j]; m.position.set((j % 2 ? 2.7 : -2.6) + v[0] * u * 0.7, 1.4 + v[1] * u - 3.2 * u * u, -0.8 + v[2] * u * 0.5); m.rotation.set(u * 3 + j, u * 2, u * 4); m.scale.setScalar(1 + 0.1 * Math.sin(u * 20)); });
      // 窗外：日月
      const a = lapse ? ((T - pr.lapse) / 3.2433) * Math.PI : 0.5; const cyc = Math.floor(a / Math.PI); const ang = a - cyc * Math.PI; const sun = cyc % 2 === 0;
      disc.position.set(Math.cos(Math.PI - ang) * 2.2, 3.4 + Math.sin(ang) * 1.5, -5.0); (disc.material as THREE.SpriteMaterial).color.set(lapse ? (sun ? 0xffd77a : 0xdfe6ff) : 0xdfe6ff);
      (win.material as THREE.MeshBasicMaterial).color.set(lapse ? (sun ? 0x8fb4ff : 0x101a44) : 0x101a44);
      plate.visible = !!pr.plate; if (pr.plate) { const s = easeOut(seg(T, L!.s, L!.s + 0.3)); plate.scale.setScalar(Math.max(0.001, s)); }
      whale.shade(x.pal.sprite).play("nod", 0); whale.update(T, x.cam); dust.update(T, 0.12); lsh.material.opacity = 0.16 + 0.04 * Math.sin(T * 30) * (L ? 1 : 0.2);
    },
  };
}

// ──────────── 哭了很多次 / 还是想坚持 ────────────
export function ghostSet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.55, metalness: 0.2 }); group.add(floorMesh(floorM));
  const clock = mesh(new THREE.PlaneGeometry(9, 9), bas(0xffffff, { map: clockTex(), transparent: true, opacity: 0.6, fog: false }), 0, 4.8, -10); group.add(clock);
  const hh = mesh(new THREE.PlaneGeometry(0.34, 2.6), bas(0x16161c), 0, 0, 0.02), mh = mesh(new THREE.PlaneGeometry(0.2, 3.7), bas(0x16161c), 0, 0, 0.03); hh.geometry.translate(0, 1.3, 0); mh.geometry.translate(0, 1.85, 0); clock.add(hh, mh);
  const whale = env.actor("whale", "sad", 1.15).place(0, 0, 0); whale.add(group);
  const ghosts: Actor[] = []; for (let i = 0; i < 7; i++) { const g = env.actor("whale", i % 2 ? "sad" : "shiver", 1.0).place((i - 3) * 1.9, 0, -1.4 - Math.abs(i - 3) * 0.5); g.add(group); ghosts.push(g); }
  const tears = new Dust(60, [0.9, 3.2, 0.4], 0x9fc2ff, 0.12, 43, [0, -0.6, 0.5], 0.9); group.add(tears.pts); const flash = glowSprite(0xdfe6ff, 10, 0); flash.position.set(0, 1.2, 0.5); group.add(flash);
  const dust = new Dust(100, [16, 8, 10], 0xb8c4ff, 0.05, 17, [0, 0, -2]); group.add(dust.pts);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const { T } = x; const L6 = x.line("B6"), L7 = x.line("B7"); const stand = T >= L7.s; const q = easeOut(seg(T, L7.s + 0.1, L7.s + 1.0));
      ghosts.forEach((g, i) => { const ta = i < 5 ? L6.t[i] : L6.t[4] + 0.12 * (i - 4); const ap = easeOut(seg(T, ta, ta + 0.35)); const sx = (i - 3) * 1.9, sz = -1.4 - Math.abs(i - 3) * 0.5;
        g.mesh.position.set(lerp(sx, 0, q), 0, lerp(sz, -0.2, q)); g.shade(mixC(0x4a5cff, 0xffffff, 0.5).getHex(), ap * (1 - q) * 0.55); g.mesh.visible = ap > 0 && q < 1; g.shadow.visible = g.mesh.visible; g.update(T, x.cam); });
      whale.shade(x.pal.sprite); whale.play(stand ? "hop" : "sad", stand ? L7.s : 0); whale.mesh.position.y = 0; whale.update(T, x.cam);
      tears.pts.visible = !stand; tears.update(T, -1.6, 0.05); hh.rotation.z = -T * (stand ? 2.2 : 0.4); mh.rotation.z = -T * (stand ? 26 : 5);
      (flash.material as THREE.SpriteMaterial).opacity = stand ? Math.exp(-(T - L7.s - 0.9) * 3) * (T > L7.s + 0.9 ? 0.9 : 0.1 * q) : 0; dust.update(T, 0.14);
    },
  };
}

// ──────────── 不愿担待平庸二字 ────────────
export function stampSet(env: Env): MvSet {
  const group = new THREE.Group(); const pt = paperTex("#d9d5c8", "30,30,40", 512, 512, 5); const floorM = std(0xffffff, { map: pt, roughness: 1 }); group.add(floorMesh(floorM, 60)); void concreteTex;
  const whale = env.actor("whale", "shake", 1.2).place(-3, 0, 1.4); whale.add(group);
  const panel = mesh(new THREE.PlaneGeometry(4.8, 2.25), bas(0xffffff, { map: popupTex(), side: THREE.DoubleSide }), 3.2, 2.7, -1.5); group.add(panel);
  const stamp = new THREE.Group(); group.add(stamp); const sm = std(0x2b3a9e, { roughness: 0.4 });
  stamp.add(mesh(boxG(2.8, 0.5, 1.6), sm, 0, 0.25, 0)); stamp.add(mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.7, 14), std(0x3b4cc0, { roughness: 0.4 }), 0, 1.35, 0)); stamp.add(mesh(new THREE.SphereGeometry(0.62, 16, 12), sm, 0, 2.3, 0));
  const decs = [["平庸", -1.2, 0.1, -0.1], ["平庸", 1.8, -0.5, 0.18], ["平庸", -4.6, -1.9, -0.25]].map(([t, px, pz, rot]) => { const d = mesh(new THREE.PlaneGeometry(2.6, 1.3), bas(0xffffff, { map: stampTex(t as string), transparent: true }), px as number, 0.04, pz as number); d.rotation.x = -Math.PI / 2; d.rotation.z = rot as number; d.visible = false; group.add(d); return d; });
  const sh = glowPool(0x000000, 3.6, 2.4, 0.5); group.add(sh); const dust = new Dust(100, [14, 8, 10], 0xdde4ff, 0.05, 57, [0, 0, 0], 0.6); group.add(dust.pts);
  return {
    group, onPal(p: Pal) { floorM.color.set(p.name === "day" ? 0xffffff : 0x8f8d98); },
    update(x: Ctx) {
      const { T } = x; const L8 = x.line("B8"), L9 = x.line("B9"); const slams = [L9.t[0], L9.t[2], L9.t[3] + 0.05]; const px = [-1.2, 1.8, -4.6], pz = [0.1, -0.5, -1.9];
      let y = 5, near = -1, tt = 0; slams.forEach((ts, i) => { const dt = T - ts; if (dt > -0.22 && dt < 0.7) { near = i; tt = dt; } });
      if (near >= 0) y = tt < 0 ? lerp(5, 0, easeIn((tt + 0.22) / 0.22)) : tt < 0.1 ? 0 : lerp(0, 5, easeOut((tt - 0.1) / 0.6));
      const sx = near >= 0 ? px[near] : px[Math.max(0, slams.filter((s) => T > s).length - 1)] ?? -1.2, szz = near >= 0 ? pz[near] : pz[Math.max(0, slams.filter((s) => T > s).length - 1)] ?? 0.1;
      stamp.position.set(sx, y, szz); stamp.visible = T > L9.s - 0.3; sh.position.set(sx, 0.03, szz); sh.visible = stamp.visible; sh.material.opacity = 0.5 * (1 - y / 6);
      decs.forEach((d, i) => (d.visible = T > slams[i] + 0.0));
      const push = easeIn(seg(T, L8.s + 0.7, L8.e)); const ap = easeOut(seg(T, L8.s - 0.2, L8.s + 0.3));
      panel.position.set(lerp(3.2, 11, push), 2.7 + Math.sin(T * 2) * 0.12 + push * 1.5, -1.5); panel.rotation.set(0, -0.35 + push * 1.2, push * 0.8); panel.scale.setScalar(Math.max(0.001, ap * (1 - push * 0.4))); panel.visible = T < L9.s;
      const slam = near >= 0 && tt > 0 && tt < 0.3;
      whale.shade(x.pal.sprite).play(slam ? "surprise" : T > L8.s + 0.5 && T < L9.s ? "point" : "shake", slam ? slams[near] : 0); whale.update(T, x.cam); dust.update(T, 0.15);
    },
  };
}

// ──────────── 渺小如我 ────────────
export function tinySet(env: Env): MvSet {
  const group = new THREE.Group(); const t = concreteTex(false, 20); const floorM = std(0xe5e4de, { map: t, roughness: 1 }); group.add(floorMesh(floorM, 300));
  const whale = env.actor("whale", "idle", 0.7).place(0, 0, 0); whale.add(group);
  const big = glowPool(0x000000, 30, 20, 0.35); group.add(big); big.position.set(0.5, 0.025, -0.5); big.scale.set(1, 1, 1);
  [[-5, 9, -34, 7], [0, 14, -34, 8], [6, 7, -34, 7]].forEach(([px, h, pz, w]) => group.add(mesh(boxG(w, h, 5), std(0x0b0b10), px, h / 2, pz)));
  const sil = Array.from({ length: 30 }, (_, i) => { const m = mesh(new THREE.PlaneGeometry(1.1, 1.65), new THREE.MeshBasicMaterial({ map: personTex(0), color: 0x000000, transparent: true, alphaTest: 0.3 }), -14 + i * 0.95, 0.82, -17 - (i % 3) * 0.8); group.add(m); return m; });
  return { group, onPal(p: Pal) { floorM.color.set(p.name === "day" ? 0xe5e4de : 0x6c6c78); }, update(x: Ctx) { whale.shade(x.pal.sprite); whale.update(x.T, x.cam); sil.forEach((m) => m.rotation.y = 0); big.scale.setScalar(1 + Math.sin(x.T * 0.8) * 0.05); } };
}

// ──────────── 改写命运的诗：一支大笔 ────────────
export function poemSet(env: Env): MvSet {
  const group = new THREE.Group(); const pt = paperTex("#e6e3d8", "30,30,40", 512, 512, 8); const floorM = new THREE.MeshBasicMaterial({ map: pt, color: 0xb8b6c4 }); group.add(floorMesh(floorM, 80));
  const pts: THREE.Vector3[] = []; for (let xx = -9; xx <= 9.01; xx += 1.5) pts.push(new THREE.Vector3(xx, 0.06, -1.3 + Math.sin(xx * 0.5) * 1.7));
  const curve = new THREE.CatmullRomCurve3(pts); const SEGS = 220;
  group.add(mesh(new THREE.TubeGeometry(curve, SEGS, 0.05, 5), bas(0x3a3a46)));
  const ink = mesh(new THREE.TubeGeometry(curve, SEGS, 0.17, 8), bas(0x4d6bfe)); group.add(ink); const radial = 8; const total = ink.geometry.index!.count;
  const pen = new THREE.Group(); group.add(pen); const pm = std(0x1b1d3a, { roughness: 0.3, metalness: 0.4 });
  const body = mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.6, 12), pm, 0.62, 1.15, 0); body.rotation.z = -0.5; pen.add(body); const tip = mesh(new THREE.ConeGeometry(0.16, 0.55, 12), std(0x4d6bfe, { emissive: 0x4d6bfe, emissiveIntensity: 0.7 }), 0, 0.27, 0); tip.rotation.z = Math.PI; pen.add(tip);
  const hg = glowSprite(0x7f94ff, 2.6, 0.9); group.add(hg); const whale = env.actor("whale", "point", 1.1).place(-4.2, 0, 2.2); whale.add(group);
  const spark = new Dust(80, [3, 2, 3], 0xaebaff, 0.09, 61, [0, 0, 0], 0.9); group.add(spark.pts);
  void radial;
  return {
    group,
    update(x: Ctx) {
      const { T } = x; const a = x.line("B12"), b = x.line("B13"); const prog = easeOut(seg(T, a.s, b.e - 0.3) * 0.999 + 0.001) * 0.999;
      const k = Math.floor(prog * SEGS); ink.geometry.setDrawRange(0, Math.min(total, k * 8 * 6));
      const head = curve.getPoint(prog); pen.position.copy(head); pen.position.y += 0.1 + Math.abs(Math.sin(T * 6)) * 0.04; hg.position.copy(head); hg.position.y += 0.3; spark.pts.position.set(head.x, head.y + 0.4, head.z); spark.update(T, 0.6, 0.4);
      whale.shade(x.pal.sprite); whale.update(T, x.cam);
    },
  };
}

// ──────────── 名垂青史：奖杯升起，鲸够不着 ────────────
export function trophySet(env: Env): MvSet {
  const group = new THREE.Group(); const floorM = std(0x1a1b24, { roughness: 0.3, metalness: 0.5 }); group.add(floorMesh(floorM));
  group.add(mesh(new THREE.CylinderGeometry(1.3, 1.5, 1.4, 24), std(0x303342, { roughness: 0.4 }), 3, 0.7, -1.5));
  const tg = new THREE.Group(); tg.position.set(3, 1.4, -1.5); group.add(tg);
  const prof = [[0.001, 0], [0.55, 0], [0.55, 0.12], [0.22, 0.24], [0.13, 0.6], [0.16, 0.95], [0.62, 1.3], [0.78, 2.1], [0.66, 2.15], [0.001, 2.1]].map(([a, b]) => new THREE.Vector2(a, b));
  const tm = std(0xe4e9ff, { metalness: 0.55, roughness: 0.22, emissive: 0x4152c9, emissiveIntensity: 0.35 });
  tg.add(mesh(new THREE.LatheGeometry(prof, 32), tm)); [-1, 1].forEach((s) => { const h = mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 20, Math.PI), tm, s * 0.75, 1.65, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; tg.add(h); });
  const tgl = glowSprite(0xaebaff, 6, 0.9); tgl.position.y = 1.2; tg.add(tgl);
  const sh = shaft(0xdfe6ff, 12, 2.2, 0.26); sh.position.set(3, 11, -1.5); group.add(sh);
  const whale = env.actor("whale", "hop", 1.1).place(-1.4, 0, 1.6); whale.add(group);
  const conf = new Dust(200, [18, 12, 12], 0xffe08a, 0.13, 74, [1, -1, -2], 0.95, false); group.add(conf.pts);
  const dust = new Dust(100, [16, 10, 12], 0xb8c4ff, 0.05, 76, [0, 0, -2]); group.add(dust.pts);
  const fans: Actor[] = (["gpt", "claude", "gemini"] as Who[]).map((w, i) => { const a = env.actor(w, w === "gpt" ? "float" : "idle", w === "gpt" ? 0.55 : 1).place(6.2 + i * 1.8, 0, -3.2 - i * 0.4); a.add(group); return a; });
  return {
    group, onPal(p: Pal) { floorM.color.set(p.floor); },
    update(x: Ctx) {
      const { T } = x; const L1 = x.line(x.p.l1), L2 = x.line(x.p.l2);
      const rise = easeOut(seg(T, L1.s, L1.s + 0.9)); tg.position.y = lerp(-1.4, 1.4, rise); tg.rotation.y = T * 0.9; tgl.scale.setScalar(6 + 1.2 * Math.sin(T * 3));
      whale.shade(x.pal.sprite).play("hop", 0); whale.speed = 0.7; whale.update(T, x.cam);
      conf.pts.visible = T >= L2.s; conf.update(T, -1.3, 0.5); dust.update(T, 0.15);
      fans.forEach((a) => { a.shade(x.pal.sprite); a.update(T, x.cam); a.mesh.position.y = a.who === "gpt" ? 0.6 : 0; });
    },
  };
}
