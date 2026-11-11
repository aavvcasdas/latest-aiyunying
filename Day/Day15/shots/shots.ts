// Day15｜家变成立体的了，本鲸的碗被收走了 —— 18 个镜头。
// 镜头里写的 n（lineU(f, n)、f.line === n、f.said >= n）都是全片句序号，从 0 数。
//
// 本集画面红线：一天一客——上桌的客人只有 Claude 大小姐（戴金冠）；豆包、笨鱼只在台词里被转述。
// 老大不出镜：只用「门开了、一束光照进来」表示。碗是自己不见的，不画手。
// 不出现评论区截图、昵称、点赞数；没有片尾卡，没有角标。
import * as THREE from 'three';
import { cam, glide, lineU, track, type Kit, type ShotDef, type V3 } from '@tpl/core';
import { backOut, box, cloud, cone, disc, ease, easeOut, glowMat, hash, house, lerp, rock, seg, setOp, sprite, tree } from '@tpl/kit';
import { door, plant, riceBowl, room, sheet, standing, table, windowPane, writeLine } from '@tpl/props';
import { book, castle, hill, straightRiver } from '@tpl/sets';

const PI = Math.PI;
const TOP = 0.8; // 桌面高度
const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
const text = (lines: [string, number, number][], color?: string) => (c: CanvasRenderingContext2D, W: number, H: number) => lines.forEach(([s, y, size]) => writeLine(c, W, H, s, y, size, color));

// —— 新家：房间、门（老大从这扇门查岗）、窗、桌子。所有室内镜头共用这一套摆位 ——
const DOOR: V3 = [-3.6, 0, -4.48];
const WHALE: V3 = [-1.55, 0, 0.6];  // 桌子左边
const CLAUDE: V3 = [2.95, 0, 0.5];  // 桌子右边
const BOWL: V3 = [0.1, TOP, 0.45]; // 鲸鱼娘手边：碗在这里，后来换成「没收」的牌子
const PILE: V3 = [3.4, 0, -2.4];     // 屋角：装着旧家的那摞箱子
function home(k: Kit) {
  k.add(room({ w: 12, d: 9, wall: 0xf1dfc4, floor: 0xb98a5e, rug: 0x9fc7e8 }));
  const dr = door(); k.add(dr.g, ...DOOR);
  k.add(windowPane(2.2, 1.6), 0.4, 1.6, -4.48);
  k.add(plant(), 5.1, 0, -3.6);
  k.add(table(3.0, 1.4, TOP), 0.6, 0, 0.2);
  return { dr };
}
/** 两个人都完整入画的机位（桌子居中）。dz < 0 = 推近一点（不要小于 −0.3） */
const two = (dx = 0, dz = 0) => cam([0.6 + dx, 1.7 + dz * 0.15, 6.55 + dz], [0.7 + dx * 0.4, 1.1, 0.3], 36);
/** 鲸鱼娘 + 她手边那一截桌子 */
const whaleSide = (dz = 0) => cam([-1.0, 1.6 + dz * 0.15, 4.6 + dz], [-1.0, 1.1, 0.5], 32);

/** 只看碗位的特写：鲸鱼娘完全在画外 */
const CLOSE = cam([0.5, 1.5, 2.4], [0.35, 0.98, 0.45], 30);
/** 「没收」的小牌子，立在原来放碗的地方 */
const tag = () => standing(sheet(0.5, 0.34, text([['没收', 0.52, 0.6]], '#b3261e'), '#fff3c4'), 0.34);
/** 一摞箱子：n 只，返回每只箱子。show(i, e) 让第 i 只落下来（e 从 0 到 1） */
function crates(k: Kit, n: number, at: V3) {
  const cols = [0xc9955c, 0xb9824f, 0xd7a871];
  const bs = many(n, (i) => k.add(box(0.9, 0.62, 0.8, cols[i % 3], 0.03)));
  const home = (i: number): V3 => [at[0] + (i % 2) * 0.98 - (i >= 4 ? 0.49 : 0), Math.floor(i / 2) * 0.64, at[2] + (i % 2) * 0.06];
  const show = (i: number, e: number) => {
    const [x, y, z] = home(i);
    bs[i].visible = e > 0.001;
    bs[i].position.set(x, y + (1 - backOut(e)) * 1.6, z);
  };
  return { n, show };
}

