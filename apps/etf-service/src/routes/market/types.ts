import type { MarketService } from "../../services/market/types";

export type MarketRoutesService = Pick<MarketService, "getDailyBars">;

export interface CreateMarketRoutesParams {
  marketService: MarketRoutesService;
}
