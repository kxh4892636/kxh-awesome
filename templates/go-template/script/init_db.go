package main

import (
	"log"

	"gorm.io/gorm/clause"

	"kxh-awesome/go-template/internal/database"
	"kxh-awesome/go-template/internal/model"
)

var seedPosts = []model.Post{
	{UserID: 1, ID: 1, Title: "Getting Started with React", Body: "React is a JavaScript library for building user interfaces."},
	{UserID: 1, ID: 2, Title: "Zustand State Management", Body: "Zustand is a small, fast state management solution."},
	{UserID: 2, ID: 3, Title: "Tailwind CSS Tips", Body: "Tailwind CSS is a utility-first CSS framework."},
	{UserID: 2, ID: 4, Title: "TanStack Query Guide", Body: "TanStack Query makes fetching data in React simple."},
	{UserID: 3, ID: 5, Title: "Ant Design Components", Body: "Ant Design provides a set of high-quality React components."},
	{UserID: 3, ID: 6, Title: "ConnectRPC + Go", Body: "ConnectRPC provides type-safe RPC between Go backend and TypeScript frontend."},
}

func main() {
	dbPath := database.PathFromEnv()
	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}

	if err := db.AutoMigrate(&model.Post{}); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	if err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"user_id", "title", "body"}),
	}).Create(&seedPosts).Error; err != nil {
		log.Fatalf("seed posts: %v", err)
	}

	log.Printf("initialized SQLite database at %s", dbPath)
}
