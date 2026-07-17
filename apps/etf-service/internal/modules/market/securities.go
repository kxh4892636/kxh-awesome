package market

import (
	"context"
	"fmt"
)

type SecurityDefinition struct {
	Symbol            string
	Name              string
	AssetType         string
	Exchange          string
	Currency          string
	Source            string
	EarliestTradeDate string
}

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

var supportedSecurities = []SecurityDefinition{
	{
		Symbol:            "932315.CSI",
		Name:              "中证红利质量",
		AssetType:         "index",
		Exchange:          "CSI",
		Currency:          "CNY",
		Source:            "hongsehuojian",
		EarliestTradeDate: "2013-12-31",
	},
	{
		Symbol:            "930955.CSI",
		Name:              "红利低波100",
		AssetType:         "index",
		Exchange:          "CSI",
		Currency:          "CNY",
		Source:            "hongsehuojian",
		EarliestTradeDate: "2005-12-30",
	},
}

func SupportedSecurities() []SecurityDefinition {
	return append([]SecurityDefinition(nil), supportedSecurities...)
}

func (s *MarketService) ListSecurities(ctx context.Context) ([]Security, error) {
	definitions, err := s.store.ListSecurityDefinitions(ctx)
	if err != nil {
		return nil, fmt.Errorf("list securities: %w", err)
	}
	result := make([]Security, 0, len(definitions))
	for _, definition := range definitions {
		latest, err := s.store.LatestCachedTradeDate(ctx, definition.Symbol, AdjustmentQFQ)
		if err != nil {
			return nil, fmt.Errorf("read latest cached date for %s: %w", definition.Symbol, err)
		}
		result = append(result, toSecurity(definition, latest))
	}
	return result, nil
}

func (s *MarketService) findSupportedSecurity(symbol string) (SecurityDefinition, bool) {
	for _, definition := range s.securities {
		if definition.Symbol == symbol {
			return definition, true
		}
	}
	return SecurityDefinition{}, false
}

func toSecurity(definition SecurityDefinition, latestCachedTradeDate *string) Security {
	return Security{
		Symbol:                definition.Symbol,
		Name:                  definition.Name,
		AssetType:             definition.AssetType,
		Exchange:              optionalString(definition.Exchange),
		Currency:              definition.Currency,
		Source:                optionalString(definition.Source),
		EarliestTradeDate:     definition.EarliestTradeDate,
		LatestCachedTradeDate: latestCachedTradeDate,
	}
}
