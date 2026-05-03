// 文章查询 Hook - 封装 ConnectRPC 查询，提取 posts 数组供组件消费
import { useQuery } from "@connectrpc/connect-query";
import { getPosts } from "../api/gen/go-template/posts/v1/posts-PostsService_connectquery";

// usePosts 对 getPosts RPC 调用做数据层解包，直接返回 posts 列表
export const usePosts = () => {
  const query = useQuery(getPosts);
  const { data, ...rest } = query;

  return {
    ...rest,
    data: data?.posts,
  };
};
