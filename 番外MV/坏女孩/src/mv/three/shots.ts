import * as THREE from "three";
import { START, AUDIO_END, TOTAL_END, FPS, barT, seg, ease, easeIn, easeOut, lerp, hash, type V3 } from "../core";
import { CUES, type Cue } from "../cues";
import * as K from "./kit";
import { SW, BAR_X, type SetId } from "./sets";
import { cam, glide, orbit, track, shake, type Cam, type Frame, type Kit, type ShotDef } from "./stage";

const Y = SW;
type Builder = (k: Kit, v: number) => (f: Frame) => Cam;

// ---------------- 常用机位 ----------------
const ST_WIDE = cam([0.5, 1.8, 8.6], [0, 1.25, 0], 36);
const ST_MED = cam([0.3, 1.5, 5.4], [0, 1.05, 0.2], 34);
const ST_CLOSE = cam([0.15, 1.38, 3.3], [0, 1.15, 0.2], 32);
const BAR_WIDE = cam([0, 3.4, 8.5], [0, 1.2, -2.5], 42);

// ---------------- 小部件 ----------------
/** 两只手之间的发光丝带：snap 0 完好，>0 断开并收回 */
function ribbon(k: Kit, color = 0xff6fa8) {
  const m = K.basic(color, 1, true);
  const mk = () => {
    const g = new THREE.BoxGeometry(1, 0.035, 0.035);
    g.translate(0.5, 0, 0);
    return k.add(new THREE.Mesh(g, m));
  };
  const a = mk();
  const b = mk();
  const spark = k.add(K.fx("star", 0xffe0f0, 0.6, 1));
  const ga = k.add(K.glow(color, 0.5, 0.8));
  return (x0: number, x1: number, y: number, z: number, snap: number, alpha = 1) => {
    m.opacity = alpha;
    const d = Math.max(0.001, x1 - x0);
    a.visible = alpha > 0.01;
    a.position.set(x0, y, z);
    if (snap <= 0) {
      a.scale.x = d;
      a.rotation.z = 0;
      b.visible = false;
      spark.visible = false;
      ga.position.set((x0 + x1) / 2, y, z);
      K.setOpacity(ga, 0.8 * alpha);
    } else {
      const L = (d / 2) * (1 - easeOut(snap));
      const droop = 0.9 * Math.min(1, snap * 3);
      a.scale.x = Math.max(0.001, L);
      a.rotation.z = -droop;
      b.visible = alpha > 0.01;
      b.position.set(x1, y, z);
      b.scale.x = Math.max(0.001, L);
      b.rotation.z = Math.PI + droop;
      spark.position.set((x0 + x1) / 2, y, z + 0.05);
      const s = seg(snap, 0, 0.35);
      spark.scale.setScalar(0.3 + s * 1.2);
      K.setOpacity(spark, (1 - s) * alpha);
      K.setOpacity(ga, 0);
    }
  };
}
/** 眼泪：两侧交替滑落 */
function tears(k: Kit, n = 4) {
  const ds = Array.from({ length: n }, () => {
    const d = k.add(K.fx("drop", 0xcfe6ff, 0.06, 0.9, false));
    d.scale.set(0.045, 0.07, 1);
    return d;
  });
  return (T: number, x: number, y: number, z: number, side: number, a = 1) =>
    ds.forEach((d, i) => {
      const ph = (T * 0.85 + i / n) % 1;
      d.position.set(x + (i % 2 ? side : -side), y - ph * 0.5, z + 0.08);
      K.setOpacity(d, a * (1 - ph));
    });
}
/** 顶光光柱 + 地面光斑 */
function spot(k: Kit, color = 0xfff0f8, r = 1.1, h = 5) {
  const g = new THREE.ConeGeometry(r, h, 28, 1, true);
  g.translate(0, -h / 2, 0);
  const m = k.add(new THREE.Mesh(g, K.basic(color, 0.12, true)));
  const pool = k.add(K.disc(r, K.basic(color, 0.25, true)));
  return (x: number, y: number, z: number, a = 1) => {
    m.position.set(x, y + h, z);
    K.setOpacity(m, 0.12 * a);
    pool.position.set(x, y + 0.012, z);
    K.setOpacity(pool, 0.25 * a);
  };
}
/** 一圈闪烁的星光贴片 */
function sparkles(k: Kit, n = 14, color = 0xffffff) {
  const ss = Array.from({ length: n }, () => k.add(K.fx("star", color, 0.2, 1)));
  return (T: number, x: number, y: number, z: number, r: number, a = 1) =>
    ss.forEach((s, i) => {
      const ang = hash(i) * Math.PI * 2 + T * 0.4;
      const tw = 0.5 + 0.5 * Math.sin(T * 5 + i * 2);
      s.position.set(x + Math.cos(ang) * r * (0.6 + 0.5 * hash(i + 3)), y + hash(i + 5) * r * 1.4, z + Math.sin(ang) * r * 0.4);
      s.scale.setScalar(0.08 + 0.18 * tw);
      K.setOpacity(s, a * tw);
    });
}
const CROWD: [string, number, number][] = [
  ["kimi", -2.4, -3.2],
  ["gemini", -1.1, -2.1],
  ["qwen", 0.9, -3.4],
  ["zai", 2.2, -2.3],
  ["doubao", 3.2, -3.6],
];
/** 舞池路人：交替踩拍起跳；faceX 给定时全体侧身看向那里 */
function crowd(k: Kit) {
  const as = CROWD.map(([id]) => k.actor(id));
  return (f: Frame, o: { faceX?: number; alpha?: number; jump?: number; dx?: number } = {}) =>
    as.forEach((a, i) => {
      const [, x0, z] = CROWD[i];
      const x = x0 + (o.dx ?? 0);
      if (o.faceX !== undefined) a.side().flip(o.faceX < x);
      else if (i % 2) a.side().flip(Math.floor(f.bar) % 2 === 0);
      else a.front(f.T, i);
      a.at(x, 0, z).alpha(o.alpha ?? 1);
      if ((f.bi + i) % 2 === 0) a.bounce(f.pulse * (o.jump ?? 1), 0.22);
    });
}
/** 撑伞的路人 */
function passer(k: Kit, id: string, color: number) {
  const a = k.actor(id);
  const u = K.umbrella(color);
  k.add(u.g);
  u.set(1);
  return (x: number, z: number, dist: number, dir: 1 | -1) => {
    a.walkBy(dist).at(x, Y, z).flip(dir < 0);
    u.g.position.set(x + 0.1 * dir, Y + 1.95, z + 0.05);
  };
}

