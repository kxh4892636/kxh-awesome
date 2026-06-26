package config

import "testing"

func TestSecuritiesEarliestTradeDateMatchesKnownHistory(t *testing.T) {
	expectedEarliestTradeDate := map[string]string{
		"930955.CSI": "2005-12-30",
		"932315.CSI": "2013-12-31",
	}

	seen := map[string]struct{}{}
	for _, security := range Securities {
		t.Run(security.Symbol, func(t *testing.T) {
			if _, ok := seen[security.Symbol]; ok {
				t.Fatalf("duplicate security symbol %s", security.Symbol)
			}
			seen[security.Symbol] = struct{}{}

			want, ok := expectedEarliestTradeDate[security.Symbol]
			if !ok {
				t.Fatalf("missing expected earliest trade date for %s", security.Symbol)
			}
			if security.EarliestTradeDate != want {
				t.Fatalf("EarliestTradeDate = %s, want %s", security.EarliestTradeDate, want)
			}
		})
	}

	if len(seen) != len(expectedEarliestTradeDate) {
		t.Fatalf("configured securities = %d, expected entries = %d", len(seen), len(expectedEarliestTradeDate))
	}
}
