package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"kxh-awesome/etf-service/internal/config"
	"kxh-awesome/etf-service/internal/domain"
	"kxh-awesome/etf-service/internal/marketdata"
)

var ErrUnknownSecurity = errors.New("unknown security")

type MarketStore interface {
	UpsertDailyBars(ctx context.Context, bars []domain.MarketBarInput, exchange string) error
	UpsertCalendarRows(ctx context.Context, rows []domain.CalendarInput) error
	ListSecuritiesRows(ctx context.Context) ([]domain.SecurityRecord, error)
	GetSecurityRow(ctx context.Context, symbol string) (*domain.SecurityRecord, error)
	GetLatestCachedTradeDate(ctx context.Context, symbol string, adjType string) (*string, error)
	ListBars(ctx context.Context, symbol string, adjType string, startDate string, endDate string) ([]domain.DailyBar, error)
	GetCalendarMap(ctx context.Context, exchange string, startDate string, endDate string) (map[string]int, error)
}

type RemoteFetcher interface {
	FetchRemoteKlineBars(ctx context.Context, security config.SecurityConfig) (*marketdata.ParsedKlineData, error)
}

type MarketService struct {
	securities []config.SecurityConfig
	store      MarketStore
	fetcher    RemoteFetcher
	now        func() time.Time
}

func NewMarketService(securities []config.SecurityConfig, store MarketStore, fetcher RemoteFetcher) *MarketService {
	return &MarketService{
		securities: securities,
		store:      store,
		fetcher:    fetcher,
		now:        time.Now,
	}
}

func NewMarketServiceWithNow(securities []config.SecurityConfig, store MarketStore, fetcher RemoteFetcher, now func() time.Time) *MarketService {
	service := NewMarketService(securities, store, fetcher)
	service.now = now
	return service
}

func (s *MarketService) ListSecurities(ctx context.Context) ([]domain.Security, error) {
	rows, err := s.store.ListSecuritiesRows(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]domain.Security, 0, len(rows))
	for _, row := range rows {
		latestCachedTradeDate, err := s.store.GetLatestCachedTradeDate(ctx, row.Symbol, "qfq")
		if err != nil {
			return nil, err
		}
		result = append(result, toSecurity(row, latestCachedTradeDate))
	}
	return result, nil
}

func (s *MarketService) GetDailyBars(ctx context.Context, request domain.GetDailyBarsRequest) (*domain.GetDailyBarsResponse, error) {
	if request.AdjType == "" {
		request.AdjType = "qfq"
	}

	securityConfig, ok := s.findSecurityConfig(request.Symbol)
	if !ok {
		return nil, fmt.Errorf("%w: %s", ErrUnknownSecurity, request.Symbol)
	}

	securityRow, err := s.store.GetSecurityRow(ctx, request.Symbol)
	if err != nil {
		return nil, err
	}
	if securityRow == nil {
		return nil, fmt.Errorf("%w: %s", ErrUnknownSecurity, request.Symbol)
	}

	tMinusOne, err := marketdata.TMinusOne(s.now())
	if err != nil {
		return nil, err
	}

	requestedStartDate := securityRow.EarliestTradeDate
	if request.StartDate != nil {
		requestedStartDate = *request.StartDate
	}
	requestedEndDate := tMinusOne
	if request.EndDate != nil {
		requestedEndDate = *request.EndDate
	}

	effectiveStartDate := marketdata.Max(requestedStartDate, securityRow.EarliestTradeDate)
	effectiveEndDate := marketdata.Min(requestedEndDate, tMinusOne)
	latestCachedBefore, err := s.store.GetLatestCachedTradeDate(ctx, request.Symbol, request.AdjType)
	if err != nil {
		return nil, err
	}
	security := toSecurity(*securityRow, latestCachedBefore)

	if marketdata.Compare(effectiveEndDate, effectiveStartDate) < 0 {
		return &domain.GetDailyBarsResponse{
			Security: security,
			Bars:     []domain.DailyBar{},
			Meta: domain.GetDailyBarsMeta{
				CacheStatus:           "invalid",
				RequestedStartDate:    &requestedStartDate,
				RequestedEndDate:      &requestedEndDate,
				EffectiveStartDate:    nil,
				EffectiveEndDate:      nil,
				EarliestTradeDate:     securityRow.EarliestTradeDate,
				LatestCachedTradeDate: latestCachedBefore,
				Refreshed:             false,
				Rows:                  0,
			},
		}, nil
	}

	requiredOpenDate, err := s.getLatestRequiredOpenDate(ctx, securityConfig.Exchange, effectiveStartDate, effectiveEndDate)
	if err != nil {
		return nil, err
	}

	shouldRefresh := requiredOpenDate != nil &&
		(latestCachedBefore == nil || marketdata.Compare(*latestCachedBefore, *requiredOpenDate) < 0)

	if shouldRefresh {
		parsed, err := s.fetcher.FetchRemoteKlineBars(ctx, securityConfig)
		if err != nil {
			return nil, err
		}

		eligibleBars := make([]domain.MarketBarInput, 0, len(parsed.Bars))
		for _, bar := range parsed.Bars {
			if marketdata.Compare(bar.TradeDate, tMinusOne) <= 0 {
				eligibleBars = append(eligibleBars, bar)
			}
		}
		if err := s.store.UpsertDailyBars(ctx, eligibleBars, securityConfig.Exchange); err != nil {
			return nil, err
		}
	}

	bars, err := s.store.ListBars(ctx, request.Symbol, request.AdjType, effectiveStartDate, effectiveEndDate)
	if err != nil {
		return nil, err
	}

	if shouldRefresh {
		startDate := effectiveStartDate
		if latestCachedBefore != nil {
			startDate, err = marketdata.AddDays(*latestCachedBefore, 1)
			if err != nil {
				return nil, err
			}
		}
		if err := s.markClosedMissingDates(ctx, securityConfig.Exchange, startDate, effectiveEndDate, bars); err != nil {
			return nil, err
		}
	}

	latestCachedTradeDate, err := s.store.GetLatestCachedTradeDate(ctx, request.Symbol, request.AdjType)
	if err != nil {
		return nil, err
	}

	return &domain.GetDailyBarsResponse{
		Security: toSecurity(*securityRow, latestCachedTradeDate),
		Bars:     bars,
		Meta: domain.GetDailyBarsMeta{
			CacheStatus:           cacheStatus(shouldRefresh),
			RequestedStartDate:    &requestedStartDate,
			RequestedEndDate:      &requestedEndDate,
			EffectiveStartDate:    &effectiveStartDate,
			EffectiveEndDate:      &effectiveEndDate,
			EarliestTradeDate:     securityRow.EarliestTradeDate,
			LatestCachedTradeDate: latestCachedTradeDate,
			Refreshed:             shouldRefresh,
			Rows:                  int32(len(bars)),
		},
	}, nil
}

