import { Anchor } from "antd";
import { usePosts } from "../../hooks/use-posts";
import { useCounter } from "../../stores/use-counter";
import { TimeSection } from "./components/time-section";
import { CounterSection } from "./components/counter-section";
import { PostsSection } from "./components/posts-section";

export const HomePage = () => {
  const { count, increment, decrement } = useCounter();
  const { data, isLoading, isError } = usePosts();

  return (
    <div className="flex gap-6">
      <div className="flex flex-1 flex-col gap-6">
        <TimeSection />
        <CounterSection count={count} onIncrement={increment} onDecrement={decrement} />
        <PostsSection data={data} isLoading={isLoading} isError={isError} />
      </div>
      <Anchor
        className="w-56 shrink-0"
        items={[
          { key: "time", href: "#time", title: "dayjs" },
          { key: "counter", href: "#counter", title: "Zustand + es-toolkit" },
          { key: "posts", href: "#posts", title: "TanStack Query" },
        ]}
      />
    </div>
  );
};
