package config

type SecurityConfig struct {
	Symbol            string
	Name              string
	AssetType         string
	Exchange          string
	Currency          string
	Source            string
	AdjType           string
	Adjust            string
	EarliestTradeDate string
}

const (
	KlineEndpoint = "https://hongsehuojian.com/fundex-quote/line/kline"
	KlineCount    = "-1000"
	PeriodDay     = "day"
)

var Securities = []SecurityConfig{
	{
		Symbol:            "932315.CSI",
		Name:              "中证红利质量",
		AssetType:         "index",
		Exchange:          "CSI",
		Currency:          "CNY",
		Source:            "hongsehuojian",
		AdjType:           "qfq",
		Adjust:            "1",
		EarliestTradeDate: "2013-12-31",
	},
	{
		Symbol:            "930955.CSI",
		Name:              "红利低波100",
		AssetType:         "index",
		Exchange:          "CSI",
		Currency:          "CNY",
		Source:            "hongsehuojian",
		AdjType:           "qfq",
		Adjust:            "1",
		EarliestTradeDate: "2005-12-30",
	},
}
