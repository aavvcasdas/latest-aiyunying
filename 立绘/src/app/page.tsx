import MvPlayer from "@/components/MvPlayer";
import SiteHeader from "@/components/SiteHeader";
import { loadPatches } from "@/lib/storyboard";
import type { ShotPatch } from "@/mv/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let patches: Record<string, ShotPatch> = {};
  let dbOk = true;
  try {
    patches = await loadPatches();
  } catch {
    dbOk = false;
  }
  return (
    <>
      <SiteHeader active="mv" />
      <MvPlayer initialPatches={patches} dbOk={dbOk} />
    </>
  );
}
