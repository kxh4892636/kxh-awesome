package database

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func OpenSQLite(dsn string) (*gorm.DB, error) {
	if err := createSQLiteDirectory(dsn); err != nil {
		return nil, err
	}
	database, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("open SQLite database: %w", err)
	}
	return database, nil
}

func createSQLiteDirectory(dsn string) error {
	if dsn == ":memory:" || strings.HasPrefix(dsn, "file:") {
		return nil
	}
	path := strings.SplitN(dsn, "?", 2)[0]
	if path == "" {
		return fmt.Errorf("SQLite DSN is empty")
	}
	directory := filepath.Dir(path)
	if directory == "." {
		return nil
	}
	if err := os.MkdirAll(directory, 0o755); err != nil {
		return fmt.Errorf("create SQLite directory %q: %w", directory, err)
	}
	return nil
}
