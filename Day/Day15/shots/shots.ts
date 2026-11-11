// Day15｜小克把家重新装修了，米饭没了 —— 走位骨架（block-out）：14 个镜头，卡点按配音实测。
//
// 只到「谁站在哪、机位怎么走、电视占住位置」：
//   · 电视只有一块空面板，没有接 素材/tv_day14 的帧（要先在 props.ts 加 tv()，见 分镜.md 第三节）；
//   · 「只有自己看得见」用一块发灰的手机屏表达，不出现任何后台界面；
//   · 纸片、书、饭碗的动画没写；米饭滑走只在 S13 把碗移出画面。
// 时机一律挂在句子上（f.said / lineU / f.when），不要改成镜头进度的百分比。
import { cam, glide, lineU, type Kit, type ShotDef } from '@tpl/core';
import { box, ease, seg } from '@tpl/kit';
import { door, hourglass, plant, riceBowl, room, table, windowPane } from '@tpl/props';

const TOP = 0.8;
const WHALE = [-1.45, 0, 0.7] as const;
const CLAUDE = [2.7, 0, 0.45] as const;

function stage(k: Kit) {
  k.add(room({ w: 12, d: 9, wall: 0xe6d8bf, floor: 0x9a6a46, rug: 0xc07c7c }));
  const dr = door(); k.add(dr.g, -3.6, 0, -4.48);
  k.add(windowPane(2.2, 1.6), 2.9, 1.6, -4.48);
  k.add(plant(), 5.1, 0, -3.6);
  k.add(table(3.0, 1.4, TOP), 0.6, 0, 0.2);
  const bowl = k.add(riceBowl(), 1.35, TOP, 0.45);
  const hg1 = hourglass(); k.add(hg1.g, 0.15, TOP, 0.35);
  const hg2 = hourglass(0.78); k.add(hg2.g, 0.95, TOP, 0.1);
  // 电视占位：矮柜 + 木框 + 一块还没接画面的屏（真正的电视道具见 分镜.md 第三节）
  k.add(box(2.4, 0.5, 0.6, 0x8a5a3c), 3.0, 0.25, -0.95);
  k.add(box(2.1, 1.0, 0.2, 0x7a4a34), 3.0, 1.02, -0.95);
  k.add(box(1.9, 0.81, 0.04, 0x5d7a8c), 3.0, 1.02, -0.84);
  return { dr, bowl, hg1, hg2 };
}

const W = (k: Kit) => k.actor('whale');
const C = (k: Kit) => k.actor('claude').wear('crown');

