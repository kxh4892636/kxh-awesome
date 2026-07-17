package config

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

const (
	defaultPort        = 8080
	defaultDatabaseDSN = "./data/etf-service.sqlite"
)

var allowedDotEnvKeys = map[string]struct{}{
	"DATABASE_DSN": {},
	"PORT":         {},
}

type Config struct {
	Port        int
	DatabaseDSN string
}

func Load(dotEnvPath string) (Config, error) {
	if err := loadDotEnv(dotEnvPath); err != nil {
		return Config{}, err
	}

	port, err := parsePort(os.Getenv("PORT"))
	if err != nil {
		return Config{}, err
	}
	databaseDSN := strings.TrimSpace(os.Getenv("DATABASE_DSN"))
	if databaseDSN == "" {
		databaseDSN = defaultDatabaseDSN
	}

	return Config{Port: port, DatabaseDSN: databaseDSN}, nil
}

func parsePort(value string) (int, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return defaultPort, nil
	}
	port, err := strconv.Atoi(value)
	if err != nil || port < 1 || port > 65535 {
		return 0, fmt.Errorf("invalid PORT %q: expected 1-65535", value)
	}
	return port, nil
}

func loadDotEnv(path string) (resultErr error) {
	file, err := os.Open(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("open .env %q: %w", path, err)
	}
	defer func() {
		if closeErr := file.Close(); resultErr == nil && closeErr != nil {
			resultErr = fmt.Errorf("close .env %q: %w", path, closeErr)
		}
	}()

	scanner := bufio.NewScanner(file)
	for lineNumber := 1; scanner.Scan(); lineNumber++ {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			return fmt.Errorf("malformed .env line %d", lineNumber)
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if _, ok := allowedDotEnvKeys[key]; !ok {
			return fmt.Errorf("unknown key %q on .env line %d", key, lineNumber)
		}
		if value == "" {
			return fmt.Errorf("empty value for %s on .env line %d", key, lineNumber)
		}
		if os.Getenv(key) != "" {
			continue
		}
		if err := os.Setenv(key, value); err != nil {
			return fmt.Errorf("set %s from .env: %w", key, err)
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("read .env %q: %w", path, err)
	}
	return nil
}
