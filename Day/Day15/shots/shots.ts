// Day15｜小克把家重新装修了，米饭没了 —— 14 个镜头，卡点按配音实测。
//
// 这一版的重点是「人要动」：每一镜都让角色真的走到位置上（按走过的距离迈步，脚不打滑，
// 步幅跟人物大小走——跟 3d坏女孩.zip 里修好的那套一致），站定之后再说话；顺带把几处互动写实：
//   · S02 本鲸走到木箱前、踩上去再指挥；小克抱着一摞纸从右边走进来；
//   · S07 小克把纸摞放到桌上，本鲸指着桌面；
//   · S08 本鲸走到电视前拍了一下，屏幕先黑一帧再亮；
//   · S10/S11 本鲸走到桌边把手机拿起来看（不是站在旁边摆着）；
//   · S12 门开、本鲸从门外的暗处一路走进光里；
//   · S13 饭碗滑走，本鲸往前追半步停住；S14 走进画面、站定、挥手。
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
  // 电视：矮柜 + 木框 + 一块屏（屏自己留句柄，S08 要拍一下让它闪）
  k.add(box(2.4, 0.5, 0.6, 0x8a5a3c), 3.0, 0.25, -0.95);
  k.add(box(2.1, 1.0, 0.2, 0x7a4a34), 3.0, 1.02, -0.95);
  const screen = k.add(box(1.9, 0.81, 0.04, 0x5d7a8c), 3.0, 1.02, -0.84);
  return { dr, bowl, hg1, hg2, screen };
}

const W = (k: Kit) => k.actor('whale');
const C = (k: Kit) => k.actor('claude').wear('crown');

