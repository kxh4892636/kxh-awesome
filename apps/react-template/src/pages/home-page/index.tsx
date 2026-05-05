// 首页 - 聚合展示三个功能区块：实时时钟、计数器、文章列表，右侧锚点导航
import { Anchor } from "antd";
import { useCounter } from "../../stores/use-counter";
import { TimeSection } from "./components/time-section";
import { CounterSection } from "./components/counter-section";
import { PostsSection } from "./components/posts-section";

// HomePage 作为页面级容器，从 Store/Hook 获取数据，通过 props 下发给各子区块
export const HomePage = () => {
  const { count, increment, decrement } = useCounter();

  return (
    <div className="flex gap-6">
      <div className="flex flex-1 flex-col gap-6">
        <TimeSection />
        <CounterSection count={count} onIncrement={increment} onDecrement={decrement} />
        <PostsSection />
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
