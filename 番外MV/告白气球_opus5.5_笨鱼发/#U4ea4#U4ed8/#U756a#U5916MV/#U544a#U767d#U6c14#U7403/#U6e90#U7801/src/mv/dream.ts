// 尾段：Kimi 的恋爱日记 → 一整瓶的梦境 → 搅拌在一起
import * as THREE from "three";
import type { Actor, Ctx, Env, MvSet } from "./engine";
import { Dust, bas, glowSprite, mesh, std } from "./kit";
import { clamp, easeIn, easeInOut, easeOut, labelTex, leafTex, lerp, pageTex, seg, smooth } from "./tex";

function lathe(pts: [number, number][], m: THREE.Material, seg = 32) { return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), m); }
function bottle(scale: number) {
  const g = new THREE.Group(); g.scale.setScalar(scale);
  const glass = new THREE.MeshStandardMaterial({ color: 0xffd6e6, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false, emissive: 0xff9ac0, emissiveIntensity: 0.08 });
  const body = lathe([[0.001, 0], [0.62, 0], [0.7, 0.08], [0.72, 0.9], [0.6, 1.1], [0.2, 1.22], [0.18, 1.4], [0.001, 1.4]], glass); g.add(body);
  const liquid = lathe([[0.001, 0.02], [0.64, 0.02], [0.68, 0.1], [0.68, 0.55], [0.001, 0.55]], new THREE.MeshStandardMaterial({ color: 0xff8fb4, transparent: true, opacity: 0.35, emissive: 0xff6f9c, emissiveIntensity: 0.25, depthWrite: false })); g.add(liquid);
  const cap = mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.3, 16), std(0xf0c870, { metalness: 0.8, roughness: 0.25 }), 0, 1.55, 0); g.add(cap);
  const bulb = mesh(new THREE.SphereGeometry(0.18, 14, 10), std(0xff8fb4, { roughness: 0.4 }), 0.32, 1.62, 0); g.add(bulb);
  const label = mesh(new THREE.PlaneGeometry(0.62, 0.31), bas(0xffffff, { map: labelTex(), transparent: true }), 0, 0.62, 0.725); g.add(label);
  return { g, glass, liquid, label };
}

