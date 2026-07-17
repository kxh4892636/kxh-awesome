package market

import (
	"context"
	"errors"
	"testing"
	"time"
)

var testSecurity = SupportedSecurities()[0]

var testSecurityRow = SecurityDefinition{
	Symbol:            testSecurity.Symbol,
	Name:              testSecurity.Name,
	AssetType:         testSecurity.AssetType,
	Exchange:          testSecurity.Exchange,
	Currency:          testSecurity.Currency,
	Source:            testSecurity.Source,
	EarliestTradeDate: "2013-12-31",
}

type fakeStore struct {
	bars                  []DailyBar
	latestCachedTradeDate *string
	calendar              map[string]int
	upsertDailyBarsCalls  [][]DailyBar
	upsertCalendarCalls   [][]TradingDay
	getCalendarMapCalls   int
}

func (s *fakeStore) UpsertDailyBars(_ context.Context, bars []DailyBar, _ string) error {
	s.upsertDailyBarsCalls = append(s.upsertDailyBarsCalls, bars)
	s.bars = append(s.bars, bars...)
	s.latestCachedTradeDate = nil
	return nil
}

func (s *fakeStore) UpsertTradingDays(_ context.Context, rows []TradingDay) error {
	s.upsertCalendarCalls = append(s.upsertCalendarCalls, rows)
	if s.calendar == nil {
		s.calendar = map[string]int{}
	}
	for _, row := range rows {
		s.calendar[row.TradeDate] = row.IsOpen
	}
	return nil
}

func (s *fakeStore) ListSecurityDefinitions(_ context.Context) ([]SecurityDefinition, error) {
	return []SecurityDefinition{testSecurityRow}, nil
}

func (s *fakeStore) FindSecurityDefinition(_ context.Context, symbol string) (*SecurityDefinition, error) {
	if symbol != testSecurity.Symbol {
		return nil, nil
	}
	row := testSecurityRow
	return &row, nil
}

func (s *fakeStore) LatestCachedTradeDate(_ context.Context, _ string, _ string) (*string, error) {
	if s.latestCachedTradeDate != nil {
		return s.latestCachedTradeDate, nil
	}
	var latest *string
	for _, bar := range s.bars {
		if latest == nil || bar.TradeDate > *latest {
			tradeDate := bar.TradeDate
			latest = &tradeDate
		}
	}
	return latest, nil
}

func (s *fakeStore) ListDailyBars(_ context.Context, symbol string, adjType string, startDate string, endDate string) ([]DailyBar, error) {
	var result []DailyBar
	for _, bar := range s.bars {
		if bar.Symbol == symbol && bar.AdjType == adjType && bar.TradeDate >= startDate && bar.TradeDate <= endDate {
			result = append(result, bar)
		}
	}
	return result, nil
}

func (s *fakeStore) TradingDayStates(_ context.Context, _ string, _ string, _ string) (map[string]int, error) {
	s.getCalendarMapCalls++
	if s.calendar == nil {
		return map[string]int{}, nil
	}
	return s.calendar, nil
}

type fakeFetcher struct {
	bars  []DailyBar
	calls int
}

func (f *fakeFetcher) FetchRemoteKlineBars(_ context.Context, _ string, _ string) ([]DailyBar, error) {
	f.calls++
	return f.bars, nil
}

func TestGetDailyBarsRejectsInvalidRequest(t *testing.T) {
	tests := []struct {
		name    string
		request GetDailyBarsRequest
	}{
		{
			name: "missing symbol",
			request: GetDailyBarsRequest{
				AdjType: "qfq",
			},
		},
		{
			name: "unsupported adjustment",
			request: GetDailyBarsRequest{
				Symbol:  testSecurity.Symbol,
				AdjType: "hfq",
			},
		},
		{
			name: "malformed start date",
			request: GetDailyBarsRequest{
				Symbol:    testSecurity.Symbol,
				AdjType:   "qfq",
				StartDate: strPtr("2026-02-30"),
			},
		},
		{
			name: "start after end",
			request: GetDailyBarsRequest{
				Symbol:    testSecurity.Symbol,
				AdjType:   "qfq",
				StartDate: strPtr("2026-05-30"),
				EndDate:   strPtr("2026-05-29"),
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			fetcher := &fakeFetcher{}
			service := newMarketServiceWithNow(SupportedSecurities(), &fakeStore{}, fetcher, fixedNow)

			_, err := service.GetDailyBars(context.Background(), test.request)
			if !errors.Is(err, ErrInvalidArgument) {
				t.Fatalf("error = %v, want ErrInvalidArgument", err)
			}
			if fetcher.calls != 0 {
				t.Fatalf("fetch calls = %d, want 0", fetcher.calls)
			}
		})
	}
}