export const SHOTS: ShotDef[] = [
  {
    id: 'S01', look: 'night', title: '先说结果', cast: ['whale'],
    note: '夜里，鲸鱼娘从门那边一路走到桌边，边走边把结果甩出来；说完正好站定。',
    build: (k) => {
      const { bowl } = stage(k);
      const whale = W(k);
      const A = cam([-0.2, 1.55, 5.8], [-1.15, 1.05, 0.7], 34), B = cam([-0.1, 1.5, 5.0], [-1.2, 1.0, 0.7], 32);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.55));
        if (p < 1) whale.walkX(-3.3, -1.35, p, 0, 1.25).sil(0.55);
        else whale.front(T).at(-1.35, 0, 1.25).sil(0.55).talk(T, said === 0);
        bowl.position.set(1.35, TOP, 0.45);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S02', look: 'night', title: '一查岗', cast: ['whale', 'claude'],
    note: '灯忽然亮了。本鲸从小克背后绕到木箱前、踩上去才回头指挥；小克抱着一摞纸从右边走进来。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      k.add(box(0.7, 0.45, 0.55, 0x8a5a3c), -0.9, 0.225, 1.2);
      const papers = k.add(box(0.5, 0.16, 0.36, 0xf4ead6), 0, 0.5, 0);
      const A = cam([0.4, 1.75, 7.2], [0.5, 1.15, 0.2], 36), B = cam([0.3, 1.7, 6.6], [0.5, 1.1, 0.2], 35);
      return ({ u, T, said }) => {
        // 本鲸：走到箱子前（0–0.34）→ 踩上去（0.34–0.5）→ 转身指挥
        const p = ease(seg(u, 0, 0.34)), up = ease(seg(u, 0.34, 0.5));
        if (p < 1) {
          whale.walkX(-3.0, -0.9, p, 0, 1.2);
          whale.walkBy(Math.abs(-3.0 - (-0.9)) * p + up * 0.4);
          whale.at(-0.9, 0.45 * up, 1.2);
        } else {
          whale.set('whale_point').at(-0.9, 0.45, 1.2).talk(T, said === 1 || said === 2);
        }
        // 小克：抱纸走到桌边站住
        const cp = ease(seg(u, 0.08, 0.62));
        if (cp < 1) {
          const cx = 4.8 + (2.7 - 4.8) * cp;
          claude.walkX(4.8, 2.7, cp, 0, 0.45); claude.set('claude_side_0');
          papers.position.set(cx - 0.35, 0.62, 0.3); papers.rotation.z = Math.sin(T * 12) * 0.05;
        }
        else { claude.set('claude_front_0').flip().at(...CLAUDE); papers.position.set(CLAUDE[0] - 0.35, 0.62, CLAUDE[2] - 0.15); papers.rotation.z = 0; }
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S03', look: 'golden', title: '重新装修', cast: ['whale', 'claude'],
    note: '小克手一抬，屋子在她身后「立起来」；她自己一边抬手一边绕到桌子那头，本鲸跟到桌边仰头看。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.6, 1.7, 6.6], [0.9, 1.1, 0.3], 36), B = cam([0.3, 1.5, 5.4], [0.8, 1.05, 0.1], 33);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.62));
        if (p < 1) { claude.walkX(3.6, 1.5, p, 0, 0.55); claude.set('claude_side_0'); claude.lift(0.12 + Math.sin(seg(u, 0.2, 0.7) * Math.PI) * 0.16); }
        else claude.set('claude_front_0').flip().at(1.5, 0, 0.55).lift(0.02 * Math.sin(T * 3));
        const wp = ease(seg(u, 0.1, 0.7));
        if (wp < 1) whale.walkX(-2.6, -1.45, wp, 0, 0.9);
        else whale.front(T).at(...WHALE).tilt(-0.06).talk(T, said === 3);
        hg1.set(0.2 + u * 0.2, T); hg2.set(0.5 - u * 0.2, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S04', look: 'golden', title: '夸的是本鲸', cast: ['whale', 'claude'],
    note: '小克一边点头一边走到本鲸侧后方，把功劳推回来；本鲸摊手看镜头。',
    build: (k) => {
      stage(k);
      const whale = W(k), claude = C(k);
      const A = cam([0.6, 1.65, 6.2], [0.7, 1.1, 0.3], 34);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.5));
        if (p < 1) claude.walkX(2.7, 1.35, p, 0, 0.6);
        else claude.set(said >= 5 ? 'claude_front_1' : 'claude_front_0').flip().at(1.35, 0, 0.6).tilt(Math.sin(T * 2.2) * 0.03);
        whale.set(said >= 5 ? 'whale_point' : 'whale_idle').at(...WHALE).talk(T, said === 5 || said === 6);
        return A;
      };
    },
  },
  {
    id: 'S05', look: 'golden', title: '童话书', cast: ['whale'],
    note: '本鲸走到桌边俯身看那本摊开的书。',
    build: (k) => {
      const { hg1 } = stage(k);
      k.add(box(1.15, 0.07, 0.8, 0xf4ead6), 0.35, TOP + 0.04, 0.25);
      const whale = W(k);
      const A = cam([0.35, 2.3, 2.6], [0.4, TOP, 0.25], 32), B = cam([0.35, 2.1, 2.1], [0.4, TOP, 0.25], 30);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.55));
        if (p < 1) whale.walkX(-2.5, -0.75, p, 0, 1.05);
        else whale.set('whale_idle').at(-0.75, 0, 1.05).tilt(-0.1).talk(T, said === 7);
        hg1.set(0.5, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S06', look: 'golden', title: '只有一页', cast: ['whale'],
    note: '近景：书页只有一行字，后面一片空白；本鲸伸手把那一页翻过去——下一页还是空白。',
    build: (k) => {
      stage(k);
      k.add(box(1.15, 0.07, 0.8, 0xf4ead6), 0.35, TOP + 0.04, 0.25);
      const page = k.add(box(0.56, 0.012, 0.78, 0xfff7e6), 0.63, TOP + 0.08, 0.25);
      const whale = W(k);
      const A = cam([0.35, 2.2, 2.3], [0.4, TOP, 0.25], 30), B = cam([0.35, 2.0, 1.85], [0.4, TOP, 0.25], 28);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(-1.3, 0, 1.2).talk(T, said === 8);
        const f = ease(seg(u, 0.35, 0.9));
        page.rotation.y = -f * Math.PI;
        page.position.set(0.63 - f * 0.02, TOP + 0.08 + Math.sin(f * Math.PI) * 0.06, 0.25);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S07', look: 'dusk', title: '重做上一集', cast: ['whale', 'claude'],
    note: '小克抱着纸走进来、把纸摞放到桌上；本鲸跟到桌边，指着那摞纸。',
    build: (k) => {
      const { hg1, hg2 } = stage(k);
      const whale = W(k), claude = C(k);
      const papers = k.add(box(0.52, 0.16, 0.38, 0xf4ead6), 1.9, 0.55, 0.45);
      const A = cam([0.5, 1.75, 6.0], [0.7, 1.1, 0.3], 36), B = cam([0.2, 1.65, 5.4], [0.7, 1.05, 0.3], 34);
      return ({ u, T, said }) => {
        // 小克：走到桌边 → 放下纸 → 站住翻纸
        const cp = ease(seg(u, 0, 0.44)), drop = ease(seg(u, 0.44, 0.58));
        if (cp < 1) {
          const cx = 4.4 + (1.9 - 4.4) * cp;
          claude.walkX(4.4, 1.9, cp, 0, 0.5); claude.set('claude_side_0');
          papers.position.set(cx - 0.3, 0.62, 0.36);
        } else {
          claude.set(said >= 10 ? 'claude_side_1' : 'claude_side_0').flip().at(1.9, 0, 0.5);
          papers.position.set(1.9, 0.62 - drop * 0.42, 0.45);
        }
        papers.rotation.y = Math.sin(T * 0.8) * 0.05 * drop;
        const wp = ease(seg(u, 0.1, 0.62));
        if (wp < 1) whale.walkX(-2.8, -0.85, wp, 0, 1.3);
        else whale.set('whale_point').at(-0.85, 0, 1.3).talk(T, said === 9 || said === 10);
        hg1.set(0.6, T); hg2.set(0.4, T);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S08', look: 'dusk', title: '电视亮了', cast: ['whale'],
    note: '本鲸一路走到电视前，伸手拍了一下机顶；屏幕先黑一帧再亮起来，她退半步指着屏幕。',
    build: (k) => {
      const { screen } = stage(k);
      const whale = W(k);
      const A = cam([1.5, 1.7, 5.6], [2.95, 1.2, -0.85], 32), B = cam([1.8, 1.65, 5.1], [2.95, 1.2, -0.85], 31);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.46)), back = ease(seg(u, 0.46, 0.6));
        if (p < 1) whale.walkX(0.2, 1.95, p, 0, 1.5);
        else whale.set('whale_point').at(1.95 - 0.5 * back, 0, 1.5).talk(T, said === 11 || said === 12);
        // 拍一下：0.42–0.5 黑一帧，之后亮起来（亮不亮只改屏的透明度，不换机位）
        const hit = seg(u, 0.42, 0.52);
        screen.scale.set(1, 1, 1 + (hit > 0 && hit < 1 ? 0.2 : 0));
        screen.visible = !(hit > 0.05 && hit < 0.3);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S09', look: 'dusk', title: '电视里在抖', cast: ['whale'],
    note: '电视特写：上一集的沙漏在屏幕里跳；本鲸从右边走进画面边缘，肩膀一耸。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([2.0, 1.35, 3.6], [2.95, 1.15, -0.85], 27), B = cam([2.2, 1.3, 3.1], [2.95, 1.15, -0.85], 26);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.5));
        if (p < 1) whale.walkX(0.4, 1.2, p, 0, 1.9);
        else whale.set('whale_idle').at(1.2, 0, 1.9).tilt(Math.sin(T * 2.4) * 0.03).talk(T, said === 13 || said === 14);
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S10', look: 'night', title: '就鲸落了', cast: ['whale'],
    note: '灯灭了。本鲸摸黑走到桌边，把手机拿起来看——屏幕发灰，屋里只有她一个人。',
    build: (k) => {
      stage(k);
      const phone = k.add(box(0.55, 0.05, 0.95, 0x2a2a33), 0.55, TOP + 0.03, 0.55);
      k.add(box(0.47, 0.02, 0.82, 0xb9c6d2), 0.55, TOP + 0.06, 0.55);
      const whale = W(k);
      const A = cam([3.5, 2.0, 5.6], [1.15, 0.9, 0.2], 36), B = cam([3.35, 1.95, 5.2], [1.15, 0.9, 0.2], 35);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.52)), lift = ease(seg(u, 0.55, 0.8));
        if (p < 1) whale.walkX(3.1, 2.0, p, 0, 1.5).sil(0.72);
        else whale.set('whale_idle').at(2.0, 0, 1.5).sil(0.72).talk(T, said === 15);
        // 手机被拿起来：从桌面抬到胸前，屏幕朝镜头偏一点（不做成大黑板挡脸）
        phone.position.set(0.55 + lift * 0.8, TOP + 0.03 + lift * 0.16, 0.55 + lift * 0.5);
        phone.rotation.x = lift * -0.12;
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S11', look: 'night', title: '只有自己看得见', cast: ['whale'],
    note: '手机屏特写：她举着手机，屏幕发灰，玻璃里只映出本鲸一个人；手在轻轻抖。',
    build: (k) => {
      stage(k);
      const phone = k.add(box(0.55, 0.05, 0.95, 0x2a2a33), 1.75, 1.15, 1.35);
      k.add(box(0.47, 0.02, 0.82, 0xb9c6d2), 1.75, 1.17, 1.35);
      const whale = W(k);
      const A = cam([2.95, 1.9, 4.6], [1.2, 0.9, 0.2], 34), B = cam([2.8, 1.85, 4.2], [1.2, 0.9, 0.2], 33);
      return ({ u, T, said }) => {
        whale.set('whale_idle').at(2.3, 0, 1.65).sil(0.55).talk(T, said === 16);
        phone.position.set(1.75 + Math.sin(T * 7) * 0.012, 1.15 + Math.cos(T * 6.3) * 0.01, 1.35);
        phone.rotation.x = -0.9;
        return glide(A, B, ease(u));
      };
    },
  },
  {
    id: 'S12', look: 'night', title: '老大捞回来', cast: ['whale'],
    note: '门推开一道光，本鲸从门外的暗处一路走进光里，剪影被照亮一半。',
    build: (k) => {
      const { dr } = stage(k);
      const whale = W(k);
      const A = cam([0.0, 1.7, 6.4], [-0.6, 1.1, 0.3], 36);
      return ({ u, T, said }) => {
        dr.set(ease(seg(u, 0.1, 0.5)));
        const p = ease(seg(u, 0.16, 0.88));
        // 从门口（-3.6, -4.48）走到桌边：z 方向走 4.9，x 方向收 2.2
        const x = -3.6 + 2.2 * p, z = -4.2 + 5.0 * p;
        whale.walkBy(p * 6.2).at(x, 0, z).sil(1 - ease(seg(u, 0.2, 0.8))).talk(T, said === 17);
        return A;
      };
    },
  },
  {
    id: 'S13', look: 'night', title: '米饭被收走', cast: ['whale'],
    note: '桌面近景：饭碗滑出画面，本鲸往前追半步停住，眼睁睁看它走。不画手来拿。',
    build: (k) => {
      const { bowl, hg1 } = stage(k);
      const whale = W(k);
      const A = cam([1.2, 1.9, 3.0], [1.3, TOP, 0.4], 32);
      return (f) => {
        const e = ease(lineU(f, 18));
        const chase = ease(seg(f.u, 0.1, 0.45));
        if (chase < 1) whale.walkX(-2.3, -1.0, chase, 0, 1.1);
        else whale.front(f.T).at(-1.0, 0, 1.1);
        bowl.position.set(1.35 + e * 2.2, TOP, 0.45 + e * 0.4);
        hg1.set(0.7, f.T);
        return A;
      };
    },
  },
  {
    id: 'S14', look: 'dusk', title: '鲸鱼绝不摸鱼', cast: ['whale'],
    note: '灯重新亮起来。本鲸从左边走进画面、站定，说完最后两句抬手挥了一下，没有片尾卡。',
    build: (k) => {
      stage(k);
      const whale = W(k);
      const A = cam([0.3, 1.8, 7.4], [0.2, 1.05, 0.3], 38);
      return ({ u, T, said }) => {
        const p = ease(seg(u, 0, 0.34));
        if (p < 1) whale.walkX(-2.9, -1.45, p, 0, 0.7);
        else whale.set(said >= 20 ? 'whale_wave' : 'whale_idle').at(...WHALE).talk(T, said === 19 || said === 20);
        return A;
      };
    },
  },
];