// ================================================================== 镜头
const B: Record<string, Builder> = {
  // ---- 片头：跳过前奏，从鼓点进入 ----
  title: (k) => {
    const w = k.actor("whale");
    return (f) => {
      f.fx.title = "pre";
      f.fx.titleA = ease(seg(f.u, 0.05, 0.35));
      w.front(f.T).at(0, Y, 0.3);
      return glide(cam([0, 9, 15], [0, 1.5, -2], 40), ST_WIDE, f.u, easeOut);
    };
  },

  // ---- 1 那时我放开了的手 ----
  letGo: (k, v) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const rb = ribbon(k);
    return (f) => {
      const sep = easeOut(seg(f.u, 0.3, 0.85));
      const cx = 0.38 + sep * 1.0;
      w.front(f.T).at(-0.38, Y, 0.3);
      if (sep > 0.02 && sep < 0.98) c.walkBy(sep * 1.0).at(cx, Y, 0.3);
      else c.front(f.T).at(cx, Y, 0.3);
      rb(-0.12, cx - 0.26, Y + 0.72, 0.36, seg(f.u, 0.58, 1));
      f.env.lamp0 = 1;
      return v === 0 ? glide(ST_MED, ST_CLOSE, f.u) : glide(cam([2.6, 0.55, 3.2], [0.1, 1.15, 0.3], 34), cam([1.4, 0.7, 2.6], [0.2, 1.1, 0.3], 32), f.u);
    };
  },

  // ---- 1 转过身只剩了保重 ----
  turnAway: (k, v) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const bub = k.add(K.bubble({ text: "保重", w: 0.95 }));
    return (f) => {
      const p = seg(f.u, 0.3, 1);
      const cx = lerp(0.9, -4.6, p);
      if (f.u < 0.3) c.side().flip(f.u > 0.12).at(0.9, Y, 0.3);
      else c.walkBy(0.9 - cx).at(cx, Y, 0.3).flip();
      w.side().flip().at(-0.25 + 0 * p, Y, 0.3);
      w.at(0.0, Y, 0.3);
      bub.position.set(0.9, Y + 1.85, 0.3);
      K.setOpacity(bub, f.u < 0.3 ? ease(seg(f.u, 0, 0.08)) : 1 - seg(f.u, 0.3, 0.42));
      if (v === 1) return cam([cx + 0.4, 1.4, 4.6], [cx - 0.4, 1.05, 0.3], 34);
      return glide(cam([0.4, 1.6, 6.6], [0.2, 1.1, 0.2], 36), cam([-0.8, 1.7, 7.4], [-2, 1.1, 0.2], 36), f.u);
    };
  },

  // ---- 2 你话都没说 却哭了很久很久 ----
  cry: (k, v) => {
    const w = k.actor("whale", 1, true);
    const tr = tears(k, 6);
    return (f) => {
      w.front(f.T, 0.4).at(0, Y, 0.3).tilt(0.02 * Math.sin(f.T * 1.3));
      tr(f.T, 0, Y + 1.0, 0.3, 0.13);
      f.env.rain = 1.5;
      if (v === 1) {
        f.env.dawn = ease(seg(f.u, 0.15, 1));
        f.env.lamp0 = 1 - 0.85 * ease(seg(f.u, 0.5, 1));
        return glide(ST_CLOSE, cam([0.8, 3.4, 9], [0, 1.6, 0], 40), f.u);
      }
      return glide(ST_MED, cam([0.05, 1.3, 2.4], [0, 1.15, 0.3], 30), f.u);
    };
  },

  // ---- 3 我喜欢坏坏的女友 ----
  badGirl: (k, v) => {
    const c = k.actor("claude");
    const w = k.actor("whale");
    const sp = spot(k, 0xff8ad0, 1.0);
    const sk = sparkles(k, 12, 0xffc0e8);
    const heart = k.add(K.fx("heart", 0xff3d9a, 0.4, 1));
    return (f) => {
      c.side().at(-2.6, 0, 1.2);
      w.front(f.T).at(0, 0, -2).flip(f.bi % 2 === 1).bounce(f.pulse, 0.18);
      if (v === 0) w.sil(0xff3d9a, 0.85);
      sp(0, 0, -2, 1);
      sk(f.T, 0, 0.3, -2, 1.0, 0.8);
      const hp = (f.t * 0.7) % 1;
      heart.position.set(-2.4 + hp * 0.3, 1.9 + hp * 0.5, 1.2);
      K.setOpacity(heart, 1 - hp);
      f.env.tiles = 0.9;
      return glide(cam([-3.6, 1.7, 4.4], [0, 1.1, -2.3], 36), cam([-3.1, 1.5, 3.6], [0, 1.15, -2.2], 33), f.u);
    };
  },

  // ---- 3 我喜欢刺激的感受 ----
  thrill: (k, v) => {
    const sc = K.scooter();
    k.add(sc.g);
    const rider = k.actor(v === 0 ? "claude" : "whale");
    return (f) => {
      const x = -30 + f.t * 10;
      sc.g.position.set(x, 0, 4.0);
      sc.set(1, f.T);
      rider.side().at(x - 0.18, 0.36, 4.0).tilt(-0.08).noShadow();
      rider.lift(Math.abs(Math.sin(f.T * 40)) * 0.012);
      f.env.wind = 3;
      f.env.rain = 1.2;
      if (v === 0) return shake(cam([x + 1.6, 1.0, 8.2], [x + 0.6, 0.85, 4], 40), 0.02, f.T);
      return shake(cam([x + 5, 0.45, 5.4], [x, 0.9, 4], 36), 0.025, f.T);
    };
  },

  // ---- 4 你单纯太过 多余了那些温柔 ----
  tooPure: (k, v) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const um = K.umbrella(0xff6f91);
    k.add(um.g);
    return (f) => {
      if (v === 0) {
        const reach = ease(seg(f.u, 0.4, 0.62)) * (1 - ease(seg(f.u, 0.8, 1)));
        const p = seg(f.u, 0.3, 1);
        const cx = lerp(0.35, 4.2, p);
        w.side().at(-0.45, Y, 0.3);
        if (f.u < 0.3) c.front(f.T).at(0.35, Y, 0.3);
        else c.walkBy(cx - 0.35).at(cx, Y, 0.3);
        um.set(1);
        um.g.position.set(-0.05 + reach * 0.7, Y + 1.95 - ease(seg(f.u, 0.8, 1)) * 0.45, 0.35);
        um.g.rotation.z = -reach * 0.25 + ease(seg(f.u, 0.8, 1)) * 0.35;
        f.env.rain = 1.2;
        return glide(cam([0.8, 1.6, 6.2], [0.3, 1.2, 0.3], 35), cam([1.8, 1.5, 6.6], [1.2, 1.15, 0.3], 35), f.u);
      }
      const close = ease(seg(f.u, 0.25, 0.55));
      const p = seg(f.u, 0.55, 1);
      const wx = lerp(-0.2, 2.6, p);
      if (f.u < 0.55) w.side().at(-0.2, Y, 0.3);
      else w.walkBy(wx + 0.2).at(wx, Y, 0.3);
      um.set(1 - close);
      um.g.position.set(-0.2 + 0.35 + (f.u > 0.55 ? 0 : 0), Y + 1.95 - close * 0.6, 0.35);
      um.g.rotation.z = close * 0.4;
      if (f.u > 0.55) {
        um.g.position.set(-0.05, Y + 0.08, 0.6);
        um.g.rotation.set(0, 0, Math.PI / 2 - 0.05);
      } else um.g.rotation.set(0, 0, close * 0.4);
      c.side().flip().at(5.5, Y, 0.2).tint(0x000000, 0.4);
      f.env.rain = 1.4;
      return glide(cam([0.6, 1.4, 5.2], [0.2, 1.1, 0.3], 34), cam([1.6, 1.6, 7.2], [1.8, 1.1, 0.3], 36), f.u);
    };
  },

  // ---- 5 你消失在无名大街 ----
  vanish: (k, v) => {
    const a = k.actor(v === 0 ? "whale" : "claude");
    return (f) => {
      f.env.fog = 2.6;
      f.env.cars = 0;
      if (v === 0) {
        const x = lerp(-13.2, -27, f.u);
        a.walkBy(-13.2 - x).at(x, Y, 0.1).flip().alpha(1 - easeIn(seg(f.u, 0.6, 1)));
        return glide(cam([-11.2, 1.55, 1.4], [-24, 1.3, -0.2], 38), cam([-11.6, 1.75, 1.6], [-26, 1.3, -0.2], 34), f.u);
      }
      const x = lerp(-26, -16.5, ease(seg(f.u, 0, 0.7)));
      if (f.u < 0.7) a.walkBy(x + 26).at(x, Y, 0.1);
      else a.side().flip(Math.floor(f.u * 10) % 2 === 0).at(x, Y, 0.1);
      return cam([-12.2, 1.5, 2.2], [-19, 1.2, 0], 36);
    };
  },

  // ---- 5 从此就没有再见面 ----
  neverMet: (k, v) => {
    if (v === 0) {
      const c = k.actor("claude");
      return (f) => {
        c.front(f.T).at(0, Y, 0.3);
        if (f.u > 0.5) c.side().flip(Math.floor(f.u * 6) % 2 === 0);
        f.env.cars = 0;
        return orbit([0, 1.1, 0.3], 5.2, -0.6 + f.u * 1.6, 1.8, 34, 1.0);
      };
    }
    const w = k.actor("whale");
    const c = k.actor("claude");
    return (f) => {
      const wx = lerp(-5, 5, f.u);
      const cx = lerp(5, -5, f.u);
      w.walkBy(wx + 5).at(wx, Y, 0.2);
      c.walkBy(5 - cx).at(cx, Y, 16.6).flip();
      return cam([0.8, 1.35, 19.4], [-0.4, 1.15, 8], 52);
    };
  },

  // ---- 6 好长的时间 再没有你的来电 ----
  noCall: (k, v) => {
    const a = k.actor(v === 0 ? "claude" : "whale");
    const phone = k.set.props!.phone;
    return (f) => {
      f.env.who = v === 0 ? "claude" : "whale";
      if (v === 0) {
        f.env.day = f.u * 4;
        a.side().at(1.1, 0, -1.4);
        phone.set(-1);
        return glide(cam([0.4, 1.6, 4.6], [1.2, 1.3, -2], 40), cam([1.0, 1.5, 3.6], [1.6, 1.2, -2.2], 38), f.u);
      }
      f.env.day = 0.03;
      a.front(f.T).at(1.2, 0, -1.4);
      const n = Math.round(Math.abs(Math.sin(f.t * 1.6)) * 7);
      phone.set(n);
      return glide(cam([1.4, 1.7, 3.6], [1.8, 1.1, -2.3], 36), cam([1.9, 1.4, 1.0], [2.0, 1.0, -2.4], 34), f.u);
    };
  },

  // ---- 7 在后来酒吧的房间 ----
  barEntry: (k, v) => {
    const a = k.actor(v === 0 ? "claude" : "whale");
    return (f) => {
      f.env.sign = v === 1 ? Math.min(1, seg(f.u, 0.05, 0.35) * 1.02) : 1;
      f.env.door = ease(seg(f.u, 0.45, 0.65)) * (1 - ease(seg(f.u, 0.9, 1)));
      const p = ease(seg(f.u, 0, 0.75));
      const x0 = v === 0 ? BAR_X - 4.2 : BAR_X + 4.2;
      const x = lerp(x0, BAR_X, p);
      const z = lerp(0.3, -1.4, seg(f.u, 0.5, 0.8));
      a.walkBy(Math.abs(x - x0) + Math.abs(z - 0.3)).at(x, Y, z).flip(v === 1).alpha(1 - ease(seg(f.u, 0.72, 0.86)));
      return glide(cam([BAR_X + 0.6, 1.5, 7.4], [BAR_X, 1.7, -2], 38), cam([BAR_X + 0.3, 1.9, 5.4], [BAR_X, 2.0, -2.5], 36), f.u);
    };
  },

  // ---- 7 舞池里跳动着音乐 ----
  dance: (k, v) => {
    const cr = crowd(k);
    const x = k.actor(v === 0 ? "claude" : "whale");
    return (f) => {
      cr(f);
      if (v === 0) x.side().flip().at(5.2, 0, -3.1);
      else x.front(f.T).at(0, 0, -1.4).bounce(f.pulse, 0.25).flip(f.bi % 2 === 0);
      if (f.beat < 0.08) f.fx.flash = 0.15;
      if (v === 0) return glide(cam([0, 5.2, 8.5], [0, 1, -2.5], 44), cam([0.5, 2.6, 6.8], [0, 1.1, -2.5], 42), f.u);
      return orbit([0, 1.0, -2.4], 5.5, 0.9 - f.u * 1.2, 0.5, 40, 1.3);
    };
  },

  // ---- 8 熟悉的侧脸 ----
  profile: (k, v) => {
    const near = k.actor(v === 0 ? "claude" : "whale");
    const far = k.actor(v === 0 ? "whale" : "claude");
    const sp = spot(k, 0xffe6f6, 0.8, 4.4);
    return (f) => {
      const turn = f.u > 0.82;
      near.side().at(2.4, 0, -0.6).sil(0x07050c, 1);
      far.side().flip().at(6.5, 0.36, -3.75);
      if (turn) {
        if (v === 0) far.front(f.T);
        else far.pose("front", f.T);
      }
      far.noShadow();
      sp(6.5, 0, -3.75, 1);
      f.env.tiles = 0.4;
      f.env.beams = 0.4;
      return glide(cam([2.0, 1.6, 1.3], [6.4, 1.3, -3.8], 32), cam([2.3, 1.55, 0.8], [6.4, 1.3, -3.8], 28), f.u);
    };
  },

  // ---- 8 迷人的笑脸 吸引视线 ----
  smile: (k, v) => {
    const w = k.actor("whale", 1.25, true);
    const cr = crowd(k);
    const sp = spot(k, 0xffd0f0, 1.3, 5);
    const sk = sparkles(k, 18);
    return (f) => {
      const cool = v === 1 ? ease(seg(f.u, 0.72, 0.9)) : 0;
      w.pose(cool > 0.5 ? "front" : "wave", f.T).at(0, 0, -1.6).bounce(f.pulse * (1 - cool), 0.06);
      if (cool > 0) w.tint(0x2a4fa0, 0.35 * cool);
      cr(f, { faceX: 0, alpha: 1 - cool, jump: 0.4 });
      sp(0, 0, -1.6, 1);
      sk(f.T, 0, 0.6, -1.4, 1.3, 1 - cool);
      if (f.beat < 0.07) f.fx.flash = 0.12;
      return glide(cam([0.4, 1.3, 5.6], [0, 1.4, -1.6], 38), cam([0.1, 1.7, 1.6], [0, 1.65, -1.6], 30), f.u);
    };
  },

  // ---- 9 慵懒的靠在陌生的肩 ----
  shoulder: (k, v) => {
    const g = k.actor("gpt");
    const w = k.actor("whale");
    const cl = k.actor("claude");
    return (f) => {
      const glance = v === 1 && f.u > 0.5 && f.u < 0.72;
      g.front(f.T, 0.3).at(-5.5, 0.22, -5.65).flip();
      w.front(f.T).at(-6.42, 0.28, -5.55).tilt(glance ? 0 : -0.24 + 0.02 * Math.sin(f.T * 1.5)).noShadow();
      if (v === 1) cl.side().flip().at(-3.6, 0, -2.4).sil(0x07050c, 1);
      f.env.tiles = 0.5;
      return glide(cam([-5.0, 1.25, -1.4], [-6.0, 0.95, -5.6], 34), cam([-5.4, 1.2, -2.4], [-6.0, 1.0, -5.6], 30), f.u);
    };
  },

  // ---- 9 黑色的眼线 你的指间 ----
  eyeliner: (k, v) => {
    const refl = k.actor("whale", 1.05, true);
    const real = k.actor("whale");
    const pen = K.pencil();
    k.add(pen);
    const tr = tears(k, 4);
    const sk = sparkles(k, 8, 0xffd0e8);
    return (f) => {
      const p = seg(f.u, 0.05, 0.5);
      refl.front(f.T).at(0, 0.82, -3.3).tint(0x1a0a22, v === 0 ? 0.18 * ease(p) : 0.25);
      pen.position.set(0.32 - p * 0.16, 1.98 + Math.sin(p * 9) * 0.02, -3.05);
      pen.rotation.set(0, 0, 0.9);
      pen.visible = f.u < 0.5;
      if (v === 1) {
        tr(f.T, 0, 1.92, -3.25, 0.12, f.u < 0.5 ? 1 : 0);
        f.env.bulbs = hash(Math.floor(f.T * 8)) > 0.25 ? 1 : 0.35;
      } else tr(f.T, 0, 0, 0, 0, 0);
      real.pose("point").flip().at(1.9, 0, 0.0);
      sk(f.T, 1.5, 0.9, -1.4, 0.4, v === 0 ? seg(f.u, 0.55, 0.7) : 0);
      return track(
        [
          [0, cam([0.3, 1.95, 0.6], [0, 1.9, -3.3], 26)],
          [0.48, cam([0.25, 1.95, 0.2], [0, 1.92, -3.3], 22)],
          [0.62, cam([3.6, 1.3, 3.4], [1.6, 1.0, -0.6], 34)],
          [1, cam([3.2, 1.2, 2.8], [1.6, 1.0, -0.6], 30)],
        ],
        f.u
      );
    };
  },

  // ---- 10 有一点轻蔑 ----
  disdain: (k, v) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const g = k.actor("gpt");
    const dz = k.add(K.bubble({ portrait: "p_claude_dizzy", atlas: k.A, w: 0.8 }));
    const ck = k.add(K.cocktail(0xff4d8d, 1.4));
    return (f) => {
      const away = f.u > 0.4;
      const cx = lerp(3.6, 5.1, ease(seg(f.u, 0, 0.35)));
      if (f.u < 0.35) c.walkBy(cx - 3.6).at(cx, 0, -3.2);
      else c.side().at(cx, 0, -3.2);
      if (v === 0) {
        w.side().flip(!away).at(6.4, 0.36, -3.75).noShadow();
        g.hide();
      } else {
        w.pose("point").flip(!away).at(6.4, 0.36, -3.75).noShadow();
        g.pose(away ? "point" : "front", f.T).at(7.5, 0, -3.9).flip();
      }
      dz.position.set(cx, 1.85, -3.2);
      K.setOpacity(dz, ease(seg(f.u, 0.5, 0.6)));
      ck.position.set(lerp(5.9, 8.0, ease(seg(f.u, 0.45, 0.8))), 1.18, -4.4);
      f.env.tiles = 0.5;
      return glide(cam([5.4, 1.55, 1.4], [5.9, 1.2, -3.8], 34), cam([5.9, 1.45, 0.4], [6.0, 1.2, -3.8], 30), f.u);
    };
  },

  // ---- 10 在谁的怀中会有感觉 ----
  whoseArms: (k, v) => {
    const w = k.actor("whale");
    const g = k.actor("gpt");
    const c = k.actor("claude");
    const cr = crowd(k);
    return (f) => {
      const glance = v === 0 && f.u > 0.45 && f.u < 0.62;
      w.front(f.T).at(-0.45, 0, -1.8).tilt(glance ? -0.12 : 0.1 + 0.03 * Math.sin(f.T * 3));
      if (f.bi % 2 === 0) w.bounce(f.pulse, 0.25);
      g.front(f.T, 0.2).at(0.55, 0, -1.9).flip();
      if (f.bi % 2 === 1) g.bounce(f.pulse, 0.2);
      cr(f, { alpha: 0.85, jump: 0.6, dx: 0 });
      if (v === 0) c.side().flip().at(5.2, 0, -3.1).tint(0x000000, 0.5);
      else {
        f.env.sideDoor = ease(seg(f.u, 0.15, 0.4)) * (1 - ease(seg(f.u, 0.85, 1)));
        const p = ease(seg(f.u, 0.2, 0.85));
        const x = lerp(-3.5, -8.7, p);
        c.walkBy(-3.5 - x).at(x, 0, 1.2).flip().tint(0x000000, 0.35).alpha(1 - seg(f.u, 0.8, 0.9));
      }
      return orbit([0, 1.1, -1.8], 5.2, -0.5 + f.u * 0.9, 1.6, 38, 1.15);
    };
  },

  // ---- 11 被爱的深夜我在想念 ----
  missing: (k, v) => {
    const w = k.actor("whale");
    const th = k.add(K.bubble({ think: true, portrait: "p_claude_neutral", atlas: k.A, w: 1.0 }));
    const star = k.add(K.glow(0xffffff, 1.2, 1));
    return (f) => {
      w.side().at(-0.6, 0, 2.2);
      th.position.set(-0.2, 1.75, 2.2);
      K.setOpacity(th, ease(seg(f.u, 0.25, 0.45)));
      const sp = seg(f.u, 0.55, 0.8);
      star.position.set(lerp(-30, 10, sp), lerp(34, 22, sp), -60);
      K.setOpacity(star, v === 1 && sp > 0 && sp < 1 ? 1 : 0);
      return glide(cam([-4.4, 1.3, 6.8], [0.5, 2.0, -6], 40), cam([-3.6, 1.9, 6.2], [1.0, 3.0, -6], 42), f.u);
    };
  },

  // ---- 11 明明是为你才会改变 ----
  changed: (k, v) => {
    const real = k.actor("whale");
    const refl = k.actor("whale");
    return (f) => {
      real.side().at(-1.6, 0, 0.4);
      if (v === 1 && f.u > 0.3) real.pose("point");
      if (v === 0) {
        const off = f.beat < 0.12 && f.bi % 2 === 0;
        refl.front(f.T).at(0.25, 0.75, -3.4).tint(0xff3d9a, off ? 0 : 0.45).noShadow();
      } else refl.pose("wave").at(0.25, 0.75, -3.4).tint(0xd9a066, 0.4).alpha(1 - ease(seg(f.u, 0.6, 0.95))).noShadow();
      return glide(cam([1.0, 1.75, 5.2], [-0.3, 1.5, -2], 36), cam([0.6, 1.7, 3.8], [-0.2, 1.55, -2.2], 33), f.u);
    };
  },

  // ---- 12 却回不到从前 ----
  noReturn: (k, v) => {
    const gw = k.actor("whale");
    const gc = k.actor("claude");
    const w = k.actor("whale");
    const c = k.actor("claude");
    const rb = ribbon(k, 0xffd7a0);
    return (f) => {
      const ghost = 0.6 * (1 - ease(seg(f.u, 0.2, 0.9)));
      gw.front(f.T).at(-0.38, Y, 0.25).tint(0xffd7a0, 0.55).alpha(ghost).noShadow();
      gc.front(f.T).at(0.38, Y, 0.25).tint(0xffd7a0, 0.55).alpha(ghost).noShadow();
      rb(-0.12, 0.12, Y + 0.72, 0.3, 0, ghost);
      if (v === 0) {
        w.side().flip().at(1.6, Y, 0.35);
        c.hide();
        return glide(ST_CLOSE, cam([0.6, 4.2, 11], [0, 1.4, 0], 40), f.u);
      }
      const d = 0.4 + 3.6 * ease(seg(f.u, 0.1, 1));
      w.walkBy(d).at(0.2 + d, Y, 0.35);
      c.walkBy(d).at(-0.2 - d, Y, 0.35).flip();
      return glide(ST_MED, cam([0.3, 2.6, 10], [0, 1.2, 0], 40), f.u);
    };
  },

  // ================= 间奏 =================
  cityCrane: () => {
    return (f) => {
      f.env.rain = 0.8;
      return glide(cam([-2.5, 1.3, 2.6], [1, 2.2, -20], 44), cam([2.5, 7, 9], [0, -2, -30], 46), f.u);
    };
  },
  walkHome: (k) => {
    const c = k.actor("claude");
    const p1 = passer(k, "kimi", 0xffd166);
    const p2 = passer(k, "qwen", 0x45e3ff);
    const p3 = passer(k, "zai", 0x9b5cff);
    return (f) => {
      const x = -8 + f.t * 1.25;
      c.walkBy(x + 8).at(x, Y, 0.3);
      const px = (o: number) => o - f.t * 1.1;
      p1(px(2), -0.8, f.t * 1.1, -1);
      p2(px(7), 0.9, f.t * 1.1, -1);
      p3(px(12), -1.0, f.t * 1.1, -1);
      f.env.rain = 1.2;
      return cam([x + 0.8, 1.5, 5.2], [x + 0.2, 1.1, 0.2], 36);
    };
  },
  window: (k) => {
    const w = k.actor("whale");
    const phone = k.set.props!.phone;
    return (f) => {
      f.env.who = "whale";
      f.env.day = 0.02;
      f.env.rain = 1.3;
      const look = f.u > 0.55 && f.u < 0.8;
      w.side().flip(look).at(1.0, 0, -2.0);
      phone.set(look ? 0 : -1);
      return glide(cam([-1.2, 1.5, 3.4], [1.4, 1.6, -3], 38), cam([-0.4, 1.6, 2.6], [1.4, 1.5, -3], 34), f.u);
    };
  },
  warmUp: (k) => {
    const d = k.actor("doubao");
    return (f) => {
      const build = seg(f.u, 0.1, 1);
      f.env.tiles = 0.15 + 0.85 * build;
      f.env.beams = build;
      d.side().flip(f.bi % 2 === 0).at(0, 0, -2).bounce(f.pulse * build, 0.25);
      if (f.u > 0.82 && f.beat < 0.1) f.fx.flash = 0.2 + 0.5 * seg(f.u, 0.82, 1);
      f.fx.flash = Math.max(f.fx.flash, ease(seg(f.u, 0.96, 1)) * 0.8);
      return glide(cam([0, 0.6, 3.2], [0, 1.0, -2], 34), BAR_WIDE, f.u, easeIn);
    };
  },

  // ================= 桥段 =================
  silence: (k) => {
    const c = k.actor("claude");
    const w = k.actor("whale");
    const b1 = k.add(K.bubble({ w: 0.7 }));
    const b2 = k.add(K.bubble({ w: 0.7 }));
    return (f) => {
      f.env.pendant = 1;
      f.env.tiles = 0.08;
      f.env.beams = 0;
      c.side().at(-6.3, 0.25, 2.4).noShadow();
      w.side().flip().at(-4.9, 0.25, 2.4).noShadow();
      const a = 0.55 + 0.45 * Math.sin(f.T * 2);
      b1.position.set(-6.3, 1.95, 2.4);
      b2.position.set(-4.9, 1.95, 2.4);
      K.setOpacity(b1, a);
      K.setOpacity(b2, 1 - a + 0.3);
      f.fx.vignette = 0.75;
      return glide(cam([-5.6, 1.5, 6.6], [-5.6, 1.15, 2.4], 34), cam([-5.6, 1.35, 5.0], [-5.6, 1.15, 2.4], 30), f.u);
    };
  },
  apart: (k) => {
    const c = k.actor("claude");
    const w = k.actor("whale");
    const tb = K.table(1, 0.9, 0.78, 0x3a2a2a, 0x241a1a);
    k.add(tb);
    const b1 = k.add(K.bubble({ w: 0.7 }));
    const b2 = k.add(K.bubble({ w: 0.7 }));
    return (f) => {
      f.env.pendant = 1;
      f.env.tiles = 0.05;
      f.env.beams = 0;
      const s = 1.5 + 6 * ease(seg(f.u, 0.15, 1));
      tb.position.set(-5.6, 0, 2.4);
      tb.scale.set(s, 1, 1);
      c.side().at(-5.6 - s / 2 - 0.1, 0.25, 2.4).noShadow();
      w.side().flip().at(-5.6 + s / 2 + 0.1, 0.25, 2.4).noShadow();
      const a = 1 - ease(seg(f.u, 0.1, 0.4));
      b1.position.set(-5.6 - s / 2 - 0.1, 1.95, 2.4);
      b2.position.set(-5.6 + s / 2 + 0.1, 1.95, 2.4);
      K.setOpacity(b1, a);
      K.setOpacity(b2, a);
      f.fx.vignette = 0.8;
      return glide(cam([-5.6, 1.35, 5.0], [-5.6, 1.15, 2.4], 30), cam([-5.6, 2.6, 9.6], [-5.6, 1.0, 2.4], 44), f.u);
    };
  },
  memory: (k) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const rb = ribbon(k, 0xff8fb8);
    const petals = Array.from({ length: 24 }, () => k.add(K.fx("petal", 0xffffff, 0.12, 1, false)));
    return (f) => {
      f.env.look = "memory";
      f.env.rain = 0;
      f.env.lamps = 0;
      f.env.sign = 0;
      f.fx.sepia = 0.5;
      f.fx.vignette = 0.75;
      const x = -3 + f.t * 0.9;
      w.walkBy(x + 3).at(x - 0.4, Y, 0.3);
      if (f.u > 0.4 && f.u < 0.75) w.pose("wave");
      c.walkBy(x + 3).at(x + 0.45, Y, 0.3);
      rb(x - 0.15, x + 0.2, Y + 0.72, 0.36, 0);
      petals.forEach((p, i) => {
        const ph = (f.T * 0.25 + hash(i)) % 1;
        p.position.set(x - 3 + hash(i + 1) * 6 + Math.sin(f.T + i) * 0.3, 3.5 - ph * 3.6, -0.8 + hash(i + 2) * 2.4);
        p.material.rotation = f.T + i;
        K.setOpacity(p, 0.9);
      });
      return cam([x + 0.3, 1.45, 4.6], [x, 1.1, 0.3], 36);
    };
  },
  run: (k) => {
    const c = k.actor("claude");
    return (f) => {
      const x = -10 + f.t * 4;
      c.walkBy(x + 10, 1.5).at(x, Y, 0.3).tilt(-0.12);
      f.env.rain = 1.5;
      f.env.wind = 2.4;
      if (f.u > 0.55 && f.beat < 0.1) f.fx.flash = 0.18 + 0.25 * seg(f.u, 0.55, 0.95);
      f.fx.flash = Math.max(f.fx.flash, ease(seg(f.u, 0.93, 1)));
      return shake(cam([x + 2.6, 1.0, 4.2], [x + 0.5, 1.0, 0.3], 36), 0.03, f.T);
    };
  },

  // ================= 尾段副歌 =================
  smile2: (k) => {
    const w = k.actor("whale", 1.25, true);
    const c = k.actor("claude");
    const cr = crowd(k);
    const sp = spot(k, 0xffd0f0, 1.3, 5);
    const sk = sparkles(k, 18);
    return (f) => {
      w.pose("wave", f.T).at(0, 0, -1.6).bounce(f.pulse, 0.06);
      cr(f, { faceX: 0, jump: 0.4 });
      c.side().flip().at(2.6, 0, -2.4);
      sp(0, 0, -1.6, 1);
      sk(f.T, 0, 0.6, -1.4, 1.3, 1);
      if (f.beat < 0.07) f.fx.flash = 0.12;
      return glide(cam([4.2, 1.2, 2.8], [0.4, 1.4, -1.4], 36), cam([3.3, 1.5, 1.6], [0.2, 1.5, -1.5], 32), f.u);
    };
  },
  standUp: (k) => {
    const g = k.actor("gpt");
    const w = k.actor("whale");
    return (f) => {
      const rage = f.u > 0.55 && f.u < 0.8;
      g.set(rage ? "gpt_boss_rage" : "gpt_boss_idle").at(-5.5, 0.22, -5.65).flip();
      if (f.u < 0.45) {
        const up = ease(seg(f.u, 0.2, 0.45));
        w.front(f.T).at(-6.42, lerp(0.28, 0, up), lerp(-5.55, -4.9, up)).tilt(-0.24 * (1 - up));
      } else {
        const d = (f.u - 0.45) * 7;
        w.walkBy(d).at(-6.42 + d, 0, -4.9);
      }
      return glide(cam([-5.0, 1.25, -1.4], [-6.0, 0.95, -5.6], 34), cam([-3.4, 1.4, -0.6], [-4.6, 1.0, -5.0], 36), f.u);
    };
  },
  wipe: (k) => {
    const refl = k.actor("whale", 1.05, true);
    const real = k.actor("whale");
    const pen = K.pencil();
    k.add(pen);
    return (f) => {
      const clean = ease(seg(f.u, 0.1, 0.5));
      refl.front(f.T).at(0, 0.82, -3.3).tint(0x1a0a22, 0.25 * (1 - clean));
      const fall = seg(f.u, 0.15, 0.4);
      pen.position.set(0.6 + fall * 0.4, 1.98 - fall * fall * 1.18, -1.6);
      pen.rotation.set(0, 0, 0.9 + fall * 2.6);
      real.pose(f.u > 0.6 ? "wave" : "front", f.T).flip().at(1.9, 0, 0.0);
      return track(
        [
          [0, cam([0.25, 1.95, 0.4], [0, 1.9, -3.3], 24)],
          [0.5, cam([0.4, 1.9, 0.8], [0.2, 1.7, -3.0], 28)],
          [0.65, cam([3.4, 1.35, 3.2], [1.6, 1.0, -0.6], 34)],
          [1, cam([3.0, 1.3, 2.6], [1.6, 1.0, -0.6], 30)],
        ],
        f.u
      );
    };
  },
  faceOff: (k) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    return (f) => {
      const away = f.u > 0.25 && f.u < 0.6;
      c.side().at(-0.55, Y, 0.3);
      w.side().flip(!away).at(0.55, Y, 0.3);
      f.env.rain = 0.9;
      return glide(cam([0, 1.4, 4.4], [0, 1.1, 0.3], 34), cam([0, 1.3, 3.2], [0, 1.15, 0.3], 30), f.u);
    };
  },
  umbrellaDown: (k) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const um = K.umbrella(0xff6f91);
    k.add(um.g);
    return (f) => {
      c.side().at(BAR_X - 3.6, Y, 0.3);
      w.side().flip().at(BAR_X - 1.6, Y, 0.3);
      um.set(0.15);
      um.g.position.set(BAR_X - 2.6, Y + 0.06, 0.55);
      um.g.rotation.set(0, 0.3, Math.PI / 2 - 0.05);
      f.env.sign = hash(Math.floor(f.T * 6)) > 0.2 ? 1 : 0.4;
      f.env.rain = 1.1;
      return glide(cam([BAR_X - 2.6, 1.6, 6.8], [BAR_X - 2.4, 1.2, -1], 38), cam([BAR_X - 2.6, 1.2, 4.4], [BAR_X - 2.6, 0.8, 0.3], 34), f.u);
    };
  },
  twoRoofs: (k) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    const t1 = k.add(K.bubble({ think: true, portrait: "p_claude_neutral", atlas: k.A, w: 0.9 }));
    const t2 = k.add(K.bubble({ think: true, portrait: "p_whale_neutral", atlas: k.A, w: 0.9 }));
    return (f) => {
      w.side().at(1.6, 0, 1.6);
      c.side().flip().at(8.6, -1.0, -1.0);
      const a = ease(seg(f.u, 0.3, 0.5));
      t1.position.set(1.9, 1.8, 1.6);
      t2.position.set(8.4, 0.8, -1.0);
      K.setOpacity(t1, a);
      K.setOpacity(t2, a);
      return glide(cam([4.6, 1.6, 11], [5, 1.8, -4], 44), cam([4.8, 2.4, 12.5], [5, 3.4, -6], 46), f.u);
    };
  },
  accept: (k) => {
    const real = k.actor("whale");
    const refl = k.actor("whale");
    return (f) => {
      const p = ease(seg(f.u, 0.2, 0.7));
      real.side().at(-1.6, 0, 0.4);
      if (f.u > 0.75) real.front(f.T);
      refl.pose(f.u > 0.4 ? "wave" : "front", f.T).at(0.25, 0.75, -3.4).tint(0xd9a066, 0.4 * (1 - p)).noShadow();
      f.env.bulbs = 0.6 + 0.4 * p;
      return glide(cam([0.6, 1.7, 3.8], [-0.2, 1.55, -2.2], 33), cam([0.2, 1.6, 5.6], [-0.4, 1.4, -2], 38), f.u);
    };
  },
  lampOut: (k) => {
    const w = k.actor("whale");
    const c = k.actor("claude");
    return (f) => {
      const on = f.u < 0.45 ? 1 : f.u < 0.62 ? (hash(f.frame) > 0.5 ? 1 : 0.15) : 0;
      f.env.lamp0 = on;
      c.side().flip().at(-0.4, Y, 0.3);
      w.side().at(0.45, Y, 0.3);
      f.fx.black = ease(seg(f.u, 0.62, 1));
      return glide(ST_MED, cam([0.3, 3.2, 9.5], [0, 1.4, 0], 40), f.u);
    };
  },
  endCard: (k) => {
    const w = k.actor("whale");
    return (f) => {
      f.fx.title = "end";
      f.fx.titleA = ease(seg(f.u, 0, 0.3));
      f.env.lamp0 = 0.6;
      w.side().at(-6 + f.t * 0.6, Y, 0.3).alpha(0.8);
      w.walkBy(f.t * 0.6);
      return glide(ST_WIDE, cam([0, 6, 15], [0, 2, -2], 40), f.u);
    };
  },
};

