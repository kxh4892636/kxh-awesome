package market

import (
	"fmt"
	"strings"
)

const AdjustmentQFQ = "qfq"

func normalizeGetDailyBarsRequest(request GetDailyBarsRequest) (GetDailyBarsRequest, error) {
	request.Symbol = strings.TrimSpace(request.Symbol)
	if request.Symbol == "" {
		return GetDailyBarsRequest{}, fmt.Errorf("%w: symbol is required", ErrInvalidArgument)
	}
	request.AdjType = strings.TrimSpace(request.AdjType)
	if request.AdjType == "" {
		request.AdjType = AdjustmentQFQ
	}
	if request.AdjType != AdjustmentQFQ {
		return GetDailyBarsRequest{}, fmt.Errorf("%w: unsupported adj_type %q", ErrInvalidArgument, request.AdjType)
	}
	if err := validateRequestDate("start_date", request.StartDate); err != nil {
		return GetDailyBarsRequest{}, err
	}
	if err := validateRequestDate("end_date", request.EndDate); err != nil {
		return GetDailyBarsRequest{}, err
	}
	if request.StartDate != nil && request.EndDate != nil && *request.StartDate > *request.EndDate {
		return GetDailyBarsRequest{}, fmt.Errorf("%w: start_date must not be after end_date", ErrInvalidArgument)
	}
	return request, nil
}

func validateRequestDate(fieldName string, value *string) error {
	if value == nil {
		return nil
	}
	if _, err := parseTradeDate(*value); err != nil {
		return fmt.Errorf("%w: %s must be YYYY-MM-DD", ErrInvalidArgument, fieldName)
	}
	return nil
}
