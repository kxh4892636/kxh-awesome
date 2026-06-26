// 程序入口 - 启动 ConnectRPC HTTP 服务器，支持 h2c、CORS、优雅关闭，内嵌 API 文档
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
	"kxh-awesome/go-template/internal/database"
	"kxh-awesome/go-template/internal/repository"
	"kxh-awesome/go-template/internal/service"
)

//go:embed docs/*
var docsDir embed.FS

func main() {
	dbPath := database.PathFromEnv()
	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("get database handle: %v", err)
	}
	defer sqlDB.Close()

	postsRepository := repository.NewPostsRepository(db)
	postsService := service.NewPostsService(postsRepository)
	mux := http.NewServeMux()
	// 注册 ConnectRPC 服务处理器
	mux.Handle(postsv1connect.NewPostsServiceHandler(postsService))

	// 内嵌 API 文档，挂载到 /doc/ 路径
	docsFS, _ := fs.Sub(docsDir, "docs")
	mux.Handle("/doc/", http.StripPrefix("/doc/", http.FileServer(http.FS(docsFS))))

	server := &http.Server{
		Addr: ":8080",
		Handler: corsMiddleware(
			h2c.NewHandler(mux, &http2.Server{}),
		),
	}

	go func() {
		log.Printf("SQLite database opened at %s", dbPath)
		log.Println("ConnectRPC server listening on http://localhost:8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// 等待 SIGINT/SIGTERM 信号后执行优雅关闭（5s 超时）
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("server shutdown error: %v", err)
	}
}

// corsMiddleware 为 ConnectRPC 前端请求添加 CORS 头，处理 OPTIONS 预检
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
