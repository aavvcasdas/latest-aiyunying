import { Cards, type TitleSpec } from "./cards";
import { MV } from "./engine";
import { loadFonts } from "./tex";
import { buildShots, CUT_FLASHES } from "./shots";
import { streetSet } from "./street";
import { dreamSet } from "./dream";

// 片头只留歌名与歌手名两行（设定表的规矩）
const TITLES: TitleSpec[] = [
  { text: "告白气球", t: [1.0, 1.35, 1.7, 2.05], x: 0, y: 1.9, s: 1.9, style: "rose", exit: 9.6 },
  { text: "周二珂", t: [3.2, 3.45, 3.7], x: 0, y: 0.15, s: 0.8, style: "cream", exit: 9.6 },
];

export async function createMV(canvas: HTMLCanvasElement, w: number, h: number) {
  await loadFonts();
  const mv = new MV(canvas, w, h);
  await mv.env.load();
  mv.addSet("street", streetSet(mv.env));
  mv.addSet("dream", dreamSet(mv.env));
  mv.shots = buildShots();
  mv.cards = new Cards(mv.tScene, mv.shots, TITLES);
  mv.flashes = CUT_FLASHES;
  return mv;
}
