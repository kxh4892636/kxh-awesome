// 文章列表组件 - 展示 TanStack Query 数据加载三态：加载中 / 错误 / 列表
import { Button, Card, Spin, Table, Tag } from "antd";
import { usePosts } from "../../../hooks/use-posts";

export const PostsSection = () => {
  const { data, isLoading, isError, refetch, isRefetching } = usePosts();

  return (
    <Card
      id="posts"
      title="TanStack Query - JSONPlaceholder Posts"
      extra={
        <Button onClick={() => refetch()} loading={isRefetching}>
          Refresh
        </Button>
      }
    >
      {isLoading && <Spin />}
      {isError && <Tag color="error">Failed to fetch posts</Tag>}
      {data && (
        <Table
          rowKey="id"
          dataSource={data}
          columns={[
            { title: "ID", dataIndex: "id", width: 60 },
            { title: "Title", dataIndex: "title" },
            { title: "Body", dataIndex: "body" },
          ]}
          pagination={false}
        />
      )}
    </Card>
  );
};
