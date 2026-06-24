import { Button, Space } from "antd";
import { useCounter } from "../../stores/use-counter";
import { CounterSection } from "./components/counter-section";
import { PostsSection } from "./components/posts-section";
import { TimeSection } from "./components/time-section";

export const HomePage = () => {
  const { count, increment, decrement } = useCounter();

  return (
    <div className="flex gap-6 max-lg:flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <TimeSection />
        <CounterSection count={count} onIncrement={increment} onDecrement={decrement} />
        <PostsSection />
      </div>
      <nav className="sticky top-6 w-60 shrink-0 self-start max-lg:static max-lg:w-full">
        <Space direction="vertical" className="w-full">
          <Button block href="#time">
            dayjs
          </Button>
          <Button block href="#counter">
            Zustand + es-toolkit
          </Button>
          <Button block href="#posts">
            TanStack Query
          </Button>
        </Space>
      </nav>
    </div>
  );
};
