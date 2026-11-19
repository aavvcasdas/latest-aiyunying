// 镜头表：按歌词逐字时间切镜
import { Scene } from "./kit";
import { byId } from "./lyrics";
import * as A from "./scenesA";
import * as B from "./scenesB";

export const SECTIONS = [
  { name: "第一遍 · 夜", a: 0 },
  { name: "间奏 · 碎裂", a: 28.3 },
  { name: "稿纸段 · 墨", a: 34 },
  { name: "第二遍 · 昼", a: 71.2 },
  { name: "间奏 · 日月", a: 99.3 },
  { name: "桥段 · 黎明", a: 112 },
  { name: "终段 · 角落", a: 123 },
];

export function buildScenes(): Scene[] {
  const out: Scene[] = [];
  const push = (id: string, a: number, b: number, fn: Scene["fn"], sec: string, P = "A") => out.push({ id, a, b, fn, sec, P });
  const L = (id: string) => byId[id].s;

  const verse = (P: string, start: number, end: number) => {
    push("stage", start, L(P + "3"), A.stage, P, P);
    push("title", L(P + "3"), L(P + "4"), A.title, P, P);
    push("bed", L(P + "4"), L(P + "5"), A.bed, P, P);
    push("ques", L(P + "5"), L(P + "6"), A.ques, P, P);
    push("tug", L(P + "6"), L(P + "8"), A.tug, P, P);
    push("well", L(P + "8"), L(P + "9"), A.well, P, P);
    push("pillar", L(P + "9"), L(P + "10"), A.pillar, P, P);
    push("podium", L(P + "10"), L(P + "11"), A.podium, P, P);
    push("crowd", L(P + "11"), L(P + "12"), A.crowd, P, P);
    push("corner", L(P + "12"), L(P + "13"), A.corner, P, P);
    push("bowl", L(P + "13"), L(P + "14"), A.bowlScene, P, P);
    push("flower", L(P + "14"), end, A.flowerScene, P, P);
  };

  verse("A", 0, 28.3);
  push("shatter", 28.3, 34, B.shatter, "I1");
  push("papers", 34, L("B2"), B.papers, "B");
  push("name", L("B2"), L("B4"), B.nameplate, "B");
  push("light", L("B4"), L("B6"), B.lightBook, "B");
  push("clocks", L("B6"), L("B8"), B.clocks, "B");
  push("stamps", L("B8"), L("B10"), B.stamps, "B");
  push("sea", L("B10"), L("B11"), B.sea, "B");
  push("tiny", L("B11"), L("B12"), B.tiny, "B");
  push("pen", L("B12"), L("B14"), B.pen, "B");
  push("trophy", L("B14"), L("B16"), B.trophyScene, "B");
  push("spots", L("B16"), L("B17"), B.spots, "B");
  push("bookB", L("B17"), 71.2, B.bookFinale, "B");
  verse("C", 71.2, 99.3);
  push("window", 99.3, 112, B.windowScene, "I2");
  push("trophyD", 112, L("D3"), B.trophyScene, "D");
  push("spotsD", L("D3"), L("D4"), B.spots, "D");
  push("bookD", L("D4"), 123, B.bookFinale, "D");
  verse("E", 123, 152.1);
  return out;
}

export const SCENES = buildScenes();
