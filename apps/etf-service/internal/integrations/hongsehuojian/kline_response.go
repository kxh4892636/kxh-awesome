package hongsehuojian

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"kxh-awesome/etf-service/internal/modules/market"
)

type ParsedKlineData struct {
	SecurityCode      string
	EarliestTradeDate string
	LatestTradeDate   string
	Bars              []market.DailyBar
}

type klinePayload struct {
	SecurityCode *string `json:"securityCode"`
	Columns      *string `json:"columns"`
	Items        *string `json:"items"`
}

type klineEnvelope struct {
	Data *klinePayload `json:"data"`
	klinePayload
}

func ParseKlineJSON(text string, fileName string, fallbackSymbol string, adjType string) (*ParsedKlineData, error) {
	payload, err := decodeKlinePayload(text, fileName)
	if err != nil {
		return nil, err
	}
	if payload.Columns == nil || payload.Items == nil {
		return nil, fmt.Errorf("%s 缺少 columns 或 items 字符串", fileName)
	}
	columns := splitNonEmpty(*payload.Columns, ",")
	missing := missingRequired(columns, []string{"tradeDate", "open", "high", "low", "close"})
	if len(missing) > 0 {
		return nil, fmt.Errorf("%s 缺少必要字段: %s", fileName, strings.Join(missing, ", "))
	}

	securityCode := fallbackSymbol
	if payload.SecurityCode != nil && *payload.SecurityCode != "" {
		securityCode = *payload.SecurityCode
	}
	if securityCode != fallbackSymbol {
		return nil, fmt.Errorf("%s securityCode %q does not match %q", fileName, securityCode, fallbackSymbol)
	}
	bars, err := parseKlineRows(*payload.Items, columns, fallbackSymbol, adjType)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", fileName, err)
	}
	if len(bars) == 0 {
		return nil, fmt.Errorf("%s items 中没有可用数据", fileName)
	}
	sort.Slice(bars, func(left int, right int) bool {
		return bars[left].TradeDate < bars[right].TradeDate
	})
	return &ParsedKlineData{
		SecurityCode:      securityCode,
		EarliestTradeDate: bars[0].TradeDate,
		LatestTradeDate:   bars[len(bars)-1].TradeDate,
		Bars:              bars,
	}, nil
}

func decodeKlinePayload(text string, fileName string) (klinePayload, error) {
	var envelope klineEnvelope
	if err := json.Unmarshal([]byte(text), &envelope); err != nil {
		return klinePayload{}, fmt.Errorf("%s decode JSON: %w", fileName, err)
	}
	if envelope.Data != nil {
		return *envelope.Data, nil
	}
	return envelope.klinePayload, nil
}

func parseKlineRows(items string, columns []string, symbol string, adjType string) ([]market.DailyBar, error) {
	lines := splitNonEmpty(items, ";")
	bars := make([]market.DailyBar, 0, len(lines))
	for index, line := range lines {
		values := strings.Split(line, ",")
		if len(values) < len(columns) {
			return nil, fmt.Errorf("第 %d 行字段数量不足", index+1)
		}
		record := make(map[string]string, len(columns))
		for columnIndex, column := range columns {
			record[column] = strings.TrimSpace(values[columnIndex])
		}
		bar, err := parseKlineRow(record, symbol, adjType, index+1)
		if err != nil {
			return nil, err
		}
		bars = append(bars, bar)
	}
	return bars, nil
}

func parseKlineRow(record map[string]string, symbol string, adjType string, rowNumber int) (market.DailyBar, error) {
	tradeDate, err := parseKlineDate(record["tradeDate"])
	if err != nil {
		return market.DailyBar{}, fmt.Errorf("第 %d 行的 tradeDate 不是 YYYY-MM-DD", rowNumber)
	}
	prices, err := parsePrices(record, rowNumber)
	if err != nil {
		return market.DailyBar{}, err
	}
	volume, err := readOptionalNumber(record["volume"], "volume", rowNumber, 0)
	if err != nil || volume < 0 {
		return market.DailyBar{}, fmt.Errorf("第 %d 行的 volume 不是有效非负数", rowNumber)
	}
	amount, err := readOptionalNumber(record["amount"], "amount", rowNumber, 0)
	if err != nil || amount < 0 {
		return market.DailyBar{}, fmt.Errorf("第 %d 行的 amount 不是有效非负数", rowNumber)
	}
	changeFallback := prices.close - prices.open
	percentFallback := 0.0
	if prices.open != 0 {
		percentFallback = (changeFallback / prices.open) * 100
	}
	changeAmount, err := readOptionalNumber(record["change"], "change", rowNumber, changeFallback)
	if err != nil {
		return market.DailyBar{}, err
	}
	changePercent, err := readOptionalNumber(record["changePercent"], "changePercent", rowNumber, percentFallback)
	if err != nil {
		return market.DailyBar{}, err
	}
	return market.DailyBar{
		Symbol: symbol, AdjType: adjType, TradeDate: tradeDate,
		Open: prices.open, High: prices.high, Low: prices.low, Close: prices.close,
		Volume: volume, Amount: amount, ChangeAmount: changeAmount,
		ChangePercent: changePercent, RawWeekday: record["week"],
	}, nil
}

type klinePrices struct {
	open  float64
	high  float64
	low   float64
	close float64
}

func parsePrices(record map[string]string, rowNumber int) (klinePrices, error) {
	open, err := toFiniteNumber(record["open"], "open", rowNumber)
	if err != nil {
		return klinePrices{}, err
	}
	high, err := toFiniteNumber(record["high"], "high", rowNumber)
	if err != nil {
		return klinePrices{}, err
	}
	low, err := toFiniteNumber(record["low"], "low", rowNumber)
	if err != nil {
		return klinePrices{}, err
	}
	closeValue, err := toFiniteNumber(record["close"], "close", rowNumber)
	if err != nil {
		return klinePrices{}, err
	}
	if high < low || high < math.Max(open, closeValue) || low > math.Min(open, closeValue) {
		return klinePrices{}, fmt.Errorf("第 %d 行的 price range 无效", rowNumber)
	}
	return klinePrices{open: open, high: high, low: low, close: closeValue}, nil
}

func splitNonEmpty(text string, separator string) []string {
	parts := strings.Split(text, separator)
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if value := strings.TrimSpace(part); value != "" {
			result = append(result, value)
		}
	}
	return result
}

func missingRequired(columns []string, required []string) []string {
	seen := make(map[string]struct{}, len(columns))
	for _, column := range columns {
		seen[column] = struct{}{}
	}
	missing := make([]string, 0)
	for _, column := range required {
		if _, ok := seen[column]; !ok {
			missing = append(missing, column)
		}
	}
	return missing
}

func parseKlineDate(value string) (string, error) {
	if _, err := time.Parse("2006-01-02", value); err != nil {
		return "", err
	}
	return value, nil
}

func toFiniteNumber(value string, fieldName string, rowNumber int) (float64, error) {
	number, err := strconv.ParseFloat(value, 64)
	if err != nil || math.IsInf(number, 0) || math.IsNaN(number) {
		return 0, fmt.Errorf("第 %d 行的 %s 不是有效数字", rowNumber, fieldName)
	}
	return number, nil
}

func readOptionalNumber(value string, fieldName string, rowNumber int, fallback float64) (float64, error) {
	if value == "" {
		return fallback, nil
	}
	return toFiniteNumber(value, fieldName, rowNumber)
}
