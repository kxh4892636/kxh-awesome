package market

type SecurityModel struct {
	Symbol            string  `gorm:"primaryKey;column:symbol"`
	Name              string  `gorm:"column:name;not null"`
	AssetType         string  `gorm:"column:asset_type;not null"`
	Exchange          *string `gorm:"column:exchange"`
	Currency          string  `gorm:"column:currency;not null;default:CNY"`
	Source            *string `gorm:"column:source"`
	EarliestTradeDate string  `gorm:"column:earliest_trade_date;not null"`
	CreatedAt         string  `gorm:"column:created_at;not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt         string  `gorm:"column:updated_at;not null;default:CURRENT_TIMESTAMP"`
}

func (SecurityModel) TableName() string {
	return "securities"
}

type DailyBarModel struct {
	Symbol        string   `gorm:"primaryKey;column:symbol"`
	AdjType       string   `gorm:"primaryKey;column:adj_type;not null;default:none"`
	TradeDate     string   `gorm:"primaryKey;column:trade_date"`
	Open          float64  `gorm:"column:open;not null"`
	High          float64  `gorm:"column:high;not null"`
	Low           float64  `gorm:"column:low;not null"`
	Close         float64  `gorm:"column:close;not null"`
	Volume        *float64 `gorm:"column:volume"`
	Amount        *float64 `gorm:"column:amount"`
	ChangeAmount  *float64 `gorm:"column:change_amount"`
	ChangePercent *float64 `gorm:"column:change_percent"`
	RawWeekday    *string  `gorm:"column:raw_weekday"`
}

func (DailyBarModel) TableName() string {
	return "daily_bars"
}

type TradingCalendarModel struct {
	Exchange  string `gorm:"primaryKey;column:exchange"`
	TradeDate string `gorm:"primaryKey;column:trade_date"`
	IsOpen    int    `gorm:"column:is_open;not null"`
}

func (TradingCalendarModel) TableName() string {
	return "trading_calendar"
}