func TestGetDailyBarsInvalidRangeDoesNotFetch(t *testing.T) {
	store := &fakeStore{}
	fetcher := &fakeFetcher{}
	service := newMarketServiceWithNow(SupportedSecurities(), store, fetcher, fixedNow)

	response, err := service.GetDailyBars(context.Background(), GetDailyBarsRequest{
		Symbol:    testSecurity.Symbol,
		AdjType:   "qfq",
		StartDate: strPtr("2012-01-01"),
		EndDate:   strPtr("2013-01-01"),
	})
	if err != nil {
		t.Fatalf("GetDailyBars returned error: %v", err)
	}
	if response.Meta.CacheStatus != "invalid" {
		t.Fatalf("CacheStatus = %s, want invalid", response.Meta.CacheStatus)
	}
	if response.Meta.Refreshed {
		t.Fatal("Refreshed = true, want false")
	}
	if len(response.Bars) != 0 {
		t.Fatalf("len(Bars) = %d, want 0", len(response.Bars))
	}
	if fetcher.calls != 0 {
		t.Fatalf("fetch calls = %d, want 0", fetcher.calls)
	}
	if store.getCalendarMapCalls != 0 {
		t.Fatalf("calendar calls = %d, want 0", store.getCalendarMapCalls)
	}
}

func TestGetDailyBarsReturnsCacheWhenCovered(t *testing.T) {
	latest := "2026-05-29"
	store := &fakeStore{
		bars:                  []DailyBar{createBar("2026-05-29", 101)},
		latestCachedTradeDate: &latest,
	}
	fetcher := &fakeFetcher{}
	service := newMarketServiceWithNow(SupportedSecurities(), store, fetcher, fixedNow)

	response, err := service.GetDailyBars(context.Background(), GetDailyBarsRequest{
		Symbol:    testSecurity.Symbol,
		AdjType:   "qfq",
		StartDate: strPtr("2026-05-29"),
		EndDate:   strPtr("2026-05-30"),
	})
	if err != nil {
		t.Fatalf("GetDailyBars returned error: %v", err)
	}
	if response.Meta.CacheStatus != "cache" {
		t.Fatalf("CacheStatus = %s, want cache", response.Meta.CacheStatus)
	}
	if fetcher.calls != 0 {
		t.Fatalf("fetch calls = %d, want 0", fetcher.calls)
	}
	if len(response.Bars) != 1 || response.Bars[0].TradeDate != "2026-05-29" {
		t.Fatalf("bars = %#v, want one cached bar", response.Bars)
	}
}

func TestGetDailyBarsDefaultsToQFQ(t *testing.T) {
	latest := "2026-05-29"
	store := &fakeStore{
		bars:                  []DailyBar{createBar("2026-05-29", 101)},
		latestCachedTradeDate: &latest,
	}
	service := newMarketServiceWithNow(SupportedSecurities(), store, &fakeFetcher{}, fixedNow)

	response, err := service.GetDailyBars(context.Background(), GetDailyBarsRequest{
		Symbol:    testSecurity.Symbol,
		StartDate: strPtr("2026-05-29"),
		EndDate:   strPtr("2026-05-30"),
	})
	if err != nil {
		t.Fatalf("GetDailyBars returned error: %v", err)
	}
	if len(response.Bars) != 1 || response.Bars[0].AdjType != AdjustmentQFQ {
		t.Fatalf("Bars = %#v, want qfq cache row", response.Bars)
	}
}