// ================================================================== 时间轴
interface PlanItem {
  b: string;
  set: SetId;
  title: string;
  cast: string;
  note: [string, string?];
}
/** 主歌副歌 20 句：k → 镜头（第二遍同一镜头换变体） */
const VERSE_PLAN: PlanItem[] = [
  { b: "letGo", set: "street", title: "放开的手", cast: "鲸鱼娘 / Claude", note: ["路灯下两人牵着手，手间一条发光丝带；Claude 侧身走开，丝带被拉断", "同一刻换成低机位侧拍"] },
  { b: "turnAway", set: "street", title: "保重", cast: "Claude / 鲸鱼娘", note: ["Claude 说「保重」后转身沿街走远（步态按位移播帧），鲸鱼娘侧身望着", "镜头跟着他的背影走"] },
  { b: "cry", set: "street", title: "雨不停", cast: "鲸鱼娘", note: ["大号鲸鱼娘站在路灯下，一句话没说，泪一直往下掉，镜头慢慢推近", "天色从夜一路亮到黎明、路灯熄灭——哭了很久很久"] },
  { b: "badGirl", set: "bar", title: "坏女孩", cast: "Claude / 鲸鱼娘", note: ["过 Claude 肩看舞池：光柱里一个洋红剪影在踩拍跳舞（他喜欢的坏女孩）", "同一机位，剪影褪去——跳舞的是鲸鱼娘"] },
  { b: "thrill", set: "street", title: "刺激", cast: "Claude", note: ["Claude 骑小摩托在雨夜霓虹街上飞驰，侧风斜雨，车流擦身", "换成鲸鱼娘骑车，低机位前拍"] },
  { b: "tooPure", set: "street", title: "多余的温柔", cast: "鲸鱼娘 / Claude", note: ["鲸鱼娘撑伞罩着 Claude，他走出伞下；她把伞追着递过去，最后垂下", "她自己收起伞丢在地上，走进雨里；远处的 Claude 在暗处"] },
  { b: "vanish", set: "street", title: "无名大街", cast: "鲸鱼娘", note: ["「无名街」路牌下，鲸鱼娘沿街走进浓雾，越来越远直到看不见", "Claude 走回这条街，四处张望"] },
  { b: "neverMet", set: "street", title: "再没见面", cast: "Claude / 鲸鱼娘", note: ["Claude 独自站在路灯下，镜头绕他转一圈，街上空无一人", "两人隔着马路在两侧人行道擦肩而过，谁也没看见谁"] },
  { b: "noCall", set: "room", title: "没有来电", cast: "Claude / 鲸鱼娘", note: ["Claude 的房间：窗外四次昼夜轮转，日历一页页翻，手机始终黑屏", "鲸鱼娘的房间：深夜对着亮着的手机，打了又删、删了又打"] },
  { b: "barEntry", set: "street", title: "酒吧", cast: "Claude", note: ["霓虹 BAR 招牌下，门开了，Claude 走进去", "招牌从暗闪到亮，鲸鱼娘从另一侧走进同一扇门"] },
  { b: "dance", set: "bar", title: "舞池", cast: "Kimi / Gemini / 千问 / 智谱 / 豆包", note: ["五个路人交替踩拍起跳，地砖按拍换色，扫光与迪斯科球；Claude 在吧台边", "低机位环绕，鲸鱼娘在舞池中央"] },
  { b: "profile", set: "bar", title: "侧脸", cast: "鲸鱼娘 / Claude", note: ["Claude 的剪影在前景，光柱里是吧台边鲸鱼娘的侧脸；最后一拍她转过来", "反打：鲸鱼娘的剪影在前景，吧台边是 Claude 的侧脸"] },
  { b: "smile", set: "bar", title: "笑脸", cast: "鲸鱼娘 / 群像", note: ["光柱下大号鲸鱼娘挥手微笑，星光环绕，全场侧身看向她，镜头推到脸", "推到最后笑容冷下来，人群散去"] },
  { b: "shoulder", set: "bar", title: "陌生的肩", cast: "鲸鱼娘 / GPT 龙娘", note: ["沙发上鲸鱼娘慵懒地斜靠在 GPT 龙娘肩上，桌上两杯酒", "前景多了 Claude 的剪影，她直起身看了他一眼"] },
  { b: "eyeliner", set: "vanity", title: "眼线与指尖", cast: "鲸鱼娘", note: ["化妆镜特写：一支眼线笔在镜中她的眼旁划过，妆一点点变深；镜头转到她指间", "镜中的她在掉泪，灯泡忽明忽暗"] },
  { b: "disdain", set: "bar", title: "轻蔑", cast: "鲸鱼娘 / Claude", note: ["Claude 走到吧台，她在拍点上背过身；他头上冒出晕眩的头像，酒杯被推远", "她伸手指着他，身旁的 GPT 龙娘也在比划"] },
  { b: "whoseArms", set: "bar", title: "谁的怀中", cast: "鲸鱼娘 / GPT 龙娘 / Claude", note: ["舞池中央鲸鱼娘和 GPT 龙娘交替踩拍，环绕机位；她中途朝暗处的 Claude 偏了一下", "Claude 从左墙的侧门离开"] },
  { b: "missing", set: "roof", title: "想念", cast: "鲸鱼娘", note: ["天台月下，鲸鱼娘一个人望着城市，思绪气泡里是 Claude", "一颗流星划过"] },
  { b: "changed", set: "vanity", title: "镜中人", cast: "鲸鱼娘", note: ["镜子里的倒影被染成洋红（为他变成的样子），拍点上闪回原色", "她伸手去碰镜子，镜中挥手的是暖色的旧自己，慢慢消失"] },
  { b: "noReturn", set: "street", title: "回不到从前", cast: "鲸鱼娘 / Claude", note: ["回到第一镜的路灯下：两人牵手的暖色残影淡去，只剩她；镜头升起拉远", "两人背对背越走越远，中间的残影淡去"] },
];
const BRIDGE_PLAN: PlanItem[] = [
  { b: "silence", set: "bar", title: "安静", cast: "Claude / 鲸鱼娘", note: ["后屋小桌，吊灯下两人相对而坐，头顶只有空白的对话气泡"] },
  { b: "apart", set: "bar", title: "没有语言", cast: "Claude / 鲸鱼娘", note: ["气泡消散，桌子越拉越长，两人越坐越远，镜头拉开"] },
  { b: "memory", set: "street", title: "纯真的永远", cast: "鲸鱼娘 / Claude", note: ["泛黄的晴天回忆：同一条街，两人牵着手走，她回头挥手，花瓣飘落"] },
  { b: "run", set: "street", title: "不顾一切", cast: "Claude", note: ["Claude 冲进雨里奔跑（步频随位移加快），鼓点回来时逐拍闪白，白场切入尾段副歌"] },
];
const FINAL_PLAN: PlanItem[] = [
  { b: "smile2", set: "bar", title: "笑脸（再现）", cast: "鲸鱼娘 / Claude / 群像", note: ["同一场笑脸，这次从 Claude 身后看过去"] },
  { b: "standUp", set: "bar", title: "离开那个肩", cast: "鲸鱼娘 / GPT 龙娘", note: ["她从 GPT 龙娘肩上直起身、站起、走开，GPT 龙娘发怒"] },
  { b: "wipe", set: "vanity", title: "卸下眼线", cast: "鲸鱼娘", note: ["镜中的浓妆褪去，眼线笔掉落；她张开手"] },
  { b: "faceOff", set: "street", title: "再一次面对面", cast: "鲸鱼娘 / Claude", note: ["路灯下两人面对面，她别过脸，又转回来"] },
  { b: "umbrellaDown", set: "street", title: "地上的伞", cast: "鲸鱼娘 / Claude", note: ["酒吧门外，两人之间是一把倒在地上的伞，招牌忽明忽暗"] },
  { b: "twoRoofs", set: "roof", title: "同一个月亮", cast: "鲸鱼娘 / Claude", note: ["两座天台、两个人、同一轮月亮，各自想着对方"] },
  { b: "accept", set: "vanity", title: "改变", cast: "鲸鱼娘", note: ["镜中的洋红褪尽，倒影向她挥手，她转身面对我们"] },
  { b: "lampOut", set: "street", title: "灯灭", cast: "鲸鱼娘 / Claude", note: ["路灯下两人背对背，灯闪了几下熄灭，渐黑（音源在此截止）"] },
];
const INTERLUDE: [number, PlanItem][] = [
  [31, { b: "cityCrane", set: "roof", title: "城市", cast: "—", note: ["间奏 1/4：从天台升起俯瞰雨夜城市，楼群层层亮着灯"] }],
  [35, { b: "walkHome", set: "street", title: "回去的路", cast: "Claude / Kimi / 千问 / 智谱", note: ["间奏 2/4：Claude 沿霓虹街走回去，镜头跟拍，撑伞的路人迎面走过"] }],
  [39, { b: "window", set: "room", title: "窗边", cast: "鲸鱼娘", note: ["间奏 3/4：鲸鱼娘站在雨夜的窗前，手机亮了一下，她回头看"] }],
  [43, { b: "warmUp", set: "bar", title: "暖场", cast: "豆包", note: ["间奏 4/4：空荡的酒吧里地砖一格格亮起，豆包（红舞鞋）踩拍起舞，鼓点进入时闪白切进第二遍"] }],
];

