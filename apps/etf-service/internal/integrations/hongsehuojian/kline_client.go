package hongsehuojian

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"kxh-awesome/etf-service/internal/modules/market"
)

const (
	defaultKlineEndpoint  = "https://hongsehuojian.com/fundex-quote/line/kline"
	klineCount            = "-1000"
	klinePeriod           = "day"
	maxKlineResponseBytes = 8 << 20
	requestTimeout        = 15 * time.Second
)

type HongsehuojianClient struct {
	httpClient *http.Client
	endpoint   string
	now        func() time.Time
}

func NewHongsehuojianClient(httpClient *http.Client) *HongsehuojianClient {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	protectedClient := *httpClient
	protectedClient.Timeout = requestTimeout
	return &HongsehuojianClient{
		httpClient: &protectedClient,
		endpoint:   defaultKlineEndpoint,
		now:        time.Now,
	}
}

func (c *HongsehuojianClient) FetchRemoteKlineBars(ctx context.Context, symbol string, adjType string) ([]market.DailyBar, error) {
	requestURL, err := buildKlineURL(c.endpoint, symbol, adjType, c.now())
	if err != nil {
		return nil, fmt.Errorf("%w: build hongsehuojian request: %v", market.ErrUpstreamUnavailable, err)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("%w: create hongsehuojian request: %v", market.ErrUpstreamUnavailable, err)
	}
	request.Header.Set("accept", "application/json")

	response, err := c.httpClient.Do(request)
	if err != nil {
		if ctxErr := ctx.Err(); ctxErr != nil {
			return nil, ctxErr
		}
		return nil, fmt.Errorf("%w: request hongsehuojian for %s: %v", market.ErrUpstreamUnavailable, symbol, err)
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		if err := response.Body.Close(); err != nil {
			return nil, fmt.Errorf("%w: close hongsehuojian response: %v", market.ErrUpstreamUnavailable, err)
		}
		return nil, fmt.Errorf("%w: hongsehuojian returned HTTP %d", market.ErrUpstreamUnavailable, response.StatusCode)
	}

	body, readErr := readLimitedResponse(response.Body)
	closeErr := response.Body.Close()
	if readErr != nil {
		if ctxErr := ctx.Err(); ctxErr != nil {
			return nil, ctxErr
		}
		return nil, fmt.Errorf("%w: read hongsehuojian response: %v", market.ErrUpstreamUnavailable, readErr)
	}
	if closeErr != nil {
		return nil, fmt.Errorf("%w: close hongsehuojian response: %v", market.ErrUpstreamUnavailable, closeErr)
	}
	parsed, err := ParseKlineJSON(string(body), requestURL.String(), symbol, adjType)
	if err != nil {
		return nil, fmt.Errorf("%w: parse hongsehuojian response: %v", market.ErrUpstreamUnavailable, err)
	}
	return parsed.Bars, nil
}

func readLimitedResponse(reader io.Reader) ([]byte, error) {
	body, err := io.ReadAll(io.LimitReader(reader, maxKlineResponseBytes+1))
	if err != nil {
		return nil, err
	}
	if len(body) > maxKlineResponseBytes {
		return nil, fmt.Errorf("response exceeds %d bytes", maxKlineResponseBytes)
	}
	return body, nil
}

func buildKlineURL(endpoint string, symbol string, adjType string, now time.Time) (*url.URL, error) {
	requestURL, err := url.Parse(endpoint)
	if err != nil {
		return nil, fmt.Errorf("parse endpoint: %w", err)
	}
	if requestURL.Host == "" || (requestURL.Scheme != "http" && requestURL.Scheme != "https") {
		return nil, fmt.Errorf("endpoint must be an absolute HTTP URL")
	}
	adjustment, err := toHongseAdjustment(adjType)
	if err != nil {
		return nil, err
	}
	query := requestURL.Query()
	query.Set("securityCode", symbol)
	query.Set("period", klinePeriod)
	query.Set("count", klineCount)
	query.Set("begin", strings.ReplaceAll(shanghaiDate(now), "-", ""))
	query.Set("adjust", adjustment)
	query.Set("ts", strconv.FormatInt(now.UnixMilli(), 10))
	requestURL.RawQuery = query.Encode()
	return requestURL, nil
}

func toHongseAdjustment(adjType string) (string, error) {
	if adjType != market.AdjustmentQFQ {
		return "", fmt.Errorf("unsupported adjustment %q", adjType)
	}
	return "1", nil
}

func shanghaiDate(now time.Time) string {
	location := time.FixedZone("Asia/Shanghai", 8*60*60)
	return now.In(location).Format("2006-01-02")
}
