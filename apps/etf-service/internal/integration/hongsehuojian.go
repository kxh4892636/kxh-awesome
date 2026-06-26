package integration

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"kxh-awesome/etf-service/internal/config"
	"kxh-awesome/etf-service/internal/marketdata"
)

type HongsehuojianClient struct {
	httpClient *http.Client
}

func NewHongsehuojianClient(httpClient *http.Client) *HongsehuojianClient {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &HongsehuojianClient{httpClient: httpClient}
}

func (c *HongsehuojianClient) FetchRemoteKlineBars(ctx context.Context, security config.SecurityConfig) (*marketdata.ParsedKlineData, error) {
	requestURL := BuildKlineURL(security, time.Now())
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL.String(), nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("accept", "application/json")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("%s 下载失败: HTTP %d %s", security.Name, response.StatusCode, response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return marketdata.ParseKlineJSON(string(body), requestURL.String(), security.Symbol, security.AdjType)
}

func BuildKlineURL(security config.SecurityConfig, now time.Time) *url.URL {
	requestURL, _ := url.Parse(config.KlineEndpoint)
	today := marketdata.ShanghaiToday(now)
	query := url.Values{}
	query.Set("securityCode", security.Symbol)
	query.Set("period", config.PeriodDay)
	query.Set("count", config.KlineCount)
	query.Set("begin", marketdata.ToURLDate(today))
	query.Set("adjust", security.Adjust)
	query.Set("ts", strconv.FormatInt(now.UnixMilli(), 10))
	requestURL.RawQuery = query.Encode()
	return requestURL
}
