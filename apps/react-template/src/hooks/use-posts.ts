import { useQuery } from "@tanstack/react-query";

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const MOCK_POSTS: Post[] = [
  {
    userId: 1,
    id: 1,
    title: "Getting Started with React",
    body: "React is a JavaScript library for building user interfaces.",
  },
  {
    userId: 1,
    id: 2,
    title: "Zustand State Management",
    body: "Zustand is a small, fast state management solution.",
  },
  {
    userId: 2,
    id: 3,
    title: "Tailwind CSS Tips",
    body: "Tailwind CSS is a utility-first CSS framework.",
  },
  {
    userId: 2,
    id: 4,
    title: "TanStack Query Guide",
    body: "TanStack Query makes fetching data in React simple.",
  },
  {
    userId: 3,
    id: 5,
    title: "Ant Design Components",
    body: "Ant Design provides a set of high-quality React components.",
  },
];

export const usePosts = () => {
  const postsQueryClient = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return MOCK_POSTS;
      } catch (e) {
        console.error("fetch posts error", e);
        return [];
      }
    },
  });

  return { ...postsQueryClient };
};
