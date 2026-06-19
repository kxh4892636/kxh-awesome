import type { GetDailyBarsRequest, GetDailyBarsResponse } from "./schema";

export interface MarketService {
  getDailyBars: (params: GetDailyBarsRequest) => Promise<GetDailyBarsResponse>;
}

export interface CreateMarketRoutesParams {
  marketService: MarketService;
}
