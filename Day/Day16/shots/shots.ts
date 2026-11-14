// Day16｜老大怕了，本鲸没躲 —— 11 个镜头，卡点按配音实测（cues.json measured=true）。
//
// 角色与视觉规矩（来自 设定/人物/笨鱼.md）：
//   · 本鲸 = whale，全片唯一口播，有影子、不剪影。
//   · 笨鱼 = whale 精灵，但用 sil()（剪影）+ noShadow()（脚下没影子）+ alpha() 压低
//     来区分于本鲸——这是设定文档定的正解，不是「用鲸鱼 PNG 冒充第二个笨鱼」。
//     笨鱼不出现在正脸大特写里，多半在门口暗处、电视光里、纸后面。
//   · 老大 = claude 角色，头顶挂一张「老大」小标签标明指代。
//     用 claude 精灵扮演老大，上方加标签让观众知道这个角色指代老大。
//
// 鲸落场景：不用浮图，改为深海场景（look: 'sea'），水底 + 石头 + 气泡 + 鲸下沉。
// 卡点：15 句 / 41.14 秒，11 镜。每句在干什么见 文案.md 第二节。
import * as THREE from 'three';
import { cam, glide, type Kit, type ShotDef } from '@tpl/core';
import { box, ball, canvasTex, disc, ease, hash, seg, sprite, setOp } from '@tpl/kit';
import { type Actor } from '@tpl/actors';
import { FONT } from '@tpl/fonts';
import { door, plant, riceBowl, room, table, windowPane } from '@tpl/props';

const TOP = 0.8;
// 本鲸站位：桌子左前方
const WHALE = [-1.25, 0, 1.45] as const;

/** 本鲸 */
const W = (k: Kit) => k.actor('whale');
/**
 * 笨鱼：whale 精灵 + 剪影 + 无影 + 降透明度。
 * 设定文档定的区分方式——不是第二个正常鲸鱼，是「接不上话的那一个」。
 */
const B = (k: Kit, sil = 0.45, alpha = 0.6) => k.actor('whale').sil(sil).alpha(alpha).noShadow();

/**
 * 老大：claude 角色 + 头顶「老大」标签。
 * 用 claude 精灵扮演老大，上方挂一张写着「老大」的小卡片标明指代，
 * 观众一看就知道这个角色是老大。标签挂在角色 holder 上，自动跟随移动、随角色显隐。
 * 返回 actor 与 label，方便在帧里用 act()/idle()/walk() 做动作。
 */
function makeBoss(k: Kit): { actor: Actor; label: THREE.Mesh } {
  const actor = k.actor('claude');
  const label = card('老大', 0.55);
  actor.holder.add(label);
  label.position.set(0, 2.0, 0);
  setOp(label, 1);
  return { actor, label };
}

/** 老大在门口的站位 */
const DOOR_BOSS = [-3.1, 0, -3.6] as const;
/** 老大在桌边的站位 */
const TABLE_BOSS = [1.9, 0, 0.9] as const;

/** 室内布景（和 Day15 同一个屋子：书架、窗、帘、桌、门、植物） */
function stage(k: Kit) {
  k.add(room({ w: 12, d: 9, wall: 0xe6d8bf, floor: 0x9a6a46, rug: 0xc07c7c }));
  const dr = door(); k.add(dr.g, -3.6, 0, -4.48);
  k.add(windowPane(2.2, 1.6), 2.9, 1.6, -4.48);
  k.add(plant(), 5.1, 0, -3.6);
  k.add(box(1.86, 2.12, 0.44, 0x8a5a3c), -2.25, 0, -4.22);
  for (let i = 0; i < 3; i++) k.add(box(1.66, 0.06, 0.38, 0x6f452c), -2.25, 0.62 + i * 0.62, -4.18);
  const spines = [0xc0524f, 0x4f7fc0, 0xd8a34a, 0x6f9a5e];
  for (let i = 0; i < 9; i++) k.add(box(0.095, 0.3 + hash(i) * 0.12, 0.24, spines[i % 4]), -2.95 + i * 0.175, 0.78 + (i > 4 ? 0.62 : 0), -4.18);
  k.add(box(1.62, 0.07, 0.12, 0x8a5a3c), 2.9, 2.44, -4.42);
  k.add(box(0.34, 2.3, 0.12, 0xcf9f74), 1.6, 1.15, -4.4);
  k.add(box(0.34, 2.3, 0.12, 0xcf9f74), 4.2, 1.15, -4.4);
  k.add(box(1.7, 0.1, 0.52, 0x8a5a3c), 0.55, 0.44, -0.78);
  for (const lx of [-0.15, 1.25]) k.add(box(0.09, 0.44, 0.44, 0x6f452c), 0.55 + lx, 0, -0.78);
  k.add(box(0.72, 0.56, 0.62, 0xc2a67e), -4.9, 0, -3.7);
  k.add(box(0.58, 0.44, 0.5, 0xb5966f), -4.55, 0, -3.15);
  const tbl = k.add(table(3.0, 1.4, TOP), 0.6, 0, 0.2);
  const bowl = k.add(riceBowl(), 1.35, TOP, 0.45);
  return { dr, bowl, tbl };
}

