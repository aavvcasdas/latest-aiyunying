import { resetPatch, savePatch } from "@/lib/storyboard";
import { SHOT_IDS, sanitizePatch } from "@/mv/shots";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!SHOT_IDS.has(id)) return Response.json({ error: "没有这个镜头" }, { status: 404 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求不是合法的 JSON" }, { status: 400 });
  }
  const patch = sanitizePatch(body);
  if (!patch) return Response.json({ error: "编排内容不合规：角色、动作、背景或站位有误" }, { status: 400 });
  try {
    await savePatch(id, patch);
    return Response.json({ ok: true, patch });
  } catch {
    return Response.json({ error: "保存失败，数据库暂时不可用" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!SHOT_IDS.has(id)) return Response.json({ error: "没有这个镜头" }, { status: 404 });
  try {
    await resetPatch(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "恢复失败，数据库暂时不可用" }, { status: 500 });
  }
}
