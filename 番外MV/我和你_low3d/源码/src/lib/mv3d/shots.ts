import * as THREE from "three";
import { Kit, type Builder, type Actor } from "./kit";
import { clamp, lerp, seg, easeOut, easeIn, easeInOut, backOut, elastic, rnd, FLOWER_COLOR } from "../mv/draw";

const ALL = ["whale", "claude", "gpt", "qwen", "doubao", "gemini", "kimi", "zai"];
const FRIENDS = ["qwen", "doubao", "gemini", "kimi"];
const HAPPY: Record<string, string> = { whale: "hop", claude: "hop", gpt: "float", qwen: "hop", doubao: "hop", gemini: "hop", kimi: "hop", zai: "hop" };
const DANCE: Record<string, string> = { whale: "sway", claude: "curtsy", gpt: "hover", qwen: "sway", doubao: "sway", gemini: "sway", kimi: "lookaround", zai: "tilt" };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const col = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t));

// ───────── 共用布景 ─────────
function day(k: Kit, o: { sun?: [number, number, number]; ground?: string; clouds?: number; fogFar?: number } = {}) {
  const sky = k.sky("#2f8cff", "#6cc76a", "#d6f0ff");
  k.fog("#d6f0ff", 30, o.fogFar ?? 220);
  k.lights(1.15, 1.5);
  k.ground(o.ground ?? "#6cc76a");
  k.hillsRing();
  const sun = o.sun ? k.sun(...o.sun, 6) : null;
  const clouds = k.clouds(o.clouds ?? 10, { x: [-80, 80], y: [18, 40], z: [-120, -30] }, [2.5, 4.5], 2);
  return { sky, sun, clouds };
}
function driftClouds(cl: THREE.Group[], t: number, speed = 1) {
  cl.forEach((c, i) => { c.position.x = ((c.userData.x0 ?? (c.userData.x0 = c.position.x)) + t * speed * (0.6 + rnd(i) * 0.8) + 100) % 200 - 100; });
}
function sunset(k: Kit) {
  const sky = k.sky("#ff8a6a", "#c46a5a", "#ffe0a0");
  k.fog("#ffcf9a", 30, 200);
  k.lights(0.9, 1.4, [0, 6, -20], "#ffd2a0", "#a05a5a");
  k.ground("#d98a6a");
  k.hillsRing(["#e0906a", "#c97a6a", "#b86a6a"]);
  return { sky, sun: k.sun(0, 7, -120, 9) };
}
function night(k: Kit, groundCol: string | null = "#1a1f4a") {
  const sky = k.sky("#070a2a", "#0d1033", "#24286a");
  k.fog("#141842", 40, 260);
  k.lights(0.5, 0.4, [5, 10, 5], "#8090ff", "#202040");
  const stars = k.stars(1000);
  if (groundCol) { k.ground(groundCol); k.hillsRing(["#1f2558", "#262c66", "#1a1f4a"]); }
  return { sky, stars };
}
function space(k: Kit) {
  k.sky("#020312", "#020312", "#0b1240");
  const stars = k.stars(1600, 500, 2);
  return { stars };
}
function garden(k: Kit, n = 140, radius = 14) {
  const base = day(k, { sun: [40, 45, -110], ground: "#5fbf5f" });
  const cols = Object.values(FLOWER_COLOR);
  const flowers: THREE.Group[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd(i * 5) * Math.PI * 2, r = 1.5 + Math.sqrt(rnd(i * 3)) * radius;
    flowers.push(k.flower(cols[i % cols.length], 0.7 + rnd(i) * 0.6, Math.sin(a) * r, Math.cos(a) * r - 2));
  }
  return { ...base, flowers };
}
function butterflies(k: Kit, n = 6) {
  const out: THREE.Group[] = [];
  const cols = ["#ffd84a", "#ff8fc2", "#8fd0ff"];
  for (let i = 0; i < n; i++) {
    const g = k.add(new THREE.Group());
    const wingGeo = k.geo("wing", () => { const p = new THREE.PlaneGeometry(0.3, 0.22); p.translate(0.15, 0, 0); return p; });
    const m = k.lam(cols[i % 3], { side: THREE.DoubleSide, emissive: cols[i % 3], emissiveIntensity: 0.3 });
    const l = new THREE.Mesh(wingGeo, m), r = new THREE.Mesh(wingGeo, m);
    r.scale.x = -1; g.add(l, r); g.userData = { l, r };
    out.push(g);
  }
  return (t: number) => out.forEach((g, i) => {
    g.position.set(Math.sin(t * 0.6 + i * 2) * (4 + i), 1.6 + Math.sin(t * 2 + i) * 0.6 + rnd(i) * 1.5, Math.cos(t * 0.5 + i) * 3 - 1);
    const f = Math.sin(t * 16 + i) * 1.1;
    (g.userData.l as THREE.Mesh).rotation.y = f; (g.userData.r as THREE.Mesh).rotation.y = -f;
    g.rotation.y = t + i;
  });
}
function lineup(k: Kit, chars: string[], z: number, spacing: number, scale: number, act: (c: string) => string) {
  return chars.map((c, i) => k.actor(c, act(c), scale, (i - (chars.length - 1) / 2) * spacing, 0, z));
}
function updAll(list: Actor[], lt: number) { list.forEach((a) => a.update(lt)); }

