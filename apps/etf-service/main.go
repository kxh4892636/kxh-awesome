package main

import (
	"embed"
	"log"

	"kxh-awesome/etf-service/internal/app"
)

//go:embed docs/*
var docsDir embed.FS

func main() {
	if err := app.Run(docsDir); err != nil {
		log.Fatal(err)
	}
}
