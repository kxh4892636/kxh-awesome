package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"kxh-awesome/go-template/gen/posts/v1/postsv1connect"
	"kxh-awesome/go-template/internal/posts"
	"kxh-awesome/go-template/internal/sqlite"
)

//go:embed docs/*
var docsDir embed.FS

func main() {
	databasePath, err := sqlite.PathFromEnv()
	if err != nil {
		log.Fatalf("validate database path: %v", err)
	}

	database, err := sqlite.Open(databasePath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}

	sqlDatabase, err := database.DB()
	if err != nil {
		log.Fatalf("get database handle: %v", err)
	}
	defer func() {
		if closeErr := sqlDatabase.Close(); closeErr != nil {
			log.Printf("close database: %v", closeErr)
		}
	}()

	postsRepository := posts.NewRepository(database)
	postsService := posts.NewService(postsRepository)
	mux := http.NewServeMux()
	mux.Handle(postsv1connect.NewPostsServiceHandler(postsService))

	docsFS, err := fs.Sub(docsDir, "docs")
	if err != nil {
		log.Fatalf("load embedded API documentation: %v", err)
	}
	mux.Handle("/doc/", http.StripPrefix("/doc/", http.FileServer(http.FS(docsFS))))

	server := &http.Server{
		Addr: ":8080",
		Handler: corsMiddleware(
			h2c.NewHandler(mux, &http2.Server{}),
		),
	}

	go func() {
		log.Printf("SQLite database opened at %s", databasePath.String())
		log.Println("ConnectRPC server listening on http://localhost:8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("server shutdown error: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Connect-Protocol-Version")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