// ───────── 镜头 ─────────
export const SHOTS3D: Record<string, Builder> = {
  intro: (k) => {
    const { sun, clouds } = day(k, { sun: [0, 10, -140] });
    return (lt, p) => {
      sun!.position.y = lerp(4, 30, easeOut(p));
      (sun!.userData.rays as THREE.Group).rotation.z = lt * 0.3;
      driftClouds(clouds, lt, 2);
      k.look(0, 2, 14, 0, lerp(6, 14, p), -60);
      k.post.flash = 1 - easeOut(p);
    };
  },

  // 晴天：太阳旋转，摇臂下降到小屋
  sunny: (k) => {
    const { sun, clouds } = day(k, { sun: [0, 38, -120] });
    const h = k.house("#fff4e0", "#e86a4a", 1.4); h.position.set(0, 0, -6);
    k.tree(1.2).position.set(-4, 0, -7); k.tree(1).position.set(4.5, 0, -8);
    return (lt, p) => {
      (sun!.userData.rays as THREE.Group).rotation.z = lt * 0.4;
      driftClouds(clouds, lt, 3);
      const q = easeInOut(p);
      k.look(0, lerp(10, 2.5, q), lerp(16, 6, q), 0, lerp(30, 1.8, q), lerp(-80, -6, q));
    };
  },

  // 有点：窗台边，一小束光
  window: (k) => {
    const room = k.room(0.05);
    k.windowOnWall(0, 4, -6.9, 4.5, 3.2);
    const beam = k.beam("#fff2b0", 7, 2.2, 0.18); k.aim(beam, V(0, 4.5, -6.8), V(0.5, 0, -2));
    const spot = k.glow("#fff6c0", 1, 0.8); spot.position.set(0.4, 0.05, -2.5);
    const w = k.actor("whale", "idle", 1.2, 0, 0, -5.4); w.fps = 4;
    const motes = k.motes(60, 5, 4);
    void room;
    return (lt, p) => {
      w.update(lt); const pts = motes(lt); pts.position.set(0, 1, -4);
      spot.scale.setScalar(lerp(1, 4, p));
      k.look(lerp(0.8, 0.3, p), 2.0, lerp(-0.6, -1.8, p), 0, 2.6, -6.5, 50);
    };
  },

  // 孤单：空荡房间，镜头后拉升高，阴云、落叶
  lonely: (k) => {
    const room = k.room(0.35, 18, 8, 16);
    k.windowOnWall(5, 4.5, -7.9, 3, 2.4, "#8fb4d8", "#cfe0ee");
    const w = k.actor("whale", "sad", 0.9, -5, 0, -5); w.fps = 5;
    const gloom = k.fx("gloom", 1.5, -5, 2.1, -5);
    const leaf = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(0.25, 0.12)), k.lam("#d98a3a", { side: THREE.DoubleSide })));
    k.post.vignetteColor = "20,20,50";
    void room;
    return (lt, p) => {
      w.update(lt); k.animFx(gloom, lt); gloom.opacity = clamp(p * 3);
      leaf.position.set(-2 + Math.sin(lt * 2) * 0.8, lerp(6, 0.1, p), -4); leaf.rotation.set(lt * 3, lt * 2, 0);
      const q = easeOut(p);
      k.look(lerp(-3, 2, q), lerp(1.8, 5.5, q), lerp(-1, 7, q), -4.5, 0.8, -5);
      k.post.vignette = 0.4 + p * 0.35;
    };
  },

  // 玩具：三件玩具弹跳登场，低机位环绕
  toys: (k) => {
    k.room(0.12);
    const teddy = k.teddy(), rocket = k.rocket(), block = k.block("A");
    teddy.position.set(-0.9, 0, 0); rocket.position.set(0.8, 0, -0.3); block.position.set(0.2, 0.4, 0.8);
    const items = [teddy, rocket, block];
    const sparks = [k.glow("#fff3a0", 0.6), k.glow("#fff3a0", 0.5), k.glow("#ffd0f0", 0.5)];
    return (lt, p) => {
      items.forEach((o, i) => {
        const s = elastic(seg(p, i * 0.12, 0.55 + i * 0.12));
        o.scale.setScalar(Math.max(0.001, s));
        o.position.y = (o === block ? 0.4 : 0) + Math.abs(Math.sin(lt * 7 + i)) * 0.25 * (1 - p);
      });
      sparks.forEach((s, i) => { s.position.set(Math.sin(lt * 2 + i * 2) * 1.8, 1.8 + Math.sin(lt * 3 + i) * 0.4, Math.cos(lt * 2 + i * 2) * 1.2); s.material.opacity = 0.5 + 0.5 * Math.sin(lt * 8 + i); });
      k.orbit(lerp(-0.6, 0.6, p), 4.2, 1.2, 0, 0.8, 0);
    };
  },

  // 丢在：玩具被抛出，翻滚落地
  toss: (k) => {
    k.room(0.18);
    const w = k.actor("whale", "shake", 1.1, -2.5, 0, 0);
    const teddy = k.teddy(); teddy.scale.setScalar(0.6);
    const dizzy = k.fx("dizzy", 1.4, 2.6, 1.4, 0);
    return (lt, p) => {
      w.update(lt);
      const q = clamp(p * 1.15);
      teddy.position.set(lerp(-1.8, 2.6, q), Math.sin(q * Math.PI) * 2.6, lerp(0, 0.4, q));
      teddy.rotation.set(q * 7, q * 3, q * 5);
      if (q >= 1) teddy.rotation.set(0, 0.3, Math.PI / 2);
      dizzy.opacity = q >= 1 ? 1 : 0; k.animFx(dizzy, lt);
      k.look(0, 1.6, 6.5, lerp(-0.5, 1.2, q), 1.0, 0);
    };
  },

  // 旁边：横移，玩具留在一边，她走开
  aside: (k) => {
    k.room(0.25);
    const teddy = k.teddy(); teddy.scale.setScalar(0.55); teddy.position.set(3.5, 0, -1); teddy.rotation.set(0, -0.4, 0.3);
    const rk = k.rocket(); rk.scale.setScalar(0.5); rk.position.set(4.3, 0, -1.4); rk.rotation.z = Math.PI / 2;
    const w = k.actor("whale", "walk", 1.1, 2, 0, 0); w.flip = true;
    const dust = k.motes(30, 3, 2, "#ffffff", 2);
    k.post.vignetteColor = "30,30,60";
    return (lt, p) => {
      w.update(lt);
      w.position.x = lerp(2.5, -3.2, p);
      dust(lt).position.set(3.8, 0, -1);
      k.look(lerp(2.2, -1.4, easeInOut(p)), 1.5, 5.5, lerp(2.2, -1.6, easeInOut(p)), 0.9, 0);
      k.post.vignette = 0.5;
    };
  },

  // 电视：啪地亮起
  tv: (k) => {
    const room = k.room(0.55);
    const tv = k.tv(); tv.group.position.set(0.6, 0, -1.5); tv.group.rotation.y = -0.15;
    const light = k.add(new THREE.PointLight("#9fc6ff", 0, 12, 1.5)); light.position.set(0.4, 1.8, 0.2);
    const w = k.actor("whale", "surprise", 1.0, -1.8, 0, 0.6); w.loop = false;
    void room;
    return (lt, p) => {
      w.update(lt);
      const on = p > 0.25;
      tv.draw(on ? "static" : "off", lt);
      light.intensity = on ? 18 + Math.sin(lt * 40) * 4 : 0;
      tv.group.scale.setScalar(backOut(seg(p, 0, 0.35)) || 0.001);
      k.post.flash = on ? 0.45 * (1 - seg(p, 0.25, 0.45)) : 0;
      k.post.flashColor = "200,230,255";
      k.look(lerp(-0.5, 0, p), 1.6, lerp(6, 5, p), 0, 1.4, -1.2);
    };
  },

  // 里：镜头钻进屏幕
  tvzoom: (k) => {
    k.room(0.6);
    const tv = k.tv(); tv.group.position.set(0, 0, 0);
    return (lt, p) => {
      tv.draw("static", lt);
      const q = easeIn(p);
      k.look(-0.15, 1.6, lerp(5, 1.25, q), -0.15, 1.6, 0, lerp(45, 38, q));
    };
  },

  // 没有：屏幕里换台，雪花/彩条
  static: (k) => {
    k.room(0.7);
    const tv = k.tv();
    return (lt, p) => {
      const ch = Math.floor(p * 6);
      tv.draw(ch % 2 === 0 ? "bars" : "static", lt);
      k.look(-0.15 + Math.sin(lt * 30) * 0.004, 1.6, 1.3, -0.15, 1.6, 0, 40);
      k.post.vignette = 0.7;
    };
  },

  // 新鲜：电视重播同一个画面，她摇头
  bored: (k) => {
    k.room(0.5);
    const tv = k.tv(); tv.group.position.set(1.8, 0, -1); tv.group.rotation.y = -0.4;
    const light = k.add(new THREE.PointLight("#9fc6ff", 14, 10, 1.5)); light.position.set(1.5, 1.8, 0.5);
    const w = k.actor("whale", "shake", 1.2, -1.4, 0, 0.3);
    const q = k.fx("question", 2.2, -1.0, 2.3, 0.4);
    const sweat = k.fx("sweat", 1.8, -0.7, 1.9, 0.5);
    return (lt, p) => {
      tv.draw("loop", lt); w.update(lt);
      q.position.y = 2.3 + Math.sin(lt * 6) * 0.1; q.opacity = 0.5 + 0.5 * Math.abs(Math.sin(lt * 5));
      void sweat;
      k.orbit(lerp(-0.25, 0.15, p), 6, 1.8, 0.2, 1.2, 0);
    };
  },

  // 球鞋：跑道上的球鞋，鞋带一甩，起跑线画出
  sneakers: (k) => {
    k.sky("#ffcf7a", "#d9a066", "#fff0c8"); k.fog("#ffe6b0", 20, 160); k.lights(1.1, 1.4, [0, 10, -10]);
    k.ground("#d9a066");
    const track = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(6, 200)), k.lam("#c0643a"))); track.rotation.x = -Math.PI / 2; track.position.set(0, 0.01, -90);
    const line = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(6, 0.15)), k.basic("#ffffff"))); line.rotation.x = -Math.PI / 2; line.position.set(0, 0.02, 0.4);
    for (const sx of [-1.5, 0, 1.5]) { const l = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(0.06, 200)), k.basic("#ffffff"))); l.rotation.x = -Math.PI / 2; l.position.set(sx, 0.02, -90); }
    const shoes = k.prop("sneakers", 2.2, 0, 0, 0);
    const beams: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) beams.push(k.beam("#fff3c8", 60, 3, 0.18));
    return (lt, p) => {
      shoes.mesh.scale.multiplyScalar(backOut(seg(p, 0, 0.45)) || 0.001);
      shoes.position.y = Math.abs(Math.sin(lt * 10)) * 0.08;
      line.scale.x = Math.max(0.001, easeOut(seg(p, 0.2, 0.8)));
      beams.forEach((b, i) => { const a = (i / 10) * Math.PI * 2 + lt * 0.3; k.aim(b, V(0, 3, -40), V(Math.cos(a) * 40, 3 + Math.sin(a) * 40, -40)); });
      k.orbit(lerp(0.7, -0.3, easeInOut(p)), 3.2, 0.5, 0, 0.35, 0, 40);
    };
  },

  // 跑不过：跑步机似的世界往后滚，她被甩后，时钟领跑
  run: (k) => {
    k.sky("#2f8cff", "#6cc76a", "#d6f0ff"); k.fog("#d6f0ff", 20, 120); k.lights(1.1, 1.5);
    k.ground("#6cc76a");
    const road = k.add(new THREE.Group());
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(k.geo("dash", () => new THREE.PlaneGeometry(1.2, 0.15)), k.basic("#ffffff")); m.rotation.x = -Math.PI / 2; m.position.set(i * 3 - 60, 0.02, 1.2); road.add(m); }
    const strip = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(400, 3)), k.lam("#d9a066"))); strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.01, 1);
    const trees: THREE.Group[] = []; for (let i = 0; i < 18; i++) { const t = k.tree(1 + rnd(i) * 0.6); t.position.set(i * 6 - 50, 0, -3 - rnd(i * 3) * 6); trees.push(t); }
    const clouds = k.clouds(8, { x: [-60, 60], y: [12, 22], z: [-60, -20] }, [2, 3.5], 9);
    const w = k.actor("whale", "walk", 1.0, 0, 0, 1); w.fps = 16;
    const sweat = k.fx("sweat", 1.4, 0, 2, 1.2);
    const clk = k.clock(0.8);
    const lines = k.speedLines(50);
    return (lt, p) => {
      w.update(lt);
      road.position.x = -((lt * 14) % 3);
      trees.forEach((t, i) => { t.position.x = ((i * 6 - lt * 14) % 108 + 108) % 108 - 54; });
      driftClouds(clouds, lt, -4);
      const x = lerp(0.5, -2.5, easeIn(p));
      w.position.x = x; sweat.position.set(x + 0.5, 1.9, 1.2);
      clk.group.position.set(lerp(3, 4.5, p), 1.3 + Math.abs(Math.sin(lt * 9)) * 0.4, 1);
      clk.minute.rotation.z = -lt * 25; clk.hour.rotation.z = -lt * 2;
      lines(lt);
      k.look(0.5, 1.3, 7, 0.5, 1.1, 0, 50);
    };
  },

  // 时间：巨大钟面飞转，太阳划过天空，昼→暮
  clock: (k) => {
    const sky = k.sky("#2f8cff", "#6cc76a", "#d6f0ff"); k.fog("#d6f0ff", 30, 220);
    const { d } = k.lights(1.1, 1.5);
    k.ground("#6cc76a"); k.hillsRing();
    const clk = k.clock(4); clk.group.position.set(0, 5, -4);
    const sun = k.sun(0, 0, -120, 6);
    const hg = k.prop("hourglass", 4, 4, 0, -1);
    const w = k.actor("whale", "shiver", 0.9, -3.2, 0, 0);
    return (lt, p) => {
      w.update(lt);
      clk.minute.rotation.z = -lt * 30; clk.hour.rotation.z = -lt * 2.5;
      const an = p * Math.PI * 1.1;
      sun.position.set(-Math.cos(an) * 90, Math.sin(an) * 50 + 2, -120);
      sky.top.value.copy(col("#2f8cff", "#ff7a5a", p)); sky.hor.value.copy(col("#d6f0ff", "#ffd29a", p));
      (k.w.scene.fog as THREE.Fog).color.copy(col("#d6f0ff", "#ffcf9a", p));
      d.color.copy(col("#fff6e8", "#ff9a6a", p));
      hg.mesh.rotation.z = Math.sin(lt * 2) * 0.3;
      k.orbit(lerp(-0.35, 0.35, p), 13, 3.5, 0, 4, -2);
    };
  },

  // 我要：站起来一指，放射光
  iwant: (k) => {
    k.sky("#ffb43a", "#ff7a2a", "#ffe08a"); k.lights(1.2, 1.2);
    const beams: THREE.Mesh[] = []; for (let i = 0; i < 16; i++) beams.push(k.beam(i % 2 ? "#fff3b0" : "#ffd27a", 50, 3.5, 0.35));
    const w = k.actor("whale", "point", 2.0, 0, 0, 0); w.loop = false; w.fps = 10;
    const ex = k.fx("exclaim", 3, 1.2, 3.4, 0.2);
    return (lt, p) => {
      w.update(lt);
      beams.forEach((b, i) => { const a = (i / 16) * Math.PI * 2 + lt * 0.8; k.aim(b, V(0, 2, -6), V(Math.cos(a) * 40, 2 + Math.sin(a) * 40, -10)); });
      ex.mesh.scale.multiplyScalar(backOut(seg(p, 0.1, 0.45)) || 0.001);
      k.look(0, lerp(0.6, 1.2, p), lerp(7, 5, easeOut(p)), 0, 2, 0, 45);
    };
  },

  // 更大的：从街道一路升到云层之上
  zoomout: (k) => {
    const { clouds } = day(k, { clouds: 0, fogFar: 400 });
    const roofs = ["#e86a4a", "#4a8ae8", "#e8b84a", "#8a5ae8"];
    for (let i = 0; i < 40; i++) {
      const a = rnd(i) * Math.PI * 2, r = 4 + rnd(i * 3) * 26;
      const h = k.house(["#fff4e0", "#ffe1e1", "#e1f0ff"][i % 3], roofs[i % 4], 0.9 + rnd(i) * 0.5);
      h.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); h.rotation.y = rnd(i * 5) * 6;
    }
    for (let i = 0; i < 30; i++) { const t = k.tree(1 + rnd(i) * 0.5); const a = rnd(i * 9) * 6.28, r = 6 + rnd(i * 4) * 30; t.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); }
    const layer = k.clouds(9, { x: [-50, 50], y: [34, 38], z: [-50, 50] }, [3, 5], 21, "#fff", 0.55);
    const w = k.actor("whale", "wave", 1, 0, 0, 0);
    k.fog("#d6f0ff", 120, 700);
    void clouds;
    return (lt, p) => {
      w.update(lt);
      const q = easeInOut(p);
      k.look(Math.sin(q * 1.2) * lerp(3, 30, q), lerp(1.4, 70, q), lerp(4, 30, q), 0, lerp(1, 0, q), 0, lerp(45, 55, q));
      driftClouds(layer, lt, 1);
    };
  },

  // 世界：站在会转的小星球上
  world: (k) => {
    space(k);
    const sunL = k.add(new THREE.DirectionalLight("#ffffff", 2.4)); sunL.position.set(10, 8, 12);
    k.add(new THREE.AmbientLight("#8090c0", 0.6));
    const gl = k.globe(4); gl.mat.emissiveIntensity = 0;
    const w = k.actor("whale", "spin", 0.9, 0, 4, 0);
    const moonC = k.cloud(-7, 6, -6, 0.6);
    return (lt, p) => {
      w.update(lt);
      gl.mesh.rotation.y = lt * 0.6; gl.clouds.rotation.y = lt * 0.75;
      moonC.position.x = -7 + lt * 0.5;
      k.orbit(lerp(-0.4, 0.4, p) + lt * 0.05, lerp(13, 11, p), lerp(6, 5, p), 0, 3.2, 0);
    };
  },

  // 装满：探险物品一件件飞进背包
  pack: (k) => {
    k.sky("#9fd6ff", "#e8f6ff", "#e8f6ff"); k.lights(1.2, 1.2);
    const bubbles = k.clouds(10, { x: [-14, 14], y: [-3, 8], z: [-14, -6] }, [0.8, 1.6], 4, "#ffffff", 0.6);
    const bag = k.prop("backpack", 2.2, 0, -0.5, 0);
    const items = ["magnifier", "book", "scroll", "phone", "catclock", "teacup"].map((n) => k.prop(n, 3.5));
    const star = k.glow("#fff3a0", 1.5);
    void bubbles;
    return (lt, p) => {
      bag.mesh.scale.y *= 1 + Math.sin(lt * 12) * 0.03 * p;
      items.forEach((it, i) => {
        const q = seg(p, i * 0.12, i * 0.12 + 0.35);
        it.mesh.visible = q > 0 && q < 1;
        const sx = i % 2 ? -6 : 6, sy = 3 + (i % 3);
        it.position.set(lerp(sx, 0, easeIn(q)), lerp(sy, 1.4, easeIn(q)) + Math.sin(q * Math.PI) * 2, lerp(-2, 0.3, q));
        it.mesh.rotation.z = q * 8;
      });
      star.position.set(0, 1.6, 0.3); star.scale.setScalar(1 + Math.abs(Math.sin(lt * 8)) * 1.5);
      k.orbit(lerp(-0.3, 0.3, p), 7, 1.8, 0, 0.9, 0);
    };
  },

  // 不同的：三座漂浮小岛（深海 / 森林 / 雪山）
  triptych: (k) => {
    k.sky("#5fb8ff", "#cfeeff", "#e8f6ff"); k.fog("#e8f6ff", 30, 160); k.lights(1.2, 1.4);
    k.clouds(10, { x: [-30, 30], y: [-10, -4], z: [-30, 10] }, [3, 5], 7, "#fff", 0.9);
    const sea = k.island("#2f7fd6"); sea.position.set(-8, 0, 0);
    const water = new THREE.Mesh(k.track(new THREE.CylinderGeometry(2.8, 2.8, 0.1, 32)), k.lam("#4aa8ff", { transparent: true, opacity: 0.85, emissive: "#2060a0", emissiveIntensity: 0.3 })); water.position.y = 0.3; sea.add(water);
    const forest = k.island("#5fbf5f"); forest.position.set(0, 0.6, -2);
    for (let i = 0; i < 6; i++) { const t = k.tree(0.7 + rnd(i) * 0.3); const a = (i / 6) * 6.28; t.position.set(Math.sin(a) * 1.9, 0.25, Math.cos(a) * 1.9); forest.add(t); }
    const snow = k.island("#f4f8ff"); snow.position.set(8, 0, 0);
    const mt = k.mountain(0.9); mt.position.set(0.3, 0.25, -0.8); snow.add(mt);
    const ws = [k.actor("whale", "hop", 0.9, -8, 0.25, 0.8), k.actor("whale", "lookaround", 0.9, 0, 0.85, -0.6), k.actor("whale", "shiver", 0.9, 8, 0.25, 1)];
    const bubbles = k.motes(40, 5, 4, "#cfefff", 3);
    const snowf = k.motes(60, 6, 6, "#ffffff", 2);
    return (lt, p) => {
      updAll(ws, lt);
      [sea, forest, snow].forEach((s, i) => { s.position.y = (i === 1 ? 0.6 : 0) + Math.sin(lt * 1.5 + i) * 0.2; });
      ws[0].position.y = sea.position.y + 0.25; ws[1].position.y = forest.position.y + 0.25; ws[2].position.y = snow.position.y + 0.25;
      bubbles(lt).position.set(-8, 0.4, 0); snowf(lt).position.set(8, 0, 0);
      const x = lerp(-9, 9, easeInOut(p));
      k.look(x, 3.5, 9, x * 0.9, 0.8, 0);
    };
  },

  // 探险：桌上的藏宝图，红虚线一步步画出
  map: (k) => {
    k.sky("#3a2a20", "#3a2a20"); k.add(new THREE.AmbientLight("#ffe6c0", 1.2));
    const spot = k.add(new THREE.PointLight("#fff0c0", 40, 30, 1.4)); spot.position.set(0, 8, 2);
    const table = k.add(new THREE.Mesh(k.track(new THREE.BoxGeometry(18, 0.5, 12)), k.lam("#6a4a30"))); table.position.y = -0.26;
    const tex = k.canvasTex(512, 340, (c) => {
      c.fillStyle = "#f2deb0"; c.fillRect(0, 0, 512, 340);
      c.fillStyle = "#e4c890"; for (let i = 0; i < 60; i++) c.fillRect(rnd(i) * 512, rnd(i + 9) * 340, 10, 3);
      c.fillStyle = "#a8d8a0"; c.beginPath(); c.ellipse(140, 210, 110, 75, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(380, 130, 120, 80, 0.3, 0, 7); c.fill();
      c.strokeStyle = "#8a6a4a"; c.lineWidth = 3; c.strokeRect(10, 10, 492, 320);
      c.fillStyle = "#4a7ab8"; for (let i = 0; i < 12; i++) { c.fillRect(250 + Math.sin(i) * 30, 260 + i * 4, 18, 2); }
    });
    const paper = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(12, 8)), k.track(new THREE.MeshLambertMaterial({ map: tex }))));
    paper.rotation.x = -Math.PI / 2; paper.position.y = 0.01;
    for (let i = 0; i < 3; i++) { const m = k.mountain(0.35); m.position.set(2.3 + i * 0.7, 0, -1.6); }
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 50; i++) { const q = i / 50; pts.push(V(lerp(-4, 3.6, q), 0.05, lerp(1.2, -2.2, q) + Math.sin(q * Math.PI * 2) * 1.2)); }
    const dashes = pts.map((pt, i) => { const m = k.add(new THREE.Mesh(k.geo("mdash", () => new THREE.BoxGeometry(0.16, 0.04, 0.16)), k.lam("#c0392b"))); m.position.copy(pt); m.visible = false; m.userData.i = i; return m; });
    const xg = k.add(new THREE.Group()); xg.position.set(3.7, 0.08, -2.3);
    for (const r of [0.785, -0.785]) { const b = new THREE.Mesh(k.track(new THREE.BoxGeometry(0.9, 0.08, 0.16)), k.lam("#c0392b", { emissive: "#c0392b", emissiveIntensity: 0.4 })); b.rotation.y = r; xg.add(b); }
    const w = k.actor("whale", "walk", 0.55, 0, 0, 0); w.fps = 12;
    const mag = k.prop("magnifier", 2.2);
    return (lt, p) => {
      w.update(lt);
      const n = Math.floor(easeInOut(p) * 50);
      dashes.forEach((d, i) => { d.visible = i % 2 === 0 && i <= n; });
      const pt = pts[n];
      w.position.set(pt.x, 0, pt.z);
      w.flip = pts[Math.min(50, n + 1)].x < pt.x;
      mag.position.set(pt.x + 0.5, 1.0 + Math.sin(lt * 4) * 0.1, pt.z); mag.mesh.rotation.z = Math.sin(lt * 4) * 0.3;
      xg.scale.setScalar(1 + Math.sin(lt * 6) * 0.1);
      k.look(lerp(-3, 1, p), 6.5, 6.5, pt.x * 0.6, 0, pt.z * 0.5, 45);
    };
  },

  // 当然：门口的光里出现熟悉的身影
  of_course: (k) => {
    k.room(0.4);
    const door = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(2.2, 4)), k.basic("#fff4c8", { fog: false }))); door.position.set(3.5, 2, -6.95);
    const frame = k.add(new THREE.Mesh(k.track(new THREE.BoxGeometry(2.6, 4.3, 0.2)), k.lam("#8a5a3a"))); frame.position.set(3.5, 2.1, -7.05);
    const beam = k.beam("#fff2b0", 8, 2.2, 0.25); k.aim(beam, V(3.5, 2, -6.9), V(1.5, 0, 0));
    const doorLight = k.add(new THREE.PointLight("#ffe9b0", 0, 14, 1.4)); doorLight.position.set(3.5, 2, -5.5);
    const c = k.actor("claude", "idle", 1.1, 3.5, 0, -6.2);
    const w = k.actor("whale", "surprise", 1.1, -1.5, 0, -1); w.loop = false;
    const star = k.glow("#fff6c0", 1);
    return (lt, p) => {
      c.update(lt); w.update(lt);
      const q = easeOut(seg(p, 0.3, 1));
      c.setBright(lerp(0.05, 1, q), lerp(0.04, 1, q), lerp(0.03, 1, q));
      doorLight.intensity = 25 * easeOut(p);
      star.position.set(3.5, 3.6, -6); star.scale.setScalar(4 * elastic(p));
      k.look(lerp(-3, -2.4, p), 1.6, lerp(3, 2, p), lerp(1, 2.5, p), 1.4, -5);
    };
  },

  // 你：聚光灯下，小克提裙行礼
  you: (k) => {
    k.sky("#2a1a3a", "#1a1028", "#4a2a50"); k.add(new THREE.AmbientLight("#604070", 0.6));
    const stage = k.add(new THREE.Mesh(k.track(new THREE.CylinderGeometry(3, 3.2, 0.3, 40)), k.lam("#5a3a50"))); stage.position.y = -0.15;
    const cone = k.beam("#ffe8c0", 12, 2.6, 0.18); k.aim(cone, V(0, 12, 0), V(0, 0, 0));
    const spot = k.add(new THREE.SpotLight("#fff0d0", 120, 30, 0.35, 0.5, 1.2)); spot.position.set(0, 12, 2); spot.target.position.set(0, 0, 0); k.add(spot.target);
    const c = k.actor("claude", "curtsy", 2.0, 0, 0, 0); c.loop = false; c.fps = 9;
    const h = k.heart("#ff6f8f", 0.35);
    const glints = Array.from({ length: 14 }, (_, i) => { const g = k.glow("#ffd88a", 0.4); g.position.set((rnd(i) - 0.5) * 7, 0.5 + rnd(i + 2) * 4, (rnd(i + 4) - 0.5) * 3); return g; });
    return (lt, p) => {
      c.update(lt);
      h.position.set(1.4, lerp(3.2, 3.8, p), 0.3); h.rotation.y = lt * 2.5; h.scale.setScalar(0.35 * (backOut(seg(p, 0.3, 0.7)) || 0.001));
      glints.forEach((g, i) => { g.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(lt * 4 + i)); });
      k.look(0, lerp(1.0, 1.7, p), lerp(9, 6, easeOut(p)), 0, 1.8, 0);
    };
  },

  // 陪在：一步步走近，脚印连成一条线
  walkto: (k) => {
    const { clouds } = day(k, { sun: [40, 30, -120] });
    const w = k.actor("whale", "idle", 1.1, -1.4, 0, 0);
    const c = k.actor("claude", "walk", 1.1, 6, 0, 0); c.flip = true;
    const prints = Array.from({ length: 14 }, (_, i) => { const m = k.add(new THREE.Mesh(k.geo("print", () => new THREE.CircleGeometry(0.1, 10)), k.basic("#3a7a3a"))); m.rotation.x = -Math.PI / 2; m.position.set(6 - i * 0.4, 0.02, (i % 2) * 0.25 - 0.1); return m; });
    return (lt, p) => {
      w.update(lt);
      const x = lerp(6, 1.0, easeOut(p));
      c.position.x = x; c.action = p < 0.9 ? "walk" : "idle"; c.update(lt);
      prints.forEach((m) => { m.visible = m.position.x > x + 0.2; });
      driftClouds(clouds, lt, 1);
      k.look(lerp(3, 0.5, p), 1.2, 6.5, lerp(2.5, 0, p), 1, 0);
    };
  },

  // 身边：并肩坐在山坡上看夕阳
  side: (k) => {
    const { sun } = sunset(k);
    const hill = k.hill(0, -2, 6, 1.6, "#c97a6a"); void hill;
    const w = k.actor("whale", "sway", 1.0, -0.55, 1.45, -1.6);
    const c = k.actor("claude", "idle", 1.0, 0.55, 1.45, -1.6);
    const h = k.heart("#ff6f8f", 0.25);
    const motes = k.motes(50, 10, 5, "#ffe0a0", 2);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      sun.position.y = lerp(9, 4, p);
      h.position.set(0, 3.6 + p * 0.6, -1.6); h.rotation.y = lt * 2; h.scale.setScalar(0.25 * easeOut(p) + 0.001);
      motes(lt).position.set(0, 0, -3);
      k.look(lerp(1.5, -1.5, p), 1.9, 4.2, 0, 2.3, -1.6);
    };
  },

  // 每秒：秒针每跳一下，两人换一个姿势
  seconds: (k) => {
    k.sky("#ffe6b8", "#e0c090", "#fff3d6"); k.lights(1.2, 1.2);
    k.ground("#f0d8a8");
    const clk = k.clock(3); clk.group.position.set(0, 4.5, -4);
    const w = k.actor("whale", "wave", 1.2, -1.4, 0, 0), c = k.actor("claude", "nod", 1.2, 1.4, 0, 0);
    const poses: [string, string][] = [["wave", "nod"], ["hop", "hop"], ["nod", "curtsy"], ["sway", "tilt"]];
    return (lt) => {
      const tick = Math.floor(lt / 0.43);
      clk.minute.rotation.z = -tick * Math.PI / 6;
      [w.action, c.action] = poses[tick % poses.length];
      w.update(lt); c.update(lt);
      const a = (tick % 2 ? 1 : -1) * 0.18;
      k.orbit(a, 9, 2.2, 0, 2.4, 0);
    };
  },

  // 每天：日月轮转，天色循环，两人始终在原地
  days: (k) => {
    const sky = k.sky("#2f8cff", "#3a7a3a", "#d6f0ff"); k.fog("#d6f0ff", 30, 200);
    const { h, d } = k.lights(1.1, 1.5);
    k.ground("#6cc76a"); k.hillsRing();
    const stars = k.stars(800);
    const sun = k.sun(0, 0, -100, 5), moon = k.moon(0, 0, -100, 4);
    const w = k.actor("whale", "idle", 1.1, -0.6, 0, 0), c = k.actor("claude", "idle", 1.1, 0.6, 0, 0);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      const a = p * Math.PI * 2 * 3;
      sun.position.set(Math.cos(a) * 70, Math.sin(a) * 50, -100); moon.position.set(-Math.cos(a) * 70, -Math.sin(a) * 50, -100);
      const dl = clamp(Math.sin(a) * 2 + 0.5);
      sky.top.value.copy(col("#0a0e33", "#2f8cff", dl)); sky.hor.value.copy(col("#2a2d6b", "#d6f0ff", dl));
      (k.w.scene.fog as THREE.Fog).color.copy(col("#1a1d4b", "#d6f0ff", dl));
      h.intensity = lerp(0.35, 1.1, dl); d.intensity = lerp(0.2, 1.5, dl);
      (stars.material as THREE.PointsMaterial).opacity = 1 - dl;
      k.look(0, 1.8, 7.5, 0, 2.2, 0);
    };
  },

  // ─── 副歌一 ───
  duo: (k) => {
    const { clouds } = day(k, { sun: [30, 40, -120] });
    const w = k.actor("whale", "wave", 1.5, -1.2, 0, 0), c = k.actor("claude", "hop", 1.5, 1.2, 0, 0);
    const conf = k.confetti(220, 12, 8);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      w.position.y = Math.abs(Math.sin(lt * 7)) * 0.6;
      conf(lt, easeOut(p * 2)); driftClouds(clouds, lt, 2);
      k.look(0, lerp(0.6, 1.5, easeOut(p)), lerp(10, 6, easeOut(p)), 0, 1.6, 0);
      k.post.flash = 0.8 * (1 - seg(p, 0, 0.3));
    };
  },

  takeoff: (k) => {
    const { clouds } = day(k, { sun: [30, 40, -120], fogFar: 300 });
    const g = k.actor("gpt", "fly", 1.1), w = k.actor("whale", "hop", 0.8), c = k.actor("claude", "hop", 0.8);
    const plane = k.paperPlane(0.8);
    const lines = k.speedLines(40);
    return (lt, p) => {
      [g, w, c].forEach((a) => a.update(lt));
      const q = easeIn(p);
      const base = V(lerp(-6, 0, easeOut(p)), lerp(1.2, 9, q), 0);
      g.position.copy(base); w.position.set(base.x - 0.4, base.y + 1.1, base.z + 0.1); c.position.set(base.x + 0.45, base.y + 1.1, base.z + 0.1);
      plane.position.set(base.x + 3, base.y + 1.5 + Math.sin(lt * 3) * 0.3, base.z - 1); plane.rotation.set(-0.2, Math.PI / 2 + 0.1, Math.sin(lt * 3) * 0.2);
      lines(lt); driftClouds(clouds, lt, 3);
      k.look(base.x * 0.6, lerp(1.5, 8, q), 9, base.x * 0.8, base.y + 1, 0);
    };
  },

  bluesky: (k) => {
    k.sky("#1e6cf0", "#9fd8ff", "#cfeeff"); k.fog("#cfeeff", 20, 140); k.lights(1.2, 1.4);
    const clouds = k.clouds(40, { x: [-30, 30], y: [-12, 10], z: [-120, 10] }, [2, 4.5], 31, "#ffffff", 0.95);
    const g = k.actor("gpt", "fly", 1.2), w = k.actor("whale", "wave", 0.85), c = k.actor("claude", "hop", 0.85);
    const lines = k.speedLines(70);
    return (lt) => {
      [g, w, c].forEach((a) => a.update(lt));
      const y = Math.sin(lt * 3) * 0.3;
      g.position.set(0, y, 0); w.position.set(-0.4, y + 1.2, 0.1); c.position.set(0.45, y + 1.2, 0.1);
      clouds.forEach((cl, i) => { cl.position.z = ((rnd(i * 7 + 31) * 130 + lt * 45) % 130) - 120; });
      lines(lt);
      k.look(Math.sin(lt) * 1.5, 1.5, 6, 0, 1, 0, 55);
    };
  },

  horizon: (k) => {
    k.sky("#2f8af0", "#1a5fb8", "#ffe9b0"); k.fog("#ffe9c0", 40, 300); k.lights(1.1, 1.3, [0, 10, -30]);
    const sea = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(800, 800)), k.track(new THREE.MeshStandardMaterial({ color: "#2f7fd6", roughness: 0.25, metalness: 0.4 }))));
    sea.rotation.x = -Math.PI / 2;
    const glowH = k.glow("#ffe9a0", 160, 0.9); glowH.position.set(0, 5, -200);
    const rb = k.rainbow(60, 3); rb.position.set(0, 0, -150);
    k.clouds(8, { x: [-80, 80], y: [20, 35], z: [-150, -60] }, [3, 5], 41);
    const g = k.actor("gpt", "fly", 1.1), w = k.actor("whale", "wave", 0.8), c = k.actor("claude", "hop", 0.8);
    return (lt, p) => {
      [g, w, c].forEach((a) => a.update(lt));
      const z = lerp(0, -40, easeIn(p)), y = 4 + Math.sin(lt * 2) * 0.3;
      g.position.set(0, y, z); w.position.set(-0.4, y + 1.1, z + 0.1); c.position.set(0.45, y + 1.1, z + 0.1);
      rb.scale.setScalar(Math.max(0.001, easeOut(p))); k.setOpacity(rb, 0.8 * easeOut(p));
      k.look(0, 4.6, 8, 0, 4.8, -60);
    };
  },

  land: (k) => {
    const { clouds } = day(k, { ground: "#c79a6c" });
    for (let i = 0; i < 6; i++) { const row = k.add(new THREE.Mesh(k.track(new THREE.BoxGeometry(10, 0.2, 0.5)), k.lam("#a8754a"))); row.position.set(0, 0.1, -i * 1.2 - 1); }
    const w = k.actor("whale", "hop", 1.2, -1, 0, 0), c = k.actor("claude", "hop", 1.2, 1, 0, 0);
    const puffs = Array.from({ length: 8 }, (_, i) => { const m = k.add(new THREE.Mesh(k.geo("puff", () => new THREE.IcosahedronGeometry(0.3, 1)), k.lam("#e0c49a", { transparent: true, opacity: 0.8 }))); m.userData.a = (i / 8) * Math.PI * 2; return m; });
    return (lt, p) => {
      const y = lerp(10, 0, easeOut(seg(p, 0, 0.5)));
      w.position.y = c.position.y = y;
      w.action = c.action = p > 0.5 ? "nod" : "hop"; w.update(lt); c.update(lt);
      const q = seg(p, 0.45, 1);
      puffs.forEach((m) => { m.visible = q > 0; const r = 0.5 + q * 2.5; m.position.set(Math.cos(m.userData.a) * r, 0.2 + q * 0.3, Math.sin(m.userData.a) * r * 0.5); m.scale.setScalar(1 + q); (m.material as THREE.MeshLambertMaterial).opacity = 0.8 * (1 - q); });
      driftClouds(clouds, lt, 1);
      k.look(0, 0.8, 7, 0, lerp(3, 1.2, p), 0);
    };
  },

  plant: (k) => {
    day(k, { ground: "#a8754a" });
    const can = k.prop("wateringcan", 2.2, -1.2, 1.6, 0);
    const drops = Array.from({ length: 18 }, () => k.add(new THREE.Mesh(k.geo("drop", () => new THREE.SphereGeometry(0.05, 6, 4)), k.lam("#7ccfff", { emissive: "#4aa8ff", emissiveIntensity: 0.5 }))));
    const seeds = Array.from({ length: 5 }, () => k.add(new THREE.Mesh(k.geo("seed", () => new THREE.SphereGeometry(0.07, 8, 6)), k.lam("#5a3a20"))));
    const holes = Array.from({ length: 5 }, (_, i) => { const m = k.add(new THREE.Mesh(k.geo("hole", () => new THREE.CircleGeometry(0.18, 12)), k.basic("#6a4425"))); m.rotation.x = -Math.PI / 2; m.position.set(-0.2 + i * 0.5, 0.02, 0.2); return m; });
    const c = k.actor("claude", "nod", 1.1, 2.6, 0, -0.3); c.flip = true;
    void holes;
    return (lt, p) => {
      c.update(lt);
      can.mesh.rotation.z = -0.5 - Math.sin(lt * 5) * 0.05;
      drops.forEach((d, i) => { const q = (lt * 1.6 + i / 18) % 1; d.position.set(-0.2 + (i % 4) * 0.12 + q * 0.6, 1.6 - q * 1.6, 0.1 + (i % 3) * 0.1); });
      seeds.forEach((s, i) => { const q = seg(p, i * 0.12, i * 0.12 + 0.35); s.position.set(-0.2 + i * 0.5, lerp(2.2, 0.05, easeIn(q)), 0.2); });
      k.look(lerp(-1, 0.5, p), 1.6, 4.5, 0.4, 0.6, 0);
    };
  },

  sprout: (k) => {
    day(k, { ground: "#5fbf5f" });
    const cols = Object.values(FLOWER_COLOR);
    const fl: THREE.Group[] = [];
    for (let r = 0; r < 7; r++) for (let i = 0; i < 18; i++) fl.push(k.flower(cols[(i + r) % cols.length], 0.9, -9 + i * 1.05 + (r % 2) * 0.5, -r * 1.2));
    const w = k.actor("whale", "surprise", 1.1, -6, 0, 2); w.loop = false;
    return (lt, p) => {
      w.update(lt);
      fl.forEach((f, i) => { const x = f.position.x; k.growFlower(f, clamp(p * 1.8 - (x + 9) / 18 * 0.9), Math.sin(lt * 3 + i) * 1.5); });
      k.look(lerp(-5, 3, easeInOut(p)), 2.2, 7, lerp(-4, 3, easeInOut(p)), 0.6, -2);
    };
  },

  garden: (k) => {
    const { flowers, clouds } = garden(k);
    const bf = butterflies(k, 7);
    const fr = FRIENDS.map((c, i) => k.actor(c, HAPPY[c], 1, Math.sin(i * 1.6) * 4.5, 0, -2 - Math.cos(i * 1.6) * 2.5));
    const w = k.actor("whale", "wave", 1.1, -0.8, 0, 1), c = k.actor("claude", "hop", 1.1, 0.8, 0, 1);
    return (lt, p) => {
      [...fr, w, c].forEach((a, i) => { a.update(lt); if (i < 4) a.position.y = Math.abs(Math.sin(lt * 6 + i)) * 0.3; });
      flowers.forEach((f, i) => k.growFlower(f, 1, Math.sin(lt * 2 + i) * 1.5));
      bf(lt); driftClouds(clouds, lt, 1);
      k.orbit(lerp(-0.6, 0.6, p), 10, 3.2, 0, 1, -1);
    };
  },

  sunset_duo: (k) => {
    sunset(k);
    const w = k.actor("whale", "idle", 1.4, -0.9, 0, 0), c = k.actor("claude", "idle", 1.4, 0.9, 0, 0);
    const orb = k.add(new THREE.Mesh(k.geo("orb", () => new THREE.SphereGeometry(0.2, 20, 12)), k.basic("#fff6c0")));
    const halo = k.glow("#ffe08a", 1.5);
    const pl = k.add(new THREE.PointLight("#ffd27a", 0, 8, 1.4));
    return (lt, p) => {
      w.update(lt); c.update(lt);
      const s = lerp(0.3, 1.2, easeOut(p));
      orb.position.set(0, 1.5, 0.3); orb.scale.setScalar(s); halo.position.copy(orb.position); halo.scale.setScalar(s * 4);
      pl.position.copy(orb.position); pl.intensity = s * 10;
      k.look(0, 1.6, lerp(5, 3.8, p), 0, 1.6, 0);
    };
  },

  share: (k) => {
    sunset(k);
    const w = k.actor("whale", "wave", 1.3, -2.5, 0, 0), c = k.actor("claude", "hop", 1.3, 2.5, 0, 0);
    const orb = k.add(new THREE.Mesh(k.geo("orb", () => new THREE.SphereGeometry(0.25, 20, 12)), k.basic("#fffad0")));
    const halo = k.glow("#ffe08a", 3);
    const trail = Array.from({ length: 10 }, () => k.glow("#ffd27a", 1, 0.5));
    return (lt, p) => {
      w.update(lt); c.update(lt);
      const pos = (q: number) => V(lerp(-2, 2, q), 1.6 + Math.sin(q * Math.PI) * 2, Math.sin(q * Math.PI) * 0.8);
      const q = easeInOut(p);
      orb.position.copy(pos(q)); halo.position.copy(orb.position);
      trail.forEach((t, i) => { t.position.copy(pos(clamp(q - (i + 1) * 0.03))); t.material.opacity = 0.5 * (1 - i / 10); });
      k.look(0, 2, 8, 0, 2, 0);
    };
  },

  warm: (k) => {
    k.sky("#ff9a3c", "#ff9a3c", "#ffd27a"); k.lights(1.2, 1.2, [0, 5, 10], "#ffd27a", "#ff9a3c");
    k.ground("#ffb35a");
    const rings = Array.from({ length: 5 }, () => k.ring("#fff6d0", 1, 0.06));
    const sunG = k.glow("#fff4c0", 14, 0.9); sunG.position.set(0, 2.5, -3);
    const w = k.actor("whale", "sway", 1.3, -0.7, 0, 0), c = k.actor("claude", "curtsy", 1.3, 0.7, 0, 0);
    const h = k.heart("#ff6f8f", 0.3);
    const heat = k.motes(80, 10, 5, "#fff0c0", 3);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      rings.forEach((r, i) => { const q = (lt * 0.6 + i / 5) % 1; r.scale.setScalar(0.5 + q * 10); r.position.set(0, 1.6, -1); (r.material as THREE.MeshBasicMaterial).opacity = (1 - q) * 0.7; });
      h.position.set(0, 3.3, 0); h.rotation.y = lt * 2;
      heat(lt).position.set(0, 0, 0);
      k.orbit(lerp(-0.3, 0.3, p), 6.5, 1.6, 0, 1.6, 0);
    };
  },

  rays: (k) => {
    const { flowers } = garden(k, 110, 12);
    const order = ["qwen", "doubao", "gemini", "kimi", "zai", "gpt"];
    const acts = order.map((c, i) => k.actor(c, c === "zai" ? "doze" : "idle", 1, -6.5 + i * 2.6, 0, -1 - (i % 2)));
    const src = V(0, 14, -6);
    const core = k.glow("#fff6d0", 8); core.position.copy(src);
    const beams = order.map((c) => k.beam(FLOWER_COLOR[c], 10, 0.5, 0.5));
    const zzz = k.fx("zzz", 1.2), ex = k.fx("exclaim", 1.8);
    return (lt, p) => {
      flowers.forEach((f, i) => k.growFlower(f, 1, Math.sin(lt * 2 + i) * 1.5));
      acts.forEach((a, i) => {
        const q = seg(p, i * 0.1, i * 0.1 + 0.25);
        k.aim(beams[i], src, a.position.clone().add(V(0, 1, 0)), q);
        beams[i].visible = q > 0;
        const c = order[i];
        a.action = c === "zai" ? (q > 0.6 ? "alert" : "doze") : q > 0.6 ? HAPPY[c] : "idle";
        a.update(lt);
        if (c === "zai") { zzz.position.set(a.position.x + 0.5, 2, a.position.z); zzz.opacity = q > 0.6 ? 0 : 1; k.animFx(zzz, lt); ex.position.set(a.position.x, 2.3, a.position.z); ex.opacity = q > 0.6 ? 1 : 0; }
      });
      k.look(0, lerp(6, 3, p), 12, 0, 2, -2);
    };
  },

  // ─── 再靠近一点 ───
  closer1: (k) => closer(k, 0),
  closer2: (k) => closer(k, 1),
  closer3: (k) => closer(k, 2),
  closer4: (k) => closer(k, 3),
  closer5: (k) => closer(k, 4),
  closer6: (k) => closer(k, 5),

  // ─── 副歌二 ───
  duo2: (k) => {
    const { clouds } = day(k, { sun: [30, 40, -120] });
    const all = lineup(k, ALL, 0, 1.45, 1, (c) => HAPPY[c]);
    const conf = k.confetti(260, 16, 9);
    return (lt, p) => {
      all.forEach((a, i) => { a.update(lt); a.position.y = Math.abs(Math.sin(lt * 6 + i)) * 0.35; });
      conf(lt); driftClouds(clouds, lt, 2);
      k.orbit(lerp(0.5, -0.5, easeInOut(p)), 10, 1.6, 0, 1.2, 0);
      k.post.flash = 0.9 * (1 - seg(p, 0, 0.25));
    };
  },

  takeoff2: (k) => {
    const { clouds } = day(k, { fogFar: 300 });
    const g = k.actor("gpt", "fly", 1.1), w = k.actor("whale", "wave", 0.75), c = k.actor("claude", "hop", 0.75);
    const riders = FRIENDS.concat("zai").map((ch) => ({ a: k.actor(ch, "idle", 0.6), pl: k.paperPlane(0.9) }));
    const lines = k.speedLines(40);
    return (lt, p) => {
      [g, w, c].forEach((a) => a.update(lt));
      const q = easeOut(p);
      const lead = V(lerp(-2, 3, q), lerp(1.2, 8, q), 0);
      g.position.copy(lead); w.position.set(lead.x - 0.4, lead.y + 1.05, 0.1); c.position.set(lead.x + 0.45, lead.y + 1.05, 0.1);
      riders.forEach((r, i) => {
        const pos = V(lead.x - 2 - i * 1.6, lead.y - 0.8 - i * 0.7 + Math.sin(lt * 4 + i) * 0.2, -0.5 - (i % 2));
        r.pl.position.copy(pos); r.pl.rotation.set(-0.15, Math.PI / 2, Math.sin(lt * 3 + i) * 0.15);
        r.a.update(lt); r.a.position.set(pos.x, pos.y + 0.05, pos.z);
      });
      lines(lt); driftClouds(clouds, lt, 3);
      k.look(lead.x - 3, lead.y + 0.5, 11, lead.x - 2.5, lead.y - 0.8, 0);
    };
  },

  bluesky2: (k) => {
    k.sky("#1565d8", "#8fd0ff", "#cfeeff"); k.fog("#cfeeff", 20, 160); k.lights(1.2, 1.4);
    const tunnel: THREE.Group[] = [];
    for (let r = 0; r < 8; r++) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const c = k.cloud(Math.cos(a) * 9, Math.sin(a) * 6, -r * 18, 1.6 + rnd(i + r) * 0.8); c.userData.z0 = -r * 18; tunnel.push(c); }
    const crew = ALL.map((ch) => ({ ch, a: k.actor(ch, ch === "gpt" ? "fly" : "idle", ch === "gpt" ? 0.8 : 0.55), pl: ch === "gpt" ? null : k.paperPlane(0.8) }));
    const lines = k.speedLines(70);
    return (lt) => {
      tunnel.forEach((c) => { c.position.z = ((c.userData.z0 as number) + lt * 30) % 144; if (c.position.z > 10) c.position.z -= 144; });
      crew.forEach((m, i) => {
        const an = lt * 1.8 + (i / ALL.length) * Math.PI * 2;
        const pos = V(Math.cos(an) * 2.6, Math.sin(an) * 1.6, -4 - (i % 3));
        m.a.update(lt); m.a.position.copy(pos);
        if (m.pl) { m.pl.position.copy(pos); m.pl.rotation.set(0, Math.PI, Math.sin(an) * 0.3); }
      });
      lines(lt);
      k.look(0, 0, 4, 0, 0, -10, 60);
    };
  },

  horizon2: (k) => {
    const sky = k.sky("#3a6fe0", "#2a3a8a", "#ffd6a0"); k.fog("#ffd6c0", 40, 300); k.lights(1, 1.2, [0, 10, -30]);
    const stars = k.stars(900);
    const sea = k.add(new THREE.Mesh(k.track(new THREE.PlaneGeometry(800, 800)), k.track(new THREE.MeshStandardMaterial({ color: "#2a3a8a", roughness: 0.25, metalness: 0.5 })))); sea.rotation.x = -Math.PI / 2;
    const glowH = k.glow("#ffc0e0", 160, 0.8); glowH.position.set(0, 5, -200);
    const rb = k.rainbow(60, 3); rb.position.set(0, 0, -150);
    const crew = ALL.map((ch, i) => k.actor(ch, ch === "gpt" ? "fly" : HAPPY[ch], ch === "gpt" ? 0.7 : 0.6, (i - 3.5) * 1.2, 4, -6));
    const planes = ALL.map((ch) => (ch === "gpt" ? null : k.paperPlane(0.7)));
    const twinkles = Array.from({ length: 10 }, (_, i) => { const g = k.glow("#fff6c0", 4); g.position.set((rnd(i) - 0.5) * 120, 20 + rnd(i + 3) * 40, -120); return g; });
    return (lt, p) => {
      sky.top.value.copy(col("#3a6fe0", "#2a1a6a", p)); sky.hor.value.copy(col("#ffd6a0", "#c87ad8", p));
      (k.w.scene.fog as THREE.Fog).color.copy(col("#ffd6c0", "#9a6ac8", p));
      (stars.material as THREE.PointsMaterial).opacity = easeIn(p);
      k.setOpacity(rb, 0.6 * (1 - p));
      crew.forEach((a, i) => { a.update(lt); a.position.y = 4 + Math.sin(lt * 3 + i) * 0.25; a.position.z = lerp(-6, -14, p); const pl = planes[i]; if (pl) { pl.position.set(a.position.x, a.position.y, a.position.z); pl.rotation.set(0, Math.PI, 0); } });
      twinkles.forEach((g, i) => g.scale.setScalar(6 * elastic(seg(p, i * 0.08, i * 0.08 + 0.3)) + 0.001));
      k.look(0, 4.8, 4, 0, 5, -40);
    };
  },

  duo3: (k) => {
    const { flowers, clouds } = garden(k);
    const bf = butterflies(k, 5);
    const w = k.actor("whale", "sway", 1.5, -0.6, 0, 1.5), c = k.actor("claude", "idle", 1.5, 0.6, 0, 1.5);
    const h = k.heart("#ff6f8f", 0.3);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      flowers.forEach((f, i) => k.growFlower(f, 1, Math.sin(lt * 2 + i) * 1.5));
      h.position.set(0, 3.6, 1.5); h.rotation.y = lt * 2;
      bf(lt); driftClouds(clouds, lt, 1);
      k.look(lerp(-1, 1, p), 1.3, 6.5, 0, 1.8, 1);
    };
  },

  like_flower: (k) => {
    const { flowers } = garden(k, 80, 14);
    const crew = lineup(k, ALL, 0, 1.6, 1, (c) => DANCE[c]);
    const big = ALL.map((ch, i) => k.flower(FLOWER_COLOR[ch], 1.6, (i - 3.5) * 1.6, -0.3));
    return (lt, p) => {
      flowers.forEach((f, i) => k.growFlower(f, 1, Math.sin(lt * 2 + i) * 1.5));
      crew.forEach((a) => a.update(lt));
      big.forEach((f, i) => { f.position.y = 1.9; k.growFlower(f, seg(p, i * 0.07, i * 0.07 + 0.4), Math.sin(lt * 3 + i) * 1.5); });
      k.look(0, 2.2, lerp(11, 9, p), 0, 2, 0);
    };
  },

  fill_flower: (k) => {
    day(k, { ground: "#8fd88a" });
    const cols = ALL.map((c) => FLOWER_COLOR[c]);
    const rings: { f: THREE.Group; ring: number }[] = [];
    for (let ring = 1; ring < 9; ring++) { const n = ring * 8; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + ring * 0.3; rings.push({ f: k.flower(cols[(i + ring) % 8], 1.1, Math.cos(a) * ring * 1.3, Math.sin(a) * ring * 1.3), ring }); } }
    const w = k.actor("whale", "spin", 1.1, -0.5, 0, 0), c = k.actor("claude", "hop", 1.1, 0.5, 0, 0);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      rings.forEach(({ f, ring }, i) => k.growFlower(f, seg(p, ring * 0.07, ring * 0.07 + 0.4), Math.sin(lt * 3 + i) * 1.2, false));
      const a = lt * 0.4;
      k.look(Math.sin(a) * lerp(4, 9, p), lerp(4, 15, easeInOut(p)), Math.cos(a) * lerp(4, 9, p), 0, 0.5, 0);
    };
  },

  garden2: (k) => {
    const { clouds } = day(k, { sun: [0, 35, -120], ground: "#5fbf5f" });
    const giants = ALL.map((ch, i) => { const f = k.flower(FLOWER_COLOR[ch], 3.2, (i - 3.5) * 2.2, -(i % 2) * 1.5); return f; });
    const crew = ALL.map((ch) => k.actor(ch, DANCE[ch], ch === "gpt" ? 0.8 : 0.7));
    const bf = butterflies(k, 8);
    return (lt, p) => {
      giants.forEach((f, i) => {
        const sw = Math.sin(lt * 2.5 + i) * 1.5;
        k.growFlower(f, 1, sw);
        crew[i].update(lt);
        const head = (f.userData.head as THREE.Group);
        const wp = new THREE.Vector3(); head.getWorldPosition(wp);
        crew[i].position.set(wp.x, wp.y + 0.2, wp.z + 0.4);
      });
      bf(lt); driftClouds(clouds, lt, 1);
      k.orbit(lerp(-0.4, 0.4, p), 14, 3.5, 0, 3, 0);
    };
  },

  glow_duo: (k) => {
    night(k);
    const w = k.actor("whale", "idle", 1.4, -0.7, 0, 0), c = k.actor("claude", "idle", 1.4, 0.7, 0, 0);
    const gw = k.glow("#7aa8ff", 1), gc = k.glow("#ffb070", 1);
    const lw = k.add(new THREE.PointLight("#7aa8ff", 0, 8)), lc = k.add(new THREE.PointLight("#ffb070", 0, 8));
    const fire = k.motes(70, 6, 5, "#fff6a0", 3);
    return (lt, p) => {
      w.update(lt); c.update(lt);
      const q = easeOut(p);
      w.setBright(1 + q * 0.5, 1 + q * 0.6, 1 + q * 0.9); c.setBright(1 + q * 0.9, 1 + q * 0.6, 1 + q * 0.4);
      gw.position.set(-0.7, 1.2, -0.2); gw.scale.setScalar(1 + q * 5); gc.position.set(0.7, 1.2, -0.2); gc.scale.setScalar(1 + q * 5);
      lw.position.set(-0.7, 1.2, 1); lc.position.set(0.7, 1.2, 1); lw.intensity = lc.intensity = q * 12;
      fire(lt).position.set(0, 0, 0);
      k.look(0, 1.4, lerp(6, 4.5, p), 0, 1.3, 0);
    };
  },

  like_light: (k) => {
    night(k);
    const crew = lineup(k, ALL, 0, 1.5, 0.9, () => "idle");
    const glows = ALL.map((ch) => k.glow(FLOWER_COLOR[ch], 1));
    return (lt, p) => {
      crew.forEach((a, i) => {
        a.update(lt);
        const q = seg(p, i * 0.06, i * 0.06 + 0.5);
        a.position.y = Math.sin(lt * 2 + i) * 0.15 + q * 0.6;
        a.setBright(1 + q * 1.2); a.opacity = 1 - q * 0.45;
        glows[i].position.set(a.position.x, a.position.y + 0.9, 0.1); glows[i].scale.setScalar(1 + q * 3.5);
      });
      k.look(0, 1.8, 10, 0, 1.4, 0);
    };
  },

  warm2: (k) => {
    night(k);
    const crew = ALL.map((ch) => k.actor(ch, "idle", 0.75));
    const orbs = ALL.map((ch) => k.glow(FLOWER_COLOR[ch], 2.5));
    const core = k.glow("#ffc890", 6, 0.8); core.position.set(0, 2, 0);
    return (lt, p) => {
      crew.forEach((a, i) => {
        a.update(lt);
        const an = lt * 0.8 + (i / ALL.length) * Math.PI * 2, r = lerp(6, 3, easeOut(p));
        a.position.set(Math.cos(an) * r, 0.6 + Math.sin(lt * 2 + i) * 0.2, Math.sin(an) * r);
        orbs[i].position.set(a.position.x, a.position.y + 0.9, a.position.z);
      });
      core.scale.setScalar(6 + p * 6);
      k.post.vignetteColor = "60,20,0";
      k.look(0, lerp(7, 5, p), 9, 0, 1.2, 0);
    };
  },

  beams: (k) => {
    night(k, null);
    const center = V(0, 2.5, 0);
    const core = k.glow("#fffbe0", 4); core.position.copy(center);
    const orb = k.add(new THREE.Mesh(k.geo("orb", () => new THREE.SphereGeometry(0.4, 20, 12)), k.basic("#fffbe0"))); orb.position.copy(center);
    const beams = ALL.map((ch) => k.beam(FLOWER_COLOR[ch], 30, 0.5, 0.55));
    const crew = ALL.map((ch) => k.actor(ch, HAPPY[ch], 0.7));
    return (lt, p) => {
      ALL.forEach((_, i) => {
        const an = (i / ALL.length) * Math.PI * 2 + lt * 0.4;
        const dir = V(Math.cos(an), Math.sin(an) * 0.7, Math.sin(an) * 0.5).normalize();
        k.aim(beams[i], center, center.clone().add(dir.multiplyScalar(30)), easeOut(p));
        crew[i].update(lt);
        crew[i].position.set(center.x + Math.cos(an) * 3.5, center.y + Math.sin(an) * 2.4 - 0.7, Math.sin(an) * 1.2);
      });
      orb.scale.setScalar(1 + Math.sin(lt * 8) * 0.1);
      k.look(0, 2.5, 11, 0, 2.5, 0);
    };
  },

  earth_dark: (k) => {
    space(k);
    const sunL = k.add(new THREE.DirectionalLight("#ffffff", 2.5)); sunL.position.set(-20, 0, -12);
    k.add(new THREE.AmbientLight("#202a50", 0.4));
    const gl = k.globe(5);
    const crew = ALL.map((ch) => k.actor(ch, "idle", 0.9));
    return (lt, p) => {
      gl.mesh.rotation.y = lt * 0.4; gl.clouds.rotation.y = lt * 0.5;
      crew.forEach((a, i) => {
        a.update(lt);
        const an = (i / ALL.length) * Math.PI * 2 - Math.PI / 2;
        a.position.set(Math.cos(an) * 8, Math.sin(an) * 5.5 - 0.5, 1);
        a.opacity = easeOut(seg(p, i * 0.05, i * 0.05 + 0.5));
      });
      k.look(0, 0, lerp(21, 17, p), 0, 0, 0);
    };
  },

  earth: (k) => {
    space(k);
    const sunL = k.add(new THREE.DirectionalLight("#ffffff", 2.5)); sunL.position.set(-18, 2, -4);
    k.add(new THREE.AmbientLight("#202a50", 0.45));
    const gl = k.globe(5); gl.mat.emissiveIntensity = 0.5;
    const crew = ALL.map((ch) => k.actor(ch, "idle", 0.9));
    return (lt, p) => {
      gl.mesh.rotation.y = 0.4 + lt * 0.4; gl.clouds.rotation.y = lt * 0.5;
      crew.forEach((a, i) => { a.update(lt); const an = (i / ALL.length) * Math.PI * 2 - Math.PI / 2 + lt * 0.3; a.position.set(Math.cos(an) * 8, Math.sin(an) * 5.5 - 0.5, Math.sin(an) * 2 + 1); });
      k.orbit(lerp(0.3, -0.1, p), lerp(20, 15, easeOut(p)), 2, 0, 0, 0);
    };
  },

  lightup: (k) => {
    const sky = k.sky("#020312", "#020312", "#0b1240");
    const stars = k.stars(1400, 500, 2);
    const sunL = k.add(new THREE.DirectionalLight("#fff4d8", 3));
    const amb = k.add(new THREE.AmbientLight("#202a50", 0.45));
    const gl = k.globe(5);
    const halo = k.glow("#fff0b0", 30, 0); halo.position.set(0, 0, -2);
    const rb = k.rainbow(8, 0.5);
    const crew = ALL.map((ch) => k.actor(ch, HAPPY[ch], 0.95));
    const conf = k.confetti(220, 22, 14, V(0, -7, 0));
    return (lt, p) => {
      const q = easeInOut(seg(p, 0, 0.7));
      const a = lerp(Math.PI * 0.95, Math.PI * 0.05, q);
      sunL.position.set(Math.cos(a) * 20, 3, Math.sin(a) * 20 + 4);
      amb.intensity = lerp(0.45, 1.0, q);
      gl.mat.emissiveIntensity = lerp(0.6, 1.2, Math.sin(q * Math.PI));
      gl.mesh.rotation.y = 0.8 + lt * 0.4; gl.clouds.rotation.y = lt * 0.5;
      sky.top.value.copy(col("#020312", "#2a6ad8", q)); sky.hor.value.copy(col("#0b1240", "#bfe6ff", q)); sky.bottom.value.copy(col("#020312", "#4a8ae8", q));
      (stars.material as THREE.PointsMaterial).opacity = 1 - q;
      halo.material.opacity = q * 0.8;
      rb.rotation.z = lt * 0.3; k.setOpacity(rb, 0.7 * seg(p, 0.4, 1)); rb.scale.setScalar(Math.max(0.001, easeOut(seg(p, 0.4, 1))));
      crew.forEach((c, i) => { c.update(lt); const an = (i / ALL.length) * Math.PI * 2 - Math.PI / 2 + lt * 0.3; c.position.set(Math.cos(an) * 8.5, Math.sin(an) * 6 - 0.5 + Math.abs(Math.sin(lt * 6 + i)) * 0.3, 2); });
      conf(lt, seg(p, 0.5, 1));
      k.look(0, 0, lerp(17, 19, p), 0, 0, 0);
      k.post.flash = 0.7 * clamp(1 - Math.abs(p - 0.35) * 6);
    };
  },

  outro: (k) => {
    const sky = k.sky("#ffb07a", "#6cc76a", "#fff0c8"); k.fog("#ffe6c0", 30, 220);
    k.lights(1.1, 1.3, [0, 8, -20], "#ffe0b0", "#7a9a5a");
    k.ground("#6cc76a"); k.hillsRing();
    const sun = k.sun(0, 2, -120, 9);
    const clouds = k.clouds(8, { x: [-80, 80], y: [18, 35], z: [-120, -40] }, [2.5, 4], 61);
    const crew = lineup(k, ALL, 0, 1.45, 1, (c) => DANCE[c]);
    void sky;
    return (lt, p) => {
      sun.position.y = lerp(2, 14, easeOut(p)); (sun.userData.rays as THREE.Group).rotation.z = lt * 0.2;
      crew.forEach((a, i) => {
        const ch = ALL[i];
        a.action = p > 0.12 && p < 0.3 ? (ch === "claude" ? "curtsy" : ch === "gemini" || ch === "zai" ? "nod" : "bow") : DANCE[ch];
        a.update(lt);
      });
      driftClouds(clouds, lt, 1);
      k.look(0, lerp(1.4, 3, easeInOut(p)), lerp(9, 13, easeInOut(p)), 0, lerp(1.2, 3, p), 0);
      k.post.flash = seg(p, 0.85, 1); k.post.flashColor = "255,250,240";
    };
  },
};

