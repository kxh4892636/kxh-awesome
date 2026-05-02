import { Card, Spin, Table, Tag } from "antd";
import type { Post } from "../../../hooks/use-posts";

interface PostsSectionProps {
  data: Post[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const PostsSection = (props: PostsSectionProps) => {
  const { data, isLoading, isError } = props;

  return (
    <Card id="posts" title="TanStack Query - JSONPlaceholder Posts">
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
  );
};
