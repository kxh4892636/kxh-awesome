import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Table, Typography } from "antd";
import type { TableProps } from "antd";
import type { Post } from "@kxh-awesome/hono-template/rpc";
import { usePosts } from "../../../hooks/use-posts";

const POST_COLUMNS: TableProps<Post>["columns"] = [
  {
    title: "ID",
    dataIndex: "id",
    width: 80,
  },
  {
    title: "Title",
    dataIndex: "title",
    width: 240,
    render: (title: string) => <Typography.Text strong>{title}</Typography.Text>,
  },
  {
    title: "Body",
    dataIndex: "body",
    render: (body: string) => (
      <Typography.Paragraph className="m-0 max-w-3xl" ellipsis={{ rows: 2, expandable: true }}>
        {body}
      </Typography.Paragraph>
    ),
  },
];

export const PostsSection = () => {
  const { data, isLoading, isError, refetch, isRefetching } = usePosts();

  return (
    <Card
      id="posts"
      title="TanStack Query - JSONPlaceholder Posts"
      extra={
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={isRefetching}
          onClick={() => {
            void refetch();
          }}
        >
          Refresh
        </Button>
      }
    >
      {isError && <Alert className="mb-4" type="error" showIcon message="Failed to fetch posts" />}
      <Table<Post>
        rowKey="id"
        columns={POST_COLUMNS}
        dataSource={data ?? []}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 760 }}
      />
    </Card>
  );
};
