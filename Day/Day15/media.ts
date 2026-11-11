// Day15 里要用到的两张图，路径都在这里汇一处：project.tsx 拿去做 preloads，shots.ts 拿去画。
// tv_day14/sheet.jpg 是上一集成片 81.4–89.4 秒那 8 秒（192 张 512×219）拼成的 16×12 大图，24 fps 循环。
import tvSheet from './素材/tv_day14/sheet.jpg';
import whaleFall from '../../鲸落图.png';

export const TV_SHEET = tvSheet;
export const TV_COLS = 16;
export const TV_ROWS = 12;
export const TV_COUNT = 192;
export const TV_FPS = 24;
/** 「本作品限制自己可见」那张图 —— 鲸落就说这个，不解释第二句 */
export const WHALE_FALL = whaleFall;
