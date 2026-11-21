// 人物动作总览：八位角色 × 高清派生动作，16:9，一人一组、一句一个动作。
//
// 用途：把 fix.zip / fix2.zip 那一包「去白边 + 2 倍高清 + 重新派生的动作」接进引擎之后，一次看全。
// 没有音源（film.json 里没有 audio），所以只出无声样片——按 AGENTS.md，这是它该有的样子，不当成片。
//
// 三个棚（每个镜头各搭一份，镜头之间互不影响）：
//   stage  动作棚：浅色墙 + 地毯 + 地标圈 + 椅子 + 植物 → 安静的动作
//   gym    节奏棚：棋盘地砖 + 灯排 → 跳 / 转 / 甩这类幅度大的动作
//   den    夜戏棚：暗地面 + 一束顶光 → 打盹 / 低头看书
//
// 写镜头的三条规矩（见 通用模板/engine/core.ts 开头）：逐帧函数只读参数里的时间、角色每帧重新摆、缺素材直接报错。
// 动作起点挂在「那句台词的第几秒」上（读 cues.json 的 start），不写死秒数：卡点一变，动作跟着走。
import * as THREE from 'three';
import { cam, mixCam, type CamState, type Kit, type ShotDef } from '@tpl/core';
import { FONT } from '@tpl/fonts';
import { box, canvasTex, cyl, lerp, seg, sprite } from '@tpl/kit';
import { plant } from '@tpl/props';
import cues from '../cues.json';

type CharId = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
interface Group { id: CharId; name: string; look: 'stage' | 'gym' | 'den'; acts: string[] }

/** 全片顺序：和 台词.txt / cues.json 一字不差地对应（一人一组，一句一个动作） */
export const GROUPS: Group[] = [
  { id: 'whale', name: '鲸鱼娘', look: 'stage', acts: ['idle', 'wave', 'point', 'eat', 'hop', 'nod', 'shake', 'bow', 'sway', 'surprise', 'sad', 'shiver'] },
  { id: 'gpt', name: 'GPT 龙娘', look: 'gym', acts: ['float', 'hover', 'cast', 'rage', 'nod', 'tilt', 'bow', 'surprise', 'shake'] },
  { id: 'claude', name: 'Claude 大小姐', look: 'stage', acts: ['idle', 'curtsy', 'read', 'tilt', 'nod', 'shake', 'lookaround', 'sad', 'hop'] },
  { id: 'doubao', name: '豆包', look: 'gym', acts: ['idle', 'step', 'sway', 'hop', 'nod', 'bow', 'tilt', 'surprise', 'spin'] },
  { id: 'gemini', name: 'Gemini', look: 'stage', acts: ['idle', 'lookaround', 'choose', 'hop', 'sway', 'nod', 'surprise', 'tilt'] },
  { id: 'kimi', name: 'Kimi', look: 'stage', acts: ['idle', 'think', 'nod', 'bow', 'lookaround', 'shake', 'sad', 'hop'] },
  { id: 'qwen', name: '千问', look: 'gym', acts: ['idle', 'bow', 'sway', 'nod', 'tilt', 'hop', 'shake', 'spin'] },
  { id: 'zai', name: '智谱', look: 'den', acts: ['idle', 'doze', 'alert', 'nod', 'shake', 'tilt', 'hop', 'lookaround'] },
];

/** 每组的起始句号（0 起） */
export const FIRST_LINE = GROUPS.reduce<number[]>((acc, _g, i) => [...acc, i ? acc[i - 1] + GROUPS[i - 1].acts.length : 0], []);
const LINES = (cues as unknown as { lines: Array<{ start: number; end: number }> }).lines;
/** 第 n 句的起点 / 终点（秒，全片时间）；越界就夹到首尾，镜头边界早进晚出几帧也不会读不到 */
const cueStart = (n: number) => LINES[Math.max(0, Math.min(LINES.length - 1, n))].start;
const cueEnd = (n: number) => LINES[Math.max(0, Math.min(LINES.length - 1, n))].end;

/** 写在墙上的名牌：模板字体、Canvas 画、贴到墙上（不依赖系统字体，换机器字形不变） */
function plate(zh: string, en: string) {
  const tex = canvasTex(768, 224, (c) => {
    c.fillStyle = '#fffdf4'; c.fillRect(0, 0, 768, 224);
    c.strokeStyle = 'rgba(90,70,50,.5)'; c.lineWidth = 8; c.strokeRect(4, 4, 760, 216);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `900 92px ${FONT}`; c.fillStyle = '#2b2233'; c.fillText(zh, 384, 96);
    c.font = `900 44px ${FONT}`; c.fillStyle = 'rgba(60,45,35,.62)'; c.fillText(en, 384, 176);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.99), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
}

/** 动作棚 */
function stage(k: Kit, g: Group) {
  k.add(box(16, 0.3, 12, 0xd7dde6, 0), 0, -0.15, -1.2);
  k.add(box(16, 6, 0.4, 0xeae4d7, 0), 0, 3, -4.6);
  k.add(box(0.4, 6, 12, 0xe4ded1, 0), -7.8, 3, -1.2);
  k.add(box(0.4, 6, 12, 0xe4ded1, 0), 7.8, 3, -1.2);
  // 地毯 + 地标圈：看走位、看跳起来时脚底是不是真的离地
  k.add(cyl(2.6, 2.6, 0.1, 0xc6cfd9, 24), 0, 0.0, 0.3);
  // 椅子（体块道具，不画手）
  k.add(box(1.1, 0.12, 1.0, 0xb9824f, 0), -3.0, 0.62, -1.7);
  k.add(box(1.1, 1.1, 0.12, 0xb9824f, 0), -3.0, 1.2, -2.15);
  for (const [dx, dz] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]]) k.add(box(0.1, 0.62, 0.1, 0x8a5f34, 0), -3.0 + dx, 0.31, -1.7 + dz);
  k.add(plant(1.15), 3.2, 0, -2.4);
  k.add(plate(g.name, g.id.toUpperCase()), 0, 3.2, -4.35);
}