func TestGetDailyBarsRefreshesAndFiltersAfterTMinusOne(t *testing.T) {
	latest := "2026-05-28"
	store := &fakeStore{
		bars:                  []DailyBar{createBar("2026-05-28", 100)},
		latestCachedTradeDate: &latest,
	}
	fetcher := &fakeFetcher{
		bars: []DailyBar{
			createBar("2026-05-29", 101),
			createBar("2026-05-31", 102),
		},
	}
	service := newMarketServiceWithNow(SupportedSecurities(), store, fetcher, fixedNow)

	response, err := service.GetDailyBars(context.Background(), GetDailyBarsRequest{
		Symbol:    testSecurity.Symbol,
		AdjType:   "qfq",
		StartDate: strPtr("2026-05-28"),
		EndDate:   strPtr("2026-05-31"),
	})
	if err != nil {
		t.Fatalf("GetDailyBars returned error: %v", err)
	}
	if response.Meta.CacheStatus != "refreshed" {
		t.Fatalf("CacheStatus = %s, want refreshed", response.Meta.CacheStatus)
	}
	if response.Meta.EffectiveEndDate == nil || *response.Meta.EffectiveEndDate != "2026-05-30" {
		t.Fatalf("EffectiveEndDate = %v, want 2026-05-30", response.Meta.EffectiveEndDate)
	}
	if fetcher.calls != 1 {
		t.Fatalf("fetch calls = %d, want 1", fetcher.calls)
	}
	if len(store.upsertDailyBarsCalls) != 1 {
		t.Fatalf("upsert calls = %d, want 1", len(store.upsertDailyBarsCalls))
	}
	if got := store.upsertDailyBarsCalls[0]; len(got) != 1 || got[0].TradeDate != "2026-05-29" {
		t.Fatalf("upserted bars = %#v, want only 2026-05-29", got)
	}
	if len(response.Bars) != 2 || response.Bars[0].TradeDate != "2026-05-28" || response.Bars[1].TradeDate != "2026-05-29" {
		t.Fatalf("response bars = %#v, want cached plus refreshed bar", response.Bars)
	}
}

func TestListSecuritiesIncludesLatestCachedTradeDate(t *testing.T) {
	store := &fakeStore{bars: []DailyBar{createBar("2026-05-29", 101)}}
	service := newMarketServiceWithNow(SupportedSecurities(), store, &fakeFetcher{}, fixedNow)

	securities, err := service.ListSecurities(context.Background())
	if err != nil {
		t.Fatalf("ListSecurities returned error: %v", err)
	}
	if len(securities) != 1 {
		t.Fatalf("len(securities) = %d, want 1", len(securities))
	}
	if securities[0].Symbol != testSecurity.Symbol {
		t.Fatalf("Symbol = %s, want %s", securities[0].Symbol, testSecurity.Symbol)
	}
	if securities[0].EarliestTradeDate != "2013-12-31" {
		t.Fatalf("EarliestTradeDate = %s, want 2013-12-31", securities[0].EarliestTradeDate)
	}
	if securities[0].LatestCachedTradeDate == nil || *securities[0].LatestCachedTradeDate != "2026-05-29" {
		t.Fatalf("LatestCachedTradeDate = %v, want 2026-05-29", securities[0].LatestCachedTradeDate)
	}
}

func fixedNow() time.Time {
	return time.Date(2026, 5, 31, 12, 0, 0, 0, time.UTC)
}

func createBar(tradeDate string, closeValue float64) DailyBar {
	return DailyBar{
		Symbol:        testSecurity.Symbol,
		AdjType:       "qfq",
		TradeDate:     tradeDate,
		Open:          closeValue,
		High:          closeValue,
		Low:           closeValue,
		Close:         closeValue,
		Volume:        1,
		Amount:        10,
		ChangeAmount:  0,
		ChangePercent: 0,
		RawWeekday:    "星期五",
	}
}

func strPtr(value string) *string {
	return &value
}
