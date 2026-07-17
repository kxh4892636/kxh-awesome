import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Table, Typography } from "antd";
import type { TableProps } from "antd";
import type * as React from "react";
import { useState } from "react";
import { usePosts } from "../../libs/api";
import type { Post } from "../../libs/api";

const REFRESH_LOADING_MIN_MS = 250;

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
    render: (title: string): React.ReactNode => <Typography.Text strong>{title}</Typography.Text>,
  },
  {
    title: "Body",
    dataIndex: "body",
    render: (body: string): React.ReactNode => (
      <Typography.Paragraph className="m-0 max-w-3xl" ellipsis={{ rows: 2, expandable: true }}>
        {body}
      </Typography.Paragraph>
    ),
  },
];

export const PostsSection: React.FC = (): React.ReactElement => {
  const { data, isLoading, isError, refetch, isRefetching } = usePosts();
  const [isRefreshPending, setIsRefreshPending] = useState(false);

  const handleRefreshClick = (): void => {
    setIsRefreshPending(true);

    void Promise.all([
      refetch(),
      new Promise<void>((resolve: (value: void | PromiseLike<void>) => void): void => {
        setTimeout((): void => resolve(), REFRESH_LOADING_MIN_MS);
      }),
    ])
      .catch((error: unknown): void => {
        console.error("Unable to refresh posts", error);
      })
      .finally((): void => setIsRefreshPending(false));
  };

  return (
    <Card
      id="posts"
      title="TanStack Query - JSONPlaceholder Posts"
      extra={
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={isRefetching || isRefreshPending}
          onClick={handleRefreshClick}
        >
          Refresh
        </Button>
      }
    >
      {isError && <Alert className="mb-4" type="error" showIcon title="Failed to fetch posts" />}
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
