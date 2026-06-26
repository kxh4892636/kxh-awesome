package repository

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"kxh-awesome/etf-service/internal/config"
	"kxh-awesome/etf-service/internal/domain"
	"kxh-awesome/etf-service/internal/model"
)

const insertChunkSize = 250

type MarketRepository struct {
	db *gorm.DB
}

func NewMarketRepository(db *gorm.DB) *MarketRepository {
	return &MarketRepository{db: db}
}

func (r *MarketRepository) AutoMigrate() error {
	return r.db.AutoMigrate(&model.Security{}, &model.DailyBar{}, &model.TradingCalendar{})
}

func (r *MarketRepository) SeedSecurities(ctx context.Context, securities []config.SecurityConfig) error {
	for _, security := range securities {
		if err := r.UpsertSecurity(ctx, security); err != nil {
			return err
		}
	}
	return nil
}

func (r *MarketRepository) UpsertSecurity(ctx context.Context, security config.SecurityConfig) error {
	exchange := nullableString(security.Exchange)
	source := nullableString(security.Source)
	row := model.Security{
		Symbol:            security.Symbol,
		Name:              security.Name,
		AssetType:         security.AssetType,
		Exchange:          exchange,
		Currency:          security.Currency,
		Source:            source,
		EarliestTradeDate: security.EarliestTradeDate,
	}

	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "symbol"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"name":                row.Name,
			"asset_type":          row.AssetType,
			"exchange":            row.Exchange,
			"currency":            row.Currency,
			"source":              row.Source,
			"earliest_trade_date": row.EarliestTradeDate,
			"updated_at":          gorm.Expr("CURRENT_TIMESTAMP"),
		}),
	}).Create(&row).Error
}

func (r *MarketRepository) UpsertDailyBars(ctx context.Context, bars []domain.MarketBarInput, exchange string) error {
	for _, values := range chunk(bars, insertChunkSize) {
		rows := make([]model.DailyBar, 0, len(values))
		for _, bar := range values {
			rows = append(rows, toDailyBarRow(bar))
		}

		if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "symbol"}, {Name: "adj_type"}, {Name: "trade_date"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"open",
				"high",
				"low",
				"close",
				"volume",
				"amount",
				"change_amount",
				"change_percent",
				"raw_weekday",
			}),
		}).Create(&rows).Error; err != nil {
			return err
		}
	}

	seen := map[string]struct{}{}
	calendarRows := make([]domain.CalendarInput, 0, len(bars))
	for _, bar := range bars {
		if _, ok := seen[bar.TradeDate]; ok {
			continue
		}
		seen[bar.TradeDate] = struct{}{}
		calendarRows = append(calendarRows, domain.CalendarInput{
			Exchange:  exchange,
			TradeDate: bar.TradeDate,
			IsOpen:    1,
		})
	}
	return r.UpsertCalendarRows(ctx, calendarRows)
}

func (r *MarketRepository) UpsertCalendarRows(ctx context.Context, rows []domain.CalendarInput) error {
	for _, values := range chunk(rows, insertChunkSize) {
		modelRows := make([]model.TradingCalendar, 0, len(values))
		for _, row := range values {
			modelRows = append(modelRows, model.TradingCalendar{
				Exchange:  row.Exchange,
				TradeDate: row.TradeDate,
				IsOpen:    row.IsOpen,
			})
		}

		if len(modelRows) == 0 {
			continue
		}

		if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "exchange"}, {Name: "trade_date"}},
			DoUpdates: clause.AssignmentColumns([]string{"is_open"}),
		}).Create(&modelRows).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *MarketRepository) ListSecuritiesRows(ctx context.Context) ([]domain.SecurityRecord, error) {
	var rows []model.Security
	if err := r.db.WithContext(ctx).Order("symbol ASC").Find(&rows).Error; err != nil {
		return nil, err
	}

	result := make([]domain.SecurityRecord, 0, len(rows))
	for _, row := range rows {
		result = append(result, domain.SecurityRecord{
			Symbol:            row.Symbol,
			Name:              row.Name,
			AssetType:         row.AssetType,
			Exchange:          row.Exchange,
			Currency:          row.Currency,
			Source:            row.Source,
			EarliestTradeDate: row.EarliestTradeDate,
		})
	}
	return result, nil
}