func (s *MarketService) findSecurityConfig(symbol string) (config.SecurityConfig, bool) {
	for _, security := range s.securities {
		if security.Symbol == symbol {
			return security, true
		}
	}
	return config.SecurityConfig{}, false
}

func (s *MarketService) getLatestRequiredOpenDate(ctx context.Context, exchange string, startDate string, endDate string) (*string, error) {
	calendar, err := s.store.GetCalendarMap(ctx, exchange, startDate, endDate)
	if err != nil {
		return nil, err
	}

	dates, err := marketdata.ListDates(startDate, endDate)
	if err != nil {
		return nil, err
	}

	for index := len(dates) - 1; index >= 0; index-- {
		date := dates[index]
		if value, ok := calendar[date]; ok && value == 0 {
			continue
		}
		isWeekend, err := marketdata.IsWeekend(date)
		if err != nil {
			return nil, err
		}
		if isWeekend {
			continue
		}
		return &date, nil
	}
	return nil, nil
}

func (s *MarketService) markClosedMissingDates(ctx context.Context, exchange string, startDate string, endDate string, bars []domain.DailyBar) error {
	openDates := map[string]struct{}{}
	for _, bar := range bars {
		openDates[bar.TradeDate] = struct{}{}
	}

	dates, err := marketdata.ListDates(startDate, endDate)
	if err != nil {
		return err
	}

	rows := make([]domain.CalendarInput, 0, len(dates))
	for _, tradeDate := range dates {
		if _, ok := openDates[tradeDate]; ok {
			continue
		}
		isWeekend, err := marketdata.IsWeekend(tradeDate)
		if err != nil {
			return err
		}
		if isWeekend {
			continue
		}
		rows = append(rows, domain.CalendarInput{
			Exchange:  exchange,
			TradeDate: tradeDate,
			IsOpen:    0,
		})
	}

	return s.store.UpsertCalendarRows(ctx, rows)
}

func toSecurity(row domain.SecurityRecord, latestCachedTradeDate *string) domain.Security {
	return domain.Security{
		Symbol:                row.Symbol,
		Name:                  row.Name,
		AssetType:             row.AssetType,
		Exchange:              row.Exchange,
		Currency:              row.Currency,
		Source:                row.Source,
		EarliestTradeDate:     row.EarliestTradeDate,
		LatestCachedTradeDate: latestCachedTradeDate,
	}
}

func cacheStatus(refreshed bool) string {
	if refreshed {
		return "refreshed"
	}
	return "cache"
}
