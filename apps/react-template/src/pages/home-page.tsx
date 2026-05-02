import { Button, Card, Spin, Table, Tag } from "antd";
import { usePosts } from "../hooks/use-posts";
import { useCounter } from "../stores/use-counter";

export const HomePage = () => {
  const { count, increment, decrement } = useCounter();
  const { data, isLoading, isError } = usePosts();

  return (
    <div className="flex flex-col gap-6">
      <Card title="Zustand Counter + es-toolkit clamp(0, 100)">
        <div className="flex items-center gap-4">
          <Button onClick={decrement}>-</Button>
          <span className="text-2xl font-bold">{count}</span>
          <Button type="primary" onClick={increment}>
            +
          </Button>
        </div>
      </Card>

      <Card title="TanStack Query - JSONPlaceholder Posts">
        {isLoading && <Spin />}
        {isError && <Tag color="error">Failed to fetch posts</Tag>}
        {data && (
          <Table
            rowKey="id"
            dataSource={data}
            columns={[
              { title: "ID", dataIndex: "id", width: 60 },
              { title: "Title", dataIndex: "title" },
            ]}
            pagination={false}
          />
        )}
      </Card>
    </div>
  );
};
