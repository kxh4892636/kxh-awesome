package marketdata

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"

	"kxh-awesome/etf-service/internal/domain"
)

type ParsedKlineData struct {
	SecurityCode      string
	EarliestTradeDate string
	LatestTradeDate   string
	Bars              []domain.MarketBarInput
}

func ParseKlineJSON(text string, fileName string, fallbackSymbol string, adjType string) (*ParsedKlineData, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(text), &payload); err != nil {
		return nil, fmt.Errorf("%s JSON 格式错误: %w", fileName, err)
	}

	indexPayload := payload
	if data, ok := payload["data"].(map[string]interface{}); ok {
		indexPayload = data
	}

	columnsText, ok := indexPayload["columns"].(string)
	if !ok {
		return nil, fmt.Errorf("%s 缺少 columns 或 items 字符串", fileName)
	}
	itemsText, ok := indexPayload["items"].(string)
	if !ok {
		return nil, fmt.Errorf("%s 缺少 columns 或 items 字符串", fileName)
	}

	columns := splitNonEmpty(columnsText, ",")
	missing := missingRequired(columns, []string{"tradeDate", "open", "high", "low", "close"})
	if len(missing) > 0 {
		return nil, fmt.Errorf("%s 缺少必要字段: %s", fileName, strings.Join(missing, ", "))
	}

	securityCode := fallbackSymbol
	if value, ok := indexPayload["securityCode"].(string); ok && value != "" {
		securityCode = value
	}

	lines := splitNonEmpty(itemsText, ";")
	bars := make([]domain.MarketBarInput, 0, len(lines))
	for index, line := range lines {
		rowNumber := index + 1
		values := strings.Split(line, ",")
		if len(values) < len(columns) {
			return nil, fmt.Errorf("%s 第 %d 行字段数量不足", fileName, rowNumber)
		}

		record := map[string]string{}
		for columnIndex, column := range columns {
			record[column] = values[columnIndex]
		}

		tradeDate, err := parseDate(record["tradeDate"], rowNumber)
		if err != nil {
			return nil, err
		}
		open, err := toFiniteNumber(record["open"], "open", rowNumber)
		if err != nil {
			return nil, err
		}
		high, err := toFiniteNumber(record["high"], "high", rowNumber)
		if err != nil {
			return nil, err
		}
		low, err := toFiniteNumber(record["low"], "low", rowNumber)
		if err != nil {
			return nil, err
		}
		closeValue, err := toFiniteNumber(record["close"], "close", rowNumber)
		if err != nil {
			return nil, err
		}

		changeFallback := closeValue - open
		percentFallback := 0.0
		if open != 0 {
			percentFallback = ((closeValue - open) / open) * 100
		}

		volume, err := readOptionalNumber(record["volume"], "volume", rowNumber, 0)
		if err != nil {
			return nil, err
		}
		amount, err := readOptionalNumber(record["amount"], "amount", rowNumber, 0)
		if err != nil {
			return nil, err
		}
		changeAmount, err := readOptionalNumber(record["change"], "change", rowNumber, changeFallback)
		if err != nil {
			return nil, err
		}
		changePercent, err := readOptionalNumber(record["changePercent"], "changePercent", rowNumber, percentFallback)
		if err != nil {
			return nil, err
		}

		bars = append(bars, domain.MarketBarInput{
			Symbol:        fallbackSymbol,
			AdjType:       adjType,
			TradeDate:     tradeDate,
			Open:          open,
			High:          high,
			Low:           low,
			Close:         closeValue,
			Volume:        volume,
			Amount:        amount,
			ChangeAmount:  changeAmount,
			ChangePercent: changePercent,
			RawWeekday:    record["week"],
		})
	}

	sort.Slice(bars, func(i, j int) bool {
		return Compare(bars[i].TradeDate, bars[j].TradeDate) < 0
	})

	if len(bars) == 0 {
		return nil, fmt.Errorf("%s items 中没有可用数据", fileName)
	}

	return &ParsedKlineData{
		SecurityCode:      securityCode,
		EarliestTradeDate: bars[0].TradeDate,
		LatestTradeDate:   bars[len(bars)-1].TradeDate,
		Bars:              bars,
	}, nil
}

func splitNonEmpty(text string, sep string) []string {
	parts := strings.Split(text, sep)
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}

func missingRequired(columns []string, required []string) []string {
	seen := map[string]struct{}{}
	for _, column := range columns {
		seen[column] = struct{}{}
	}

	var missing []string
	for _, column := range required {
		if _, ok := seen[column]; !ok {
			missing = append(missing, column)
		}
	}
	return missing
}

func parseDate(value string, rowNumber int) (string, error) {
	if _, err := Parse(value); err != nil {
		return "", fmt.Errorf("第 %d 行的 tradeDate 不是 YYYY-MM-DD", rowNumber)
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
