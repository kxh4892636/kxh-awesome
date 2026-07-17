package market

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const insertChunkSize = 250

type GormStore struct {
	db *gorm.DB
}

func NewGormStore(db *gorm.DB) *GormStore {
	return &GormStore{db: db}
}

func (s *GormStore) Migrate() error {
	if err := s.db.AutoMigrate(&securityModel{}, &dailyBarModel{}, &tradingDayModel{}); err != nil {
		return fmt.Errorf("migrate market tables: %w", err)
	}
	return nil
}

func (s *GormStore) SeedSecurities(ctx context.Context, definitions []SecurityDefinition) error {
	err := s.db.WithContext(ctx).Transaction(func(transaction *gorm.DB) error {
		transactionStore := &GormStore{db: transaction}
		for _, definition := range definitions {
			if err := transactionStore.upsertSecurity(ctx, definition); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("seed securities: %w", err)
	}
	return nil
}

func (s *GormStore) upsertSecurity(ctx context.Context, definition SecurityDefinition) error {
	row := securityModel{
		Symbol:            definition.Symbol,
		Name:              definition.Name,
		AssetType:         definition.AssetType,
		Exchange:          optionalString(definition.Exchange),
		Currency:          definition.Currency,
		Source:            optionalString(definition.Source),
		EarliestTradeDate: definition.EarliestTradeDate,
	}
	err := s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "symbol"}},
		DoUpdates: clause.Assignments(map[string]any{
			"name": row.Name, "asset_type": row.AssetType, "exchange": row.Exchange,
			"currency": row.Currency, "source": row.Source,
			"earliest_trade_date": row.EarliestTradeDate,
			"updated_at":          gorm.Expr("CURRENT_TIMESTAMP"),
		}),
	}).Create(&row).Error
	if err != nil {
		return fmt.Errorf("upsert security %s: %w", definition.Symbol, err)
	}
	return nil
}

func (s *GormStore) UpsertDailyBars(ctx context.Context, bars []DailyBar, exchange string) error {
	if len(bars) == 0 {
		return nil
	}
	err := s.db.WithContext(ctx).Transaction(func(transaction *gorm.DB) error {
		transactionStore := &GormStore{db: transaction}
		if err := transactionStore.insertDailyBars(ctx, bars); err != nil {
			return err
		}
		return transactionStore.upsertTradingDays(ctx, openTradingDays(exchange, bars))
	})
	if err != nil {
		return fmt.Errorf("upsert daily bars: %w", err)
	}
	return nil
}

func (s *GormStore) insertDailyBars(ctx context.Context, bars []DailyBar) error {
	for _, values := range chunk(bars, insertChunkSize) {
		rows := make([]dailyBarModel, 0, len(values))
		for _, bar := range values {
			rows = append(rows, toDailyBarModel(bar))
		}
		err := s.db.WithContext(ctx).Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "symbol"}, {Name: "adj_type"}, {Name: "trade_date"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"open", "high", "low", "close", "volume", "amount",
				"change_amount", "change_percent", "raw_weekday",
			}),
		}).Create(&rows).Error
		if err != nil {
			return fmt.Errorf("write daily bar chunk: %w", err)
		}
	}
	return nil
}

func openTradingDays(exchange string, bars []DailyBar) []TradingDay {
	seen := make(map[string]struct{}, len(bars))
	days := make([]TradingDay, 0, len(bars))
	for _, bar := range bars {
		if _, ok := seen[bar.TradeDate]; ok {
			continue
		}
		seen[bar.TradeDate] = struct{}{}
		days = append(days, TradingDay{Exchange: exchange, TradeDate: bar.TradeDate, IsOpen: 1})
	}
	return days
}

func (s *GormStore) UpsertTradingDays(ctx context.Context, days []TradingDay) error {
	if len(days) == 0 {
		return nil
	}
	err := s.db.WithContext(ctx).Transaction(func(transaction *gorm.DB) error {
		return (&GormStore{db: transaction}).upsertTradingDays(ctx, days)
	})
	if err != nil {
		return fmt.Errorf("upsert trading days: %w", err)
	}
	return nil
}

func (s *GormStore) upsertTradingDays(ctx context.Context, days []TradingDay) error {
	for _, values := range chunk(days, insertChunkSize) {
		rows := make([]tradingDayModel, 0, len(values))
		for _, day := range values {
			rows = append(rows, tradingDayModel{
				Exchange: day.Exchange, TradeDate: day.TradeDate, IsOpen: day.IsOpen,
			})
		}
		err := s.db.WithContext(ctx).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "exchange"}, {Name: "trade_date"}},
			DoUpdates: clause.AssignmentColumns([]string{"is_open"}),
		}).Create(&rows).Error
		if err != nil {
			return fmt.Errorf("write trading day chunk: %w", err)
		}
	}
	return nil
}

