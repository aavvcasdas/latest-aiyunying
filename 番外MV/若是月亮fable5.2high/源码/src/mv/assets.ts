// 素材加载：全部 import 进来，单文件打包时内联
import atlasUrl from "../assets/atlas.png";
import lampUrl from "../assets/gen/streetlamp.png";
import lookupUrl from "../assets/gen/whale_lookup.png";
import hugUrl from "../assets/gen/whale_hug_benyu.png";
import holdUrl from "../assets/gen/whale_hold_camellia.png";
import budUrl from "../assets/gen/camellia_bud.png";
import halfUrl from "../assets/gen/camellia_half.png";
import bloomUrl from "../assets/gen/camellia_bloom.png";
import budHdUrl from "../assets/gen/camellia_bud_hd.png";
import halfHdUrl from "../assets/gen/camellia_half_hd.png";
import bloomHdUrl from "../assets/gen/camellia_bloom_hd.png";
import benyuUrl from "../assets/gen/benyu_px.png";
import fontUrl from "../assets/moon-font.woff2";
import audioUrl from "../assets/moon.mp3";

export type Img = HTMLImageElement | HTMLCanvasElement;
export type Assets = {
  atlas: HTMLImageElement; lamp: HTMLImageElement; lampOff: HTMLCanvasElement;
  wLookup: HTMLImageElement; wHug: HTMLImageElement; wHold: HTMLImageElement;
  cBud: HTMLImageElement; cHalf: HTMLImageElement; cBloom: HTMLImageElement;
  cBudHd: HTMLImageElement; cHalfHd: HTMLImageElement; cBloomHd: HTMLImageElement;
  benyu: HTMLImageElement;
};
export const AUDIO_URL: string = audioUrl;
// 打包源码 zip 时要带上的二进制素材
export const BIN_URLS: Record<string, string> = { "src/assets/atlas.png": atlasUrl, "src/assets/moon-font.woff2": fontUrl, "src/assets/moon.mp3": audioUrl };
export const SPRITE_URLS: Record<string, string> = {
  "streetlamp.png": lampUrl, "whale_lookup.png": lookupUrl, "whale_hug_benyu.png": hugUrl, "whale_hold_camellia.png": holdUrl,
  "camellia_bud.png": budUrl, "camellia_half.png": halfUrl, "camellia_bloom.png": bloomUrl,
  "camellia_bud_hd.png": budHdUrl, "camellia_half_hd.png": halfHdUrl, "camellia_bloom_hd.png": bloomHdUrl, "benyu_px.png": benyuUrl,
};

function load(url: string, name: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(`缺素材：${name}`)); im.src = url; });
}
// 熄灭的路灯：把灯罩里的暖黄像素压成夜色
function unlit(im: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height;
  const g = cv.getContext("2d")!; g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
    if (d.data[i + 3] && r > 120 && r > b + 50 && gg > 60) { const l = (r + gg + b) / 3; d.data[i] = 40 + l * 0.12; d.data[i + 1] = 44 + l * 0.12; d.data[i + 2] = 78 + l * 0.14; }
  }
  g.putImageData(d, 0, 0); return cv;
}

export async function loadAssets(): Promise<Assets> {
  const face = new FontFace("MoonKuaiLe", `url(${fontUrl})`);
  const [fontOk, atlas, lamp, wLookup, wHug, wHold, cBud, cHalf, cBloom, cBudHd, cHalfHd, cBloomHd, benyu] = await Promise.all([
    face.load().then((f) => { document.fonts.add(f); return true; }).catch(() => false),
    load(atlasUrl, "人物/atlas.png"), load(lampUrl, "streetlamp.png"), load(lookupUrl, "whale_lookup.png"), load(hugUrl, "whale_hug_benyu.png"),
    load(holdUrl, "whale_hold_camellia.png"), load(budUrl, "camellia_bud.png"), load(halfUrl, "camellia_half.png"), load(bloomUrl, "camellia_bloom.png"),
    load(budHdUrl, "camellia_bud_hd.png"), load(halfHdUrl, "camellia_half_hd.png"), load(bloomHdUrl, "camellia_bloom_hd.png"), load(benyuUrl, "benyu_px.png"),
  ]);
  if (!fontOk) console.warn("模板字体没加载上，退回系统字体");
  return { atlas, lamp, lampOff: unlit(lamp), wLookup, wHug, wHold, cBud, cHalf, cBloom, cBudHd, cHalfHd, cBloomHd, benyu };
}
