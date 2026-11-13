// 《动作总览 v2》的镜头表：把 motion-v2 的 96 个动作（八位 × 十二个）全部演一遍。
//
// 一排四个人，每个人头顶一块名牌写着「谁 · 正在演什么」。每 2 秒换一个动作（动作本身两秒一轮），
// 四人是同步换的：第 r 轮，四个人各演自己的第 r 个动作。两镜各 12 轮，48 秒演完 96 个动作。
// 没有歌、没有字幕、没有解说——声音一点不加。
import * as THREE from 'three';
import { cam, glide, type Kit, type ShotDef } from '@tpl/core';
import { canvasTex, box, disc } from '@tpl/kit';
import { FONT } from '@tpl/fonts';

/** 台词/名牌上的中文名（取自 人物动作替换指南 第四节） */
const NAME: Record<string, string> = { whale: '本鲸', gpt: '龙娘', claude: '小克', doubao: '豆包', gemini: '猫', kimi: 'Kimi', qwen: '千问', zai: '狐狸' };

/** 十二个动作的键与中文名：十个全员通用 + 两个专属 */
const COMMON: [string, string][] = [
  ['idle', '待机'], ['walk', '行走'], ['wave', '挥手'], ['talk', '说话'], ['bow', '鞠躬'],
  ['sit', '坐下'], ['happy', '开心'], ['think', '思考'], ['surprise', '惊讶'], ['jump', '跳跃'],
];
const SPECIAL: Record<string, [string, string][]> = {
  whale: [['offer_rice', '递饭碗'], ['tail_beat', '鲸尾打拍']],
  gpt: [['hourglass', '举沙漏'], ['shield', '展翼守护']],
  claude: [['read', '认真翻书'], ['tea', '端杯思考']],
  doubao: [['basket', '递出篮子'], ['dance', '轻快踩拍']],
  gemini: [['clock', '对照时钟'], ['paint', '提笔创作']],
  kimi: [['scroll', '展开卷轴'], ['bookmark', '夹好书签']],
  qwen: [['fan', '轻摇折扇'], ['serve_tea', '茶会邀请']],
  zai: [['abacus', '拨动算盘'], ['wake', '睡醒认真']],
};
const seqOf = (id: string) => [...COMMON, ...SPECIAL[id]];

const ROUND = 2;      // 一个动作演一轮（两秒，正好动作本身的一整轮）
const ROUNDS = 12;

/** 舞台底板：和《人物动作演示》同一套，深色台面 + 后墙 */
function stage(k: Kit) {
  k.add(disc(90, 0x2b2740));
  k.add(box(34, 2.6, 0.6, 0x3a3352), 0, 0, -7.2);
  k.add(box(34, 0.12, 0.9, 0x4a4266), 0, 2.6, -7.2);
}

/** 名牌贴图：上面一行是谁（小、金），下面一行是这个动作叫什么（大、白） */
function labelTex(name: string, action: string) {
  return canvasTex(512, 144, (c) => {
    c.clearRect(0, 0, 512, 144);
    c.textAlign = 'center';
    c.lineJoin = 'round';
    c.font = `900 32px ${FONT}`;
    c.lineWidth = 8; c.strokeStyle = 'rgba(12,10,24,.85)';
    c.strokeText(name, 256, 42);
    c.fillStyle = '#ffd166';
    c.fillText(name, 256, 42);
    c.font = `900 58px ${FONT}`;
    c.lineWidth = 12; c.strokeStyle = 'rgba(12,10,24,.9)';
    c.strokeText(action, 256, 118);
    c.fillStyle = '#ffffff';
    c.fillText(action, 256, 118);
  });
}

/** 一排四个人 + 每人头顶一块名牌；第 r 轮全员各演自己的第 r 个动作 */
function line(ids: string[]): ShotDef['build'] {
  const XS = [-4.5, -1.5, 1.5, 4.5];
  return (k) => {
    stage(k);
    const cast = ids.map((id) => k.actor(id));
    // 每个人的十二张名牌先画好（build 只跑一次，别每帧画贴图）
    const texes = ids.map((id) => seqOf(id).map(([, cn]) => labelTex(NAME[id], cn)));
    const labels = ids.map((id, i) => {
      const m = new THREE.SpriteMaterial({ map: texes[i][0], transparent: true, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.scale.set(2.9, 0.82, 1);
      k.add(s, XS[i], 2.05, 0.2);
      return s;
    });
    const A = cam([0, 2.05, 9.3], [0, 1.2, 0], 39), B = cam([0, 1.98, 8.7], [0, 1.18, 0], 38);
    return ({ u, t }) => {
      const r = Math.min(ROUNDS - 1, Math.floor(t / ROUND));
      const local = t - r * ROUND;           // 每个动作都从 0 开始，别接着上一轮的时间
      cast.forEach((a, i) => {
        const [action] = seqOf(ids[i])[r];
        a.motion(action, local).at(XS[i], 0, 0);
        const mat = labels[i].material as THREE.SpriteMaterial;
        if (mat.map !== texes[i][r]) { mat.map = texes[i][r]; mat.needsUpdate = true; }
      });
      return glide(A, B, u, 0.5);
    };
  };
}

export const SHOTS: ShotDef[] = [
  {
    id: 'S1', look: 'stage', title: '本鲸 / 龙娘 / 小克 / 豆包：十二轮', cast: ['whale', 'gpt', 'claude', 'doubao'],
    note: '四个人并排，每 2 秒同步换一个动作：待机、行走、挥手、说话、鞠躬、坐下、开心、思考、惊讶、跳跃，第十一、十二轮换成各自的专属动作（本鲸递饭碗 / 鲸尾打拍，龙娘举沙漏 / 展翼守护，小克认真翻书 / 端杯思考，豆包递出篮子 / 轻快踩拍）。',
    build: line(['whale', 'gpt', 'claude', 'doubao']),
  },
  {
    id: 'S2', look: 'stage', title: '猫 / Kimi / 千问 / 狐狸：十二轮', cast: ['gemini', 'kimi', 'qwen', 'zai'],
    note: '后四位同一套十二轮；专属动作是猫对照时钟 / 提笔创作，Kimi 展开卷轴 / 夹好书签，千问轻摇折扇 / 茶会邀请，狐狸拨动算盘 / 睡醒认真。',
    build: line(['gemini', 'kimi', 'qwen', 'zai']),
  },
];
