// 按「字」和「词」复刻的 3D 立体活字积木雕塑系统
// 每个汉字是一块有厚度、有墨线描边、有词组配色侧面与釉面正面的真实 3D 体块；
// 同一个「词」共享一块 3D 词托底座与语义小徽章，并在人声唱到该字/词的精确毫秒触发符合词意的 3D 运动。
import * as THREE from 'three';
import {
  PI,
  TAU,
  ball,
  box,
  canvasTex,
  clamp01,
  cone,
  cssHex,
  ease,
  easeOut,
  mesh,
  put,
  setOp,
  springPop,
  sprite,
  toon,
  torus,
} from './kit';
import { FONT } from './fonts';
import type { BeatState, CharCue, LyricCue } from './cues';

// 缓存单字釉面贴图（待唱象牙釉 / 唱响暖金釉）
const tileTexCache = new Map<string, THREE.CanvasTexture>();

function makeCharTileTex(ch: string, accent: number, lit: boolean): THREE.CanvasTexture {
  const key = `${ch}_${accent.toString(16)}_${lit ? 1 : 0}`;
  const hit = tileTexCache.get(key);
  if (hit) return hit;

  const S = 256;
  const ac = cssHex(accent);
  const tex = canvasTex(S, S, (c) => {
    // 温润陶瓷/木版底色
    const grd = c.createLinearGradient(0, 0, 0, S);
    if (lit) {
      grd.addColorStop(0, '#fffdf2');
      grd.addColorStop(0.55, '#fff3c4');
      grd.addColorStop(1, '#ffdf85');
    } else {
      grd.addColorStop(0, '#fffef8');
      grd.addColorStop(1, '#f7edda');
    }
    c.fillStyle = grd;
    c.fillRect(0, 0, S, S);

    // 词组色内框线（类似川渝木牌/活字章）
    c.strokeStyle = lit ? '#e09124' : ac;
    c.lineWidth = 12;
    c.strokeRect(16, 16, S - 32, S - 32);

    // 四角小圆钉装饰
    c.fillStyle = ac;
    for (const [x, y] of [
      [32, 32],
      [S - 32, 32],
      [32, S - 32],
      [S - 32, S - 32],
    ]) {
      c.beginPath();
      c.arc(x, y, 5, 0, TAU);
      c.fill();
    }

    // 模板字体 ZCOOL KuaiLe 粗墨线描边 + 实心汉字
    c.font = `900 166px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 13;
    c.strokeStyle = lit ? '#2b1610' : '#33243c';
    c.strokeText(ch, S / 2, S / 2 + 5);

    c.fillStyle = lit ? '#b83b1a' : '#3a2d47';
    if (lit) {
      const tg = c.createLinearGradient(0, 36, 0, S - 36);
      tg.addColorStop(0, '#4a1f14');
      tg.addColorStop(1, '#8c2d19');
      c.fillStyle = tg;
    }
    c.fillText(ch, S / 2, S / 2 + 5);
  });
  // 远景缩小时保持笔画清晰：关闭 mipmap，改线性过滤（否则高对比字形会糊成黑块）
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  tileTexCache.set(key, tex);
  return tex;
}

// 为关键词顶部装配迷你 3D 语义徽章
function makeWordBadge(tag: string, accent: number): THREE.Object3D | null {
  const g = new THREE.Group();
  if (tag === 'sun') {
    put(g, ball(0.18, 0xffa834, false, 0.025), 0, 0.14, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const r = cone(0.055, 0.14, 0xffd859, 5, 0.018);
      r.position.set(Math.cos(a) * 0.22, 0.14 + Math.sin(a) * 0.22, 0);
      r.rotation.z = a - PI / 2;
      g.add(r);
    }
    return g;
  }
  if (tag === 'moon') {
    const m = torus(0.16, 0.055, 0xffe46b, 16, 0.022);
    m.position.set(0, 0.16, 0);
    put(g, m);
    put(g, sprite('star', 0.26, 0xfff3a8, true, 0.9), 0.16, 0.24, 0.04);
    return g;
  }
  if (tag === 'cloud') {
    put(g, ball(0.15, 0xffffff, false, 0.022), 0, 0.13, 0);
    put(g, ball(0.11, 0xf2f9ff, false, 0.02), -0.13, 0.1, 0);
    put(g, ball(0.12, 0xf2f9ff, false, 0.02), 0.13, 0.1, 0);
    return g;
  }
  if (tag === 'flower' || tag === 'bloom') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      put(g, ball(0.085, 0xff8cb8, false, 0.018), Math.cos(a) * 0.12, 0.13 + Math.sin(a) * 0.06, Math.sin(a) * 0.1);
    }
    put(g, ball(0.075, 0xffde59, false, 0.018), 0, 0.15, 0);
    return g;
  }
  if (tag === 'slow') {
    // 迷你小蜗牛壳
    const sh = torus(0.11, 0.055, 0xe89b5a, 14, 0.02);
    sh.position.set(0, 0.12, 0);
    g.add(sh);
    put(g, ball(0.06, 0xffe0a6, false, 0.016), 0.14, 0.07, 0);
    return g;
  }
  if (tag === 'lucky' || tag === 'destiny') {
    put(g, sprite('clover', 0.36, 0xffffff, false, 0.98), 0, 0.2, 0.03);
    return g;
  }
  if (tag === 'star') {
    put(g, sprite('star', 0.44, 0xffe875, true, 0.95), 0, 0.22, 0.03);
    return g;
  }
  if (tag === 'sleep') {
    put(g, sprite('zzz', 0.32, 0xd8eeff, false, 0.95), 0.12, 0.22, 0.03);
    return g;
  }
  if (tag === 'wind' || tag === 'blow') {
    put(g, sprite('leaf', 0.34, 0x9bf5a8, false, 0.95), 0, 0.2, 0.03);
    return g;
  }
  if (tag === 'tipsy') {
    put(g, sprite('bubble', 0.3, 0xffc8dd, false, 0.92), 0.08, 0.22, 0.03);
    return g;
  }
  if (tag === 'beat') {
    put(g, sprite('note', 0.36, 0xffe37d, false, 0.96), 0, 0.22, 0.03);
    return g;
  }
  if (tag === 'letgo') {
    // 迷你孔明灯
    put(g, box(0.18, 0.24, 0.18, 0xffb357, 0.02), 0, 0.08, 0);
    put(g, sprite('glow', 0.42, 0xffd97d, true, 0.85), 0, 0.2, 0.05);
    return g;
  }
  if (tag === 'best') {
    put(g, sprite('heart', 0.32, accent, false, 0.95), 0, 0.2, 0.03);
    return g;
  }
  return null;
}

interface CharNode {
  cue: CharCue;
  pivot: THREE.Group;
  block: THREE.Group;
  faceDim: THREE.Mesh;
  faceLit: THREE.Mesh;
  halo: THREE.Sprite;
  spark: THREE.Sprite;
  badge: THREE.Object3D | null;
  baseX: number;
  baseY: number;
  baseZ: number;
  baseRY: number;
}

interface WordBeam {
  mesh: THREE.Group;
  t0: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  baseRY: number;
}

export interface WordSculptureOpts {
  /** 雕塑中心坐标（默认悬于画面中上方天空处，不挡角色也不挡字幕） */
  pos?: [number, number, number];
  /** 整体缩放（默认按字数自适应 0.9..1.12） */
  scale?: number;
  /** 水平弧度弯曲深度 */
  arc?: number;
  /** 始终面向相机（默认 true） */
  faceCamera?: boolean;
  /** 字牌出现时刻（默认比首字再早一点；镜头切入即出现更稳妥） */
  revealAt?: number;
}

export interface WordSculpture {
  group: THREE.Group;
  update: (T: number, bt: BeatState, camPos: THREE.Vector3, visible?: boolean) => void;
}

let sharedBlockGeo: THREE.BufferGeometry | null = null;
let sharedFaceGeo: THREE.BufferGeometry | null = null;
let sharedGoldTrimGeo: THREE.BufferGeometry | null = null;

function getBlockGeos() {
  if (!sharedBlockGeo) {
    sharedBlockGeo = new THREE.BoxGeometry(0.90, 0.94, 0.24);
    sharedFaceGeo = new THREE.PlaneGeometry(0.80, 0.84);
    sharedGoldTrimGeo = new THREE.BoxGeometry(0.92, 0.96, 0.12);
  }
  return {
    blockGeo: sharedBlockGeo!,
    faceGeo: sharedFaceGeo!,
    trimGeo: sharedGoldTrimGeo!,
  };
}

export function createWordSculpture(cue: LyricCue, opts: WordSculptureOpts = {}): WordSculpture {
  const root = new THREE.Group();
  const [px, py, pz] = opts.pos ?? [0, 4.35, -2.5];
  root.position.set(px, py, pz);

  const n = cue.chars.length;
  const autoScale = (opts.scale ?? (n >= 10 ? 0.86 : n >= 8 ? 0.94 : 1.06)) * 1.3;
  root.scale.setScalar(autoScale);

  const { blockGeo, faceGeo, trimGeo } = getBlockGeos();

  // 计算每个字的水平槽位：同词紧凑（0.93），异词微距（1.05），空格停顿（1.42）
  const xs: number[] = [];
  let cursor = 0;
  cue.chars.forEach((ch, i) => {
    if (i > 0) {
      const prev = cue.chars[i - 1];
      if (ch.gapBefore) cursor += 1.42;
      else if (ch.wordIdx !== prev.wordIdx) cursor += 1.06;
      else cursor += 0.92;
    }
    xs.push(cursor);
  });
  const midX = cursor / 2;
  const span = Math.max(3.5, cursor);
  const arcDepth = opts.arc ?? 0.55;

  const nodes: CharNode[] = [];
  const beams: WordBeam[] = [];

  // 1) 为每个「词」搭建 3D 词托横梁（体现词组边界）
  cue.words.forEach((w) => {
    const first = w.charIndices[0];
    const last = w.charIndices[w.charIndices.length - 1];
    const x0 = xs[first] - midX;
    const x1 = xs[last] - midX;
    const cx = (x0 + x1) / 2;
    const width = x1 - x0 + 0.82;
    const norm = cx / (span * 0.55);
    const by = (1 - norm * norm) * 0.18 - 0.54;
    const bz = norm * norm * arcDepth;
    const bry = -norm * 0.14;

    const beamGroup = new THREE.Group();
    beamGroup.position.set(cx, by, bz);
    beamGroup.rotation.y = bry;
    const bar = box(width, 0.11, 0.3, w.accent, 0.026);
    bar.position.y = -0.055;
    beamGroup.add(bar);
    root.add(beamGroup);
    beams.push({ mesh: beamGroup, t0: w.t0, baseX: cx, baseY: by, baseZ: bz, baseRY: bry });
  });

  // 2) 为每个「字」搭建独立 3D 立体活字块
  cue.chars.forEach((ch, idx) => {
    const bx = xs[idx] - midX;
    const norm = bx / (span * 0.55);
    const by = (1 - norm * norm) * 0.18;
    const bz = norm * norm * arcDepth;
    const bry = -norm * 0.14;

    const pivot = new THREE.Group();
    pivot.position.set(bx, by, bz);
    pivot.rotation.y = bry;

    const block = new THREE.Group();

    // 立体有厚度的 3D 墨线木块主体（按词组着色）
    const body = mesh(blockGeo, toon(ch.accent), 0.034);
    block.add(body);

    // 后背暖金腰线（唱响时更立体）
    const trim = new THREE.Mesh(trimGeo, toon(0xffe07d));
    trim.position.z = -0.03;
    block.add(trim);

    // 正面待唱釉面 & 唱响金釉面（硬切/平滑切换，无系统字体依赖）
    const dimMat = new THREE.MeshBasicMaterial({ map: makeCharTileTex(ch.ch, ch.accent, false) });
    const litMat = new THREE.MeshBasicMaterial({ map: makeCharTileTex(ch.ch, ch.accent, true) });
    const faceDim = new THREE.Mesh(faceGeo, dimMat);
    const faceLit = new THREE.Mesh(faceGeo, litMat);
    faceDim.renderOrder = 6;
    faceLit.renderOrder = 7;
    faceDim.position.z = 0.176;
    faceLit.position.z = 0.18;
    faceLit.visible = false;
    block.add(faceDim, faceLit);

    // 背面也贴上字面，旋转时双面完整
    const backFace = new THREE.Mesh(faceGeo, dimMat);
    backFace.position.z = -0.176;
    backFace.rotation.y = PI;
    backFace.renderOrder = 5;
    block.add(backFace);

    // 关键词首字或末字装配迷你 3D 语义徽章
    const word = cue.words[ch.wordIdx];
    const badgeTarget = Math.floor(word.charIndices.length / 2);
    let badge: THREE.Object3D | null = null;
    if (ch.charInWord === badgeTarget) {
      badge = makeWordBadge(word.tag, ch.accent);
      if (badge) {
        badge.position.set(0, 0.45, 0.02);
        block.add(badge);
      }
    }

    // 唱响瞬间的光晕与星芒
    const halo = sprite('glow', 1.75, ch.accent, true, 0);
    halo.position.z = -0.08;
    const spark = sprite('star', 0.65, 0xfff2a6, true, 0);
    spark.position.set(0.28, 0.56, 0.16);

    pivot.add(halo, block, spark);
    root.add(pivot);

    nodes.push({
      cue: ch,
      pivot,
      block,
      faceDim,
      faceLit,
      halo,
      spark,
      badge,
      baseX: bx,
      baseY: by,
      baseZ: bz,
      baseRY: bry,
    });
  });

  const faceCam = opts.faceCamera !== false;

  const update = (T: number, bt: BeatState, camPos: THREE.Vector3, visible = true) => {
    if (!visible) {
      root.visible = false;
      return;
    }
    root.visible = true;

    if (faceCam) {
      const dx = camPos.x - root.position.x;
      const dz = camPos.z - root.position.z;
      root.rotation.y = Math.atan2(dx, dz);
    }

    // 更新每个「词」底座：唱到该词时弹性展开
    for (let wi = 0; wi < beams.length; wi++) {
      const bm = beams[wi];
      const dt = T - bm.t0;
      if (dt < -0.18) {
        bm.mesh.visible = false;
      } else {
        bm.mesh.visible = true;
        const pop = dt < 0 ? clamp01((dt + 0.18) / 0.18) * 0.45 : 0.45 + 0.55 * easeOut(dt / 0.22);
        bm.mesh.scale.set(pop, 1, 1);
        bm.mesh.position.set(bm.baseX, bm.baseY + Math.sin(T * 2.1 + wi) * 0.025, bm.baseZ);
      }
    }

    // 更新每个「字」3D 积木：精确到毫秒的卡点弹出 + 15 种歌词语义动态
    const mode = cue.mode;
    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i];
      const c = nd.cue;
      const word = cue.words[c.wordIdx];
      const age = T - c.t0;
      const active = T >= c.t0 && T <= c.t1 + 0.06;
      const sung = T >= c.t0;

      // 预备态：整句开始后以小巧木粒待命；起音瞬间 Q 弹放大成实体 3D 字块
      const lineAge = T - (opts.revealAt ?? cue.start - 0.55);
      if (lineAge < 0) {
        nd.pivot.visible = false;
        continue;
      }
      nd.pivot.visible = true;

      let sx = 1;
      let sy = 1;
      let sz = 1;
      let dx = 0;
      let dy = 0;
      let dz = 0;
      let rx = 0;
      let ry = 0;
      let rz = 0;

      if (!sung) {
        // 待唱态：完整可读的象牙釉字牌，微微后退等待被唱响（绝不缩成看不清的小黑块）
        const pre = easeOut(clamp01(lineAge / 0.3));
        const s = 0.94 * pre;
        sx = sy = sz = s;
        dy = -0.06;
        dz = 0.04;
        rx = -0.06;
        nd.faceLit.visible = false;
        nd.faceDim.visible = true;
        (nd.faceDim.material as THREE.MeshBasicMaterial).opacity = 1;
        if (nd.badge) nd.badge.visible = false;
        setOp(nd.halo, 0);
        setOp(nd.spark, 0);
      } else {
        // 唱响瞬间：3D 弹簧弹出 + 挤压回弹 + 金釉点亮 + 星芒迸发
        const pPop = springPop(age / 0.28);
        const hitPulse = Math.exp(-age * 6.5);
        sx = pPop * (1 + hitPulse * 0.16);
        sy = pPop * (1 + hitPulse * 0.22);
        sz = pPop * (1 + hitPulse * 0.15);
        dy = hitPulse * 0.22 + Math.sin(T * 2.4 + i * 0.55) * 0.035;
        dz = active ? 0.16 : 0;
        // 3D 翻转落位
        ry = (1 - easeOut(clamp01(age / 0.26))) * -0.85;

        nd.faceLit.visible = true;
        nd.faceDim.visible = false;

        if (nd.badge) {
          nd.badge.visible = true;
          const bs = springPop(age / 0.35);
          nd.badge.scale.setScalar(bs);
        }

        // 依据 15 种歌词含义赋予专属 3D 字词表演
        if (mode === 'calm') {
          if (word.tag === 'fluster') {
            // 「慌」刚出来轻轻发抖，等到「慢慢」唱起就安稳舒展
            const calmDown = T >= cue.words[2].t0 ? 0.12 : 1;
            rz = Math.sin(T * 28) * 0.11 * calmDown;
            dx = Math.cos(T * 32) * 0.03 * calmDown;
          } else if (word.tag === 'tease') {
            // 「啥子嘛」像摇蒲扇一样悠然轻晃
            rz = Math.sin(T * 3.8 + i * 0.7) * 0.08;
          } else {
            // 「慢慢来」从容稳稳落定、呼吸起伏
            const gentle = ease(clamp01(age / 0.42));
            sx = sy = sz = 0.55 + 0.48 * gentle;
            dy = (1 - gentle) * 0.28 + Math.sin(T * 1.8 + i) * 0.04;
          }
        } else if (mode === 'sunmoon') {
          if (word.tag === 'sun' || word.tag === 'sink') {
            // 「太阳下山」暖阳字块缓缓西沉
            const sinkP = ease(clamp01((T - cue.words[1].t0) / 1.4));
            dy += 0.22 - sinkP * 0.38;
          } else if (word.tag === 'moon' || word.tag === 'climb') {
            // 「月亮爬上来」一阶比一阶往上爬！
            const step = i - 5; // 月(0) 亮(1) 爬(2) 上(3) 来(4)
            const climbP = easeOut(clamp01(age / 0.45));
            dy += (step * 0.11 - 0.06) * climbP;
          }
        } else if (mode === 'cloudflower') {
          if (word.tag === 'cloud' || word.tag === 'stay') {
            // 「云会在」如棉花云轻柔漂浮
            dy += 0.1 + Math.sin(T * 2.0 + i * 0.9) * 0.07;
          } else {
            // 「花会开」如花瓣向上舒展盛放
            rz = (c.charInWord - 0.5) * 0.07 * easeOut(clamp01(age / 0.4));
            const bloom = 1 + 0.06 * bt.pulse;
            sx *= bloom;
            sy *= bloom;
          }
        } else if (mode === 'luck') {
          // 「好运总会为你而等待」如檐下红灯笼轻轻摇曳迎客
          rz = Math.sin(T * 2.6 + i * 0.6) * 0.065;
          dy += bt.pulse * 0.05;
        } else if (mode === 'unpack') {
          // 「卸下一身的疲惫」自上而下卸落重担，轻轻松一口气
          const drop = easeOut(clamp01(age / 0.34));
          dy = (1 - drop) * 0.55 - 0.06 * drop + Math.sin(T * 1.6 + i) * 0.025;
          if (word.tag === 'exhale') rx = -0.08 * drop;
        } else if (mode === 'starbed') {
          // 「今夜枕着星光再入睡」星光闪烁，「再入睡」轻轻侧倚在云枕上
          dy += Math.sin(T * 1.7 + i * 0.65) * 0.06;
          if (word.tag === 'sleep') {
            rz = 0.14 * ease(clamp01(age / 0.5));
            dy -= 0.06;
          }
        } else if (mode === 'breeze') {
          // 「风啊轻轻吹」晚风拂过芦苇般的连续柔波
          const wave = Math.sin(T * 3.2 - i * 0.65);
          dx = wave * 0.06 + (word.tag === 'blow' ? easeOut(clamp01(age / 0.8)) * 0.14 : 0);
          dy += Math.cos(T * 2.6 - i * 0.55) * 0.07;
          rz = -0.08 + wave * 0.07;
        } else if (mode === 'forget') {
          // 「这一刻就忘了你是谁」后半句如蒲公英轻盈升起
          if (word.tag === 'forget' || word.tag === 'who') {
            const floatUp = ease(clamp01(age / 1.4));
            dy += floatUp * 0.28;
            rz = Math.sin(T * 2.2 + i) * 0.07;
          }
        } else if (mode === 'tipsy') {
          // 「清醒」端正挺拔，「醉」微醺摇晃
          if (word.tag === 'sober') {
            rz = 0;
            dy += 0.06;
          } else if (word.tag === 'tipsy') {
            rz = Math.sin(T * 4.4) * 0.2;
            rx = Math.cos(T * 3.1) * 0.1;
            dy += Math.abs(Math.sin(T * 2.2)) * 0.08;
          }
        } else if (mode === 'burden') {
          // 「压力」先沉重下压，唱到「自己背」时被托起变轻盈
          if (word.tag === 'heavy') {
            const lifted = ease(clamp01((T - cue.words[3].t0) / 0.9));
            dy += -0.22 * (1 - lifted) + 0.16 * lifted;
          }
        } else if (mode === 'road') {
          // 「人生路还远」阶梯式向远方延展
          dy += i * 0.06;
          dz -= i * 0.05;
        } else if (mode === 'imperfect') {
          // 「完美」故意带一点俏皮可爱的微歪角度，顶上开出小花——不必事事完美
          if (word.tag === 'bloom') {
            rz = c.charInWord === 0 ? -0.08 : 0.11;
            dy += 0.07;
          }
        } else if (mode === 'rhythm') {
          // 「每个人都有自己的节拍」每个字按各自相位踩着 130 BPM 琴键弹跳！
          const myBeat = ((bt.idx + i) % 2 === 0 ? bt.pulse : 1 - bt.phase) * 0.14;
          dy += myBeat;
          sy *= 1 + bt.pulse * 0.06;
        } else if (mode === 'release') {
          // 「得不到 就放开」「放开」化作孔明灯冉冉升空
          if (word.tag === 'letgo') {
            const rise = ease(clamp01(age / 1.5));
            dy += rise * 0.42;
            rz = Math.sin(T * 2.5 + i) * 0.06;
          }
        } else if (mode === 'arrange') {
          // 「一切都是最好的安排」拼合成温暖金色拱桥
          const arch = Math.sin((i / Math.max(1, n - 1)) * PI) * 0.28;
          dy += arch * easeOut(clamp01(age / 0.5)) + bt.pulse * 0.04;
        }

        // 光晕与星芒动画
        const glowAmt = active ? 0.62 : Math.max(0.16, 0.45 * hitPulse);
        setOp(nd.halo, glowAmt);
        nd.halo.scale.setScalar(active ? 1.85 + bt.pulse * 0.25 : 1.35);

        const spAmt = clamp01(1 - age / 0.55);
        setOp(nd.spark, spAmt);
        nd.spark.position.set(0.26, 0.48 + (1 - spAmt) * 0.42, 0.18);
        nd.spark.scale.setScalar(0.3 + spAmt * 0.55);
      }

      nd.pivot.position.set(nd.baseX + dx, nd.baseY + dy, nd.baseZ + dz);
      nd.pivot.rotation.set(rx, nd.baseRY + ry, rz);
      nd.block.scale.set(sx, sy, sz);
    }
  };

  return { group: root, update };
}
