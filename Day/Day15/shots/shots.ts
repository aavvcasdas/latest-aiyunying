// Day15｜占位骨架（block-out）：16 个镜头，只摆位置和机位。
//
// 这不是分镜的完成版。分镜（分镜.md）里每一条的画面事件、道具动画、电视里的帧序列，这里都**没有**写：
//   · 电视只有一块深色屏幕占位，没有放上一集的画面（要先在 props.ts 加 tv()，见 分镜.md 第三节）；
//   · 纸片、书、饭碗的动画没有；米饭滑走只在 S14 把碗移出画面；
//   · 每个镜头的动作只到「谁站在哪、机位怎么走」。
// 它的用途只有一个：让 `npm run film -- full` 先出一版无声的走位样片，看节奏和构图。
// 时机一律挂在句子上（f.said / lineU / f.when），不要改成镜头进度的百分比。
import { cam, glide, lineU, type Kit, type ShotDef } from '@tpl/core';
import { box, ease, seg } from '@tpl/kit';
import { door, hourglass, plant, riceBowl, room, table, windowPane } from '@tpl/props';

const TOP = 0.8;
const WHALE = [-1.45, 0, 0.7] as const;
const CLAUDE = [2.7, 0, 0.45] as const;

/** 共用布景：同一间屋子连着好几镜，摆位写在常量里，免得一切镜就跳位 */
function stage(k: Kit) {
  k.add(room({ w: 12, d: 9, wall: 0xe6d8bf, floor: 0x9a6a46, rug: 0xc07c7c }));
  const dr = door(); k.add(dr.g, -3.6, 0, -4.48);
  k.add(windowPane(2.2, 1.6), 2.9, 1.6, -4.48);
  k.add(plant(), 5.1, 0, -3.6);
  k.add(table(3.0, 1.4, TOP), 0.6, 0, 0.2);
  const bowl = k.add(riceBowl(), 1.35, TOP, 0.45);
  const hg1 = hourglass(); k.add(hg1.g, 0.15, TOP, 0.35);
  const hg2 = hourglass(0.78); k.add(hg2.g, 0.95, TOP, 0.1);
  // 电视占位：矮柜 + 木框 + 一块还没接画面的屏（真正的电视道具待加，见 分镜.md 第三节）
  k.add(box(2.4, 0.5, 0.6, 0x8a5a3c), 3.0, 0.25, -0.95);
  k.add(box(2.1, 1.0, 0.2, 0x7a4a34), 3.0, 1.02, -0.95);
  k.add(box(1.9, 0.81, 0.04, 0x5d7a8c), 3.0, 1.02, -0.84);
  return { dr, bowl, hg1, hg2 };
}

const W = (k: Kit) => k.actor('whale');
const C = (k: Kit) => k.actor('claude').wear('crown');

