"use client";
// 浏览器端素材加载：八张立绘（各建三级缩放图）、两张背景、歌词字体。全站只加载一次。
import { CAST, CAST_IDS } from "@/mv/cast";
import { buildMips, type CanvasPair, type Ctx2D, type Img, type Mip } from "@/mv/rig";
import type { Env } from "@/mv/scene";

export interface Assets {
  images: Record<string, Img>;
  tachie: Record<string, Mip[]>;
}

export function makeCanvas(w: number, h: number): CanvasPair {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d") as Ctx2D };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`素材加载失败：${src}`));
    im.src = src;
  });
}

let cache: Promise<Assets> | null = null;
const listeners = new Set<(done: number, total: number) => void>();
let done = 0;
const TOTAL = CAST_IDS.length + 3;

export function loadAssets(onProgress?: (done: number, total: number) => void): Promise<Assets> {
  if (onProgress) {
    listeners.add(onProgress);
    onProgress(done, TOTAL);
  }
  if (!cache) {
    const tick = () => {
      done++;
      listeners.forEach((fn) => fn(done, TOTAL));
    };
    const images: Record<string, Img> = {};
    const tachie: Record<string, Mip[]> = {};
    const jobs: Promise<void>[] = [
      ...CAST_IDS.map(async (id) => {
        const im = await loadImage(CAST[id].src);
        tachie[id] = buildMips(im, CAST[id].w, CAST[id].h, makeCanvas);
        tick();
      }),
      ...(["meadow", "night"] as const).map(async (name) => {
        images[`bg_${name}`] = await loadImage(`/bg/${name}.jpg`);
        tick();
      }),
      // 字体加载不上不拦着出画面，退回系统黑体
      document.fonts
        .load('48px "ZCOOL KuaiLe"', "勾指起誓")
        .catch(() => undefined)
        .then(tick),
    ];
    cache = Promise.all(jobs)
      .then(() => ({ images, tachie }))
      .catch((err) => {
        cache = null;
        done = 0;
        throw err;
      });
  }
  return cache;
}

export function makeEnv(W: number, H: number, assets: Assets): Env {
  return { W, H, images: assets.images, tachie: assets.tachie, scratch: makeCanvas(W, H), make: makeCanvas, bgCache: {} };
}