func (s *GormStore) ListSecurityDefinitions(ctx context.Context) ([]SecurityDefinition, error) {
	var rows []securityModel
	if err := s.db.WithContext(ctx).Order("symbol ASC").Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("query securities: %w", err)
	}
	definitions := make([]SecurityDefinition, 0, len(rows))
	for _, row := range rows {
		definitions = append(definitions, toSecurityDefinition(row))
	}
	return definitions, nil
}

func (s *GormStore) FindSecurityDefinition(ctx context.Context, symbol string) (*SecurityDefinition, error) {
	var row securityModel
	err := s.db.WithContext(ctx).Where("symbol = ?", symbol).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query security %s: %w", symbol, err)
	}
	definition := toSecurityDefinition(row)
	return &definition, nil
}

func (s *GormStore) LatestCachedTradeDate(ctx context.Context, symbol string, adjType string) (*string, error) {
	var row dailyBarModel
	err := s.db.WithContext(ctx).
		Where("symbol = ? AND adj_type = ?", symbol, adjType).
		Order("trade_date DESC").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query latest cached date for %s: %w", symbol, err)
	}
	return &row.TradeDate, nil
}

func (s *GormStore) ListDailyBars(
	ctx context.Context,
	symbol string,
	adjType string,
	startDate string,
	endDate string,
) ([]DailyBar, error) {
	var rows []dailyBarModel
	err := s.db.WithContext(ctx).
		Where("symbol = ? AND adj_type = ? AND trade_date >= ? AND trade_date <= ?", symbol, adjType, startDate, endDate).
		Order("trade_date ASC").Find(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("query daily bars for %s: %w", symbol, err)
	}
	bars := make([]DailyBar, 0, len(rows))
	for _, row := range rows {
		bars = append(bars, toDailyBar(row))
	}
	return bars, nil
}

func (s *GormStore) TradingDayStates(
	ctx context.Context,
	exchange string,
	startDate string,
	endDate string,
) (map[string]int, error) {
	var rows []tradingDayModel
	err := s.db.WithContext(ctx).
		Where("exchange = ? AND trade_date >= ? AND trade_date <= ?", exchange, startDate, endDate).
		Find(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("query trading days for %s: %w", exchange, err)
	}
	states := make(map[string]int, len(rows))
	for _, row := range rows {
		states[row.TradeDate] = row.IsOpen
	}
	return states, nil
}

func toSecurityDefinition(row securityModel) SecurityDefinition {
	return SecurityDefinition{
		Symbol: row.Symbol, Name: row.Name, AssetType: row.AssetType,
		Exchange: valueOrEmpty(row.Exchange), Currency: row.Currency,
		Source: valueOrEmpty(row.Source), EarliestTradeDate: row.EarliestTradeDate,
	}
}

func toDailyBar(row dailyBarModel) DailyBar {
	return DailyBar{
		Symbol: row.Symbol, AdjType: row.AdjType, TradeDate: row.TradeDate,
		Open: row.Open, High: row.High, Low: row.Low, Close: row.Close,
		Volume: valueOrZero(row.Volume), Amount: valueOrZero(row.Amount),
		ChangeAmount:  valueOrZero(row.ChangeAmount),
		ChangePercent: valueOrZero(row.ChangePercent), RawWeekday: valueOrEmpty(row.RawWeekday),
	}
}

func toDailyBarModel(bar DailyBar) dailyBarModel {
	return dailyBarModel{
		Symbol: bar.Symbol, AdjType: bar.AdjType, TradeDate: bar.TradeDate,
		Open: bar.Open, High: bar.High, Low: bar.Low, Close: bar.Close,
		Volume: &bar.Volume, Amount: &bar.Amount, ChangeAmount: &bar.ChangeAmount,
		ChangePercent: &bar.ChangePercent, RawWeekday: &bar.RawWeekday,
	}
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func valueOrZero(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func chunk[T any](values []T, size int) [][]T {
	if size <= 0 {
		return [][]T{values}
	}
	chunks := make([][]T, 0, (len(values)+size-1)/size)
	for index := 0; index < len(values); index += size {
		end := min(index+size, len(values))
		chunks = append(chunks, values[index:end])
	}
	return chunks
}
