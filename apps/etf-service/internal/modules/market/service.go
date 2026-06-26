package market

import (
	"context"
	"fmt"
	"time"

	"kxh-awesome/etf-service/internal/shared/config"
	"kxh-awesome/etf-service/internal/shared/utils"
)

type MarketStore interface {
	UpsertDailyBars(ctx context.Context, bars []MarketBarInput, exchange string) error
	UpsertCalendarRows(ctx context.Context, rows []CalendarInput) error
	ListSecuritiesRows(ctx context.Context) ([]SecurityRecord, error)
	GetSecurityRow(ctx context.Context, symbol string) (*SecurityRecord, error)
	GetLatestCachedTradeDate(ctx context.Context, symbol string, adjType string) (*string, error)
	ListBars(ctx context.Context, symbol string, adjType string, startDate string, endDate string) ([]DailyBar, error)
	GetCalendarMap(ctx context.Context, exchange string, startDate string, endDate string) (map[string]int, error)
}

type RemoteFetcher interface {
	FetchRemoteKlineBars(ctx context.Context, security config.SecurityConfig) ([]MarketBarInput, error)
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

func (s *MarketService) ListSecurities(ctx context.Context) ([]Security, error) {
	rows, err := s.store.ListSecuritiesRows(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]Security, 0, len(rows))
	for _, row := range rows {
		latestCachedTradeDate, err := s.store.GetLatestCachedTradeDate(ctx, row.Symbol, "qfq")
		if err != nil {
			return nil, err
		}
		result = append(result, toSecurity(row, latestCachedTradeDate))
	}
	return result, nil
}

func (s *MarketService) GetDailyBars(ctx context.Context, request GetDailyBarsRequest) (*GetDailyBarsResponse, error) {
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

	// 行情源在交易日盘中可能返回未定稿数据，本地缓存只认 T-1 以保持图表口径稳定。
	tMinusOne, err := utils.TMinusOne(s.now())
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

	// 请求范围裁剪到已知历史和已完成交易日，避免返回无意义空洞或半日数据。
	effectiveStartDate := utils.Max(requestedStartDate, securityRow.EarliestTradeDate)
	effectiveEndDate := utils.Min(requestedEndDate, tMinusOne)
	latestCachedBefore, err := s.store.GetLatestCachedTradeDate(ctx, request.Symbol, request.AdjType)
	if err != nil {
		return nil, err
	}
	security := toSecurity(*securityRow, latestCachedBefore)

	if utils.Compare(effectiveEndDate, effectiveStartDate) < 0 {
		return &GetDailyBarsResponse{
			Security: security,
			Bars:     []DailyBar{},
			Meta: GetDailyBarsMeta{
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

	// 刷新判断基于最近应开市日，防止周末和节假日把缓存误判为落后。
	requiredOpenDate, err := s.getLatestRequiredOpenDate(ctx, securityConfig.Exchange, effectiveStartDate, effectiveEndDate)
	if err != nil {
		return nil, err
	}

	shouldRefresh := requiredOpenDate != nil &&
		(latestCachedBefore == nil || utils.Compare(*latestCachedBefore, *requiredOpenDate) < 0)

	if shouldRefresh {
		remoteBars, err := s.fetcher.FetchRemoteKlineBars(ctx, securityConfig)
		if err != nil {
			return nil, err
		}

		eligibleBars := make([]MarketBarInput, 0, len(remoteBars))
		for _, bar := range remoteBars {
			// 远端可能带出当天或未来占位数据，入库前再次拦截以保护缓存口径。
			if utils.Compare(bar.TradeDate, tMinusOne) <= 0 {
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
			startDate, err = utils.AddDays(*latestCachedBefore, 1)
			if err != nil {
				return nil, err
			}
		}
		// 刷新后把无 K 线的工作日记为休市，后续请求才能跳过已验证的缺口。
		if err := s.markClosedMissingDates(ctx, securityConfig.Exchange, startDate, effectiveEndDate, bars); err != nil {
			return nil, err
		}
	}

	latestCachedTradeDate, err := s.store.GetLatestCachedTradeDate(ctx, request.Symbol, request.AdjType)
	if err != nil {
		return nil, err
	}

	return &GetDailyBarsResponse{
		Security: toSecurity(*securityRow, latestCachedTradeDate),
		Bars:     bars,
		Meta: GetDailyBarsMeta{
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

	dates, err := utils.ListDates(startDate, endDate)
	if err != nil {
		return nil, err
	}

	for index := len(dates) - 1; index >= 0; index-- {
		date := dates[index]
		if value, ok := calendar[date]; ok && value == 0 {
			continue
		}
		isWeekend, err := utils.IsWeekend(date)
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

func (s *MarketService) markClosedMissingDates(ctx context.Context, exchange string, startDate string, endDate string, bars []DailyBar) error {
	openDates := map[string]struct{}{}
	for _, bar := range bars {
		openDates[bar.TradeDate] = struct{}{}
	}

	dates, err := utils.ListDates(startDate, endDate)
	if err != nil {
		return err
	}

	rows := make([]CalendarInput, 0, len(dates))
	for _, tradeDate := range dates {
		if _, ok := openDates[tradeDate]; ok {
			continue
		}
		isWeekend, err := utils.IsWeekend(tradeDate)
		if err != nil {
			return err
		}
		if isWeekend {
			continue
		}
		rows = append(rows, CalendarInput{
			Exchange:  exchange,
			TradeDate: tradeDate,
			IsOpen:    0,
		})
	}

	return s.store.UpsertCalendarRows(ctx, rows)
}

func toSecurity(row SecurityRecord, latestCachedTradeDate *string) Security {
	return Security{
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
