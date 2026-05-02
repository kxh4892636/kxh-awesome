import { useQuery } from "@connectrpc/connect-query";
import { getPosts } from "../api/gen/go-template/posts/v1/posts-PostsService_connectquery.js";
import type { Post } from "../api/gen/go-template/posts/v1/posts_pb.js";

export type { Post };

export const usePosts = () => {
  const query = useQuery(getPosts);
  const { data, ...rest } = query;

  return {
    ...rest,
    data: data?.posts,
  };
};