export function dreamSet(env: Env): MvSet {
  const group = new THREE.Group();
  const dust = new Dust(260, [30, 14, 20], 0xfff0fa, 0.09, 7, [0, -2, -4], 0.9); group.add(dust.pts);
  const clouds = Array.from({ length: 10 }, (_, i) => { const s = glowSprite(i % 2 ? 0xffc4dc : 0xc8b0ff, 6 + (i % 3) * 3, 0.25); s.position.set(-14 + i * 3.2, -1 + (i % 3) * 3, -10 - (i % 4) * 2); group.add(s); return s; });
  // ── 日记长卷（竖着立起来的横幅，从 Kimi 手里往右展开）──
  const ITEMS = ["cup", "card", "balloon", "leaf", "lights", "tower", "heart"] as const; const PW = 15.4, PH = 2.2;
  const ptex = pageTex([...ITEMS], 3); ptex.wrapS = THREE.ClampToEdgeWrapping;
  const pg = new THREE.PlaneGeometry(1, PH); pg.translate(0.5, 0, 0);
  const page = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: ptex, side: THREE.DoubleSide, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0.18, emissiveMap: ptex }));
  const X0 = -6.4, Y0 = 1.9; page.position.set(X0, Y0, 0); group.add(page);
  const rollM = std(0xc89a5a, { roughness: 0.6 }); const rollL = mesh(new THREE.CylinderGeometry(0.16, 0.16, PH + 0.3, 16), rollM, X0, Y0, 0.02); const rollR = mesh(new THREE.CylinderGeometry(0.22, 0.22, PH + 0.3, 16), rollM, X0, Y0, 0.05); group.add(rollL, rollR);
  const mark = mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: leafTex(), color: 0xffc040, emissive: 0xc87a10, emissiveIntensity: 0.6, alphaTest: 0.4, side: THREE.DoubleSide })); group.add(mark);
  const markGlow = glowSprite(0xffd36b, 1.6, 0); group.add(markGlow);
  // ── 香水瓶 ──
  const small = bottle(1.3); group.add(small.g);
  const mist = new Dust(160, [10, 4, 3], 0xff9ac0, 0.16, 19, [2, 1, 0.4], 0.8); group.add(mist.pts);
  // ── 一整瓶的梦境：瓶子里的小咖啡馆，四个小克 ──
  const big = bottle(4.2); big.g.position.set(1.4, -2.2, -0.5); group.add(big.g); big.label.visible = false;
  const dio = new THREE.Group(); dio.position.set(1.4, -2.1, -0.5); group.add(dio);
  dio.add(mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.08, 40), std(0xe8d6c0, { roughness: 0.9 }), 0, 0.3, 0));
  const tbl = new THREE.Group(); tbl.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 20), std(0x2f2a26, { metalness: 0.5 }), 0, 0.62, 0), mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), std(0x2f2a26), 0, 0.32, 0)); tbl.position.set(0, 0.34, -0.6); dio.add(tbl);
  const lampG = glowSprite(0xffc870, 1.0, 0.5); lampG.position.set(-1.3, 2.4, -0.9); dio.add(lampG); dio.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.1, 6), std(0x1f2a26), -1.3, 1.35, -0.9));
  const miniAct = ["read", "lookaround", "curtsy", "hop"]; const miniPos = [[-1.2, -0.2], [-0.4, 0.7], [0.5, 0.6], [1.2, -0.3]];
  const minis: Actor[] = miniAct.map((a) => { const m = env.actor("claude", a, 0.78); m.add(dio); return m; });
  const K = env.actor("kimi", "think", 1.1); K.add(group); const W = env.actor("whale", "idle", 1.35); W.add(group);
  const scroll = env.thing("prop_scroll", 1.8).add(group);
  const swirlP = new Dust(220, [1, 1, 1], 0xffb3d0, 0.14, 23, [0, 0, 0], 0.95); group.add(swirlP.pts); const sp = swirlP.pts.geometry.getAttribute("position") as THREE.BufferAttribute;
  return {
    group,
    update(x: Ctx) {
      const { T } = x; const sc = x.p.scene as string; const L = x.p.lineId ? x.line(x.p.lineId) : null;
      dust.update(T, 0.12, 0.4); clouds.forEach((c, i) => (c.position.x = -14 + i * 3.2 + Math.sin(T * 0.2 + i) * 0.6));
      const showDiary = sc === "diary" || sc === "perfume"; page.visible = rollL.visible = rollR.visible = showDiary; mark.visible = markGlow.visible = showDiary;
      small.g.visible = sc === "perfume"; mist.pts.visible = sc === "perfume"; big.g.visible = dio.visible = sc === "bottle" || sc === "swirl"; swirlP.pts.visible = sc === "swirl";
      K.show(showDiary); W.show(sc === "bottle" || sc === "swirl"); scroll.hide(); minis.forEach((m) => m.show(false));
      if (showDiary) {
        const E1 = x.line("E1");
        // 展开：「恋爱日记」的「日」字之前一直往右铺；书签一夹，就停
        const stopAt = E1.t[8]; const p = sc === "perfume" ? 0.9 : 0.06 + 0.84 * easeInOut(seg(T, E1.t[0] - 0.3, stopAt));
        page.scale.x = PW * p; ptex.repeat.set(p, 1); ptex.offset.set(0, 0); ptex.needsUpdate = false;
        rollR.position.x = X0 + PW * p; rollR.rotation.y = -p * 20;
        const mx = X0 + PW * (6.5 / 7) * 0.97; const mq = seg(T, stopAt - 0.9, stopAt);
        mark.position.set(lerp(mx + 2.5, mx, easeOut(mq)), lerp(Y0 + 3.2, Y0 + 0.95, easeIn(mq)), 0.08); mark.rotation.set(0, 0, lerp(2.5, -0.4, mq) + (mq < 1 ? Math.sin(T * 4) * 0.4 : 0)); mark.visible = T > stopAt - 0.9 || sc === "perfume";
        (markGlow.material as THREE.SpriteMaterial).opacity = mq >= 1 ? 0.8 * Math.exp(-(T - stopAt) * 1.2) + 0.2 : 0; markGlow.position.copy(mark.position);
        K.at(X0 - 0.5, -0.15, 0.6).act(sc === "perfume" ? "lookaround" : T > stopAt && T < stopAt + 1.2 ? "nod" : "think", sc === "perfume" ? 0 : stopAt); K.shade(x.pal.sprite); K.update(T, x.cam);
        if (sc === "diary" && T > stopAt) K.emote("fx_bulb");
        if (sc === "perfume" && L) {
          const up = easeOut(seg(T, L.s - 0.4, L.t[1])); small.g.position.set(1.6, lerp(-3.5, -0.6, up), 1.6); small.g.rotation.y = T * 0.4;
          mist.pts.position.set(0, 0, 0); mist.update(T, 0.35, 0.8); (mist.pts.material as THREE.PointsMaterial).opacity = 0.8 * seg(T, L.t[1], L.t[3]);
        }
      }
      if (sc === "bottle" || sc === "swirl") {
        const E3 = x.line("E3"); const sw = sc === "swirl" ? seg(T, x.line("E4").s, x.line("E4").e + 0.3) : 0;
        big.g.rotation.y = Math.sin(T * 0.3) * 0.2; (big.liquid.material as THREE.MeshStandardMaterial).opacity = 0.3 + 0.3 * sw;
        minis.forEach((m, i) => {
          const ti = E3.t[6 + i]; const on = sc === "swirl" || T >= ti - 0.05; m.show(on); if (!on) return;
          const [mx, mz] = miniPos[i]; const ang = Math.atan2(mz, mx) + easeIn(sw) * 9; const r = Math.hypot(mx, mz) * (1 - sw * 0.85);
          m.at(Math.cos(ang) * r, 0.34 + sw * 3.2 * easeIn(sw), Math.sin(ang) * r); m.act(sw > 0 ? "hop" : miniAct[i], sw > 0 ? 0 : ti); m.shade(x.pal.sprite);
          if (sc === "bottle" && T < ti + 0.5) m.mesh.scale.multiplyScalar(1); m.update(T, x.cam); if (sc === "bottle" && T < ti + 0.9) m.emote("fx_heart");
        });
        W.at(-2.3, -2.2, 2.6).act(sc === "swirl" ? "spin" : T > E3.t[9] + 0.3 ? "hop" : "idle", sc === "swirl" ? 0 : E3.t[9] + 0.3); W.shade(x.pal.sprite); W.update(T, x.cam);
        if (sc === "bottle" && T > E3.t[6]) W.emote("fx_heart");
        if (sc === "swirl") { for (let i = 0; i < sp.count; i++) { const k = i / sp.count; const a = k * 40 + T * (3 + sw * 8); const rr = 2.4 * (1 - sw * 0.7) * (0.3 + 0.7 * ((i * 0.618) % 1)); sp.setXYZ(i, 1.4 + Math.cos(a) * rr, -1.6 + k * 4 + sw * 2, -0.5 + Math.sin(a) * rr); } sp.needsUpdate = true; (swirlP.pts.material as THREE.PointsMaterial).opacity = smooth(seg(T, x.line("E4").s - 0.2, x.line("E4").s + 0.4)); }
        dio.rotation.y = sw * sw * 6;
      }
      void clamp;
    },
  };
}
