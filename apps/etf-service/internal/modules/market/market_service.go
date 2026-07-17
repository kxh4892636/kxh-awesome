package market

import (
	"context"
	"time"
)

type MarketStore interface {
	UpsertDailyBars(ctx context.Context, bars []DailyBar, exchange string) error
	UpsertTradingDays(ctx context.Context, days []TradingDay) error
	ListSecurityDefinitions(ctx context.Context) ([]SecurityDefinition, error)
	FindSecurityDefinition(ctx context.Context, symbol string) (*SecurityDefinition, error)
	LatestCachedTradeDate(ctx context.Context, symbol string, adjType string) (*string, error)
	ListDailyBars(ctx context.Context, symbol string, adjType string, startDate string, endDate string) ([]DailyBar, error)
	TradingDayStates(ctx context.Context, exchange string, startDate string, endDate string) (map[string]int, error)
}

type RemoteFetcher interface {
	FetchRemoteKlineBars(ctx context.Context, symbol string, adjType string) ([]DailyBar, error)
}

type MarketService struct {
	securities []SecurityDefinition
	store      MarketStore
	fetcher    RemoteFetcher
	now        func() time.Time
}

func NewMarketService(securities []SecurityDefinition, store MarketStore, fetcher RemoteFetcher) *MarketService {
	return newMarketServiceWithNow(securities, store, fetcher, time.Now)
}

func newMarketServiceWithNow(
	securities []SecurityDefinition,
	store MarketStore,
	fetcher RemoteFetcher,
	now func() time.Time,
) *MarketService {
	return &MarketService{
		securities: append([]SecurityDefinition(nil), securities...),
		store:      store,
		fetcher:    fetcher,
		now:        now,
	}
}
