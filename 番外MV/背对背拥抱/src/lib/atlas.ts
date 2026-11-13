import raw from "@/data/castAtlas.json";

/**
 * 角色图集：1024 × 1006 的一张 PNG，格子的坐标表来自仓库的 cast_atlas.json。
 * 所有像素动画都用 `calc(Npx * var(--k))` 写，这样一份 keyframes 对任意放大倍数都成立。
 */
// 图集总尺寸必须和 src/assets/cast_atlas.png 的真实像素高度一致：
// 贴图来自 通用模板/engine/assets/cast_atlas.png（1024×1212）。
// zip 里那份 castAtlas.json 写的是 1006，跟这张图对不上——高度一错，
// 采样区间整体偏移又翻过来，纸片人会变成头朝下。别改回去。
export const ATLAS_W = 1024;
export const ATLAS_H = 1212;

export const RECTS = raw.s as unknown as Record<string, [number, number, number, number]>;

export function rect(cell: string): [number, number, number, number] {
  const r = RECTS[cell];
  if (!r) throw new Error(`[图集] 没有这一格：${cell}`);
  return r;
}

export function has(cell: string): boolean {
  return Boolean(RECTS[cell]);
}

/** 一序列有几格，以图集实际有的为准（不写死 8）。 */
export function framesIn(prefix: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 32; i++) {
    const name = `${prefix}_${i}`;
    if (RECTS[name]) out.push(name);
    else break;
  }
  return out;
}

/** 一个序列里最大的格子尺寸：元素按它定宽高，格子小的靠右下对齐。 */
export function cycleSize(cells: string[]): [number, number] {
  let w = 0;
  let h = 0;
  for (const c of cells) {
    const r = rect(c);
    w = Math.max(w, r[2]);
    h = Math.max(h, r[3]);
  }
  return [w, h];
}

/** 某格在「宽高为 W×H 的元素」里的 background-position（以 px 为单位，乘 --k 使用）。 */
function posOf(cell: string, W: number, H: number): [number, number] {
  const [x, y, w, h] = rect(cell);
  return [-(x + (W - w)), -(y + (H - h))];
}

function keyframes(name: string, body: string): string {
  return `@keyframes ${name}{${body}}`;
}

/** 一个位置同时写给 background-position 与 mask-position：
 *  普通模式用背景，剪影 / 染色模式用遮罩，动画只有一份。 */
function posDecl(px: number, py: number): string {
  const v = `calc(${px}px * var(--k)) calc(${py}px * var(--k))`;
  return `background-position:${v};mask-position:${v};-webkit-mask-position:${v}`;
}

/** 步态：每格 3 个整帧的感觉，用 steps(1,end) 硬切。 */
function walkCss(prefix: string): string {
  const cells = framesIn(prefix);
  if (cells.length < 2) return "";
  const [W, H] = cycleSize(cells);
  const stops = cells
    .map((c, i) => {
      const [px, py] = posOf(c, W, H);
      return `${((i / cells.length) * 100).toFixed(3)}%{${posDecl(px, py)}}`;
    })
    .join("");
  return keyframes(`walk_${prefix}`, stops);
}

/** 待机眨眼：两格来回，大部分时间停在第一格。 */
function blinkCss(name: string, a: string, b: string, hold = 88): string {
  if (!has(a) || !has(b)) return "";
  const [W, H] = cycleSize([a, b]);
  const [ax, ay] = posOf(a, W, H);
  const [bx, by] = posOf(b, W, H);
  const pa = posDecl(ax, ay);
  const pb = posDecl(bx, by);
  return keyframes(
    name,
    `0%,${hold}%{${pa}}${hold + 4}%,${hold + 8}%{${pb}}${hold + 12}%,100%{${pa}}`,
  );
}

export const WALK_PREFIXES = [
  "walk_whale",
  "walk_claude",
  "walk_kimi",
  "walk_gemini",
  "walk_qwen",
  "walk_zai",
  "walk_doubao_big",
];

export const BLINKS: Array<[string, string, string]> = [
  ["bk_whale", "whale_idle", "whale_blink"],
  ["bk_claude_front", "claude_front_0", "claude_front_1"],
  ["bk_claude_side", "claude_side_0", "claude_side_1"],
  ["bk_kimi_front", "kimi_front_0", "kimi_front_1"],
  ["bk_kimi_side", "kimi_side_0", "kimi_side_1"],
  ["bk_gemini_front", "gemini_front_0", "gemini_front_1"],
  ["bk_gemini_side", "gemini_side_0", "gemini_side_1"],
  ["bk_qwen_front", "qwen_front_0", "qwen_front_1"],
  ["bk_qwen_side", "qwen_side_0", "qwen_side_1"],
  ["bk_zai_front", "zai_front_0", "zai_front_1"],
  ["bk_zai_side", "zai_side_0", "zai_side_1"],
  ["bk_doubao", "doubao_cage_0", "doubao_cage_1"],
  ["bk_gpt", "gpt_boss_idle", "gpt_boss_blink"],
  ["bk_gpt_cast", "gpt_boss_cast0", "gpt_boss_cast1"],
  ["bk_fly", "gpt_fly_0", "gpt_fly_1"],
];

/** 一次性生成整套像素动画 CSS，注入一个 <style> 即可。 */
export function buildAtlasCss(): string {
  const parts: string[] = [];
  for (const p of WALK_PREFIXES) parts.push(walkCss(p));
  for (const [name, a, b] of BLINKS) parts.push(blinkCss(name, a, b, name === "bk_fly" ? 40 : 88));
  // 说话轻轻颠（写在位移之后，作用在精灵内层，不和站位打架）
  parts.push("@keyframes talkBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}");
  parts.push("@keyframes idleBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}");
  return parts.filter(Boolean).join("\n");
}

/** 单格精灵的内联样式（不含动画）。 */
export function cellStyle(cell: string, k: number, atlasUrl: string) {
  const [x, y, w, h] = rect(cell);
  return {
    width: `${w * k}px`,
    height: `${h * k}px`,
    backgroundImage: `url(${atlasUrl})`,
    backgroundSize: `${ATLAS_W * k}px ${ATLAS_H * k}px`,
    backgroundPosition: `${-x * k}px ${-y * k}px`,
  } as const;
}
