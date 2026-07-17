package main

import (
	"embed"
	"log/slog"
	"os"

	"kxh-awesome/etf-service/internal/app"
)

//go:embed docs/*
var docsDir embed.FS

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := app.Run(docsDir, logger); err != nil {
		logger.Error("etf-service stopped", "error", err)
		os.Exit(1)
	}
}
