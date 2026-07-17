import { Button, Space } from "antd";
import type * as React from "react";
import { CounterSection } from "../../features/counter";
import { LiveClockSection } from "../../features/live-clock";
import { PostsSection } from "../../features/posts";

export const HomePage: React.FC = (): React.ReactElement => (
  <div className="flex gap-6 max-lg:flex-col">
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <LiveClockSection />
      <CounterSection />
      <PostsSection />
    </div>
    <nav className="sticky top-6 w-60 shrink-0 self-start max-lg:static max-lg:w-full">
      <Space orientation="vertical" className="w-full">
        <Button block href="#live-clock">
          dayjs
        </Button>
        <Button block href="#counter">
          Zustand clamp 0..10
        </Button>
        <Button block href="#posts">
          TanStack Query
        </Button>
      </Space>
    </nav>
  </div>
);
