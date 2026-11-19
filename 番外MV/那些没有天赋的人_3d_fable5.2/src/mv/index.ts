import { Cards } from "./cards";
import { MV } from "./engine";
import { loadFonts } from "./tex";
import { buildShots } from "./shots";
import { beamSet, bedSet, podiumSet, qmazeSet, smileSet, tugSet } from "./setsA";
import { bowlSet, deskSet, ghostSet, poemSet, shatterSet, stampSet, tinySet, trophySet } from "./setsB";
import { cornerSet, crowdSet, stageSet } from "./setsC";

export async function createMV(canvas: HTMLCanvasElement, w: number, h: number) {
  await loadFonts();
  const mv = new MV(canvas, w, h);
  await mv.env.load();
  mv.cards = new Cards(mv.tScene);
  const e = mv.env;
  mv.addSet("stage", stageSet(e)); mv.addSet("bed", bedSet(e)); mv.addSet("qmaze", qmazeSet(e)); mv.addSet("tug", tugSet(e));
  mv.addSet("smile", smileSet(e)); mv.addSet("beam", beamSet(e)); mv.addSet("podium", podiumSet(e)); mv.addSet("crowd", crowdSet(e));
  mv.addSet("corner", cornerSet(e)); mv.addSet("bowl", bowlSet(e)); mv.addSet("shatter", shatterSet(e)); mv.addSet("desk", deskSet(e));
  mv.addSet("ghost", ghostSet(e)); mv.addSet("stamp", stampSet(e)); mv.addSet("tiny", tinySet(e)); mv.addSet("poem", poemSet(e)); mv.addSet("trophy", trophySet(e));
  mv.shots = buildShots();
  return mv;
}
