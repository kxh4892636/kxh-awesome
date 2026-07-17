package market

import (
	"context"

	"connectrpc.com/connect"

	etfv1 "kxh-awesome/etf-service/gen/etf/v1"
	"kxh-awesome/etf-service/gen/etf/v1/etfv1connect"
)

type MarketUsecase interface {
	ListSecurities(ctx context.Context) ([]Security, error)
	GetDailyBars(ctx context.Context, request GetDailyBarsRequest) (*GetDailyBarsResponse, error)
}

type EtfHandler struct {
	marketService MarketUsecase
}

var _ etfv1connect.EtfServiceHandler = (*EtfHandler)(nil)

func NewEtfHandler(marketService MarketUsecase) *EtfHandler {
	return &EtfHandler{marketService: marketService}
}

func (h *EtfHandler) ListSecurities(
	ctx context.Context,
	_ *connect.Request[etfv1.ListSecuritiesRequest],
) (*connect.Response[etfv1.ListSecuritiesResponse], error) {
	securities, err := h.marketService.ListSecurities(ctx)
	if err != nil {
		return nil, err
	}
	response := &etfv1.ListSecuritiesResponse{
		Securities: make([]*etfv1.Security, 0, len(securities)),
	}
	for _, security := range securities {
		response.Securities = append(response.Securities, toProtoSecurity(security))
	}
	return connect.NewResponse(response), nil
}

func (h *EtfHandler) GetDailyBars(
	ctx context.Context,
	request *connect.Request[etfv1.GetDailyBarsRequest],
) (*connect.Response[etfv1.GetDailyBarsResponse], error) {
	response, err := h.marketService.GetDailyBars(ctx, GetDailyBarsRequest{
		Symbol:    request.Msg.GetSymbol(),
		AdjType:   request.Msg.GetAdjType(),
		StartDate: request.Msg.StartDate,
		EndDate:   request.Msg.EndDate,
	})
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(toProtoGetDailyBarsResponse(response)), nil
}

func toProtoGetDailyBarsResponse(response *GetDailyBarsResponse) *etfv1.GetDailyBarsResponse {
	result := &etfv1.GetDailyBarsResponse{
		Security: toProtoSecurity(response.Security),
		Bars:     make([]*etfv1.DailyBar, 0, len(response.Bars)),
		Meta: &etfv1.GetDailyBarsMeta{
			CacheStatus: response.Meta.CacheStatus, RequestedStartDate: response.Meta.RequestedStartDate,
			RequestedEndDate: response.Meta.RequestedEndDate, EffectiveStartDate: response.Meta.EffectiveStartDate,
			EffectiveEndDate: response.Meta.EffectiveEndDate, EarliestTradeDate: response.Meta.EarliestTradeDate,
			LatestCachedTradeDate: response.Meta.LatestCachedTradeDate,
			Refreshed:             response.Meta.Refreshed, Rows: response.Meta.Rows,
		},
	}
	for _, bar := range response.Bars {
		result.Bars = append(result.Bars, &etfv1.DailyBar{
			Symbol: bar.Symbol, AdjType: bar.AdjType, TradeDate: bar.TradeDate,
			Open: bar.Open, High: bar.High, Low: bar.Low, Close: bar.Close,
			Volume: bar.Volume, Amount: bar.Amount, ChangeAmount: bar.ChangeAmount,
			ChangePercent: bar.ChangePercent, RawWeekday: bar.RawWeekday,
		})
	}
	return result
}

func toProtoSecurity(security Security) *etfv1.Security {
	return &etfv1.Security{
		Symbol: security.Symbol, Name: security.Name, AssetType: security.AssetType,
		Exchange: security.Exchange, Currency: security.Currency, Source: security.Source,
		EarliestTradeDate:     security.EarliestTradeDate,
		LatestCachedTradeDate: security.LatestCachedTradeDate,
	}
}
