// 文章查询 Hook - 封装 ConnectRPC 查询，提取 posts 数组供组件消费

import { useQuery } from "@tanstack/react-query";
import { postsClient } from "../api/client";

// usePosts 对 getPosts RPC 调用做数据层解包，直接返回 posts 列表
// random 为 true 时后端随机排序，默认 true
export const usePosts = (random = true) => {
  const query = useQuery({
    queryKey: ["posts", random],
    queryFn: () => {
      try {
        return postsClient.getPosts({ random });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });
  const { data, ...rest } = query;

  return {
    ...rest,
    data: data?.posts,
  };
};
