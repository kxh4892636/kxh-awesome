package app

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"connectrpc.com/connect"

	"kxh-awesome/etf-service/gen/etf/v1/etfv1connect"
	"kxh-awesome/etf-service/internal/modules/market"
)

func newEtfConnectHandler(usecase market.MarketUsecase, logger *slog.Logger) (string, http.Handler) {
	return etfv1connect.NewEtfServiceHandler(
		market.NewEtfHandler(usecase),
		connect.WithInterceptors(newConnectInterceptor(logger)),
	)
}

func newConnectInterceptor(logger *slog.Logger) connect.Interceptor {
	if logger == nil {
		logger = slog.Default()
	}
	return connect.UnaryInterceptorFunc(func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, request connect.AnyRequest) (connect.AnyResponse, error) {
			startedAt := time.Now()
			response, err := next(ctx, request)
			if err == nil {
				logger.InfoContext(ctx, "connect request completed",
					"procedure", request.Spec().Procedure,
					"code", "ok",
					"duration_ms", time.Since(startedAt).Milliseconds(),
				)
				return response, nil
			}
			mapped := mapConnectError(err)
			code := connect.CodeOf(mapped)
			logger.Log(ctx, connectLogLevel(code), "connect request failed",
				"procedure", request.Spec().Procedure,
				"code", code.String(),
				"duration_ms", time.Since(startedAt).Milliseconds(),
				"error", err.Error(),
			)
			return nil, mapped
		}
	})
}

func mapConnectError(err error) error {
	var connectErr *connect.Error
	if errors.As(err, &connectErr) {
		return err
	}
	code := connect.CodeInternal
	switch {
	case errors.Is(err, market.ErrInvalidArgument):
		code = connect.CodeInvalidArgument
	case errors.Is(err, market.ErrUnknownSecurity):
		code = connect.CodeNotFound
	case errors.Is(err, market.ErrUpstreamUnavailable):
		code = connect.CodeUnavailable
	case errors.Is(err, context.Canceled):
		code = connect.CodeCanceled
	case errors.Is(err, context.DeadlineExceeded):
		code = connect.CodeDeadlineExceeded
	}
	return connect.NewError(code, err)
}

func connectLogLevel(code connect.Code) slog.Level {
	switch code {
	case connect.CodeInvalidArgument, connect.CodeNotFound, connect.CodeCanceled, connect.CodeDeadlineExceeded:
		return slog.LevelWarn
	default:
		return slog.LevelError
	}
}
