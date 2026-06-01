import { asc, sql } from "drizzle-orm";
import { db } from "../db/client";
import { posts } from "../db/schema";
import type { PostsService } from "../routes/posts/types";

export const postsService = {
  listPosts: async (params) => {
    const { random } = params;

    try {
      if (random) {
        return await db
          .select()
          .from(posts)
          .orderBy(sql`random()`);
      }

      return await db.select().from(posts).orderBy(asc(posts.id));
    } catch (error) {
      console.error("listPosts error", error);
      throw error;
    }
  },
} satisfies PostsService;
