import { useQuery } from "@connectrpc/connect-query";
import { getPosts } from "./gen/go-template/posts/v1/posts-PostsService_connectquery";
import type { Post } from "./gen/go-template/posts/v1/posts_pb";

interface UsePostsResult {
  data: Post[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => Promise<unknown>;
}

export const usePosts = (random = true): UsePostsResult => {
  const query = useQuery(getPosts, { random });
  const { data, isLoading, isError, isRefetching, refetch } = query;

  return {
    data: data?.posts,
    isLoading,
    isError,
    isRefetching,
    refetch,
  };
};

export type { Post };
