import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getPostsRequestSchema, getPostsResponseSchema } from "./schema";
import type { CreatePostsRoutesParams } from "./types";

export const createPostsRoutes = (params: CreatePostsRoutesParams) => {
  const { postsService } = params;

  return new Hono().post(
    "/posts/getPosts",
    zValidator("json", getPostsRequestSchema),
    async (c) => {
      const request = c.req.valid("json");
      const posts = await postsService.listPosts(request);
      const response = getPostsResponseSchema.parse({ posts });

      return c.json(response, 200);
    },
  );
};
