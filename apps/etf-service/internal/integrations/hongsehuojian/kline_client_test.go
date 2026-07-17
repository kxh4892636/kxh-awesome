package hongsehuojian

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"kxh-awesome/etf-service/internal/modules/market"
)

func TestFetchRemoteKlineBarsUsesHongsehuojianProtocol(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		query := request.URL.Query()
		assertQueryValue(t, query.Get("securityCode"), "932315.CSI")
		assertQueryValue(t, query.Get("period"), "day")
		assertQueryValue(t, query.Get("count"), "-1000")
		assertQueryValue(t, query.Get("adjust"), "1")
		assertQueryValue(t, query.Get("begin"), "20260601")
		response.Header().Set("Content-Type", "application/json")
		if _, err := io.WriteString(response, `{"columns":"tradeDate,open,high,low,close","items":"2026-05-29,100,101,99,100.5"}`); err != nil {
			t.Errorf("write response: %v", err)
		}
	}))
	defer server.Close()

	client := newTestClient(server.Client(), server.URL)
	bars, err := client.FetchRemoteKlineBars(context.Background(), "932315.CSI", market.AdjustmentQFQ)
	if err != nil {
		t.Fatalf("FetchRemoteKlineBars returned error: %v", err)
	}
	if len(bars) != 1 || bars[0].TradeDate != "2026-05-29" {
		t.Fatalf("bars = %#v, want one parsed bar", bars)
	}
}

func TestFetchRemoteKlineBarsClassifiesUpstreamFailures(t *testing.T) {
	tests := []struct {
		name    string
		handler func(*testing.T) http.Handler
		client  func(*httptest.Server) *HongsehuojianClient
	}{
		{
			name: "non-success status",
			handler: func(*testing.T) http.Handler {
				return http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
					response.WriteHeader(http.StatusBadGateway)
				})
			},
			client: func(server *httptest.Server) *HongsehuojianClient {
				return newTestClient(server.Client(), server.URL)
			},
		},
		{
			name: "response exceeds limit",
			handler: func(t *testing.T) http.Handler {
				return http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
					if _, err := io.WriteString(response, strings.Repeat("x", maxKlineResponseBytes+1)); err != nil {
						t.Errorf("write oversized response: %v", err)
					}
				})
			},
			client: func(server *httptest.Server) *HongsehuojianClient {
				return newTestClient(server.Client(), server.URL)
			},
		},
		{
			name: "request times out",
			handler: func(*testing.T) http.Handler {
				return http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
					time.Sleep(100 * time.Millisecond)
					response.WriteHeader(http.StatusOK)
				})
			},
			client: func(server *httptest.Server) *HongsehuojianClient {
				httpClient := server.Client()
				httpClient.Timeout = 20 * time.Millisecond
				return newTestClient(httpClient, server.URL)
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(test.handler(t))
			defer server.Close()

			_, err := test.client(server).FetchRemoteKlineBars(context.Background(), "932315.CSI", market.AdjustmentQFQ)
			if !errors.Is(err, market.ErrUpstreamUnavailable) {
				t.Fatalf("error = %v, want ErrUpstreamUnavailable", err)
			}
			if errors.Is(err, context.DeadlineExceeded) {
				t.Fatalf("error = %v, must not expose client timeout as caller deadline", err)
			}
		})
	}
}

func TestFetchRemoteKlineBarsPreservesCallerDeadline(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, _ *http.Request) {
		time.Sleep(100 * time.Millisecond)
		response.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	_, err := newTestClient(server.Client(), server.URL).FetchRemoteKlineBars(ctx, "932315.CSI", market.AdjustmentQFQ)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("error = %v, want caller deadline", err)
	}
	if errors.Is(err, market.ErrUpstreamUnavailable) {
		t.Fatalf("error = %v, caller deadline must not be classified as upstream", err)
	}
}

func TestNewHongsehuojianClientUsesFixedTimeout(t *testing.T) {
	client := NewHongsehuojianClient(&http.Client{Timeout: time.Second})
	if client.httpClient.Timeout != requestTimeout {
		t.Fatalf("timeout = %s, want %s", client.httpClient.Timeout, requestTimeout)
	}
}

func newTestClient(httpClient *http.Client, endpoint string) *HongsehuojianClient {
	return &HongsehuojianClient{
		httpClient: httpClient,
		endpoint:   endpoint,
		now: func() time.Time {
			return time.Date(2026, 6, 1, 8, 0, 0, 0, time.FixedZone("CST", 8*60*60))
		},
	}
}

func assertQueryValue(t *testing.T, actual string, expected string) {
	t.Helper()
	if actual != expected {
		t.Fatalf("query value = %q, want %q", actual, expected)
	}
}
