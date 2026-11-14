import { loadPatches } from "@/lib/storyboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ patches: await loadPatches() });
  } catch {
    return Response.json({ error: "读取分镜编排失败" }, { status: 500 });
  }
}
