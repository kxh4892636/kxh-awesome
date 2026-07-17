package sqlite

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	sqliteDriver "github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type DatabasePath string

const (
	DefaultPath DatabasePath = "data/app.db"
	EnvPath                  = "GO_TEMPLATE_DB_PATH"
)

func PathFromEnv() (DatabasePath, error) {
	value := os.Getenv(EnvPath)
	if value == "" {
		return DefaultPath, nil
	}
	return ParseDatabasePath(value)
}

func ParseDatabasePath(value string) (DatabasePath, error) {
	if strings.TrimSpace(value) == "" {
		return "", fmt.Errorf("%s cannot be blank", EnvPath)
	}
	if strings.ContainsRune(value, '\x00') {
		return "", fmt.Errorf("%s cannot contain a null byte", EnvPath)
	}

	cleaned := filepath.Clean(value)
	return DatabasePath(cleaned), nil
}

func (path DatabasePath) String() string {
	return string(path)
}

func Open(path DatabasePath) (*gorm.DB, error) {
	value := path.String()
	if err := os.MkdirAll(filepath.Dir(value), 0o755); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}

	database, err := gorm.Open(sqliteDriver.Open(value), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open sqlite database: %w", err)
	}
	return database, nil
}
