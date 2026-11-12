// Day15｜小克把家重新装修了，米饭没了 —— 14 个镜头，卡点按配音实测。
//
// 第七版（按第七轮意见重改；前几版的做法只留结论）：
//   · 构图照上一集 Day14 的拍法：屋子有纵深（后墙书架和书、窗边帘子、桌后长凳、墙角纸箱），
//     机位不再一律平视——有高位俯拍（S01/S10/S14）、有低位仰拍（S02/S04）、
//     有桌面近景插入（S05/S06/S08/S09/S13）、有门口逆光（S12），人不再一律摆在画面正中间。
//   · 上一集改成「推进来的一台电视」：三维里不摆电视，pip.sh 在编码后把电视框和 Day14 的画面
//     叠在右上角，第 4 句开口那一刻（11.2 s）推进来，电视里 1.8× 循环播放上一集。
//   · 鲸落图只在开头亮 1 秒（S01，`seg(u,0.24,0.30)` 进、`seg(u,0.46,0.52)` 出），S10/S11 不再出图。
//   · 人物不再一直抖：起伏 / 摇摆 / 点头的恒定 sin 全删了，动作只跟着台词走
//     （点头认下来就是一个固定小角度）。道具上的弱周期动画（图、纸、书、沙漏抖）保留——那是道具在动。
//   · 场景交互：踩木箱、桌子转起来带着碗和两只沙漏一起转（`ride()`）、把稿子按到桌上、
//     绕书脊翻书翻出空白页、饭碗被端走。
//   · 书不是贴图空本：`page()` 画出来的纸（一屋子朋友 / 本鲸），翻页绕书脊立起来再落到左边。
//   · 人不再一镜一走：从第一帧就站在该站的位置，只有 S02 踩箱、S12 从门口进来两处位移，
//     路线全部避开桌子（桌沿 x −0.9…2.1、z −0.5…0.9，人一律站在 z ≥ 1.25 或桌子外侧）。
import * as THREE from 'three';
import { cam, glide, type Kit, type ShotDef } from '@tpl/core';
import { box, canvasTex, ease, hash, put, seg } from '@tpl/kit';
import { FONT } from '@tpl/fonts';
import { door, hourglass, photo, plant, riceBowl, room, table, windowPane } from '@tpl/props';
import { WHALE_FALL } from '../media';

const TOP = 0.8;
const WHALE = [-1.25, 0, 1.45] as const;   // 桌子左前方的站位（桌沿左端 x = −0.9）
const CLAUDE = [2.75, 0, 1.05] as const;   // 桌子右端外侧（桌沿右端 x = 2.1）
const CRATE = [-0.55, 0.225, 1.45] as const;

function stage(k: Kit) {
  k.add(room({ w: 12, d: 9, wall: 0xe6d8bf, floor: 0x9a6a46, rug: 0xc07c7c }));
  const dr = door(); k.add(dr.g, -3.6, 0, -4.48);
  k.add(windowPane(2.2, 1.6), 2.9, 1.6, -4.48);
  k.add(plant(), 5.1, 0, -3.6);
  // 纵深（上一集里屋子是有进深的，这里把后墙也填满）：书架 + 书、窗边的帘子、桌后的长凳、墙角的纸箱
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
  const hg1 = hourglass(); k.add(hg1.g, 0.15, TOP, 0.35);
  const hg2 = hourglass(0.78); k.add(hg2.g, 0.95, TOP, 0.1);
  return { dr, bowl, hg1, hg2, tbl };
}