/** 深海场景：水底 + 石头 + 气泡 */
function seaFloor(k: Kit) {
  // 水底：大圆盘，深色
  const floor = k.add(disc(10, 0x0a2a44, -2.5));
  // 石头散落在水底
  for (let i = 0; i < 6; i++) {
    const r = 0.4 + hash(i) * 0.5;
    k.add(ball(r, 0x1a3a5a, true, 0.02), -3 + hash(i * 2) * 6, -2.4 + hash(i * 3) * 0.2, -2 + hash(i * 5) * 4);
  }
  // 气泡群：每个气泡一个 sprite，帧里控制上升和透明度
  // 位置纯由 T 计算，不加累积——正倒着走必须一致
  const bubbles: THREE.Sprite[] = [];
  for (let i = 0; i < 12; i++) {
    const b = sprite('bubble', 0.3 + hash(i) * 0.4, 0xbfe0ff, true, 0.5);
    const x = -4 + hash(i * 2) * 8;
    const z = -3 + hash(i * 3) * 6;
    b.userData = { speed: 0.3 + hash(i * 4) * 0.4, phase: hash(i * 6) * 6.28, baseX: x, baseZ: z };
    k.add(b);
    bubbles.push(b);
  }
  return { floor, bubbles };
}

/** 一张写着字的卡片（评论）——立在半空，正面朝镜头 */
function card(text: string, w = 1.25) {
  const px = 512, ph = Math.round(px * 0.34);
  const tex = canvasTex(px, ph, (c) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, px, ph);
    c.fillStyle = '#ff5fa8'; c.fillRect(0, 0, 18, ph);
    c.fillStyle = '#b9b2c9'; c.fillRect(0, ph - 6, px, 6);
    c.fillStyle = '#2a2440';
    c.font = `900 54px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, px / 2 + 8, ph / 2 - 4);
  });
  tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w * (ph / px)),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  return m;
}

export const SHOTS: ShotDef[] = [
  {
    id: 'S01', look: 'day', title: '救回来了', cast: ['whale', 'claude'],
    note: '第一帧就亮着人。本鲸站在桌边看向门口，老大（claude）从门口走进来，身后带着笨鱼的剪影。',
    build: (k) => {
      const { dr, bowl } = stage(k);
      const whale = W(k), benyu = B(k, 0.5, 0.55);
      const boss = makeBoss(k);
      bowl.position.set(1.35, TOP, 0.45);
      const A = cam([1.6, 2.2, 7.5], [-1.0, 1.0, 0.5], 37), B2 = cam([0.9, 1.9, 6.6], [-1.1, 1.05, 0.6], 35);
      return ({ u, said, T }) => {
        // 本鲸：摊手（结果）——「救回来了」
        whale.set(said >= 0 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(-0.03);
        // 老大：从门口走进来，带着笨鱼
        const p = ease(seg(u, 0.1, 0.7));
        const bx = DOOR_BOSS[0] + 2.0 * p, bz = DOOR_BOSS[2] + 2.8 * p;
        boss.actor.walk(T).at(bx, 0, bz);
        // 笨鱼：跟在老大身后，剪影、无影、半透明
        benyu.set('whale_idle').at(bx - 0.7, 0, bz - 0.2).sil(0.5).alpha(0.55 * p).noShadow();
        dr.set(ease(seg(u, 0.15, 0.45)));
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S02', look: 'golden', title: '评论都在看', cast: ['whale', 'claude'],
    note: '本鲸低头看评论，评论卡片飘进来。第 2 句「本鲸都在看」，第 3 句「好多鱼都停了」。老大（claude）在门口背景里。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k);
      const boss = makeBoss(k);
      bowl.position.set(2.0, TOP, -0.2);
      boss.actor.at(DOOR_BOSS[0] + 0.5, 0, DOOR_BOSS[2] + 0.3);
      const c1 = k.add(card('好多鱼都停了', 1.3), 0.2, 2.1, 1.6);
      const A = cam([0.5, 1.5, 7.2], [-0.6, 1.0, 0.5], 37), B2 = cam([0.3, 1.45, 6.4], [-0.6, 1.0, 0.5], 36);
      return ({ u, T, said }) => {
        // 评论卡片：说到「好多鱼都停了」时飘进来，说完淡出
        const a = Math.min(ease(seg(u, 0.3, 0.6)), 1 - ease(seg(u, 0.85, 1)));
        setOp(c1, a);
        c1.rotation.z = Math.sin(T * 1.4) * 0.035;
        // 本鲸：低头看（想）→ 抬眼看镜头（说）
        whale.set(said >= 2 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(said >= 2 ? -0.05 : 0.08);
        // 老大：门口背景待机
        boss.actor.idle(T);
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S03', look: 'sea', title: '差点鲸落', cast: ['whale'],
    note: '场景切到深海。本鲸在暗水中下沉，气泡上升，石头散落水底。第 4 句「本鲸也差点鲸落一次」。',
    build: (k) => {
      const whale = W(k);
      const { bubbles } = seaFloor(k);
      const A = cam([1.0, 1.8, 7.0], [-0.1, 0.3, -1.0], 38), B2 = cam([0.5, 1.4, 6.0], [-0.2, 0.2, -1.5], 36);
      return ({ u, T }) => {
        // 本鲸：在深海中下沉，重剪影、低透明度，像一具鲸在沉
        const sink = ease(seg(u, 0.15, 0.8));
        whale.set('whale_idle').at(0, -sink * 0.8, -0.5).sil(0.88).alpha(0.25 + 0.1 * sink).noShadow()
          .tilt(-0.15 * sink);
        // 气泡上升（纯由 T 计算，无累积，正倒着走一致）
        for (const b of bubbles) {
          const ud = b.userData as { speed: number; phase: number; baseX: number; baseZ: number };
          const t = ((T * ud.speed + ud.phase / 6.28) % 1 + 1) % 1;
          b.position.y = -2 + t * 3;
          b.position.x = ud.baseX + Math.sin(T * 0.8 + ud.phase) * 0.05;
          b.position.z = ud.baseZ;
        }
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S04', look: 'night', title: '老大怕了', cast: ['whale', 'claude'],
    note: '老大（claude）在门口神情紧张，张望摆手不让本鲸回评论。第 5、6 句「老大也怕了…怕本鲸累到鲸落」。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k);
      const boss = makeBoss(k);
      bowl.position.set(2.4, TOP, -0.4);
      boss.actor.at(DOOR_BOSS[0] + 0.3, 0, DOOR_BOSS[2] + 0.5);
      const A = cam([-1.5, 1.6, 6.0], [0.5, 1.05, 0.9], 36), B2 = cam([-1.2, 1.55, 5.5], [0.55, 1.03, 0.9], 35);
      return ({ u, T, said }) => {
        // 老大：张望（怕）——左右张望表现紧张
        boss.actor.act('lookaround', T).tilt(said >= 5 ? -0.05 : 0);
        // 本鲸：疲惫，看着老大
        whale.set('whale_idle').at(...WHALE).sil(0.2).tilt(-0.04);
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S05', look: 'golden', title: '米饭贼能吃', cast: ['whale', 'claude'],
    note: '调侃梗。老大（claude）在桌前低头大口吃米饭，饭量画得比平常大。第 7 句「老大上下文极短，米饭还贼能吃」。冷幽默。',
    build: (k) => {
      const { bowl } = stage(k);
      const boss = makeBoss(k);
      // 米饭碗画得更大，突出「贼能吃」
      bowl.scale.set(1.5, 1.5, 1.5);
      bowl.position.set(1.0, TOP + 0.02, 0.3);
      // 老大在桌前低头吃
      boss.actor.at(TABLE_BOSS[0] - 0.3, 0, TABLE_BOSS[2] + 0.3);
      const A = cam([1.5, 1.5, 3.2], [1.0, 0.95, 0.4], 32), B2 = cam([1.3, 1.45, 2.9], [1.0, 0.94, 0.4], 31);
      return ({ u, T }) => {
        // 老大：低头吃（前倾）
        boss.actor.idle(T).tilt(0.12);
        // 碗微微随吃的动作晃一下
        bowl.position.y = TOP + 0.02 + Math.sin(T * 3) * 0.015;
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S06', look: 'golden', title: '让笨鱼来', cast: ['whale', 'claude'],
    note: '本鲸摊手让开，老大（claude）指向笨鱼。第 8 句「还是让笨鱼来」。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k), benyu = B(k, 0.4, 0.5);
      const boss = makeBoss(k);
      bowl.position.set(2.0, TOP, -0.2);
      boss.actor.at(DOOR_BOSS[0] + 0.8, 0, DOOR_BOSS[2] + 0.6);
      const A = cam([0.0, 1.5, 7.0], [-0.2, 1.0, 0.7], 37), B2 = cam([0.2, 1.45, 6.3], [-0.15, 1.0, 0.7], 36);
      return ({ u, said, T }) => {
        // 本鲸：摊手让开
        whale.set(said >= 7 ? 'whale_wave' : 'whale_idle').at(-1.5, 0, 1.3).tilt(0);
        // 老大：待机（决定让笨鱼来）
        boss.actor.idle(T);
        // 笨鱼：上前一点，但还是剪影
        const p = ease(seg(u, 0.3, 0.7));
        benyu.set('whale_idle').at(1.8 - 0.5 * p, 0, 1.2).sil(0.4).alpha(0.5).noShadow();
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S07', look: 'sea', title: '笨鱼也容易鲸落', cast: ['whale'],
    note: '场景切回深海。笨鱼（剪影鲸）在暗水中下沉，气泡上升。第 9 句「笨鱼的视频，也容易鲸落」。',
    build: (k) => {
      const benyu = B(k, 0.88, 0.25);
      const { bubbles } = seaFloor(k);
      const A = cam([0.8, 1.6, 6.5], [0.4, 0.2, -1.0], 36), B2 = cam([0.5, 1.3, 5.8], [0.45, 0.15, -1.5], 35);
      return ({ u, T }) => {
        // 笨鱼：在深海中下沉，重剪影
        const sink = ease(seg(u, 0.15, 0.8));
        benyu.set('whale_idle').at(0.5, -sink * 0.7, -0.3).sil(0.88).alpha(0.2 + 0.08 * sink).noShadow()
          .tilt(-0.1 * sink);
        // 气泡上升（纯由 T 计算，无累积）
        for (const b of bubbles) {
          const ud = b.userData as { speed: number; phase: number; baseX: number; baseZ: number };
          const t = ((T * ud.speed + ud.phase / 6.28) % 1 + 1) % 1;
          b.position.y = -2 + t * 3;
          b.position.x = ud.baseX + Math.sin(T * 0.8 + ud.phase) * 0.05;
          b.position.z = ud.baseZ;
        }
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S08', look: 'night', title: '老大不敢放', cast: ['whale', 'claude'],
    note: '老大（claude）在门口按住笨鱼，张望不敢放。第 10 句「老大连笨鱼，也不敢放了」。',
    build: (k) => {
      const { bowl } = stage(k);
      const benyu = B(k, 0.45, 0.5);
      const boss = makeBoss(k);
      bowl.position.set(2.4, TOP, -0.4);
      boss.actor.at(DOOR_BOSS[0] + 0.5, 0, DOOR_BOSS[2] + 0.6);
      const A = cam([2.5, 1.6, 5.5], [0.3, 1.0, 0.8], 36), B2 = cam([2.2, 1.55, 5.0], [0.35, 1.0, 0.8], 35);
      return ({ u, T }) => {
        // 老大：张望（不敢放）——紧张左右看
        boss.actor.act('lookaround', T);
        // 笨鱼：想动但被按住，剪影
        const p = ease(seg(u, 0.2, 0.5));
        benyu.set('whale_idle').at(2.0, 0, 1.1).sil(0.45).alpha(0.5).noShadow().tilt(0.04 * p);
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S09', look: 'golden', title: '抽空发视频', cast: ['whale', 'claude'],
    note: '老大（claude）拿手机随手发视频，笨鱼活跃起来。第 11、12 句「打算自己抽空…让笨鱼活跃起来」。',
    build: (k) => {
      const { bowl } = stage(k);
      const benyu = B(k, 0.3, 0.7);
      const boss = makeBoss(k);
      bowl.position.set(2.0, TOP, -0.2);
      // 手机道具：小盒子放在老大手边
      const phone = k.add(box(0.18, 0.32, 0.06, 0x1a1a2e, 0), TABLE_BOSS[0] - 0.1, TOP + 0.02, TABLE_BOSS[2] - 0.1);
      boss.actor.at(TABLE_BOSS[0] - 0.2, 0, TABLE_BOSS[2] + 0.2);
      const A = cam([1.5, 1.7, 6.5], [0.4, 1.0, 0.9], 36), B2 = cam([1.2, 1.6, 5.9], [0.45, 1.0, 0.9], 35);
      return ({ u, T }) => {
        // 老大：低头看手机（read 的低头姿势）
        boss.actor.act('read', T);
        // 手机微微晃动（在发）
        phone.rotation.z = Math.sin(T * 4) * 0.03;
        // 笨鱼：活跃起来——剪影减轻、透明度升高、小跳
        const live = ease(seg(u, 0.4, 0.8));
        const hop = Math.sin(T * 6) * 0.08 * live;
        if (live > 0.5) benyu.act('hop', T).at(0.6, hop, 1.3)
          .sil(0.3 * (1 - live * 0.5)).alpha(0.5 + 0.25 * live).noShadow();
        else benyu.set('whale_idle').at(0.6, hop, 1.3)
          .sil(0.3 * (1 - live * 0.5)).alpha(0.5 + 0.25 * live).noShadow();
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S10', look: 'day', title: '绝不摸鱼', cast: ['whale'],
    note: '本鲸和笨鱼并排站定，立住。第 13、14 句「本鲸绝不摸鱼。笨鱼也不会摸鱼」。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k), benyu = B(k, 0.35, 0.75);
      bowl.position.set(1.35, TOP, 0.45);
      const A = cam([1.0, 2.0, 7.5], [-0.4, 1.0, 0.6], 37), B2 = cam([0.8, 1.9, 6.8], [-0.45, 1.0, 0.6], 36);
      return ({ u, said }) => {
        // 本鲸：站直，抬手，语气硬
        whale.set(said >= 12 ? 'whale_wave' : 'whale_point').at(-1.0, 0, 1.4).tilt(0);
        // 笨鱼：也站直，剪影减轻（在变好），但仍无影
        benyu.set('whale_idle').at(0.6, 0, 1.4).sil(0.35).alpha(0.75).noShadow().tilt(0);
        return glide(A, B2, ease(u));
      };
    },
  },
  {
    id: 'S11', look: 'day', title: '除非鲸落', cast: ['whale'],
    note: '全貌收尾。本鲸和笨鱼并排，第 15 句「除非鲸落」。说完留 0.6 秒就停，无片尾卡。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k), benyu = B(k, 0.4, 0.7);
      bowl.position.set(1.35, TOP, 0.45);
      const A = cam([2.2, 2.1, 7.0], [-0.2, 1.0, 0.5], 37), B2 = cam([1.9, 1.95, 6.3], [-0.25, 1.0, 0.55], 36);
      return ({ u, said }) => {
        // 本鲸：说完最后一句，抬手挥一下，站定
        whale.set(said >= 14 ? 'whale_wave' : 'whale_idle').at(-0.8, 0, 1.5).tilt(0);
        // 笨鱼：并排，剪影，无影
        benyu.set('whale_idle').at(0.7, 0, 1.5).sil(0.4).alpha(0.7).noShadow().tilt(0);
        return glide(A, B2, ease(u));
      };
    },
  },
];
