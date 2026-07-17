package app

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"

	etfv1 "kxh-awesome/etf-service/gen/etf/v1"
	"kxh-awesome/etf-service/gen/etf/v1/etfv1connect"
	"kxh-awesome/etf-service/internal/modules/market"
)

type failingMarketUsecase struct {
	err error
}

func (f failingMarketUsecase) ListSecurities(context.Context) ([]market.Security, error) {
	return nil, f.err
}

func (f failingMarketUsecase) GetDailyBars(context.Context, market.GetDailyBarsRequest) (*market.GetDailyBarsResponse, error) {
	return nil, f.err
}

func TestConnectInterceptorMapsAndLogsErrors(t *testing.T) {
	tests := []struct {
		name       string
		serviceErr error
		wantCode   connect.Code
		wantLevel  string
	}{
		{name: "invalid argument", serviceErr: market.ErrInvalidArgument, wantCode: connect.CodeInvalidArgument, wantLevel: "WARN"},
		{name: "unknown security", serviceErr: market.ErrUnknownSecurity, wantCode: connect.CodeNotFound, wantLevel: "WARN"},
		{name: "canceled", serviceErr: context.Canceled, wantCode: connect.CodeCanceled, wantLevel: "WARN"},
		{name: "deadline", serviceErr: context.DeadlineExceeded, wantCode: connect.CodeDeadlineExceeded, wantLevel: "WARN"},
		{name: "upstream", serviceErr: market.ErrUpstreamUnavailable, wantCode: connect.CodeUnavailable, wantLevel: "ERROR"},
		{
			name:       "upstream timeout",
			serviceErr: errors.Join(market.ErrUpstreamUnavailable, context.DeadlineExceeded),
			wantCode:   connect.CodeUnavailable,
			wantLevel:  "ERROR",
		},
		{name: "internal", serviceErr: errors.New("database failed"), wantCode: connect.CodeInternal, wantLevel: "ERROR"},
		{
			name:       "existing connect code",
			serviceErr: connect.NewError(connect.CodeAlreadyExists, errors.New("exists")),
			wantCode:   connect.CodeAlreadyExists,
			wantLevel:  "ERROR",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var logs bytes.Buffer
			logger := slog.New(slog.NewJSONHandler(&logs, nil))
			path, handler := newEtfConnectHandler(failingMarketUsecase{err: test.serviceErr}, logger)
			mux := http.NewServeMux()
			mux.Handle(path, handler)
			server := httptest.NewServer(mux)
			defer server.Close()

			client := etfv1connect.NewEtfServiceClient(server.Client(), server.URL)
			_, err := client.GetDailyBars(context.Background(), connect.NewRequest(&etfv1.GetDailyBarsRequest{}))
			if connect.CodeOf(err) != test.wantCode {
				t.Fatalf("code = %s, want %s", connect.CodeOf(err), test.wantCode)
			}
			assertErrorLog(t, logs.Bytes(), test.wantLevel, test.wantCode.String())
		})
	}
}

func assertErrorLog(t *testing.T, encoded []byte, wantLevel string, wantCode string) {
	t.Helper()
	var entry map[string]any
	if err := json.Unmarshal(encoded, &entry); err != nil {
		t.Fatalf("decode log %q: %v", encoded, err)
	}
	if entry["level"] != wantLevel {
		t.Fatalf("level = %v, want %s", entry["level"], wantLevel)
	}
	if entry["code"] != wantCode {
		t.Fatalf("code = %v, want %s", entry["code"], wantCode)
	}
	if entry["procedure"] == "" || entry["duration_ms"] == nil {
		t.Fatalf("log entry missing core fields: %#v", entry)
	}
}
