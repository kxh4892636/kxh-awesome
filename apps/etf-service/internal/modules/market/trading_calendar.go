package market

import (
	"context"
	"fmt"
	"time"
)

const tradeDateLayout = "2006-01-02"

type TradingDay struct {
	Exchange  string
	TradeDate string
	IsOpen    int
}

func (s *MarketService) latestRequiredTradingDate(
	ctx context.Context,
	exchange string,
	startDate string,
	endDate string,
) (*string, error) {
	states, err := s.store.TradingDayStates(ctx, exchange, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("read trading calendar for %s: %w", exchange, err)
	}
	dates, err := listTradeDates(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("build trading date range: %w", err)
	}
	for index := len(dates) - 1; index >= 0; index-- {
		date := dates[index]
		if state, ok := states[date]; ok && state == 0 {
			continue
		}
		weekend, err := isWeekend(date)
		if err != nil {
			return nil, err
		}
		if !weekend {
			return &date, nil
		}
	}
	return nil, nil
}

func (s *MarketService) markClosedTradingDates(
	ctx context.Context,
	exchange string,
	startDate string,
	endDate string,
	bars []DailyBar,
) error {
	openDates := make(map[string]struct{}, len(bars))
	for _, bar := range bars {
		openDates[bar.TradeDate] = struct{}{}
	}
	dates, err := listTradeDates(startDate, endDate)
	if err != nil {
		return fmt.Errorf("build refreshed trading date range: %w", err)
	}
	closedDays := make([]TradingDay, 0, len(dates))
	for _, date := range dates {
		if _, ok := openDates[date]; ok {
			continue
		}
		weekend, err := isWeekend(date)
		if err != nil {
			return err
		}
		if !weekend {
			closedDays = append(closedDays, TradingDay{Exchange: exchange, TradeDate: date, IsOpen: 0})
		}
	}
	if err := s.store.UpsertTradingDays(ctx, closedDays); err != nil {
		return fmt.Errorf("cache closed trading dates for %s: %w", exchange, err)
	}
	return nil
}

func parseTradeDate(value string) (time.Time, error) {
	parsed, err := time.Parse(tradeDateLayout, value)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid trade date %q: %w", value, err)
	}
	return parsed, nil
}

func addTradeDateDays(value string, days int) (string, error) {
	parsed, err := parseTradeDate(value)
	if err != nil {
		return "", err
	}
	return parsed.AddDate(0, 0, days).Format(tradeDateLayout), nil
}

func listTradeDates(startDate string, endDate string) ([]string, error) {
	current, err := parseTradeDate(startDate)
	if err != nil {
		return nil, err
	}
	end, err := parseTradeDate(endDate)
	if err != nil {
		return nil, err
	}
	dates := make([]string, 0)
	for !current.After(end) {
		dates = append(dates, current.Format(tradeDateLayout))
		current = current.AddDate(0, 0, 1)
	}
	return dates, nil
}

func isWeekend(value string) (bool, error) {
	parsed, err := parseTradeDate(value)
	if err != nil {
		return false, err
	}
	return parsed.Weekday() == time.Saturday || parsed.Weekday() == time.Sunday, nil
}

func lastCompletedTradeDate(now time.Time) string {
	shanghai := time.FixedZone("Asia/Shanghai", 8*60*60)
	return now.In(shanghai).AddDate(0, 0, -1).Format(tradeDateLayout)
}

func laterTradeDate(left string, right string) string {
	if left >= right {
		return left
	}
	return right
}

func earlierTradeDate(left string, right string) string {
	if left <= right {
		return left
	}
	return right
}
