// PostsService 业务实现 - 查询文章数据，实现 postsv1connect.PostsServiceHandler 接口
package service

import (
	"context"
	"math/rand/v2"

	"connectrpc.com/connect"

	postsv1 "kxh-awesome/go-template/gen/posts/v1"
	"kxh-awesome/go-template/gen/posts/v1/postsv1connect"
	"kxh-awesome/go-template/internal/model"
)

type PostsRepository interface {
	List(ctx context.Context) ([]model.Post, error)
}

// PostsService 实现 ConnectRPC 的 PostsServiceHandler 接口
type PostsService struct {
	postsRepository PostsRepository
}

// 编译期接口实现检查
var _ postsv1connect.PostsServiceHandler = (*PostsService)(nil)

func NewPostsService(postsRepository PostsRepository) *PostsService {
	return &PostsService{postsRepository: postsRepository}
}

// GetPosts 返回全部文章列表，当 random 为 true 时随机排序
func (s *PostsService) GetPosts(
	ctx context.Context,
	req *connect.Request[postsv1.GetPostsRequest],
) (*connect.Response[postsv1.GetPostsResponse], error) {
	postModels, err := s.postsRepository.List(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	posts := make([]*postsv1.Post, 0, len(postModels))
	for _, post := range postModels {
		posts = append(posts, &postsv1.Post{
			UserId: post.UserID,
			Id:     post.ID,
			Title:  post.Title,
			Body:   post.Body,
		})
	}

	if req.Msg.GetRandom() {
		shuffled := make([]*postsv1.Post, len(posts))
		copy(shuffled, posts)
		rand.Shuffle(len(shuffled), func(i, j int) {
			shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
		})
		posts = shuffled
	}
	res := connect.NewResponse(&postsv1.GetPostsResponse{
		Posts: posts,
	})
	return res, nil
}
