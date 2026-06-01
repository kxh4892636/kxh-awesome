import { count } from "drizzle-orm";
import { db } from "./client";
import { posts, type NewPostRow } from "./schema";

const seedPosts: NewPostRow[] = [
  {
    id: 1,
    userId: 1,
    title: "Getting Started with React",
    body: "React is a JavaScript library for building user interfaces.",
  },
  {
    id: 2,
    userId: 1,
    title: "Zustand State Management",
    body: "Zustand is a small, fast state management solution.",
  },
  {
    id: 3,
    userId: 2,
    title: "Tailwind CSS Tips",
    body: "Tailwind CSS is a utility-first CSS framework.",
  },
  {
    id: 4,
    userId: 2,
    title: "TanStack Query Guide",
    body: "TanStack Query makes fetching data in React simple.",
  },
  {
    id: 5,
    userId: 3,
    title: "Ant Design Components",
    body: "Ant Design provides a set of high-quality React components.",
  },
  {
    id: 6,
    userId: 3,
    title: "Hono RPC + Node",
    body: "Hono RPC provides type-safe APIs between a Node backend and TypeScript frontend.",
  },
];

export const seedDatabase = async (): Promise<void> => {
  const [row] = await db.select({ value: count() }).from(posts);

  if ((row?.value ?? 0) > 0) {
    return;
  }

  await db.insert(posts).values(seedPosts);
};
