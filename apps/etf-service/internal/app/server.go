package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"kxh-awesome/etf-service/internal/integrations/hongsehuojian"
	"kxh-awesome/etf-service/internal/modules/market"
	"kxh-awesome/etf-service/internal/shared/config"
	"kxh-awesome/etf-service/internal/shared/database"
)

const shutdownTimeout = 5 * time.Second

func Run(docsDir fs.FS, logger *slog.Logger) (resultErr error) {
	if logger == nil {
		logger = slog.Default()
	}
	loadedConfig, err := config.Load(".env")
	if err != nil {
		return fmt.Errorf("load configuration: %w", err)
	}
	databaseHandle, err := database.OpenSQLite(loadedConfig.DatabaseDSN)
	if err != nil {
		return err
	}
	sqlDatabase, err := databaseHandle.DB()
	if err != nil {
		return fmt.Errorf("get database handle: %w", err)
	}
	defer func() {
		if closeErr := sqlDatabase.Close(); closeErr != nil {
			resultErr = errors.Join(resultErr, fmt.Errorf("close database: %w", closeErr))
		}
	}()

	definitions := market.SupportedSecurities()
	store := market.NewGormStore(databaseHandle)
	if err := store.Migrate(); err != nil {
		return err
	}
	if err := store.SeedSecurities(context.Background(), definitions); err != nil {
		return err
	}
	service := market.NewMarketService(
		definitions,
		store,
		hongsehuojian.NewHongsehuojianClient(http.DefaultClient),
	)
	handler, err := newApplicationHandler(docsDir, service, logger)
	if err != nil {
		return err
	}
	server := newHTTPServer(loadedConfig.Port, handler)
	logger.Info("etf-service starting", "port", loadedConfig.Port, "database_dialect", "sqlite")
	return serveUntilSignal(server, logger)
}

func newApplicationHandler(docsDir fs.FS, usecase market.MarketUsecase, logger *slog.Logger) (http.Handler, error) {
	mux := http.NewServeMux()
	connectPath, connectHandler := newEtfConnectHandler(usecase, logger)
	mux.Handle(connectPath, connectHandler)
	mux.HandleFunc("/", healthHandler(logger))
	docsFS, err := fs.Sub(docsDir, "docs")
	if err != nil {
		return nil, fmt.Errorf("open embedded docs: %w", err)
	}
	mux.Handle("/doc/", http.StripPrefix("/doc/", http.FileServer(http.FS(docsFS))))
	// The local dashboard calls ConnectRPC from another port; h2c avoids development-only TLS setup.
	return corsMiddleware(h2c.NewHandler(mux, &http2.Server{})), nil
}

func newHTTPServer(port int, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              fmt.Sprintf(":%d", port),
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}
}

func serveUntilSignal(server *http.Server, logger *slog.Logger) error {
	serverErrors := make(chan error, 1)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(quit)
	select {
	case received := <-quit:
		logger.Info("etf-service shutdown started", "signal", received.String())
	case err := <-serverErrors:
		return fmt.Errorf("serve HTTP: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		return fmt.Errorf("shutdown HTTP server: %w", err)
	}
	logger.Info("etf-service shutdown completed")
	return nil
}

type healthResponse struct {
	Name string `json:"name"`
	OK   bool   `json:"ok"`
}

func healthHandler(logger *slog.Logger) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/" {
			http.NotFound(response, request)
			return
		}
		response.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(response).Encode(healthResponse{Name: "etf-service", OK: true}); err != nil {
			logger.ErrorContext(request.Context(), "write health response", "error", err)
		}
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("Access-Control-Allow-Origin", "*")
		response.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		response.Header().Set("Access-Control-Allow-Headers", "Content-Type, Connect-Protocol-Version")
		if request.Method == http.MethodOptions {
			response.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(response, request)
	})
}
