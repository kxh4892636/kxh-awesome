// 文章列表组件 - 展示 TanStack Query 数据加载三态：加载中 / 错误 / 列表
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePosts } from "../../../hooks/use-posts";

export const PostsSection = () => {
  const { data, isLoading, isError, refetch, isRefetching } = usePosts();

  return (
    <Card id="posts">
      <CardHeader>
        <CardTitle>TanStack Query - JSONPlaceholder Posts</CardTitle>
        <CardAction>
          <Button
            onClick={() => {
              void refetch();
            }}
            disabled={isRefetching}
          >
            {isRefetching && <Spinner data-icon="inline-start" />}
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading && <Spinner />}
        {isError && <Badge variant="destructive">Failed to fetch posts</Badge>}
        {data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Body</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.id}</TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="max-w-xl whitespace-normal">{post.body}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
