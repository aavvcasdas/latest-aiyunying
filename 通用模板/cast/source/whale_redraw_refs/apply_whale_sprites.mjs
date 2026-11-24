import fs from 'node:fs';
import {RAW_SPRITES, CHAR_HEX} from '../sprites_data.js';
const data = JSON.parse(fs.readFileSync(new URL('./whale_sprites.json', import.meta.url),'utf8')).sprites;
Object.assign(RAW_SPRITES, data);
const path = new URL('../sprites_data.js', import.meta.url);
const old = fs.readFileSync(path,'utf8');
const marker = '\nconst cache = new Map();';
const tail = old.slice(old.indexOf(marker));
const header = `// sprites_data.js — 640×360 high-clarity pixel-art sprites & 64×64 portraits of all 8 project AI-girls
// Source assets: assets/ai-girls/{full-v9,walk-v14,lyric-action-v13,dance-v11,whale-pet-study}
// 2026-11-24 用户明确授权「完全重画 / 重新生成全部本鲸帧」：whale_* 基础格由
// 通用模板/cast/source/whale_redraw_refs/whale_*_clean.png 重新采样到原坐标尺寸，
// 调色板仍只用 px.js 的 248 色，透明仍为 255。其他角色基础格未改。
export const CHAR_HEX = ${JSON.stringify(CHAR_HEX)};
export const RAW_SPRITES = ${JSON.stringify(RAW_SPRITES)};
`;
fs.writeFileSync(path, header + tail);
console.log('sprites_data.js rewritten, whale keys', Object.keys(RAW_SPRITES).filter(k=>k.includes('whale')).length);
