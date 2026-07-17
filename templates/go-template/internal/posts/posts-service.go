package posts

import (
	"context"
	"log"
	"math/rand/v2"

	"connectrpc.com/connect"

	postsv1 "kxh-awesome/go-template/gen/posts/v1"
	"kxh-awesome/go-template/gen/posts/v1/postsv1connect"
)

type Store interface {
	List(ctx context.Context) ([]Post, error)
}

type Service struct {
	store Store
}

var _ postsv1connect.PostsServiceHandler = (*Service)(nil)

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (service *Service) GetPosts(
	ctx context.Context,
	req *connect.Request[postsv1.GetPostsRequest],
) (*connect.Response[postsv1.GetPostsResponse], error) {
	postRecords, err := service.store.List(ctx)
	if err != nil {
		log.Printf("list posts: %v", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	responsePosts := make([]*postsv1.Post, 0, len(postRecords))
	for _, post := range postRecords {
		responsePosts = append(responsePosts, &postsv1.Post{
			UserId: post.UserID,
			Id:     post.ID,
			Title:  post.Title,
			Body:   post.Body,
		})
	}

	if req.Msg.GetRandom() {
		shuffled := make([]*postsv1.Post, len(responsePosts))
		copy(shuffled, responsePosts)
		rand.Shuffle(len(shuffled), func(i, j int) {
			shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
		})
		responsePosts = shuffled
	}

	return connect.NewResponse(&postsv1.GetPostsResponse{Posts: responsePosts}), nil
}
