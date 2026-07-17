package posts

import (
	"context"

	"gorm.io/gorm"
)

type Repository struct {
	database *gorm.DB
}

func NewRepository(database *gorm.DB) *Repository {
	return &Repository{database: database}
}

func (repository *Repository) List(ctx context.Context) ([]Post, error) {
	var posts []Post
	if err := repository.database.WithContext(ctx).Order("id ASC").Find(&posts).Error; err != nil {
		return nil, err
	}
	return posts, nil
}
