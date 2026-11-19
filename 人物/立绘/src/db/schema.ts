import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 分镜编排的改动：默认分镜写在 src/mv/shots.ts，这里只存被人改过的镜头。
export const shotOverrides = pgTable("shot_overrides", {
  shotId: text("shot_id").primaryKey(),
  patch: jsonb("patch").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
