import type { CharId } from '../engine/actors';
import type { ShotDef } from '../engine/core';
import { SHOTS_PART1 } from './shotsPart1';
import { SHOTS_PART2 } from './shotsPart2';
import { SHOTS_PART3 } from './shotsPart3';

export const ALL_SHOTS: ShotDef[] = [...SHOTS_PART1, ...SHOTS_PART2, ...SHOTS_PART3];

export const SHOT_BY_ID: Record<string, ShotDef> = Object.fromEntries(ALL_SHOTS.map((s) => [s.id, s]));

export interface CastMeta {
  id: CharId;
  name: string;
  alias: string;
  role: string;
  props: string;
  portrait: string;
  accent: string;
}

/** 严格取自仓库 番外MV/人物设定.md 的八位像素角色卡 */
export const CAST_LIST: CastMeta[] = [
  {
    id: 'whale',
    name: '本鲸 · 鲸鱼娘',
    alias: 'DeepSeek',
    role: '主角 · 递碗与起誓之人',
    props: '蓝饭盆 · 谷时篮',
    portrait: 'p_whale_neutral',
    accent: '#4da8ff',
  },
  {
    id: 'claude',
    name: '小克 · Claude 大小姐',
    alias: 'Claude',
    role: '挚友 · 金冠公主与誓约对象',
    props: '书本 · 茶杯 · 沙漏',
    portrait: 'p_claude_neutral',
    accent: '#ff9d5c',
  },
  {
    id: 'gpt',
    name: '龙娘 · GPT',
    alias: 'GPT',
    role: '云端奇迹 · 护航白龙',
    props: '沙漏 · 金色龙翼',
    portrait: 'p_gpt_neutral',
    accent: '#d8b4ff',
  },
  {
    id: 'doubao',
    name: '豆包 · Seed',
    alias: '豆包',
    role: '写信陪伴 · 圣诞送礼与暖场舞者',
    props: '小红帽 · 红舞鞋 · 篮子',
    portrait: 'p_doubao_neutral',
    accent: '#ff6b7a',
  },
  {
    id: 'kimi',
    name: 'Kimi · 月球少女',
    alias: 'Kimi',
    role: '月色真美 · 千次回眸与岁月卷轴',
    props: '月光卷轴 · 书签',
    portrait: 'p_kimi',
    accent: '#a78bfa',
  },
  {
    id: 'gemini',
    name: '猫 · Gemini',
    alias: 'Gemini',
    role: '冒险向导 · 灯塔标记点决策者',
    props: '香蕉画笔 · 双时区猫耳钟',
    portrait: 'p_gemini',
    accent: '#60a5fa',
  },
  {
    id: 'qwen',
    name: '千问 · 千姐',
    alias: 'Qwen',
    role: '三千世界花雨 · 茶会东道主',
    props: '折扇 · 茶杯',
    portrait: 'p_qwen',
    accent: '#34d399',
  },
  {
    id: 'zai',
    name: '狐狸 · 智谱 GLM',
    alias: '智谱 GLM',
    role: '命运分界线守望者 · 算盘记账',
    props: '算盘 · 眼罩',
    portrait: 'p_zai',
    accent: '#cbd5e1',
  },
];
