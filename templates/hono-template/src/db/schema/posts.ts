import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
});

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
