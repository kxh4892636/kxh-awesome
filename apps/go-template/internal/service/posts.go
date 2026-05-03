// PostsService 业务实现 - 提供模拟文章数据，实现 postsv1connect.PostsServiceHandler 接口
package service

import (
	"context"

	"connectrpc.com/connect"

	postsv1 "kxh-awesome/go-template/gen/posts/v1"
	"kxh-awesome/go-template/gen/posts/v1/postsv1connect"
)

// PostsService 实现 ConnectRPC 的 PostsServiceHandler 接口
type PostsService struct{}

// 编译期接口实现检查
var _ postsv1connect.PostsServiceHandler = (*PostsService)(nil)

// mockPosts 模拟数据库中的文章数据
var mockPosts = []*postsv1.Post{
	{UserId: 1, Id: 1, Title: "Getting Started with React", Body: "React is a JavaScript library for building user interfaces."},
	{UserId: 1, Id: 2, Title: "Zustand State Management", Body: "Zustand is a small, fast state management solution."},
	{UserId: 2, Id: 3, Title: "Tailwind CSS Tips", Body: "Tailwind CSS is a utility-first CSS framework."},
	{UserId: 2, Id: 4, Title: "TanStack Query Guide", Body: "TanStack Query makes fetching data in React simple."},
	{UserId: 3, Id: 5, Title: "Ant Design Components", Body: "Ant Design provides a set of high-quality React components."},
	{UserId: 3, Id: 6, Title: "ConnectRPC + Go", Body: "ConnectRPC provides type-safe RPC between Go backend and TypeScript frontend."},
}

// GetPosts 返回全部模拟文章列表
func (s *PostsService) GetPosts(
	_ context.Context,
	_ *connect.Request[postsv1.GetPostsRequest],
) (*connect.Response[postsv1.GetPostsResponse], error) {
	res := connect.NewResponse(&postsv1.GetPostsResponse{
		Posts: mockPosts,
	})
	return res, nil
}
