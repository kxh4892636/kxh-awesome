import type { AdjType, Security } from "../../common/schema";
import type { SecurityConfig } from "../../config/securities";

export type MarketCacheStatus = "cache" | "refreshed" | "invalid";

export interface DailyBar {
  symbol: string;
  adjType: AdjType;
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  changeAmount: number;
  changePercent: number;
  rawWeekday: string;
}

export interface GetDailyBarsRequest {
  symbol: string;
  adjType: AdjType;
  startDate?: string;
  endDate?: string;
}

export interface GetDailyBarsResponse {
  security: Security;
  bars: DailyBar[];
  meta: {
    cacheStatus: MarketCacheStatus;
    requestedStartDate: string | null;
    requestedEndDate: string | null;
    effectiveStartDate: string | null;
    effectiveEndDate: string | null;
    earliestTradeDate: string;
    latestCachedTradeDate: string | null;
    refreshed: boolean;
    rows: number;
  };
}

export interface MarketSecurityRecord {
  symbol: string;
  name: string;
  assetType: Security["assetType"];
  exchange: string | null;
  currency: string;
  source: string | null;
  earliestTradeDate: string;
}

export interface MarketBarInput {
  symbol: string;
  adjType?: AdjType;
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  amount?: number | null;
  changeAmount?: number | null;
  changePercent?: number | null;
  rawWeekday?: string | null;
}

export interface MarketCalendarInput {
  exchange: string;
  tradeDate: string;
  isOpen: number;
}

export interface MarketDataStore {
  upsertSecurity: (params: {
    security: SecurityConfig;
    earliestTradeDate: string;
  }) => Promise<void>;
  upsertDailyBars: (params: { bars: MarketBarInput[]; exchange: string }) => Promise<void>;
  upsertCalendarRows: (rows: MarketCalendarInput[]) => Promise<void>;
  listSecuritiesRows: () => Promise<MarketSecurityRecord[]>;
  getSecurityRow: (symbol: string) => Promise<MarketSecurityRecord | null>;
  getLatestCachedTradeDate: (params: {
    symbol: string;
    adjType: AdjType;
  }) => Promise<string | null>;
  listBars: (params: {
    symbol: string;
    adjType: AdjType;
    startDate: string;
    endDate: string;
  }) => Promise<DailyBar[]>;
  getCalendarMap: (params: {
    exchange: string;
    startDate: string;
    endDate: string;
  }) => Promise<Map<string, number>>;
}

export interface MarketService {
  upsertSecurity: (params: {
    security: SecurityConfig;
    earliestTradeDate: string;
  }) => Promise<void>;
  upsertDailyBars: (params: { bars: MarketBarInput[]; exchange: string }) => Promise<void>;
  listSecurities: () => Promise<Security[]>;
  getDailyBars: (params: GetDailyBarsRequest) => Promise<GetDailyBarsResponse>;
}

export interface CreateMarketServiceParams {
  securities: SecurityConfig[];
  store: MarketDataStore;
  fetchRemoteKlineBars: (params: { security: SecurityConfig }) => Promise<{
    bars: MarketBarInput[];
  }>;
  getTMinusOneDate: () => string;
}
