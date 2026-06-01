import { useQuery } from "@tanstack/react-query";
import { getPosts } from "../api/posts";

export const usePosts = (random = true) => {
  const query = useQuery({
    queryKey: ["posts", random],
    queryFn: () => getPosts({ random }),
  });
  const { data, ...rest } = query;

  return {
    ...rest,
    data: data?.posts,
  };
};
