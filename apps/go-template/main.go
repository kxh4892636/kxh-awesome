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
	"kxh-awesome/go-template/internal/service"
)

//go:embed docs/*
var docsDir embed.FS

func main() {
	postsService := &service.PostsService{}
	mux := http.NewServeMux()
	mux.Handle(postsv1connect.NewPostsServiceHandler(postsService))

	docsFS, _ := fs.Sub(docsDir, "docs")
	mux.Handle("/doc/", http.StripPrefix("/doc/", http.FileServer(http.FS(docsFS))))

	server := &http.Server{
		Addr: ":8080",
		Handler: corsMiddleware(
			h2c.NewHandler(mux, &http2.Server{}),
		),
	}

	go func() {
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
