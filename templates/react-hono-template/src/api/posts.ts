import { apiClient } from "./client";
import {
  getPostsRequestSchema,
  getPostsResponseSchema,
  type GetPostsRequest,
  type GetPostsResponse,
} from "@kxh-awesome/hono-template/rpc";

export const getPosts = async (params: GetPostsRequest): Promise<GetPostsResponse> => {
  try {
    const request = getPostsRequestSchema.parse(params);
    const response = await apiClient.api.posts.getPosts.$post({
      json: request,
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    return getPostsResponseSchema.parse(body);
  } catch (error) {
    console.error("getPosts error", error);
    throw error;
  }
};