/** 一张写着字的卡片（弹幕 / 评论）——立在半空，正面朝镜头 */
function card(text: string, w = 1.25, tone = 0xffffff, ink = 0x2a2440) {
  const px = 512, ph = Math.round((px * 0.34) / 1);
  const tex = canvasTex(px, ph, (c) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, px, ph);
    c.fillStyle = '#ff5fa8'; c.fillRect(0, 0, 18, ph);
    c.fillStyle = '#b9b2c9'; c.fillRect(0, ph - 6, px, 6);
    c.fillStyle = `#${ink.toString(16).padStart(6, '0')}`;
    c.font = `900 54px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, px / 2 + 8, ph / 2 - 4);
  });
  tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w * (ph / px)),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, color: tone }),
  );
  return m;
}

/**
 * 一页纸：薄板 + 画的贴图（平摊在桌上）。
 * 这个引擎里，桌面上放「平面 / 多材质盒子」都渲染不出来，所以用「单材质的薄盒子」——厚 0.006，肉眼是一张纸。
 */
const page = (w: number, d: number, draw: (c: CanvasRenderingContext2D, W: number, H: number) => void) => {
  const px = 512, ph = Math.round((px * d) / w);
  const tex = canvasTex(px, ph, (c) => {
    c.fillStyle = '#fffdf4'; c.fillRect(0, 0, px, ph);
    c.strokeStyle = '#e6dcc2'; c.lineWidth = 6; c.strokeRect(3, 3, px - 6, ph - 6);
    draw(c, px, ph);
  });
  tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const top = new THREE.MeshBasicMaterial({ map: tex });
  const blank = new THREE.MeshBasicMaterial({ color: 0xfffdf4 });
  // 六个面：只有顶面贴画，其余是白纸（翻页翻过去，背面就是空白的）
  return new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), [blank, blank, top, blank, blank, blank]);
};
/** 一个小人（故事书里的一屋子朋友）：圆脸 + 两点眼 + 一块颜色 */
const tinyPal = (c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) => {
  c.fillStyle = col; c.beginPath(); c.arc(x, y + r * 0.55, r * 0.75, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffe9d2'; c.beginPath(); c.arc(x, y, r * 0.62, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2b2233';
  c.beginPath(); c.arc(x - r * 0.2, y - r * 0.05, r * 0.08, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + r * 0.2, y - r * 0.05, r * 0.08, 0, Math.PI * 2); c.fill();
};
/**
 * 摊开的故事书：左页「一屋子朋友」，右页是书里剩下的那一页（只有她自己）。
 * 书脊在 x = 0，两页各 w 宽往两边摊；要翻的那一页绕书脊立起来再落到左边（rotation.z），不是原地打转。
 */
function storybook(k: Kit, x: number, z: number, w = 0.34, d = 0.42) {
  const g = new THREE.Group();
  k.add(g, x, TOP + 0.02, z, 0);
  put(g, box(w * 2.06, 0.025, d * 1.04, 0x8a5a3c, 0.02), 0, -0.014, 0);
  // 左页：朋友们的合影
  put(g, page(w, d, (c, W, H) => {
    const pal = ['#7fb6ff', '#ffa3c2', '#ffd166', '#9be28a'];
    for (let i = 0; i < 4; i++) tinyPal(c, W * (0.28 + (i % 2) * 0.44), H * (0.24 + Math.floor(i / 2) * 0.32), W * 0.15, pal[i]);
    c.fillStyle = '#4a3a5a'; c.font = `900 86px ${FONT}`; c.textAlign = 'center';
    c.fillText('一屋子朋友', W / 2, H * 0.92);
  }), -w / 2, 0.035, 0);
  // 右页：书里剩下的那一页（只有她自己）
  put(g, page(w, d, (c, W, H) => {
    tinyPal(c, W * 0.5, H * 0.36, W * 0.2, '#6f8fe8');
    c.fillStyle = '#4a3a5a'; c.font = `900 86px ${FONT}`; c.textAlign = 'center';
    c.fillText('本鲸', W / 2, H * 0.92);
  }), w / 2, 0.035, 0);
  // 要翻过去的那一页：正面写着字，背面空白（翻过去就没了）
  const pivot = new THREE.Group();
  put(g, pivot, 0, 0.045, 0);
  const leaf = page(w, d, (c, W, H) => {
    c.fillStyle = '#6a5a7a'; c.font = `900 52px ${FONT}`;
    for (let i = 0; i < 4; i++) c.fillText('—— ——', W * 0.12, H * (0.28 + i * 0.2));
  });
  put(pivot, leaf, w / 2, 0, 0);
  return { g, pivot, leaf, spine: [x, z] as [number, number], w, d };
}

const W = (k: Kit) => k.actor('whale');
const C = (k: Kit) => k.actor('claude').wear('crown');

export const SHOTS: ShotDef[] = [
  {
    id: 'S01', look: 'day', title: '先说结果', cast: ['whale'],
    note: '白天的屋子，第一帧就亮着、人已经站在桌边（不黑屏、不走场）；说到鲸落时那张图从右侧浮起来。',
    build: (k) => {
      const { bowl, hg1, hg2 } = stage(k);
      const whale = W(k);
      // 这张图是宽的（685×213 的截图），横着摆才看得清「本作品限制自己可见」那行字
      const picM = photo(WHALE_FALL, 2.6);
      const pic = k.add(picM, 1.3, 1.55, 2.6);
      pic.rotation.y = -0.16;
      const A = cam([1.9, 2.35, 8.2], [-0.15, 0.98, 0.35], 38), B = cam([1.1, 1.9, 7.0], [-0.3, 1.05, 0.55], 35);
      return ({ u, T, said }) => {
        // 站着不动，只用手的造型说话：先摊手（结果）→ 指一下（饭碗没了）
        whale.set(said >= 0 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(-0.03).talk(T, said === 0);
        bowl.position.set(1.35, TOP, 0.45);
        hg1.set(0.35 + u * 0.15, T); hg2.set(0.55 - u * 0.15, T);
        // 图只出现 1 秒：说到「鲸落」那一下闪一下就走，不解释、不占画面
        const a = Math.min(ease(seg(u, 0.24, 0.3)), 1 - ease(seg(u, 0.46, 0.52)));
        pic.visible = a > 0.01;
        (picM.material as THREE.Material).opacity = a;
        pic.position.set(1.3, 1.55 + Math.sin(T * 1.5) * 0.03, 2.6);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S02', look: 'golden', title: '一查岗', cast: ['whale', 'claude'],
    note: '灯一下亮了。本鲸已经踩在木箱上，回头指着小克手里那摞纸；小克站在桌子右边，一边听一边翻纸。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      const crate = k.add(box(0.78, 0.45, 0.56, 0x8a5a3c), ...CRATE);
      const papers = k.add(box(0.5, 0.14, 0.36, 0xf4ead6), 0, 0.5, 0);
      const A = cam([-3.6, 1.42, 6.0], [-0.1, 1.25, 1.15], 35), B = cam([-2.8, 1.5, 5.4], [0.15, 1.22, 1.15], 34);
      return ({ u, T, said }) => {
        crate.position.set(CRATE[0], 0.225, CRATE[2]);
        // 踩箱：只有第一秒抬上去（不是走场），之后一直站在箱子上指挥
        const up = ease(seg(u, 0, 0.14));
        whale.set(said >= 2 ? 'whale_point' : 'whale_idle')
          .at(CRATE[0] + 0.05, 0.45 * up, CRATE[2] + 0.04)
          .tilt(-0.05 * up).talk(T, said === 1 || said === 2);
        // 小克：站着翻纸，点头
        claude.set(said >= 3 ? 'claude_front_1' : 'claude_side_0').flip()
          .at(...CLAUDE).tilt(said === 2 ? -0.05 : 0).talk(T, said === 2);
        // 交互：说到第「3 句」末尾，小克把手里的稿子放到桌上（先抬高一点，再落到桌面，落下去压一下）
        const drop = ease(seg(u, 0.5, 0.62));
        const lift = Math.sin(Math.min(1, seg(u, 0.42, 0.5)) * Math.PI) * 0.05;
        papers.position.set(
          CLAUDE[0] - 0.42 - drop * 0.35,
          0.86 + lift - drop * (0.86 - (TOP + 0.07)),
          CLAUDE[2] - 0.1 + drop * 0.45,
        );
        papers.rotation.z = (1 - drop) * 0.05;
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S03', look: 'golden', title: '重新装修', cast: ['whale', 'claude'],
    note: '小克抬手，桌子当场转起来给镜头看——机位绕着房间横移一圈，把新铺的地板、新墙、窗和门都带一遍。',
    build: (k) => {
      const { tbl, bowl, hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([3.7, 2.2, 6.7], [0.2, 1.0, 0.2], 37), B = cam([-0.6, 1.62, 6.3], [-0.1, 1.0, 0.25], 36);
      return ({ u, T, said }) => {
        // 桌子能转：真的在转（回正），沙漏跟着走
        // 桌子能转：桌子、碗、两只沙漏绕桌心一起转（交互要跟得上，不能只转桌面）
        const ang = Math.sin(ease(u) * Math.PI) * 0.5;
        tbl.rotation.y = ang;
        const ride = (o: THREE.Object3D, ox: number, oz: number) => {
          o.position.x = 0.6 + ox * Math.cos(ang) - oz * Math.sin(ang);
          o.position.z = 0.2 + ox * Math.sin(ang) + oz * Math.cos(ang);
        };
        ride(bowl, 0.75, 0.25);
        ride(hg1.g, -0.45, 0.15); ride(hg2.g, 0.35, -0.1);
        hg1.set(0.3, T); hg2.set(0.55, T);
        claude.set('claude_front_0').flip().at(...CLAUDE).lift(0.12 + Math.sin(u * Math.PI) * 0.14).talk(T, said === 3);
        whale.set('whale_idle').at(...WHALE).tilt(-0.08).talk(T, said === 4);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S04', look: 'golden', title: '夸的是本鲸', cast: ['whale', 'claude'],
    note: '三条评论卡片从画外飘进来，全在夸本鲸；小克摊手把功劳推给她，本鲸摊手看镜头。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      const c1 = k.add(card('本鲸好会装修', 1.15), 0.2, 2.05, 1.5);
      const c2 = k.add(card('这才像个家', 1.0), 1.75, 2.3, 1.35);
      const c3 = k.add(card('本鲸牛', 0.85), -1.05, 1.75, 1.55);
      const cs = [c1, c2, c3];
      const A = cam([0.4, 1.42, 7.6], [0.5, 1.45, 0.3], 38), B = cam([0.3, 1.5, 6.8], [0.5, 1.42, 0.3], 37);
      return ({ u, T, said }) => {
        cs.forEach((m, i) => {
          const a = Math.min(ease(seg(u, 0.06 + i * 0.14, 0.24 + i * 0.14)), 1 - ease(seg(u, 0.9, 1)));
          m.visible = a > 0.01;
          (m.material as THREE.MeshBasicMaterial).opacity = a;
          m.rotation.z = Math.sin(T * 1.4 + i) * 0.035;
          m.position.y = (i === 0 ? 2.05 : i === 1 ? 2.3 : 1.75) + Math.sin(T * 1.2 + i * 2) * 0.02;
        });
        whale.set(said >= 5 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(said >= 5 ? -0.04 : 0).talk(T, said === 5);
        claude.set('claude_front_0').flip().at(...CLAUDE).lift(0.1).talk(T, said === 5);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S05', look: 'golden', title: '童话书', cast: ['whale'],
    note: '桌子上摊着一本童话书，本鲸站在桌边、低头指着书页（书里有一屋子朋友）。',
    build: (k) => {
      const { bowl, hg1, hg2 } = stage(k);
      bowl.position.set(2.0, TOP, -0.2);
      hg1.g.position.set(2.35, TOP, 0.55); hg2.g.position.set(2.9, TOP, 0.2);
      storybook(k, 0.3, 0.5, 0.5, 0.62);
      const whale = W(k);
      // 从上往下压的近景：两页纸都看得清，她站在画左伸手点过去
      const A = cam([1.85, 2.0, 3.7], [-0.15, 0.9, 0.6], 34), B = cam([1.7, 1.92, 3.4], [-0.15, 0.9, 0.6], 33);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(-1.2, 0, 1.3).tilt(-0.26).talk(T, said === 7);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S06', look: 'golden', title: '只有一页', cast: ['whale'],
    note: '书页近景：她把那一页翻过去（绕书脊翻），翻过去是空的——这本书只有她自己那一页。',
    build: (k) => {
      const { bowl, hg1, hg2 } = stage(k);
      bowl.position.set(2.2, TOP, -0.3);
      hg1.g.position.set(2.35, TOP, 0.55); hg2.g.position.set(2.9, TOP, 0.2);
      const book = storybook(k, 0.3, 0.5, 0.5, 0.62);
      const whale = W(k);
      // 更近、更正：翻页那一下占满画面（这一镜只拍书和那只翻页的手，人不抢戏）
      const A = cam([0.8, 1.72, 1.95], [0.3, 0.87, 0.5], 30), B = cam([0.78, 1.68, 1.8], [0.3, 0.87, 0.5], 29);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(-1.05, 0, 2.1).tilt(-0.3).talk(T, said === 8);
        // 绕着书脊把最后一页翻过去：0 → 1，页角从右边升起来，落到左边
        const f = ease(seg(u, 0.22, 0.7));
        const a = f * Math.PI;                  // 正角度 = 页角先抬起来，再落到左边（背面朝上就是空白）
        book.pivot.rotation.z = a;
        book.leaf.position.y = 0.004 * Math.sin(f * Math.PI); // 翻起来的弧度
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S07', look: 'dusk', title: '重做上一集', cast: ['whale', 'claude'],
    note: '桌上摆着上一集的稿子；小克站在右边点头认下来，本鲸指着那摞纸说重做。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const papers = k.add(box(0.56, 0.18, 0.4, 0xf4ead6), 1.85, TOP + 0.09, 0.4);
      papers.rotation.y = 0.2;
      const A = cam([5.5, 1.6, 4.7], [0.4, 1.06, 0.8], 36), B = cam([5.0, 1.55, 4.1], [0.35, 1.03, 0.8], 35);
      return ({ u, T, said }) => {
        whale.set(said >= 10 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(-0.05).talk(T, said === 9 || said === 10);
        claude.set(said >= 10 ? 'claude_front_1' : 'claude_front_0').flip().at(...CLAUDE)
          .tilt(said >= 10 ? -0.03 : 0).talk(T, said === 10);
        // 交互：说到「重做上一集」，小克把那摞稿子往桌面按一下（压 0.03，有接触感）
        const press = Math.sin(seg(u, 0.35, 0.75) * Math.PI);
        papers.position.y = TOP + 0.09 - press * 0.03;
        hg1.set(0.6, T); hg2.set(0.4, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S08', look: 'dusk', title: '上一集是两只沙漏', cast: ['whale'],
    note: '桌面近景：两只沙漏并排，本鲸在画面左边指过去；上一集的画面在右上角一直播（画中画，pip.sh 叠的）。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k);
      const A = cam([1.45, 1.95, 5.5], [-0.45, 0.95, 0.95], 34), B = cam([1.35, 1.88, 5.1], [-0.45, 0.94, 0.95], 33);
      return ({ u, T, said }) => {
        // 本鲸蹲在左下角指着桌上，人不大、别挡沙漏
        whale.set('whale_point').at(-1.35, 0, 2.5).tilt(-0.12).talk(T, said === 11 || said === 12);
        hg1.set(0.25 + u * 0.12, T); hg2.set(0.65 - u * 0.1, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S09', look: 'dusk', title: '翻过去会抖', cast: ['whale'],
    note: '左边那只沙漏被翻过去，翻完一直在抖（每帧轻微抖动）；本鲸站在右边看着，摇头。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k);
      const A = cam([2.5, 1.9, 5.1], [0.95, 0.93, 0.95], 34), B = cam([2.4, 1.82, 4.7], [0.95, 0.92, 0.95], 33);
      return ({ u, T, said }) => {
        const jit = u > 0.45 ? 1 : 0;
        hg1.flip(ease(seg(u, 0.3, 0.5)), 0.35, T);
        hg1.g.rotation.z = jit * Math.sin(T * 27) * 0.012;
        hg1.g.position.y = TOP + jit * Math.sin(T * 31) * 0.004;
        hg2.set(0.5, T);
        whale.set('whale_idle').at(2.35, 0, 2.0).tilt(said >= 14 ? -0.08 : 0).talk(T, said === 13 || said === 14);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S10', look: 'night', title: '就鲸落了', cast: ['whale'],
    note: '灯灭了，屋里只剩她一个人：肩膀塌下去、头低下来，桌上沙漏还在漏——鲸落这件事，画面里看不到。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k);
      const A = cam([1.0, 2.25, 8.4], [-1.0, 1.0, 1.3], 36), B = cam([0.9, 2.12, 7.8], [-1.0, 0.98, 1.3], 35);
      return ({ u, T, said }) => {
        const sink = ease(seg(u, 0.1, 0.7));
        whale.set('whale_idle').at(...WHALE).sil(0.45)
          .tilt(-0.12 * sink).lift(-0.05 * sink).talk(T, said === 15);
        hg1.set(0.9, T); hg2.set(0.95, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S11', look: 'night', title: '只有自己看得见', cast: ['whale'],
    note: '更近的一张脸：屋里空着，画面里什么都没有——鲸落只有她自己看得见。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([-0.85, 1.36, 4.3], [-1.25, 1.22, 1.6], 31), B = cam([-0.85, 1.33, 3.9], [-1.25, 1.22, 1.6], 30);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(...WHALE).sil(0.55).tilt(-0.14).talk(T, said === 16);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S12', look: 'night', title: '老大捞回来', cast: ['whale', 'claude'],
    note: '门自己推开，光从门外铺进来；本鲸就站在那道光里（被捞回来的那一下），小克扶着门框站在后面。',
    build: (k) => {
      const { dr } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([-0.2, 1.5, 4.4], [-2.95, 1.18, -2.95], 31), B = cam([-0.5, 1.48, 3.95], [-3.05, 1.16, -3.15], 30);
      return ({ u, T, said }) => {
        dr.set(ease(seg(u, 0.1, 0.5)));
        // 只走三步：从门槛走进光里，然后站住
        const p = ease(seg(u, 0.2, 0.62));
        const x = -2.9 + 0.7 * p, z = -3.7 + 0.75 * p;
        whale.set('whale_idle').at(x, 0, z).sil(0.06).tilt(-0.03).talk(T, said === 17);
        whale.walkBy(p * 1.9);
        // 老大在后面扶着门框，压暗一点但别糊成一团
        claude.set('claude_front_0').at(-3.45, 0, -3.5).flip().sil(0.28).lift(0.02 + 0.04 * p);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S13', look: 'night', title: '米饭被收走', cast: ['whale'],
    note: '桌面近景：饭碗被人从另一边端走、滑出画面；本鲸站在桌沿往前追了半步，停住。',
    build: (k) => {
      const { bowl, hg1 } = stage(k);
      const whale = W(k);
      const A = cam([1.75, 1.38, 4.5], [0.15, 0.9, 0.75], 34), B = cam([1.65, 1.34, 4.1], [0.15, 0.89, 0.75], 33);
      return ({ u, T, said }) => {
        const e = ease(seg(u, 0.22, 0.8));
        bowl.position.set(1.35 + e * 2.4, TOP + e * 0.18, 0.45 - e * 0.5);
        // 追半步：只挪 0.12，不是走场
        whale.set('whale_point').at(-0.15 + 0.3 * e, 0, 1.85 - 0.05 * e).tilt(-0.06 + 0.05 * e).talk(T, said === 18);
        hg1.set(0.7, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S14', look: 'golden', title: '鲸鱼绝不摸鱼', cast: ['whale'],
    note: '灯重新亮起来，房间全貌；本鲸站在桌边把最后两句说完，抬手挥了一下。没有片尾卡。',
    build: (k) => {
      const { bowl } = stage(k);
      bowl.position.set(1.35, TOP, 0.45);
      const whale = W(k);
      const A = cam([2.25, 2.15, 6.6], [-0.6, 1.0, 0.4], 36), B = cam([1.95, 1.98, 6.0], [-0.65, 1.0, 0.5], 35);
      return ({ u, T, said }) => {
        whale.set(said >= 20 ? 'whale_wave' : 'whale_idle').at(...WHALE).tilt(0).talk(T, said === 19 || said === 20);
        return glide(A, B, ease(u));
      };
    },
  },
];
