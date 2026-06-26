package marketdata

import (
	"strings"
	"testing"
)

func TestParseKlineJSONSortsRowsAndFillsOptionalNumbers(t *testing.T) {
	text := `{
		"data": {
			"securityCode": "932315.CSI",
			"columns": "week,tradeDate,open,high,low,close,volume,amount,change,changePercent",
			"items": "星期二,2014-01-02,101,103,100,102,,,,;星期一,2013-12-31,100,101,99,100.5,10,1000,0.5,0.5"
		}
	}`

	parsed, err := ParseKlineJSON(text, "fixture.json", "932315.CSI", "qfq")
	if err != nil {
		t.Fatalf("ParseKlineJSON returned error: %v", err)
	}

	if parsed.SecurityCode != "932315.CSI" {
		t.Fatalf("SecurityCode = %s, want 932315.CSI", parsed.SecurityCode)
	}
	if parsed.EarliestTradeDate != "2013-12-31" {
		t.Fatalf("EarliestTradeDate = %s, want 2013-12-31", parsed.EarliestTradeDate)
	}
	if parsed.LatestTradeDate != "2014-01-02" {
		t.Fatalf("LatestTradeDate = %s, want 2014-01-02", parsed.LatestTradeDate)
	}
	if got := []string{parsed.Bars[0].TradeDate, parsed.Bars[1].TradeDate}; got[0] != "2013-12-31" || got[1] != "2014-01-02" {
		t.Fatalf("trade dates = %v, want sorted dates", got)
	}
	if parsed.Bars[1].Volume != 0 {
		t.Fatalf("Volume = %v, want 0", parsed.Bars[1].Volume)
	}
	if parsed.Bars[1].Amount != 0 {
		t.Fatalf("Amount = %v, want 0", parsed.Bars[1].Amount)
	}
	if parsed.Bars[1].ChangeAmount != 1 {
		t.Fatalf("ChangeAmount = %v, want 1", parsed.Bars[1].ChangeAmount)
	}
}

func TestParseKlineJSONMissingRequiredField(t *testing.T) {
	text := `{
		"data": {
			"columns": "tradeDate,open,high,low",
			"items": "2026-05-29,1,1,1"
		}
	}`

	_, err := ParseKlineJSON(text, "fixture.json", "932315.CSI", "qfq")
	if err == nil {
		t.Fatal("ParseKlineJSON returned nil error")
	}
	if !strings.Contains(err.Error(), "缺少必要字段: close") {
		t.Fatalf("error = %q, want missing close error", err.Error())
	}
}