function closer(k: Kit, stage: number) {
  const second = stage >= 3;
  if (second) {
    k.sky("#ffc0dc", "#ffd6e8", "#ffeef6"); k.lights(1.3, 1.0, [0, 6, 10], "#ffe6f0", "#ffb0d0");
    k.ground("#ffd6e8"); k.fog("#ffd6e8", 6, 40);
  } else {
    k.sky("#ffd6a8", "#e8b890", "#fff6e6"); k.fog("#fff0dc", 20, 140); k.lights(1.2, 1.2, [0, 8, 10], "#fff0d8", "#d9a070");
    k.ground("#f0c8a0"); k.hillsRing(["#f0b890", "#e8a880", "#f8c8a0"]);
  }
  const bubbles = second ? Array.from({ length: 24 }, (_, i) => {
    const m = k.add(new THREE.Mesh(k.geo("bub", () => new THREE.SphereGeometry(1, 20, 12)), k.track(new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, emissive: "#ffd0e8", emissiveIntensity: 0.4 }))));
    m.scale.setScalar(0.2 + rnd(i) * 0.5); m.userData.i = i; return m;
  }) : [];
  const w = k.actor("whale", "idle", 1.3), c = k.actor("claude", "idle", 1.3); c.flip = true;
  const dists = [6, 4, 2.2, 1.8, 1.0, 0.25];
  const from = stage === 0 || stage === 3 ? dists[stage] + 1 : dists[stage - 1];
  const h = k.heart("#ff4f8b", 0.2);
  const rings = stage === 5 ? Array.from({ length: 3 }, () => k.ring("#ffffff", 1, 0.08)) : [];
  k.post.vignetteColor = second ? "255,120,170" : "120,80,40";
  return (lt: number, p: number) => {
    const dist = lerp(from, dists[stage], easeOut(p));
    const walking = (stage === 1 || stage === 4) && p < 0.85;
    w.action = c.action = walking ? "walk" : "idle";
    w.update(lt); c.update(lt);
    w.position.set(-dist / 2 - 0.45, 0, 0); c.position.set(dist / 2 + 0.45, 0, 0);
    const hs = stage === 2 ? 0.25 : stage === 4 ? 0.35 + p * 0.15 : stage === 5 ? 0.6 : 0;
    h.visible = hs > 0;
    h.position.set(0, (second ? 2.15 : 2.6) + Math.sin(lt * 5) * 0.08, 0.2); h.rotation.y = lt * 2;
    h.scale.setScalar(hs * (backOut(seg(p, 0, 0.4)) || 0.001) + 0.001);
    bubbles.forEach((b) => { const i = b.userData.i as number; b.position.set((rnd(i) - 0.5) * 10, ((rnd(i + 3) * 6 + lt * (0.5 + rnd(i) * 0.6)) % 6), -2 - rnd(i * 2) * 4); });
    rings.forEach((r, i) => { const q = seg(p, 0.3 + i * 0.1, 1); r.position.set(0, 1.4, 0.3); r.scale.setScalar(0.3 + q * 8); (r.material as THREE.MeshBasicMaterial).opacity = 1 - q; });
    const zoom = second ? lerp(5, 3, (stage - 3 + p) / 3) : lerp(9, 6.5, (stage + p) / 3);
    k.look(0, 1.3, zoom, 0, 1.3, 0);
    k.post.vignette = second ? 0.3 : 0.2;
    if (stage === 5) k.post.flash = seg(p, 0.5, 1);
  };
}