/** 节奏棚 */
function gym(k: Kit, g: Group) {
  for (let i = -4; i <= 4; i++) for (let j = -3; j <= 2; j++) {
    k.add(box(1.7, 0.14, 1.7, (i + j) % 2 === 0 ? 0xe2e8ef : 0xbcc7d4, 0), i * 1.7, -0.07, j * 1.7 + 0.5);
  }
  k.add(box(18, 0.2, 0.4, 0x8f9aa8, 0), 0, 4.0, -4.8);
  for (const [x, c] of [[-4.6, 0xfff0c8], [0, 0xffffff], [4.6, 0xd8ecff]] as const) k.add(box(0.34, 0.34, 0.34, c, 0), x, 4.2, -4.6);
  k.add(plate(g.name, g.id.toUpperCase()), 0, 3.2, -4.55);
}

/** 夜戏棚 */
function den(k: Kit, g: Group) {
  k.add(cyl(3.4, 3.4, 0.2, 0x3a4050, 24), 0, -0.05, 0.5);
  k.add(box(16, 6, 0.4, 0x1e2130, 0), 0, 0, -4.4);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    k.add(box(0.1, 0.55, 0.1, 0x14161f, 0), Math.cos(a) * 4.4, 0.27, 0.5 + Math.sin(a) * 4.4);
  }
  k.add(sprite('glow', 3.6, 0xfff3c0, false, 0.3), 0, 2.9, -1.4);
  k.add(plate(g.name, g.id.toUpperCase()), 0, 3.2, -3.9);
}

const BUILD = { stage, gym, den };

/** 机位：远景（全身 + 脚底）→ 中景（脸和手）→ 近景（裙摆、鞋、描边），整段一直在缓缓动 */
function camRig(g: Group): [CamState, CamState, CamState] {
  if (g.look === 'den') return [cam([-0.3, 1.85, 6.4], [0, 1.1, 0.3], 36), cam([0.25, 1.6, 4.9], [0, 1.05, 0.3], 33), cam([0.4, 1.3, 3.2], [0, 1.0, 0.3], 30)];
  if (g.look === 'gym') return [cam([0, 2.05, 8.4], [0, 1.2, 0.3], 40), cam([0.4, 1.85, 6.2], [0, 1.2, 0.3], 37), cam([0.6, 1.5, 3.8], [0, 1.15, 0.3], 33)];
  return [cam([0, 2.0, 8.2], [0, 1.2, 0.3], 40), cam([0.35, 1.8, 6.0], [0, 1.2, 0.3], 37), cam([0.5, 1.45, 3.7], [0, 1.1, 0.3], 32)];
}

export const SHOTS: ShotDef[] = GROUPS.map((g) => {
  const first = FIRST_LINE[GROUPS.indexOf(g)];
  const n = g.acts.length;
  return {
    id: `G_${g.id}`,
    look: g.look === 'den' ? 'night' : g.look === 'gym' ? 'stage' : 'cozy',
    title: `${g.name} · ${n} 个动作`,
    cast: [g.id],
    note: `${g.name} 的 ${n} 个动作，一句一个：镜头从远景（全身、脚底基线、跳起离地、影子）一路推到近景（脸、头发、裙摆、描边）。`,
    build: (k) => {
      BUILD[g.look](k, g);
      const a = k.actor(g.id);
      const [A, B, C] = camRig(g);
      return ({ u, T, line }) => {
        // 这一镜只在自己的句子里：边界落在句子起止上（plan 排镜时按 cue 切），
        // 早进 / 晚出几帧就夹到本组的第一句 / 最后一句，动作起点永远取那句的开头
        const ln = Math.min(first + n - 1, Math.max(first, line));
        a.act(g.acts[ln - first], T, cueStart(ln)).at(0, 0, 0.3);
        void cueEnd;
        // 三段机位：0 → 0.5 推近，0.5 → 1 再推近；每段都用 glide（smootherstep + 匀速蠕动），没有完全静止的一帧
        const p1 = seg(u, 0, 0.55), p2 = seg(u, 0.55, 1);
        const c1 = mixCam(A, B, lerp(p1, p1 * p1 * (3 - 2 * p1), 0.45));
        const c2 = mixCam(B, C, lerp(p2, p2 * p2 * (3 - 2 * p2), 0.45));
        return p1 < 1 ? c1 : c2;
      };
    },
  };
});