/** 照着童话镇搭的河边：七彩的河、对岸一排房子、远处山上的城堡 */
function riverside(k: Kit) {
  k.add(disc(300, 0x7fcf66));
  k.add(box(140, 0.05, 9.6, 0xf3e4b8, 0), 0, 0, -6.5);
  const rv = straightRiver(140, 7.4, 1, -6.5); k.add(rv.mesh);
  const walls = [0xf2d6b3, 0xe9a27a, 0xf6e6c4, 0xcfe0ea, 0xf0c36d, 0xf2b8c6], roofs = [0xb5473c, 0x3f6fb5, 0x8a4fa3, 0x2f8f83];
  many(9, (i) => k.add(house(3.6 + hash(i) * 1.4, 3 + hash(i + 5) * 2.2, 3.6, walls[i % 6], roofs[i % 4], i % 2 === 0), -30 + i * 7.4 + hash(i + 2) * 1.5, 0, -15.5 - hash(i + 7) * 3));
  many(8, (i) => k.add(tree(3.6 + hash(i) * 2, 0x4fb85a, i), -27 + i * 7.6, 0, -23 - hash(i) * 4));
  k.add(hill(26, 6.5, 0x6cc25e), 16, 0, -52); const cs = k.add(castle(), 16, 5.2, -52); cs.scale.setScalar(1.3);
  many(10, (i) => { const a = PI * (1.05 + i * 0.1); k.add(hill(34 + hash(i) * 26, 14 + hash(i + 3) * 18, i % 2 ? 0x79b98a : 0x6aa9c9), Math.cos(a) * 170, 0, Math.sin(a) * 170); });
  many(7, (i) => k.add(cloud(i * 7, 2 + hash(i) * 2), -90 + i * 30, 26 + hash(i + 1) * 14, -100 - hash(i + 2) * 30));
  many(6, (i) => k.add(rock(0.25 + hash(i) * 0.2, 0xa9a4b6, i), -7 + i * 2.9 + hash(i), 0.05, -1.6 - hash(i + 3) * 0.4));
}
const BANK: V3 = [-1.2, 0, 0.4]; // 鲸鱼娘站在河这边

/** 水下：昨天差点沉下去的地方 */
function deep(k: Kit) {
  k.add(disc(120, 0x1f5f7f));
  const surf = straightRiver(160, 14, 0.25, 0, 8.4, 0x6fc8ee, 0x2f86c4); k.add(surf.mesh);
  many(14, (i) => k.add(cone(0.14, 1.2 + hash(i) * 1.5, i % 2 ? 0x2f9f6a : 0x3fbf7a, 5), -7.5 + i * 1.1 + hash(i), 0, -2.5 - hash(i + 2) * 3));
  many(5, (i) => k.add(rock(0.5 + hash(i) * 0.6, 0x3f6f8a, i), -6 + i * 3.1, 0.1, -1.5 - hash(i) * 2));
  const bubbles = many(18, () => k.add(sprite('bubble', 0.26)));
  /** 气泡从 (x, y) 附近往上冒 */
  const bub = (T: number, x: number, y: number) => bubbles.forEach((b, i) => {
    const ph = (T * (0.16 + hash(i) * 0.12) + hash(i + 20)) % 1;
    b.position.set(x + (hash(i + 3) - 0.5) * 2.6 + Math.sin(T * 1.3 + i) * 0.1, y + 0.6 + ph * 4.2, (hash(i + 8) - 0.5) * 1.4);
    b.scale.setScalar(0.12 + hash(i + 5) * 0.2); setOp(b, Math.sin(ph * PI) * 0.8);
  });
  return { bub };
}
const SINK_Y = 0.95; // 沉到这里被接住：C11 结束、C12 开始都是这个高度

