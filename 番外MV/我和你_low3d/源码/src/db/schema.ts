import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// 审片意见：每条挂在某个镜头（=某个词）上。
export const reviewNotes = pgTable("review_notes", {
  id: serial("id").primaryKey(),
  shotIndex: integer("shot_index").notNull(),
  word: text("word").notNull().default(""),
  author: text("author").notNull().default("审片人"),
  rating: integer("rating").notNull().default(5),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
