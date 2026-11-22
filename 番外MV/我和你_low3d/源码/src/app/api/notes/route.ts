import { db } from "@/db";
import { reviewNotes } from "@/db/schema";
import { SHOTS } from "@/lib/mv/timeline";
import { desc, sql } from "drizzle-orm";

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS review_notes (
    id serial PRIMARY KEY,
    shot_index integer NOT NULL,
    word text NOT NULL DEFAULT '',
    author text NOT NULL DEFAULT '审片人',
    rating integer NOT NULL DEFAULT 5,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  ensured = true;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureTable();
    const rows = await db.select().from(reviewNotes).orderBy(desc(reviewNotes.createdAt)).limit(200);
    return Response.json({ notes: rows });
  } catch {
    return Response.json({ notes: [], error: "数据库不可用" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { shotIndex?: number; author?: string; rating?: number; content?: string } | null;
  const shotIndex = Number(body?.shotIndex);
  const content = String(body?.content ?? "").trim().slice(0, 500);
  if (!Number.isInteger(shotIndex) || shotIndex < 0 || shotIndex >= SHOTS.length || !content) {
    return Response.json({ error: "参数不对：需要有效的镜头号和内容" }, { status: 400 });
  }
  const rating = Math.max(1, Math.min(5, Math.round(Number(body?.rating ?? 5)) || 5));
  const author = String(body?.author ?? "").trim().slice(0, 30) || "审片人";
  await ensureTable();
  const [row] = await db
    .insert(reviewNotes)
    .values({ shotIndex, word: SHOTS[shotIndex].word, author, rating, content })
    .returning();
  return Response.json({ note: row }, { status: 201 });
}