func (r *MarketRepository) GetSecurityRow(ctx context.Context, symbol string) (*domain.SecurityRecord, error) {
	var row model.Security
	err := r.db.WithContext(ctx).Where("symbol = ?", symbol).First(&row).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &domain.SecurityRecord{
		Symbol:            row.Symbol,
		Name:              row.Name,
		AssetType:         row.AssetType,
		Exchange:          row.Exchange,
		Currency:          row.Currency,
		Source:            row.Source,
		EarliestTradeDate: row.EarliestTradeDate,
	}, nil
}

func (r *MarketRepository) GetLatestCachedTradeDate(ctx context.Context, symbol string, adjType string) (*string, error) {
	var row model.DailyBar
	err := r.db.WithContext(ctx).
		Where("symbol = ? AND adj_type = ?", symbol, adjType).
		Order("trade_date DESC").
		First(&row).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row.TradeDate, nil
}

func (r *MarketRepository) ListBars(ctx context.Context, symbol string, adjType string, startDate string, endDate string) ([]domain.DailyBar, error) {
	var rows []model.DailyBar
	if err := r.db.WithContext(ctx).
		Where("symbol = ? AND adj_type = ? AND trade_date >= ? AND trade_date <= ?", symbol, adjType, startDate, endDate).
		Order("trade_date ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}

	bars := make([]domain.DailyBar, 0, len(rows))
	for _, row := range rows {
		bars = append(bars, toDailyBar(row))
	}
	return bars, nil
}

func (r *MarketRepository) GetCalendarMap(ctx context.Context, exchange string, startDate string, endDate string) (map[string]int, error) {
	var rows []model.TradingCalendar
	if err := r.db.WithContext(ctx).
		Where("exchange = ? AND trade_date >= ? AND trade_date <= ?", exchange, startDate, endDate).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	result := map[string]int{}
	for _, row := range rows {
		result[row.TradeDate] = row.IsOpen
	}
	return result, nil
}

func toDailyBar(row model.DailyBar) domain.DailyBar {
	return domain.DailyBar{
		Symbol:        row.Symbol,
		AdjType:       row.AdjType,
		TradeDate:     row.TradeDate,
		Open:          row.Open,
		High:          row.High,
		Low:           row.Low,
		Close:         row.Close,
		Volume:        derefFloat(row.Volume),
		Amount:        derefFloat(row.Amount),
		ChangeAmount:  derefFloat(row.ChangeAmount),
		ChangePercent: derefFloat(row.ChangePercent),
		RawWeekday:    derefString(row.RawWeekday),
	}
}

func toDailyBarRow(bar domain.MarketBarInput) model.DailyBar {
	adjType := bar.AdjType
	if adjType == "" {
		adjType = "none"
	}
	return model.DailyBar{
		Symbol:        bar.Symbol,
		AdjType:       adjType,
		TradeDate:     bar.TradeDate,
		Open:          bar.Open,
		High:          bar.High,
		Low:           bar.Low,
		Close:         bar.Close,
		Volume:        &bar.Volume,
		Amount:        &bar.Amount,
		ChangeAmount:  &bar.ChangeAmount,
		ChangePercent: &bar.ChangePercent,
		RawWeekday:    &bar.RawWeekday,
	}
}

func nullableString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func derefFloat(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func chunk[T any](values []T, size int) [][]T {
	if size <= 0 {
		return [][]T{values}
	}
	chunks := make([][]T, 0, (len(values)+size-1)/size)
	for index := 0; index < len(values); index += size {
		end := index + size
		if end > len(values) {
			end = len(values)
		}
		chunks = append(chunks, values[index:end])
	}
	return chunks
}
