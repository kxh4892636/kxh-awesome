package repository

import (
	"context"

	"gorm.io/gorm"

	"kxh-awesome/go-template/internal/model"
)

type PostsRepository struct {
	db *gorm.DB
}

func NewPostsRepository(db *gorm.DB) *PostsRepository {
	return &PostsRepository{db: db}
}

func (r *PostsRepository) List(ctx context.Context) ([]model.Post, error) {
	var posts []model.Post
	if err := r.db.WithContext(ctx).Order("id ASC").Find(&posts).Error; err != nil {
		return nil, err
	}
	return posts, nil
}
