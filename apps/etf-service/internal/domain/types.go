package domain

type Security struct {
	Symbol                string
	Name                  string
	AssetType             string
	Exchange              *string
	Currency              string
	Source                *string
	EarliestTradeDate     string
	LatestCachedTradeDate *string
}

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

type MarketBarInput = DailyBar

type CalendarInput struct {
	Exchange  string
	TradeDate string
	IsOpen    int
}

type SecurityRecord struct {
	Symbol            string
	Name              string
	AssetType         string
	Exchange          *string
	Currency          string
	Source            *string
	EarliestTradeDate string
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
