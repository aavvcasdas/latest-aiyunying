import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { shotOverrides } from "@/db/schema";
import { sanitizePatch } from "@/mv/shots";
import type { ShotPatch } from "@/mv/types";

let ready: Promise<void> | null = null;

/** 表不存在就建（全新环境里还没跑过 drizzle-kit push 时也能用） */
function ensureTable(): Promise<void> {
  ready ??= db
    .execute(
      sql`create table if not exists shot_overrides (
        shot_id text primary key,
        patch jsonb not null,
        updated_at timestamptz not null default now()
      )`,
    )
    .then(() => undefined)
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

export async function loadPatches(): Promise<Record<string, ShotPatch>> {
  await ensureTable();
  const rows = await db.select().from(shotOverrides);
  const out: Record<string, ShotPatch> = {};
  for (const row of rows) {
    const patch = sanitizePatch(row.patch);
    if (patch) out[row.shotId] = patch;
  }
  return out;
}

export async function savePatch(shotId: string, patch: ShotPatch): Promise<void> {
  await ensureTable();
  await db
    .insert(shotOverrides)
    .values({ shotId, patch })
    .onConflictDoUpdate({ target: shotOverrides.shotId, set: { patch, updatedAt: new Date() } });
}

export async function resetPatch(shotId: string): Promise<void> {
  await ensureTable();
  await db.delete(shotOverrides).where(eq(shotOverrides.shotId, shotId));
}
