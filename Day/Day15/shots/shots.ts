// Day15｜小克把家重新装修了，米饭没了 —— 14 个镜头，卡点按配音实测。
//
// 这一版按第五轮的意见重写：
//   · 不再一镜一走：人从第一帧就站在该站的位置，只有真的需要交代动作时才走一步
//     （S02 踩上木箱、S12 从门口被捞回来），而且路线全部避开桌子（桌沿是 x −0.9…2.1、z −0.5…0.9，
//     人一律站在 z ≥ 1.25 或者桌子外侧的 x 上，不会再走进桌子里）。
//   · 一镜一场戏：每句话都配一样看得见的东西 —— 木箱和纸、转起来的桌子、弹幕卡片、
//     摊开的书、两只沙漏、手机和鲸落图、开门的灯光、滑走的饭碗。
//   · 电视改画中画：上一集的成片由 pip.sh 叠在右上角，从第一帧一直播到最后一帧，
//     三维里不再摆一台假电视（那台电视的模型 props.tv 还在引擎里，本片不用）。
//   · 书用 notebook 的书页组：绕书脊翻，翻过去是空的 —— 不会再把整页原地打转。
import * as THREE from 'three';
import { cam, glide, type Kit, type ShotDef } from '@tpl/core';
import { box, canvasTex, ease, seg } from '@tpl/kit';
import { FONT } from '@tpl/fonts';
import { door, hourglass, notebook, photo, plant, riceBowl, room, table, windowPane } from '@tpl/props';
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
      const A = cam([0.15, 1.78, 7.6], [0.25, 1.12, 0.4], 37), B = cam([0.05, 1.7, 7.0], [0.25, 1.08, 0.4], 36);
      return ({ u, T, said }) => {
        // 站着不动，只用手的造型说话：先摊手（结果）→ 指一下（饭碗没了）
        whale.set(said >= 0 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(-0.03).talk(T, said === 0);
        bowl.position.set(1.35, TOP, 0.45);
        hg1.set(0.35 + u * 0.15, T); hg2.set(0.55 - u * 0.15, T);
        // 图：说到「鲸落」时浮起来，最后两帧收掉，不解释
        const a = Math.min(ease(seg(u, 0.28, 0.42)), 1 - ease(seg(u, 0.92, 1)));
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
      const A = cam([0.9, 1.85, 6.9], [0.45, 1.12, 0.6], 36), B = cam([0.75, 1.8, 6.5], [0.45, 1.1, 0.55], 35);
      return ({ u, T, said }) => {
        crate.position.set(CRATE[0], 0.225, CRATE[2]);
        // 踩箱：只有第一秒抬上去（不是走场），之后一直站在箱子上指挥
        const up = ease(seg(u, 0, 0.14));
        whale.set(said >= 2 ? 'whale_point' : 'whale_idle')
          .at(CRATE[0] + 0.05, 0.45 * up, CRATE[2] + 0.04)
          .tilt(-0.05 * up).talk(T, said === 1 || said === 2);
        // 小克：站着翻纸，点头
        const nod = Math.sin(T * 2.6) * 0.025;
        claude.set(said >= 3 ? 'claude_front_1' : 'claude_side_0').flip()
          .at(...CLAUDE).tilt(nod).talk(T, false);
        papers.position.set(CLAUDE[0] - 0.42, 0.86 + Math.sin(T * 3) * 0.02, CLAUDE[2] - 0.1);
        papers.rotation.z = Math.sin(T * 3) * 0.06;
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S03', look: 'golden', title: '重新装修', cast: ['whale', 'claude'],
    note: '小克抬手，桌子当场转起来给镜头看——机位绕着房间横移一圈，把新铺的地板、新墙、窗和门都带一遍。',
    build: (k) => {
      const { tbl, hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([3.0, 1.9, 6.4], [0.3, 1.1, 0.3], 38), B = cam([-2.2, 1.75, 6.6], [0.5, 1.05, 0.3], 38);
      return ({ u, T, said }) => {
        // 桌子能转：真的在转（回正），沙漏跟着走
        tbl.rotation.y = Math.sin(ease(u) * Math.PI) * 0.5;
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
      const A = cam([0.35, 1.95, 7.2], [0.5, 1.32, 0.4], 38), B = cam([0.25, 1.9, 6.6], [0.5, 1.3, 0.4], 37);
      return ({ u, T, said }) => {
        cs.forEach((m, i) => {
          const a = Math.min(ease(seg(u, 0.06 + i * 0.14, 0.24 + i * 0.14)), 1 - ease(seg(u, 0.9, 1)));
          m.visible = a > 0.01;
          (m.material as THREE.MeshBasicMaterial).opacity = a;
          m.rotation.z = Math.sin(T * 1.4 + i) * 0.035;
          m.position.y = (i === 0 ? 2.05 : i === 1 ? 2.3 : 1.75) + Math.sin(T * 1.2 + i * 2) * 0.02;
        });
        whale.set(said >= 5 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(Math.sin(T * 1.8) * 0.03).talk(T, said === 5);
        claude.set('claude_front_0').flip().at(...CLAUDE).lift(0.1 + Math.sin(T * 2) * 0.05).talk(T, said === 5);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S05', look: 'golden', title: '童话书', cast: ['whale'],
    note: '桌子上摊着一本童话书，本鲸站在桌边、低头指着书页（书里有一屋子朋友）。',
    build: (k) => {
      const { bowl } = stage(k);
      bowl.position.set(2.0, TOP, -0.2);
      const book = notebook(0.86, 0.64);
      const bg = k.add(book.g, 0.35, TOP + 0.02, 0.35, 0.1);
      bg.rotation.x = 0;
      book.cover.rotation.y = 0.02 + Math.sin(1.2) * 0.01;
      const whale = W(k);
      const A = cam([1.15, 2.05, 3.4], [0.55, 0.95, 0.4], 32), B = cam([1.0, 1.98, 3.0], [0.5, 0.92, 0.4], 31);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(-0.35, 0, 1.55).tilt(-0.16).talk(T, said === 7);
        book.cover.rotation.y = 0.06 + Math.sin(T * 1.1) * 0.02;
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S06', look: 'golden', title: '只有一页', cast: ['whale'],
    note: '书页近景：她把那一页翻过去（绕书脊翻），翻过去是空的——这本书只有她自己那一页。',
    build: (k) => {
      const { bowl } = stage(k);
      bowl.position.set(2.2, TOP, -0.3);
      const book = notebook(0.92, 0.68);
      k.add(book.g, 0.4, TOP + 0.02, 0.3, 0.06);
      const whale = W(k);
      const A = cam([0.95, 1.95, 4.2], [0.45, 0.9, 0.35], 34), B = cam([0.85, 1.9, 3.8], [0.45, 0.88, 0.35], 33);
      return ({ u, T, said }) => {
        // 人退到画面左边、别糊在镜头上
        whale.set('whale_idle').at(-1.5, 0, 2.3).tilt(-0.18).talk(T, said === 8);
        // 绕书脊翻页：0.3 起翻，翻到 1（背面朝上）
        const f = ease(seg(u, 0.3, 0.78));
        book.cover.rotation.y = f * Math.PI * 1.02;
        void T;
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
      const A = cam([0.5, 1.8, 6.3], [0.35, 1.08, 0.45], 36), B = cam([0.3, 1.72, 5.8], [0.3, 1.04, 0.45], 35);
      return ({ u, T, said }) => {
        whale.set(said >= 10 ? 'whale_point' : 'whale_idle').at(...WHALE).tilt(-0.05).talk(T, said === 9 || said === 10);
        claude.set(said >= 10 ? 'claude_front_1' : 'claude_front_0').flip().at(...CLAUDE)
          .tilt(0.04 * Math.sin(T * 2.4)).talk(T, said === 10);
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
      const A = cam([1.1, 1.72, 4.6], [0.3, 1.0, 0.45], 36), B = cam([1.2, 1.68, 4.2], [0.3, 0.98, 0.45], 35);
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
      const A = cam([1.5, 1.62, 4.2], [0.6, 1.0, 0.45], 34), B = cam([1.6, 1.58, 3.9], [0.62, 0.98, 0.45], 33);
      return ({ u, T, said }) => {
        const jit = u > 0.45 ? 1 : 0;
        hg1.flip(ease(seg(u, 0.3, 0.5)), 0.35, T);
        hg1.g.rotation.z = jit * Math.sin(T * 27) * 0.012;
        hg1.g.position.y = TOP + jit * Math.sin(T * 31) * 0.004;
        hg2.set(0.5, T);
        whale.set('whale_idle').at(2.2, 0, 1.35).tilt(Math.sin(T * 3) * 0.05).talk(T, said === 13 || said === 14);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S10', look: 'night', title: '就鲸落了', cast: ['whale'],
    note: '灯灭了，屋里只剩她一个人；她举着手机，身后那张「鲸落」的图自己浮起来。',
    build: (k) => {
      stage(k);
      const picM = photo(WHALE_FALL, 1.95);
      const pic = k.add(picM, 0.95, 1.18, 2.1);
      pic.rotation.y = -0.16;
      const whale = W(k);
      const A = cam([-0.1, 1.7, 6.0], [0.45, 1.05, 0.5], 36), B = cam([-0.05, 1.66, 5.5], [0.45, 1.02, 0.5], 35);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(...WHALE).sil(0.45).talk(T, said === 15);
        const a = Math.min(ease(seg(u, 0.3, 0.55)), 1 - ease(seg(u, 0.95, 1)));
        pic.visible = a > 0.01;
        (picM.material as THREE.Material).opacity = a * 0.95;
        pic.position.set(0.95, 1.18 + Math.sin(T * 1.3) * 0.02, 2.1);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S11', look: 'night', title: '只有自己看得见', cast: ['whale'],
    note: '更近：手机屏举在胸前，鲸落这张图占着画面右侧，屋里只有她一个人。',
    build: (k) => {
      stage(k);
      const picM = photo(WHALE_FALL, 2.2);
      const pic = k.add(picM, 0.9, 1.18, 2.35);
      pic.rotation.y = -0.12;
      const whale = W(k);
      const A = cam([0.3, 1.62, 5.0], [0.55, 1.08, 0.55], 34), B = cam([0.35, 1.58, 4.5], [0.55, 1.06, 0.55], 33);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(...WHALE).sil(0.55).tilt(Math.sin(T * 1.6) * 0.02).talk(T, said === 16);
        (picM.material as THREE.Material).opacity = 0.95;
        pic.position.set(0.9 + Math.sin(T * 1.2) * 0.015, 1.18 + Math.sin(T * 1.05) * 0.02, 2.35);
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
      const A = cam([-0.4, 1.62, 5.2], [-1.9, 1.15, -1.4], 36), B = cam([-0.3, 1.56, 4.7], [-1.9, 1.12, -1.4], 35);
      return ({ u, T, said }) => {
        dr.set(ease(seg(u, 0.1, 0.5)));
        // 只走三步：从门槛走进光里，然后站住
        const p = ease(seg(u, 0.2, 0.62));
        const x = -2.9 + 0.7 * p, z = -3.7 + 0.75 * p;
        whale.set('whale_idle').at(x, 0, z).sil(0.06).tilt(-0.03).talk(T, said === 17);
        whale.walkBy(p * 1.9);
        // 老大在后面扶着门框，压暗一点但别糊成一团
        claude.set('claude_front_0').at(-3.85, 0, -4.05).flip().sil(0.5).lift(0.02 + 0.04 * p);
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
      const A = cam([1.25, 1.85, 5.2], [0.95, 1.02, 0.4], 34), B = cam([1.15, 1.8, 4.8], [0.95, 1.0, 0.4], 33);
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
      const A = cam([0.4, 1.85, 7.6], [0.3, 1.1, 0.35], 38), B = cam([0.3, 1.8, 7.0], [0.3, 1.08, 0.35], 37);
      return ({ u, T, said }) => {
        whale.set(said >= 20 ? 'whale_wave' : 'whale_idle').at(...WHALE).tilt(Math.sin(T * 1.7) * 0.02).talk(T, said === 19 || said === 20);
        return glide(A, B, ease(u));
      };
    },
  },
];