export const SHOTS: ShotDef[] = [
  {
    id: 'S01', look: 'night', title: '先说结果', cast: ['whale'],
    note: '夜里，桌上空碗，鲸鱼娘压成剪影站在桌边。第一句就把结果甩出来。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k);
      const A = cam([-0.2, 1.55, 5.8], [-1.15, 1.05, 0.7], 34), B = cam([-0.1, 1.5, 5.0], [-1.2, 1.0, 0.7], 32);
      return ({ u, T, said }) => {
        whale.front(T).at(-1.35, 0, 1.25).sil(0.55).talk(T, said === 0);
        bowl.position.set(1.35, TOP, 0.45);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S02', look: 'night', title: '一查岗', cast: ['whale', 'claude'],
    note: '灯忽然亮了。鲸鱼娘踩着木箱，指挥小克改做好的片子；小克抱着一摞纸站在桌边。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      k.add(box(0.7, 0.45, 0.55, 0x8a5a3c), -0.9, 0.225, 1.2);
      const A = cam([0.4, 1.75, 7.2], [0.5, 1.15, 0.2], 36), B = cam([0.3, 1.7, 6.6], [0.5, 1.1, 0.2], 35);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(-0.9, 0.45, 1.2).talk(T, said === 1 || said === 2);
        claude.set('claude_front_0').flip().at(...CLAUDE);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S03', look: 'golden', title: '重新装修', cast: ['whale', 'claude'],
    note: '小克手一抬，屋子在她身后「立起来」：桌角、窗台、地板三层纵深。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.6, 1.7, 6.6], [0.9, 1.1, 0.3], 36), B = cam([0.3, 1.5, 5.4], [0.8, 1.05, 0.1], 33);
      return ({ u, T, said }) => {
        whale.front(T).at(...WHALE).talk(T, said === 3);
        claude.set('claude_front_0').flip().at(...CLAUDE);
        hg1.set(0.2 + u * 0.2, T); hg2.set(0.5 - u * 0.2, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S04', look: 'golden', title: '夸的是本鲸', cast: ['whale', 'claude'],
    note: '鲸鱼娘摊手看镜头；小克在旁边点头，把功劳推回来。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.6, 1.65, 6.2], [0.7, 1.1, 0.3], 34);
      return ({ T, said }) => {
        whale.set(said >= 5 ? 'whale_point' : 'whale_idle').at(...WHALE).talk(T, said === 5 || said === 6);
        claude.set('claude_front_1').flip().at(...CLAUDE);
        return A;
      };
    },
  },
  {
    id: 'S05', look: 'golden', title: '童话书', cast: ['whale'],
    note: '桌面：一本摊开的书，书页有厚度；鲸鱼娘从桌后看着它。',
    build: (k) => {
      const { hg1 } = stage(k);
      k.add(box(1.15, 0.07, 0.8, 0xf4ead6), 0.35, TOP + 0.04, 0.25);
      const whale = W(k);
      const A = cam([0.35, 2.3, 2.6], [0.4, TOP, 0.25], 32), B = cam([0.35, 2.1, 2.1], [0.4, TOP, 0.25], 30);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(-1.3, 0, 1.2).talk(T, said === 7);
        hg1.set(0.5, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S06', look: 'golden', title: '只有一页', cast: ['whale'],
    note: '书页近景：只有一行字，后面是空白。',
    build: (k) => {
      stage(k);
      k.add(box(1.15, 0.07, 0.8, 0xf4ead6), 0.35, TOP + 0.04, 0.25);
      const whale = W(k);
      const A = cam([0.35, 2.2, 2.3], [0.4, TOP, 0.25], 30), B = cam([0.35, 2.0, 1.85], [0.4, TOP, 0.25], 28);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(-1.3, 0, 1.2).talk(T, said === 8);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S07', look: 'dusk', title: '重做上一集', cast: ['whale', 'claude'],
    note: '夜里的桌边：小克在翻纸，鲸鱼娘站在她身后指着桌面。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.5, 1.75, 6.0], [0.7, 1.1, 0.3], 36), B = cam([0.2, 1.65, 5.4], [0.7, 1.05, 0.3], 34);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(-0.9, 0, 1.3).talk(T, said === 9 || said === 10);
        claude.set('claude_side_0').flip().at(...CLAUDE);
        hg1.set(0.6, T); hg2.set(0.4, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S08', look: 'dusk', title: '电视亮了', cast: ['whale'],
    note: '鲸鱼娘拍了一下电视，屏幕先黑一帧再亮；她退到左边，指着屏幕。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([1.5, 1.7, 5.6], [2.95, 1.2, -0.85], 32), B = cam([1.8, 1.65, 5.1], [2.95, 1.2, -0.85], 31);
      return ({ u, T, said }) => {
        whale.set('whale_point').at(1.45, 0, 1.45).talk(T, said === 11 || said === 12);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S09', look: 'dusk', title: '电视里在抖', cast: ['whale'],
    note: '电视特写：上一集的沙漏在屏幕里跳。鲸鱼娘在左边缘只露半个身子。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([2.0, 1.35, 3.6], [2.95, 1.15, -0.85], 27), B = cam([2.2, 1.3, 3.1], [2.95, 1.15, -0.85], 26);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(1.15, 0, 1.9).talk(T, said === 13 || said === 14);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S10', look: 'night', title: '就鲸落了', cast: ['whale'],
    note: '灯灭了。还是那部手机，屏幕发灰；屋里只有她一个人。',
    build: (k) => {
      stage(k);
      k.add(box(0.55, 0.05, 0.95, 0x2a2a33), 0.55, TOP + 0.03, 0.55);
      k.add(box(0.47, 0.02, 0.82, 0xb9c6d2), 0.55, TOP + 0.06, 0.55);
      const whale = W(k);
      const A = cam([3.5, 2.0, 5.6], [1.15, 0.9, 0.2], 36), B = cam([3.35, 1.95, 5.2], [1.15, 0.9, 0.2], 35);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(2.25, 0, 1.75).sil(0.72).talk(T, said === 15);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S11', look: 'night', title: '只有自己看得见', cast: ['whale'],
    note: '手机屏特写：屏幕发灰，玻璃里只映出本鲸一个人。同一场，机位比 S10 更近。',
    build: (k) => {
      stage(k);
      k.add(box(0.55, 0.05, 0.95, 0x2a2a33), 0.55, TOP + 0.03, 0.55);
      k.add(box(0.47, 0.02, 0.82, 0xb9c6d2), 0.55, TOP + 0.06, 0.55);
      const whale = W(k);
      const A = cam([2.95, 1.9, 4.6], [1.2, 0.9, 0.2], 34), B = cam([2.8, 1.85, 4.2], [1.2, 0.9, 0.2], 33);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(2.3, 0, 1.65).sil(0.55).talk(T, said === 16);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S12', look: 'night', title: '老大捞回来', cast: ['whale'],
    note: '门口推开一道光，鲸鱼娘站在光里，剪影被照亮一半。',
    build: (k) => {
      const { dr } = stage(k);
      const whale = W(k);
      const A = cam([0.0, 1.7, 6.4], [-0.6, 1.1, 0.3], 36);
      return ({ u, T, said }) => {
        dr.set(ease(seg(u, 0.1, 0.5)));
        whale.front(T).at(...WHALE).sil(1 - ease(seg(u, 0.2, 0.8))).talk(T, said === 17);
        return A;
      };
    },
  },
  {
    id: 'S13', look: 'night', title: '米饭被收走', cast: ['whale'],
    note: '桌面近景：饭碗滑出画面，只剩空桌面。不画手来拿。',
    build: (k) => {
      const { bowl, hg1 } = stage(k);
      const whale = W(k);
      const A = cam([1.2, 1.9, 3.0], [1.3, TOP, 0.4], 32);
      return (f) => {
        whale.set('whale_idle').at(-1.4, 0, 1.1);
        const e = ease(lineU(f, 18));
        bowl.position.set(1.35 + e * 2.2, TOP, 0.45 + e * 0.4);
        hg1.set(0.7, f.T);
        return A;
      };
    },
  },
  {
    id: 'S14', look: 'dusk', title: '鲸鱼绝不摸鱼', cast: ['whale'],
    note: '灯重新亮起来。房间全景，鲸鱼娘站定面向镜头说完最后两句。没有片尾卡。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([0.3, 1.8, 7.4], [0.2, 1.05, 0.3], 38);
      return ({ T, said }) => {
        whale.set(said >= 20 ? 'whale_wave' : 'whale_idle').at(...WHALE).talk(T, said === 19 || said === 20);
        return A;
      };
    },
  },
];
