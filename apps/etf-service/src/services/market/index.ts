import { SECURITIES } from "../../config/securities";
import { fetchRemoteKlineBars } from "../../libs/hongsehuojian";
import { marketRepository } from "../../repositories/market-repository";
import type { GetDailyBarsRequest } from "../../routes/market/schema";
import { getTMinusOneDate } from "../../utils/date";
import { createMarketService, type MarketBarInput } from "./service";

export const marketService = createMarketService({
  securities: SECURITIES,
  store: marketRepository,
  fetchRemoteKlineBars,
  getTMinusOneDate,
});

export const upsertSecurity = marketService.upsertSecurity;

export const upsertDailyBars = (params: {
  bars: MarketBarInput[];
  exchange: string;
}): Promise<void> => marketService.upsertDailyBars(params);

export const listSecurities = marketService.listSecurities;

export const getDailyBars = (params: GetDailyBarsRequest) => marketService.getDailyBars(params);
