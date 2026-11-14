// 「长大」样板：三个镜头演示立绘进成片的两种正经用法。
//   1. G1  小时候（Q 版）蹲在水洼边，镜头落地 → 渐白
//   2. G2  同一个站位，动态长大：Q 版缩小淡出、长大版浮现放大（growInto），中间一次闪白
//   3. G3  同框对话：小时候蹲着抬头，长大后的自己站在旁边低头看她
// 规矩（设定/立绘.md）：主用 Q 版，立绘只放在「长大」时刻；同一镜头允许两人同框，切换处给转场。
import { cam, glide, type Kit, type ShotDef } from '@tpl/core';
import { cloud, disc, hash, house, lerp, seg, tree } from '@tpl/kit';
import { growInto } from '@tpl/tachie';
import { hill } from '@tpl/sets';

function yard(k: Kit) {
  k.add(disc(300, 0x86d36b));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.3; k.add(hill(40 + hash(i) * 24, 15 + hash(i + 3) * 16, i % 2 ? 0x79b98a : 0x6aa9c9), Math.cos(a) * 165, 0, Math.sin(a) * 165); }
  for (let i = 0; i < 5; i++) k.add(cloud(i * 9, 2 + hash(i) * 2), -70 + i * 34, 32 + hash(i + 1) * 12, -110);
  k.add(house(4.2, 3, 3.6, 0xf3e2c6, 0xd9534f), -7.5, 0, -7);
  k.add(tree(4.6, 0x4fb85a, 2), 7.2, 0, -5.5);
  // 地面上的水洼：一个扁圆盘，颜色压暗一点
  k.add(disc(0.9, 0x7fb4d8), 0.1, 0.012, 1.2);
}

export const SHOTS: ShotDef[] = [
  {
    id: 'G1',
    look: 'day',
    title: '小时候',
    cast: ['whale'],
    fx: { whiteOut: true },
    note: 'Q 版鲸鱼娘蹲在水洼边，镜头从高处落到地面。这是全片默认的样子——Q 版。',
    build: (k) => {
      yard(k);
      const q = k.actor('whale');
      const A = cam([0, 6.5, 13], [0, 1.6, 0], 40), B = cam([0, 1.9, 6.4], [0, 0.9, 0.6], 35);
      return ({ u, T }) => { q.idle(T).at(0, 0, 0.4).size(1.15); return glide(A, B, u); };
    },
  },
  {
    id: 'G2',
    look: 'day',
    title: '动态长大',
    cast: ['whale'],
    fx: { whiteIn: true, flash: [0.55] },
    note: '同一站位动态长大：闪白那 0.2 秒里完成交换——Q 版缩下去、长大版浮上来，观众看到的是「一闪就长大了」。',
    build: (k) => {
      yard(k);
      const q = k.actor('whale');
      const g = k.tachie('whale');
      const A = cam([0, 1.9, 6.4], [0, 0.9, 0.6], 35), B = cam([0.4, 1.7, 5.2], [0, 1.1, 0.4], 33);
      return ({ u, T }) => {
        const p = seg(u, 0.52, 0.60); // 交换压在闪白那 0.2 秒里（fx.flash: [0.55]），不露重影
        q.idle(T).at(0, 0, 0.4);
        g.act('idle', T).at(0, 0, 0.4);
        growInto(q, g, p);
        g.lift(0.06 * (1 - p));   // 浮上来一点点，像站起来
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'G3',
    look: 'golden',
    title: '同框对话',
    cast: ['whale'],
    fx: { blackOut: true },
    note: '同框：小时候（Q 版）蹲在左边抬头，长大后的自己（立绘）站在右边低头看她。两人同镜不算犯规，前提是这一刻正是「长大」。',
    build: (k) => {
      yard(k);
      const q = k.actor('whale');
      const g = k.tachie('whale');
      const A = cam([0.2, 1.5, 6.2], [0.4, 1.0, 0.3], 34), B = cam([0.6, 1.4, 5.0], [0.5, 1.05, 0.3], 32);
      return ({ u, T }) => {
        // 小时候：矮一点、往下压一点，像蹲着；长大版：站着，头微微低下来
        q.idle(T).at(-0.75, 0, 0.5).size(0.68);
        g.act('tilt', T).at(0.85, 0, 0.2).size(1.0).flip();
        return glide(A, B, u, lerp(0.4, 0.7, u));
      };
    },
  },
];
