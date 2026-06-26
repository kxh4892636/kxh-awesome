package rpc

import (
	"context"
	"errors"

	"connectrpc.com/connect"

	etfv1 "kxh-awesome/etf-service/gen/etf/v1"
	"kxh-awesome/etf-service/gen/etf/v1/etfv1connect"
	"kxh-awesome/etf-service/internal/domain"
	"kxh-awesome/etf-service/internal/service"
)

type MarketService interface {
	ListSecurities(ctx context.Context) ([]domain.Security, error)
	GetDailyBars(ctx context.Context, request domain.GetDailyBarsRequest) (*domain.GetDailyBarsResponse, error)
}

type EtfHandler struct {
	marketService MarketService
}

var _ etfv1connect.EtfServiceHandler = (*EtfHandler)(nil)

func NewEtfHandler(marketService MarketService) *EtfHandler {
	return &EtfHandler{marketService: marketService}
}

func (h *EtfHandler) ListSecurities(ctx context.Context, _ *connect.Request[etfv1.ListSecuritiesRequest]) (*connect.Response[etfv1.ListSecuritiesResponse], error) {
	securities, err := h.marketService.ListSecurities(ctx)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	response := &etfv1.ListSecuritiesResponse{
		Securities: make([]*etfv1.Security, 0, len(securities)),
	}
	for _, security := range securities {
		response.Securities = append(response.Securities, toProtoSecurity(security))
	}
	return connect.NewResponse(response), nil
}

func (h *EtfHandler) GetDailyBars(ctx context.Context, req *connect.Request[etfv1.GetDailyBarsRequest]) (*connect.Response[etfv1.GetDailyBarsResponse], error) {
	response, err := h.marketService.GetDailyBars(ctx, domain.GetDailyBarsRequest{
		Symbol:    req.Msg.GetSymbol(),
		AdjType:   req.Msg.GetAdjType(),
		StartDate: req.Msg.StartDate,
		EndDate:   req.Msg.EndDate,
	})
	if err != nil {
		if errors.Is(err, service.ErrUnknownSecurity) {
			return nil, connect.NewError(connect.CodeNotFound, err)
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(toProtoGetDailyBarsResponse(response)), nil
}

func toProtoGetDailyBarsResponse(response *domain.GetDailyBarsResponse) *etfv1.GetDailyBarsResponse {
	result := &etfv1.GetDailyBarsResponse{
		Security: toProtoSecurity(response.Security),
		Bars:     make([]*etfv1.DailyBar, 0, len(response.Bars)),
		Meta: &etfv1.GetDailyBarsMeta{
			CacheStatus:           response.Meta.CacheStatus,
			RequestedStartDate:    response.Meta.RequestedStartDate,
			RequestedEndDate:      response.Meta.RequestedEndDate,
			EffectiveStartDate:    response.Meta.EffectiveStartDate,
			EffectiveEndDate:      response.Meta.EffectiveEndDate,
			EarliestTradeDate:     response.Meta.EarliestTradeDate,
			LatestCachedTradeDate: response.Meta.LatestCachedTradeDate,
			Refreshed:             response.Meta.Refreshed,
			Rows:                  response.Meta.Rows,
		},
	}

	for _, bar := range response.Bars {
		result.Bars = append(result.Bars, &etfv1.DailyBar{
			Symbol:        bar.Symbol,
			AdjType:       bar.AdjType,
			TradeDate:     bar.TradeDate,
			Open:          bar.Open,
			High:          bar.High,
			Low:           bar.Low,
			Close:         bar.Close,
			Volume:        bar.Volume,
			Amount:        bar.Amount,
			ChangeAmount:  bar.ChangeAmount,
			ChangePercent: bar.ChangePercent,
			RawWeekday:    bar.RawWeekday,
		})
	}
	return result
}

func toProtoSecurity(security domain.Security) *etfv1.Security {
	return &etfv1.Security{
		Symbol:                security.Symbol,
		Name:                  security.Name,
		AssetType:             security.AssetType,
		Exchange:              security.Exchange,
		Currency:              security.Currency,
		Source:                security.Source,
		EarliestTradeDate:     security.EarliestTradeDate,
		LatestCachedTradeDate: security.LatestCachedTradeDate,
	}
}