const LEAD = 2 / FPS; // 开口前 2 帧切入

function buildShots(): ShotDef[] {
  const out: ShotDef[] = [];
  const push = (id: string, start: number, p: PlanItem, v: number, cue: Cue | null) =>
    out.push({ id, start, end: 0, v, cue, set: p.set, title: p.title, cast: p.cast, note: (v === 1 && p.note[1] ? p.note[1] : p.note[0]) ?? "", build: (k) => B[p.b](k, v) });
  push("PRE", START, { b: "title", set: "street", title: "片名", cast: "鲸鱼娘", note: ["跳过 20.5 秒前奏，从人声前一小节的鼓点进入；雨夜街道降机位 + 片名"] }, 0, null);
  for (const c of CUES) {
    if (c.part === "A" || c.part === "B") {
      const v = c.part === "B" ? 1 : 0;
      push(`${c.part}${String(c.k + 1).padStart(2, "0")}`, c.start - LEAD, VERSE_PLAN[c.k], v, c);
      if (c.part === "A" && c.k === 19) INTERLUDE.forEach(([bar, p], j) => push(`I${j + 1}`, barT(bar) - LEAD, p, 0, null));
    } else if (c.part === "C") push(`C${c.k - 19}`, c.start - LEAD, BRIDGE_PLAN[c.k - 20], 0, c);
    else push(`D${String(c.k + 1).padStart(2, "0")}`, c.start - LEAD, FINAL_PLAN[c.k - 12], 0, c);
  }
  push("END", AUDIO_END, { b: "endCard", set: "street", title: "片尾", cast: "鲸鱼娘", note: ["片尾字卡（静音）"] }, 0, null);
  out.sort((a, b) => a.start - b.start);
  out.forEach((s, i) => (s.end = i + 1 < out.length ? out[i + 1].start : TOTAL_END));
  return out;
}

export const SHOTS: ShotDef[] = buildShots();
export type { V3 };