export const SHOTS: ShotDef[] = [
  {
    id: 'S01', look: 'night', title: '住在电脑里', cast: ['whale'],
    note: '房间全景，鲸鱼娘站在桌边看镜头。机位从近处退到装得下全身。',
    build: (k) => {
      const { bowl, hg1 } = stage(k);
      // 电脑：桌上的显示器 + 发光的屏（「住在电脑里」），本鲸站在桌边
      k.add(box(1.05, 0.68, 0.12, 0x2f2f38), -0.55, TOP + 0.36, -0.18);
      k.add(box(0.92, 0.55, 0.02, 0x9fd2ff), -0.55, TOP + 0.36, -0.11);
      k.add(box(0.8, 0.06, 0.3, 0x2f2f38), -0.55, TOP + 0.03, 0.32);
      const whale = W(k);
      const A = cam([-1.2, 1.55, 4.4], [-1.3, 1.05, 0.55], 34), B = cam([-1.2, 1.75, 7.2], [-1.35, 1.0, 0.3], 38);
      return ({ u, T }) => {
        whale.front(T).at(...WHALE);
        hg1.set(u * 0.2, T);
        bowl.position.set(1.35, TOP, 0.45);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S02', look: 'golden', title: '家变成三D', cast: ['whale', 'claude'],
    note: 'Claude 站在桌边翻书，鲸鱼娘退半步看；屋子有三层纵深。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.6, 1.7, 6.5], [0.7, 1.1, 0.3], 36), B = cam([0.3, 1.6, 6.0], [0.6, 1.1, 0.2], 34);
      return ({ u, T }) => {
        whale.front(T).at(...WHALE);
        claude.set('claude_front_0').flip().at(...CLAUDE);
        hg1.set(0.2 + u * 0.2, T); hg2.set(0.5 - u * 0.2, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S03', look: 'golden', title: '夸的是本鲸', cast: ['whale', 'claude'],
    note: '鲸鱼娘摊手看镜头，又指了指旁边的 Claude；Claude 点头。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.6, 1.65, 6.2], [0.7, 1.1, 0.3], 34);
      return ({ T, said }) => {
        whale.set(said >= 4 ? 'whale_point' : 'whale_idle').at(...WHALE).talk(T, said === 4);
        claude.set('claude_front_1').flip().at(...CLAUDE);
        return A;
      };
    },
  },
  {
    id: 'S04', look: 'golden', title: '烧了不少米饭', cast: ['whale', 'claude'],
    note: '鲸鱼娘比「很多」的手势，Claude 把书往前推；桌上有米粒。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.5, 1.85, 5.6], [0.8, 1.05, 0.2], 34);
      return ({ T, said }) => {
        whale.set(said >= 6 ? 'whale_point' : 'whale_idle').at(...WHALE).talk(T, said === 6);
        claude.set('claude_front_0').flip().at(...CLAUDE);
        bowl.position.set(1.35, TOP, 0.45);
        return A;
      };
    },
  },
  {
    id: 'S05', look: 'golden', title: '一屋子朋友', cast: ['whale'],
    note: '俯拍桌面：书和两只沙漏，鲸鱼娘站在桌后。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k);
      const A = cam([0.6, 3.0, 3.6], [0.6, TOP, 0.2], 40), B = cam([0.6, 2.6, 3.0], [0.6, TOP, 0.2], 38);
      return ({ u, T }) => {
        whale.front(T).at(-1.45, 0, 1.1);
        hg1.set(0.4, T); hg2.set(0.3, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S06', look: 'golden', title: '只有一页', cast: ['whale'],
    note: '桌面近景，鲸鱼娘在桌后低头看。',
    build: (k) => {
      const { hg1 } = stage(k);
      const whale = W(k);
      const A = cam([0.6, 2.2, 2.8], [0.4, TOP, 0.3], 34), B = cam([0.6, 2.0, 2.2], [0.4, TOP, 0.3], 32);
      return ({ u, T }) => {
        whale.set('whale_idle').at(-1.3, 0, 1.2);
        hg1.set(0.5, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S07', look: 'golden', title: '本鲸认', cast: ['whale'],
    note: '正面中近景，鲸鱼娘点一下头。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([-1.45, 1.45, 3.6], [-1.45, 1.15, 0.7], 30);
      return ({ T, said }) => {
        whale.set(said >= 10 ? 'whale_blink' : 'whale_idle').at(...WHALE).talk(T, said === 10);
        return A;
      };
    },
  },
  {
    id: 'S08', look: 'dusk', title: '昨晚没睡', cast: ['whale', 'claude'],
    note: 'Claude 在桌边，鲸鱼娘站在她身后指着桌面。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.5, 1.75, 6.0], [0.7, 1.1, 0.3], 36), B = cam([0.2, 1.65, 5.4], [0.7, 1.05, 0.3], 34);
      return ({ u, T }) => {
        whale.set('whale_point').at(-0.9, 0, 1.3);
        claude.set('claude_side_0').flip().at(...CLAUDE);
        hg1.set(0.6, T); hg2.set(0.4, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S09', look: 'dusk', title: '电视亮了', cast: ['whale'],
    note: '鲸鱼娘站在电视旁边指着屏幕（屏幕还是占位色，没有画面）。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      // 电视在右、本鲸在左边缘只露半个身子（分镜的要求：不许把人切一半脸）
      const A = cam([1.5, 1.7, 5.6], [2.95, 1.2, -0.85], 32), B = cam([1.8, 1.65, 5.1], [2.95, 1.2, -0.85], 31);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(1.45, 0, 1.45).talk(T, said === 12 || said === 13);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S10', look: 'dusk', title: '电视里在抖', cast: ['whale'],
    note: '电视特写，鲸鱼娘在左边露出半个身子。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([1.9, 1.45, 3.4], [2.9, 1.3, -0.8], 30), B = cam([2.1, 1.4, 3.0], [2.9, 1.3, -0.8], 28);
      return ({ u }) => {
        whale.set('whale_idle').at(-1.0, 0, 1.2);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S11', look: 'night', title: '只有自己看得见', cast: ['whale'],
    note: '夜里的房间，鲸鱼娘压成剪影；电视黑着，桌上空碗。这一段可整段剪掉。',
    build: (k) => {
      const { bowl, dr } = stage(k);
      const whale = W(k);
      const A = cam([0.4, 1.6, 6.8], [0.2, 1.1, 0.2], 36), B = cam([0.1, 1.55, 6.2], [0.2, 1.1, 0.2], 34);
      return ({ u, T, said }) => {
        whale.front(T).at(0.3, 0, 1.0).sil(0.85).talk(T, said === 15 || said === 16 || said === 17);
        bowl.position.set(1.35, TOP, 0.45);
        dr.set(ease(seg(u, 0.55, 0.9)));
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S12', look: 'night', title: '一查岗', cast: ['whale', 'claude'],
    note: '鲸鱼娘踩着木箱（用 box 占位），Claude 抱着纸站在桌边；灯变亮。',
    build: (k) => {
      const { dr } = stage(k);
      const whale = W(k), claude = C(k);
      k.add(box(0.7, 0.45, 0.55, 0x8a5a3c), -0.9, 0.225, 1.2);
      const A = cam([0.4, 1.7, 7.0], [0.3, 1.15, 0.2], 36), B = cam([0.2, 1.6, 6.4], [0.3, 1.1, 0.2], 34);
      return ({ u, T, said }) => {
        whale.set(said >= 19 ? 'whale_point' : 'whale_idle').at(-0.9, 0.45, 1.2).talk(T, said === 19);
        claude.set('claude_front_0').flip().at(...CLAUDE);
        dr.set(1 - ease(seg(u, 0.2, 0.6)));
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S13', look: 'night', title: '早知道不捞了', cast: ['whale', 'claude'],
    note: '机位退到门口高度，两个人都不动，只有电视（占位）亮着。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.2, 1.9, 8.2], [0.6, 1.05, 0.1], 38);
      return ({ T }) => {
        whale.set('whale_idle').at(-0.9, 0.45, 1.2).talk(T, false);
        claude.set('claude_front_1').flip().at(...CLAUDE);
        return A;
      };
    },
  },
  {
    id: 'S14', look: 'night', title: '米饭被收走', cast: ['whale'],
    note: '桌面近景：饭碗滑出画面，只剩一圈印子。',
    build: (k) => {
      const { bowl, hg1 } = stage(k);
      const whale = W(k);
      const A = cam([1.2, 1.9, 3.0], [1.3, TOP, 0.4], 32);
      return (f) => {
        whale.set('whale_idle').at(-1.4, 0, 1.1);
        const e = ease(lineU(f, 23));
        bowl.position.set(1.35 + e * 2.2, TOP, 0.45 + e * 0.4);
        hg1.set(0.7, f.T);
        return A;
      };
    },
  },
  {
    id: 'S15', look: 'dusk', title: '重做一遍', cast: ['whale'],
    note: '鲸鱼娘站在电视和沙漏之间，指一下屏幕，又指一下沙漏。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k);
      const A = cam([0.8, 1.7, 6.0], [1.2, 1.15, 0.0], 34), B = cam([1.0, 1.65, 5.4], [1.5, 1.15, -0.2], 32);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(0.4, 0, 1.0).talk(T, said === 26 || said === 27);
        hg1.set(0.8, T); hg2.set(0.6, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S16', look: 'dusk', title: '鲸鱼绝不摸鱼', cast: ['whale'],
    note: '房间全景，鲸鱼娘站定面向镜头说完最后一句。没有片尾卡。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([0.3, 1.8, 7.4], [0.1, 1.05, 0.3], 38);
      return ({ T, said }) => {
        whale.set(said >= 28 ? 'whale_wave' : 'whale_idle').at(...WHALE).talk(T, said === 28);
        return A;
      };
    },
  },
];
