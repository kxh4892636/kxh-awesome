import type { GetPostsRequest, Post } from "./schema";

export interface PostsService {
  listPosts: (params: GetPostsRequest) => Promise<Post[]>;
}

export interface CreatePostsRoutesParams {
  postsService: PostsService;
}
