package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"kxh-awesome/etf-service/gen/etf/v1/etfv1connect"
	"kxh-awesome/etf-service/internal/config"
	"kxh-awesome/etf-service/internal/database"
	"kxh-awesome/etf-service/internal/integration"
	"kxh-awesome/etf-service/internal/repository"
	"kxh-awesome/etf-service/internal/rpc"
	"kxh-awesome/etf-service/internal/service"
)

//go:embed docs/*
var docsDir embed.FS

func main() {
	cfg := config.Load()
	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("get database handle: %v", err)
	}
	defer sqlDB.Close()

	marketRepository := repository.NewMarketRepository(db)
	if err := marketRepository.AutoMigrate(); err != nil {
		log.Fatalf("migrate database: %v", err)
	}
	if err := marketRepository.SeedSecurities(context.Background(), config.Securities); err != nil {
		log.Fatalf("seed securities: %v", err)
	}

	marketService := service.NewMarketService(
		config.Securities,
		marketRepository,
		integration.NewHongsehuojianClient(http.DefaultClient),
	)
	etfHandler := rpc.NewEtfHandler(marketService)

	mux := http.NewServeMux()
	mux.Handle(etfv1connect.NewEtfServiceHandler(etfHandler))
	mux.HandleFunc("/", healthHandler)

	docsFS, err := fs.Sub(docsDir, "docs")
	if err == nil {
		mux.Handle("/doc/", http.StripPrefix("/doc/", http.FileServer(http.FS(docsFS))))
	}

	server := &http.Server{
		Addr: fmt.Sprintf(":%d", cfg.Port),
		Handler: corsMiddleware(
			// 本地 dashboard 直接从浏览器调用 ConnectRPC，h2c 避免开发环境为 HTTP/2 额外配置证书。
			h2c.NewHandler(mux, &http2.Server{}),
		),
	}

	go func() {
		log.Printf("SQLite database opened at %s", cfg.DatabaseURL)
		log.Printf("ConnectRPC server listening on http://localhost:%d", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
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

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"name": "etf-service",
		"ok":   true,
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// dashboard 和 service 通常分端口启动，预检请求必须先放行才能进入 ConnectRPC handler。
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
