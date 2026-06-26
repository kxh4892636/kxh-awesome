package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Config struct {
	Port        int
	DatabaseURL string
}

func Load() Config {
	loadDotEnv(".env")

	port := 8080
	if value := os.Getenv("PORT"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 && parsed <= 65535 {
			port = parsed
		}
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "./data/etf-service.sqlite"
	}

	return Config{
		Port:        port,
		DatabaseURL: normalizeDatabasePath(databaseURL),
	}
}

func normalizeDatabasePath(value string) string {
	value = strings.TrimPrefix(value, "file:")
	if filepath.IsAbs(value) {
		return value
	}
	path, err := filepath.Abs(value)
	if err != nil {
		return value
	}
	return path
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" || os.Getenv(key) != "" {
			continue
		}
		os.Setenv(key, strings.TrimSpace(value))
	}
}
