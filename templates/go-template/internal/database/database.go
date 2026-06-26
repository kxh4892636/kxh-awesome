package database

import (
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

const (
	// DefaultPath is relative to the go-template project root.
	DefaultPath = "data/app.db"
	EnvPath     = "GO_TEMPLATE_DB_PATH"
)

func PathFromEnv() string {
	if path := os.Getenv(EnvPath); path != "" {
		return path
	}
	return DefaultPath
}

func Open(path string) (*gorm.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}

	return gorm.Open(sqlite.Open(path), &gorm.Config{})
}
