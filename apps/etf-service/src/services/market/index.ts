import { SECURITIES } from "../../config/securities";
import { fetchRemoteKlineBars } from "../../libs/hongsehuojian";
import type { GetDailyBarsRequest } from "../../routes/market/schema";
import { getTMinusOneDate } from "../../utils/date";
import { marketDataStore } from "./db";
import { createMarketService, type MarketBarInput } from "./service";

export const marketService = createMarketService({
  securities: SECURITIES,
  store: marketDataStore,
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
