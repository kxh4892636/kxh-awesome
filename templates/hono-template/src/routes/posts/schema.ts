import { z } from "zod";

export const postSchema = z.object({
  userId: z.number().int(),
  id: z.number().int(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const getPostsRequestSchema = z.object({
  random: z.boolean().default(true),
});

export const getPostsResponseSchema = z.object({
  posts: z.array(postSchema),
});

export type Post = z.infer<typeof postSchema>;
export type GetPostsRequest = z.infer<typeof getPostsRequestSchema>;
export type GetPostsResponse = z.infer<typeof getPostsResponseSchema>;