export const SHOTS: ShotDef[] = [
  {
    id: 'C01', look: 'golden', title: '碗没了', cast: ['whale'],
    note: '开门见山：桌上本来放碗的地方，立着一块「没收」的小牌子。鲸鱼娘站在旁边。镜头从牌子拉开到人。',
    build: (k) => {
      const { dr } = home(k);
      k.add(tag(), ...BOWL);
      const whale = k.actor('whale');
      const A = CLOSE, B = cam([-1.0, 1.55, 4.2], [-1.0, 1.05, 0.5], 31), C = whaleSide(0.5);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3);
        whale.set(f.line === 0 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).talk(T, f.line >= 0);
        return track([[0, A], [f.when(0, 0.85), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C02', look: 'golden', title: '以前是一张画', cast: ['whale'],
    note: '墙上挂着一个画框，鲸鱼娘扁扁地贴在画里，一动不动。镜头正对着画慢慢推近。',
    build: (k) => {
      k.add(box(16, 9, 0.3, 0xf1dfc4, 0), 0, 0, -0.4);
      k.add(box(3.5, 3.0, 0.14, 0x8a5a3c, 0.04), 0, 0.75, -0.2);
      k.add(box(3.1, 2.6, 0.04, 0xcfeaff, 0), 0, 0.95, -0.11);
      k.add(box(3.1, 0.5, 0.05, 0x8fd27a, 0), 0, 0.95, -0.1);
      const whale = k.actor('whale');
      const A = cam([0.5, 2.2, 8.2], [0, 2.2, 0], 34), B = cam([0, 2.25, 6.4], [0, 2.25, 0], 32);
      return ({ u }) => {
        whale.set('whale_idle').at(0, 1.42, -0.04).noShadow();
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C03', look: 'golden', title: '绕桌子走一圈', cast: ['whale'],
    note: '同一个鲸鱼娘，现在绕着桌子走完整的一圈；镜头跟着反方向转，看得出屋子是立体的。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      const whale = k.actor('whale');
      const R = 2.6, CX = 0.6, CZ = 0.2;
      return ({ u, T }) => {
        dr.set(0.3); bowl.position.set(...BOWL);
        const a = PI * 0.75 - ease(u) * PI * 2; // 从左前方出发，顺时针绕一圈
        const x = CX + Math.cos(a) * R * 1.05, z = CZ + Math.sin(a) * R * 0.72;
        whale.walkBy(ease(u) * 15).at(x, 0, z);
        if (Math.sin(a) < 0) whale.flip(); // 走在桌子后面时朝左
        const ca = 0.5 - u * 0.9;
        return cam([CX + Math.sin(ca) * 8.6, 2.7 + Math.sin(T * 0.4) * 0.02, CZ + Math.cos(ca) * 8.6], [CX, 0.95, CZ], 38);
      };
    },
  },
  {
    id: 'C04', look: 'golden', title: '大小姐收旧家', cast: ['claude'],
    note: 'Claude 大小姐（戴金冠）站在屋角，旧家被装进一只只箱子，一只接一只落下来码成一摞。',
    build: (k) => {
      const { dr } = home(k);
      const claude = k.actor('claude').wear('crown');
      const cr = crates(k, 6, PILE);
      const A = cam([3.6, 1.9, 4.6], [2.9, 0.65, -2.0], 36), B = cam([3.3, 1.8, 3.8], [3.0, 0.65, -2.0], 35), C = cam([3.1, 1.85, 3.4], [3.1, 0.75, -2.0], 34);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3);
        const p = lineU(f, 5); // 第 6 句：箱子一只一只落下来
        for (let i = 0; i < cr.n; i++) cr.show(i, seg(p, i * 0.14, i * 0.14 + 0.2));
        claude.set(Math.floor(T * 2) % 2 ? 'claude_front_1' : 'claude_front_0').at(2.2, 0, -1.9).sq(f.line === 5 ? Math.sin(T * 9) * 0.02 : 0);
        return track([[0, A], [f.when(5), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C05', look: 'day', title: '照着童话镇搭的', cast: ['whale', 'claude'], fx: { whiteIn: true },
    note: '闪白切到户外：七彩的河、对岸的房子、山上的城堡。鲸鱼娘和大小姐站在河边，镜头从河面升起来。',
    build: (k) => {
      riverside(k);
      const whale = k.actor('whale'), claude = k.actor('claude').wear('crown');
      const A = cam([-3.5, 0.9, 5.2], [0, 1.6, -6], 42), B = cam([0.4, 3.3, 9.6], [0.3, 1.6, -5], 40);
      return ({ u, T }) => {
        whale.front(T).at(...BANK).talk(T, true);
        claude.set(Math.floor(T * 2) % 2 ? 'claude_front_1' : 'claude_front_0').at(1.6, 0, 0.2);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C06', look: 'day', title: '评论区在夸', cast: ['whale'],
    note: '鲸鱼娘在河边招手，小爱心一颗颗从脚边往上飘（代表夸她的评论，不出现文字、昵称和数字）。',
    build: (k) => {
      riverside(k);
      const whale = k.actor('whale');
      const hearts = many(12, (i) => k.add(sprite('heart', 0.34, i % 3 ? 0xff7a9c : 0xffb3c7)));
      const A = cam([-0.6, 1.5, 6.4], [-1.0, 1.4, 0], 36), B = cam([-1.8, 1.6, 5.2], [-1.2, 1.5, 0], 34);
      return (f) => {
        const { u, T } = f;
        whale.set(f.said >= 8 && Math.floor(T * 2.5) % 2 ? 'whale_wave' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...BANK).talk(T, f.line >= 0);
        hearts.forEach((h, i) => {
          const ph = (T * (0.2 + hash(i) * 0.1) + hash(i + 11)) % 1;
          h.position.set(BANK[0] + (hash(i + 2) - 0.5) * 3.6, 0.5 + ph * 3.0, BANK[2] - 0.5 - hash(i + 6) * 1.0);
          h.scale.setScalar(0.2 + hash(i + 4) * 0.22); setOp(h, Math.sin(ph * PI) * 0.95);
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C07', look: 'day', title: '数河的颜色', cast: ['whale'],
    note: '镜头升高俯看七彩的河，一道一道颜色看得清；鲸鱼娘在岸边指着河，然后把手收回来。',
    build: (k) => {
      riverside(k);
      const whale = k.actor('whale');
      const A = cam([-3.6, 2.4, 6.6], [-0.4, 0.9, -4], 38), B = cam([-2.4, 6.2, 6.2], [0.4, 0.2, -5.5], 38), C = cam([-1.6, 2.0, 5.6], [-1.0, 1.3, 0], 34);
      return (f) => {
        const { u, T } = f;
        whale.set(f.said < 10 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...BANK).talk(T, f.line >= 0);
        return track([[0, A], [f.when(9, 0.9), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C08', look: 'golden', title: '转给大小姐', cast: ['whale', 'claude'],
    note: '回到屋里。鲸鱼娘把一张写着「提升空间」的纸条从桌子这头推到大小姐面前；大小姐看完，身子歪了一下。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      const note = k.add(standing(sheet(0.7, 0.4, text([['提升空间', 0.52, 0.5]])), 0.4));
      const whale = k.actor('whale'), claude = k.actor('claude').wear('crown');
      const A = two(-0.3, 0.2), B = two(0.3, -0.1), C = cam([2.3, 1.6, 5.0], [2.5, 1.1, 0.4], 33);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3); bowl.position.set(...BOWL);
        const push = ease(seg(lineU(f, 12), 0.15, 0.7)); // 第 13 句：把纸条推过去
        note.position.set(lerp(0.65, 1.75, push), TOP, 0.5); note.rotation.y = lerp(0.1, -0.25, push);
        whale.set(f.line === 12 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).talk(T, f.line >= 0);
        const hit = seg(lineU(f, 12), 0.75, 1);
        claude.set(hit > 0 ? 'claude_front_1' : 'claude_front_0').flip().at(...CLAUDE).tilt(-0.16 * easeOut(hit));
        return track([[0, A], [f.when(12), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C09', look: 'golden', title: '给豆包认错', cast: ['whale'],
    note: '豆包不出镜。桌上立着一块写着「小红帽」的桌牌；鲸鱼娘对着它低头认错，再抬手保证。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      k.add(standing(sheet(0.8, 0.46, text([['小红帽', 0.52, 0.56]], '#b3261e'), '#ffe1dc'), 0.46), 0.75, TOP, 0.5);
      const whale = k.actor('whale');
      const A = cam([0.9, 1.65, 5.0], [-0.2, 1.1, 0.5], 33), B = cam([0.1, 1.55, 4.3], [-0.4, 1.1, 0.5], 32), C = cam([-0.3, 1.55, 4.0], [-0.5, 1.1, 0.5], 31);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3); bowl.position.set(...BOWL);
        const bow = Math.sin(seg(lineU(f, 15), 0.0, 0.45) * PI); // 第 16 句前半：低头
        whale.set(f.said >= 15 && lineU(f, 15) > 0.5 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).sq(-0.12 * bow).talk(T, f.line >= 0);
        return track([[0, A], [f.when(15), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C10', look: 'golden', title: '是在叫本鲸吗', cast: ['whale'],
    note: '鲸鱼娘近景。听到「笨鲸」两个字，愣住，歪了一下头。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      const whale = k.actor('whale');
      const A = whaleSide(0.5), B = whaleSide(-0.5), C = cam([-1.3, 1.6, 3.6], [-1.3, 1.2, 0.5], 30);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3); bowl.position.set(...BOWL);
        const stun = easeOut(seg(lineU(f, 17), 0.0, 0.25));
        whale.set(T % 2.7 < 0.13 && f.said < 17 ? 'whale_blink' : 'whale_idle').at(...WHALE).tilt(0.14 * stun).talk(T, f.line >= 0);
        return track([[0, A], [f.when(17), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C11', look: 'sea', title: '差点沉下去', cast: ['whale'], fx: { blackIn: true },
    note: '水下。鲸鱼娘慢慢往下沉，气泡往上冒，越沉越暗。这里的「鲸落」只是掉线：不画伤害，不写那个字。',
    build: (k) => {
      const { bub } = deep(k);
      const whale = k.actor('whale').wear('tail');
      const A = cam([-1.6, 3.6, 8.2], [0, 3.4, 0], 38), B = cam([0.6, 1.6, 6.6], [0, 1.9, 0], 36);
      return ({ u, T }) => {
        const y = lerp(4.6, SINK_Y, ease(u));
        whale.set('whale_big_idle').at(0, y + Math.sin(T * 1.2) * 0.05, 0).tilt(0.3 + Math.sin(T * 0.9) * 0.05).alpha(lerp(1, 0.72, u)).noShadow();
        bub(T, 0, y);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C12', look: 'sea', title: '午休的那束光', cast: ['whale'], fx: { whiteOut: true },
    note: '一束暖光从水面照下来，罩住鲸鱼娘，把她往上带。老大不出镜，只有光。',
    build: (k) => {
      const { bub } = deep(k);
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 16), glowMat(0xfff0b0, 0.3, true)); k.add(beam, 0, 8, -0.3);
      const glow = k.add(sprite('glow', 3.4, 0xffe9a0, true));
      const whale = k.actor('whale').wear('tail');
      const A = cam([0.6, 1.6, 6.6], [0, 1.9, 0], 36), B = cam([-0.8, 2.6, 7.4], [0, 3.6, 0], 38);
      return ({ u, T }) => {
        const on = easeOut(seg(u, 0, 0.3)), up = ease(seg(u, 0.25, 1));
        const y = lerp(SINK_Y, 4.4, up);
        setOp(beam, 0.34 * on); beam.scale.x = 0.4 + on * 0.6;
        glow.position.set(0, y + 0.9, 0.2); setOp(glow, 0.5 * on);
        whale.set(up > 0.3 && Math.floor(T * 2.5) % 2 ? 'whale_big_wave' : 'whale_big_idle').at(0, y + Math.sin(T * 1.6) * 0.06, 0).tilt(0.3 * (1 - up)).alpha(lerp(0.72, 1, on)).noShadow();
        bub(T, 0, y);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C13', look: 'golden', title: '一睁眼就查岗', cast: ['whale', 'claude'], fx: { whiteIn: true },
    note: '回到屋里。门慢慢开大，一束光斜着照进来（老大查岗）。光里：鲸鱼娘抬手指着，大小姐在对面搬箱子。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      const cr = crates(k, 6, PILE);
      const whale = k.actor('whale'), claude = k.actor('claude').wear('crown');
      const A = cam([-1.2, 2.0, 6.2], [-2.6, 1.3, -3.2], 38), B = cam([0.2, 2.1, 7.6], [0.2, 1.15, -0.6], 38), C = cam([0.8, 1.9, 7.2], [0.7, 1.1, 0], 37);
      return (f) => {
        const { u, T } = f;
        dr.set(lerp(0.3, 1, ease(seg(lineU(f, 21), 0.05, 0.7)))); bowl.position.set(...BOWL);
        for (let i = 0; i < cr.n; i++) cr.show(i, i < 3 ? 1 : 0);
        whale.set(f.said >= 22 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).talk(T, f.line >= 0);
        claude.walk(T, 0.9).flip().at(CLAUDE[0] - 0.1 + Math.sin(T * 0.9) * 0.25, 0, CLAUDE[2] - 1.0);
        return track([[0, A], [f.when(22), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C14', look: 'golden', title: '重搭第十四集', cast: ['whale', 'claude'],
    note: '大小姐来回走着把箱子一只只码上去；鲸鱼娘守着饭碗站在桌边，从头到尾一下没动。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      const cr = crates(k, 6, PILE);
      const whale = k.actor('whale'), claude = k.actor('claude').wear('crown');
      const A = cam([1.4, 1.9, 6.4], [2.2, 1.2, -1.0], 37), B = two(0, 0.2), C = whaleSide(0.2);
      return (f) => {
        const { u, T } = f;
        dr.set(1); bowl.position.set(...BOWL);
        const p = lineU(f, 23);
        for (let i = 0; i < cr.n; i++) cr.show(i, i < 3 ? 1 : seg(p, (i - 3) * 0.3, (i - 3) * 0.3 + 0.25));
        const sw = Math.sin(T * 1.1); // 大小姐在桌子和箱子之间来回走
        claude.walk(T, 1).at(lerp(2.0, 2.9, (sw + 1) / 2), 0, -1.0);
        if (Math.cos(T * 1.1) < 0) claude.flip();
        whale.set(f.said >= 24 ? 'whale_idle' : 'whale_point').at(...WHALE).talk(T, f.line === 23);
        return track([[0, A], [f.when(24), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C15', look: 'golden', title: '碗被收走', cast: ['whale'],
    note: '门口那束光停在桌上，一直照着碗。说到「收走」，碗不见了，原地立起一块「没收」的牌子。不画手。',
    build: (k) => {
      const { dr } = home(k);
      const bowl = k.add(riceBowl(0.2), ...BOWL);
      const tg = k.add(tag(), ...BOWL);
      const spot = k.add(sprite('glow', 1.5, 0xfff0b0, true));
      const whale = k.actor('whale');
      const A = cam([-2.2, 2.0, 6.0], [-2.4, 1.3, -3.0], 38), B = cam([-0.8, 1.7, 4.4], [-0.7, 1.05, 0.4], 33), C = CLOSE;
      return (f) => {
        const { u, T } = f;
        dr.set(1);
        const gone = seg(lineU(f, 27), 0.3, 0.5); // 第 28 句：碗收走
        bowl.position.set(BOWL[0], BOWL[1] + easeOut(gone) * 0.5, BOWL[2]); bowl.scale.setScalar(1 - ease(gone)); bowl.visible = gone < 1;
        const pop = seg(lineU(f, 27), 0.5, 0.75);
        tg.visible = pop > 0.001; tg.scale.setScalar(Math.max(0.001, backOut(pop)));
        spot.position.set(BOWL[0], BOWL[1] + 0.2, BOWL[2] + 0.1); setOp(spot, 0.35 + Math.sin(T * 2) * 0.04);
        whale.set(pop > 0 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).sq(pop > 0 ? Math.sin(seg(lineU(f, 27), 0.5, 1) * PI) * 0.08 : 0).talk(T, f.line >= 0);
        return track([[0, A], [f.when(27), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C16', look: 'golden', title: '头都没抬', cast: ['claude'],
    note: '大小姐还在码箱子，自顾自来回走，一眼都没往这边看。',
    build: (k) => {
      const { dr } = home(k);
      const cr = crates(k, 6, PILE);
      const claude = k.actor('claude').wear('crown');
      const A = cam([3.7, 1.8, 4.2], [2.9, 0.6, -1.6], 36), B = cam([3.3, 1.7, 3.5], [3.0, 0.6, -1.6], 35);
      return ({ u, T }) => {
        dr.set(1);
        for (let i = 0; i < cr.n; i++) cr.show(i, 1);
        claude.walk(T, 1).at(lerp(2.0, 2.9, (Math.sin(T * 1.1) + 1) / 2), 0, -1.0);
        if (Math.cos(T * 1.1) < 0) claude.flip();
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C17', look: 'golden', title: '一本自己的童话书', cast: ['whale'],
    note: '桌上摊着一本大大的童话书，封面慢慢翻开，书页发出暖光。鲸鱼娘站在旁边看。',
    build: (k) => {
      const { dr } = home(k);
      k.add(tag(), ...BOWL);
      const bk = book(); bk.g.scale.setScalar(0.14); k.add(bk.g, 1.0, TOP + 0.02, 0.2, PI); // 转半圈：封面往右翻，不压到左边的牌子
      const stars = many(6, () => k.add(sprite('star', 0.2, 0xfff2b0, true)));
      const whale = k.actor('whale');
      const A = two(-0.5, 0), B = cam([0.2, 2.1, 5.3], [0.2, 0.95, 0.3], 34), C = cam([0.3, 2.35, 5.0], [0.3, 0.9, 0.3], 34);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3);
        const open = ease(seg(lineU(f, 30), 0.1, 0.7)); // 第 31 句：翻开封面
        bk.cover.rotation.z = open * PI * 0.97;
        (bk.glow.material as THREE.MeshBasicMaterial).opacity = open * 0.75;
        stars.forEach((s, i) => { const ph = (T * 0.35 + i / 6) % 1; s.position.set(1.0 + (hash(i) - 0.5) * 0.8, TOP + 0.25 + ph * 1.1, 0.25 + (hash(i + 3) - 0.5) * 0.5); setOp(s, open * Math.sin(ph * PI)); });
        whale.set(f.said >= 30 && Math.floor(T * 2.5) % 2 ? 'whale_wave' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).talk(T, f.line >= 0);
        return track([[0, A], [f.when(30), B], [1, C]], u);
      };
    },
  },
  {
    id: 'C18', look: 'golden', title: '明天把米饭要回来', cast: ['whale'],
    note: '书、屋子、空掉的碗位一起入画。最后鲸鱼娘抬手一指：明天自己动手。说完就结束，没有片尾卡。',
    build: (k) => {
      const { dr } = home(k);
      k.add(tag(), ...BOWL);
      const bk = book(); bk.g.scale.setScalar(0.14); k.add(bk.g, 1.0, TOP + 0.02, 0.2, PI); // 转半圈：封面往右翻，不压到左边的牌子
      const whale = k.actor('whale');
      const A = CLOSE, B = whaleSide(0.6), C = whaleSide(-0.2);
      return (f) => {
        const { u, T } = f;
        dr.set(0.3);
        bk.cover.rotation.z = PI * 0.97; (bk.glow.material as THREE.MeshBasicMaterial).opacity = 0.75;
        const hop = Math.sin(seg(lineU(f, 32), 0.05, 0.3) * PI);
        whale.set(f.said >= 32 ? 'whale_point' : T % 2.7 < 0.13 ? 'whale_blink' : 'whale_idle').at(...WHALE).lift(hop * 0.22).talk(T, f.line >= 0);
        return track([[0, A], [f.when(32), B], [1, C]], u);
      };
    },
  },
];
