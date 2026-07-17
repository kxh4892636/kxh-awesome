package market

import (
	"context"
	"fmt"
	"time"
)

type DailyBar struct {
	Symbol        string
	AdjType       string
	TradeDate     string
	Open          float64
	High          float64
	Low           float64
	Close         float64
	Volume        float64
	Amount        float64
	ChangeAmount  float64
	ChangePercent float64
	RawWeekday    string
}

type GetDailyBarsRequest struct {
	Symbol    string
	AdjType   string
	StartDate *string
	EndDate   *string
}

type GetDailyBarsResponse struct {
	Security Security
	Bars     []DailyBar
	Meta     GetDailyBarsMeta
}

type GetDailyBarsMeta struct {
	CacheStatus           string
	RequestedStartDate    *string
	RequestedEndDate      *string
	EffectiveStartDate    *string
	EffectiveEndDate      *string
	EarliestTradeDate     string
	LatestCachedTradeDate *string
	Refreshed             bool
	Rows                  int32
}

type dailyBarRange struct {
	requestedStart string
	requestedEnd   string
	effectiveStart string
	effectiveEnd   string
	lastCompleted  string
	valid          bool
}

func (s *MarketService) GetDailyBars(ctx context.Context, request GetDailyBarsRequest) (*GetDailyBarsResponse, error) {
	request, err := normalizeGetDailyBarsRequest(request)
	if err != nil {
		return nil, err
	}
	configured, ok := s.findSupportedSecurity(request.Symbol)
	if !ok {
		return nil, fmt.Errorf("%w: %s", ErrUnknownSecurity, request.Symbol)
	}
	stored, err := s.store.FindSecurityDefinition(ctx, request.Symbol)
	if err != nil {
		return nil, fmt.Errorf("find security %s: %w", request.Symbol, err)
	}
	if stored == nil {
		return nil, fmt.Errorf("%w: %s", ErrUnknownSecurity, request.Symbol)
	}
	bounds := resolveDailyBarRange(request, *stored, s.now())
	latestBefore, err := s.store.LatestCachedTradeDate(ctx, request.Symbol, request.AdjType)
	if err != nil {
		return nil, fmt.Errorf("read latest cached date for %s: %w", request.Symbol, err)
	}
	if !bounds.valid {
		return invalidDailyBarsResponse(*stored, latestBefore, bounds), nil
	}

	requiredDate, err := s.latestRequiredTradingDate(ctx, configured.Exchange, bounds.effectiveStart, bounds.effectiveEnd)
	if err != nil {
		return nil, err
	}
	refreshed := requiredDate != nil && (latestBefore == nil || *latestBefore < *requiredDate)
	if refreshed {
		if err := s.refreshDailyBars(ctx, configured, request.AdjType, bounds.lastCompleted); err != nil {
			return nil, err
		}
	}
	bars, err := s.store.ListDailyBars(ctx, request.Symbol, request.AdjType, bounds.effectiveStart, bounds.effectiveEnd)
	if err != nil {
		return nil, fmt.Errorf("list daily bars for %s: %w", request.Symbol, err)
	}
	if refreshed {
		startDate := bounds.effectiveStart
		if latestBefore != nil {
			startDate, err = addTradeDateDays(*latestBefore, 1)
			if err != nil {
				return nil, fmt.Errorf("advance latest cached date: %w", err)
			}
		}
		if err := s.markClosedTradingDates(ctx, configured.Exchange, startDate, bounds.effectiveEnd, bars); err != nil {
			return nil, err
		}
	}
	latestAfter, err := s.store.LatestCachedTradeDate(ctx, request.Symbol, request.AdjType)
	if err != nil {
		return nil, fmt.Errorf("read refreshed cache date for %s: %w", request.Symbol, err)
	}
	return dailyBarsResponse(*stored, latestAfter, bars, bounds, refreshed), nil
}

func resolveDailyBarRange(request GetDailyBarsRequest, security SecurityDefinition, now time.Time) dailyBarRange {
	lastCompleted := lastCompletedTradeDate(now)
	requestedStart := security.EarliestTradeDate
	if request.StartDate != nil {
		requestedStart = *request.StartDate
	}
	requestedEnd := lastCompleted
	if request.EndDate != nil {
		requestedEnd = *request.EndDate
	}
	effectiveStart := laterTradeDate(requestedStart, security.EarliestTradeDate)
	effectiveEnd := earlierTradeDate(requestedEnd, lastCompleted)
	return dailyBarRange{
		requestedStart: requestedStart,
		requestedEnd:   requestedEnd,
		effectiveStart: effectiveStart,
		effectiveEnd:   effectiveEnd,
		lastCompleted:  lastCompleted,
		valid:          effectiveStart <= effectiveEnd,
	}
}

func (s *MarketService) refreshDailyBars(
	ctx context.Context,
	security SecurityDefinition,
	adjType string,
	lastCompleted string,
) error {
	remoteBars, err := s.fetcher.FetchRemoteKlineBars(ctx, security.Symbol, adjType)
	if err != nil {
		return err
	}
	eligible := make([]DailyBar, 0, len(remoteBars))
	for _, bar := range remoteBars {
		if bar.Symbol != security.Symbol || bar.AdjType != adjType {
			return fmt.Errorf("%w: mismatched bar identity for %s", ErrUpstreamUnavailable, security.Symbol)
		}
		if _, err := parseTradeDate(bar.TradeDate); err != nil {
			return fmt.Errorf("%w: invalid remote trade date %q", ErrUpstreamUnavailable, bar.TradeDate)
		}
		if bar.TradeDate <= lastCompleted {
			eligible = append(eligible, bar)
		}
	}
	if err := s.store.UpsertDailyBars(ctx, eligible, security.Exchange); err != nil {
		return fmt.Errorf("cache daily bars for %s: %w", security.Symbol, err)
	}
	return nil
}

func invalidDailyBarsResponse(
	security SecurityDefinition,
	latest *string,
	bounds dailyBarRange,
) *GetDailyBarsResponse {
	return &GetDailyBarsResponse{
		Security: toSecurity(security, latest),
		Bars:     []DailyBar{},
		Meta: GetDailyBarsMeta{
			CacheStatus:           "invalid",
			RequestedStartDate:    &bounds.requestedStart,
			RequestedEndDate:      &bounds.requestedEnd,
			EarliestTradeDate:     security.EarliestTradeDate,
			LatestCachedTradeDate: latest,
		},
	}
}

func dailyBarsResponse(
	security SecurityDefinition,
	latest *string,
	bars []DailyBar,
	bounds dailyBarRange,
	refreshed bool,
) *GetDailyBarsResponse {
	return &GetDailyBarsResponse{
		Security: toSecurity(security, latest),
		Bars:     bars,
		Meta: GetDailyBarsMeta{
			CacheStatus:           cacheStatus(refreshed),
			RequestedStartDate:    &bounds.requestedStart,
			RequestedEndDate:      &bounds.requestedEnd,
			EffectiveStartDate:    &bounds.effectiveStart,
			EffectiveEndDate:      &bounds.effectiveEnd,
			EarliestTradeDate:     security.EarliestTradeDate,
			LatestCachedTradeDate: latest,
			Refreshed:             refreshed,
			Rows:                  int32(len(bars)),
		},
	}
}

func cacheStatus(refreshed bool) string {
	if refreshed {
		return "refreshed"
	}
	return "cache"
}
