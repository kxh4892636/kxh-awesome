import { HTTPException } from "hono/http-exception";
import type { AdjType, Security } from "../../common/schema";
import type { SecurityConfig } from "../../config/securities";
import type {
  DailyBar,
  GetDailyBarsRequest,
  GetDailyBarsResponse,
} from "../../routes/market/schema";
import { addDays, compareDate, isWeekend, listDates, maxDate, minDate } from "../../utils/date";

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

const findSecurityConfig = (params: {
  securities: SecurityConfig[];
  symbol: string;
}): SecurityConfig => {
  const security = params.securities.find((item) => item.symbol === params.symbol);
  if (!security) {
    throw new HTTPException(404, { message: `Unknown security: ${params.symbol}` });
  }
  return security;
};

const toSecurity = (params: {
  row: MarketSecurityRecord;
  latestCachedTradeDate: string | null;
}): Security => ({
  symbol: params.row.symbol,
  name: params.row.name,
  assetType: params.row.assetType,
  exchange: params.row.exchange,
  currency: params.row.currency,
  source: params.row.source,
  earliestTradeDate: params.row.earliestTradeDate,
  latestCachedTradeDate: params.latestCachedTradeDate,
});

const getLatestRequiredOpenDate = async (params: {
  store: MarketDataStore;
  exchange: string;
  startDate: string;
  endDate: string;
}): Promise<string | null> => {
  const calendar = await params.store.getCalendarMap(params);
  const dates = listDates({ startDate: params.startDate, endDate: params.endDate }).reverse();

  for (const date of dates) {
    const calendarValue = calendar.get(date);
    if (calendarValue === 0 || isWeekend(date)) {
      continue;
    }
    return date;
  }

  return null;
};

const markClosedMissingDates = async (params: {
  store: MarketDataStore;
  exchange: string;
  startDate: string;
  endDate: string;
  bars: DailyBar[];
}): Promise<void> => {
  const openDates = new Set(params.bars.map((bar) => bar.tradeDate));
  const rows = listDates({ startDate: params.startDate, endDate: params.endDate })
    .filter((date) => !isWeekend(date) && !openDates.has(date))
    .map((tradeDate) => ({ exchange: params.exchange, tradeDate, isOpen: 0 }));

  await params.store.upsertCalendarRows(rows);
};

export const createMarketService = (params: CreateMarketServiceParams): MarketService => {
  const { securities, store, fetchRemoteKlineBars, getTMinusOneDate } = params;

  const listSecurities = async (): Promise<Security[]> => {
    const rows = await store.listSecuritiesRows();
    const result: Security[] = [];

    for (const row of rows) {
      const latestCachedTradeDate = await store.getLatestCachedTradeDate({
        symbol: row.symbol,
        adjType: "qfq",
      });
      result.push(toSecurity({ row, latestCachedTradeDate }));
    }

    return result;
  };

  const getDailyBars = async (request: GetDailyBarsRequest): Promise<GetDailyBarsResponse> => {
    const securityConfig = findSecurityConfig({ securities, symbol: request.symbol });
    const securityRow = await store.getSecurityRow(request.symbol);
    if (!securityRow) {
      throw new HTTPException(404, { message: `Unknown security: ${request.symbol}` });
    }

    const tMinusOne = getTMinusOneDate();
    const requestedStartDate = request.startDate ?? securityRow.earliestTradeDate;
    const requestedEndDate = request.endDate ?? tMinusOne;
    const effectiveStartDate = maxDate(requestedStartDate, securityRow.earliestTradeDate);
    const effectiveEndDate = minDate(requestedEndDate, tMinusOne);
    const latestCachedBefore = await store.getLatestCachedTradeDate(request);
    const security = toSecurity({ row: securityRow, latestCachedTradeDate: latestCachedBefore });

    if (compareDate(effectiveEndDate, effectiveStartDate) < 0) {
      return {
        security,
        bars: [],
        meta: {
          cacheStatus: "invalid",
          requestedStartDate,
          requestedEndDate,
          effectiveStartDate: null,
          effectiveEndDate: null,
          earliestTradeDate: securityRow.earliestTradeDate,
          latestCachedTradeDate: latestCachedBefore,
          refreshed: false,
          rows: 0,
        },
      };
    }

    const requiredOpenDate = await getLatestRequiredOpenDate({
      store,
      exchange: securityConfig.exchange,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    });
    const shouldRefresh =
      requiredOpenDate !== null &&
      (latestCachedBefore === null || compareDate(latestCachedBefore, requiredOpenDate) < 0);

    if (shouldRefresh) {
      const parsed = await fetchRemoteKlineBars({ security: securityConfig });
      const eligibleBars = parsed.bars.filter((bar) => compareDate(bar.tradeDate, tMinusOne) <= 0);
      await store.upsertDailyBars({ bars: eligibleBars, exchange: securityConfig.exchange });
    }

    const bars = await store.listBars({
      symbol: request.symbol,
      adjType: request.adjType,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    });

    if (shouldRefresh) {
      await markClosedMissingDates({
        store,
        exchange: securityConfig.exchange,
        startDate: addDays({ dateText: latestCachedBefore ?? effectiveStartDate, days: 1 }),
        endDate: effectiveEndDate,
        bars,
      });
    }

    const latestCachedTradeDate = await store.getLatestCachedTradeDate(request);

    return {
      security: toSecurity({ row: securityRow, latestCachedTradeDate }),
      bars,
      meta: {
        cacheStatus: shouldRefresh ? "refreshed" : "cache",
        requestedStartDate,
        requestedEndDate,
        effectiveStartDate,
        effectiveEndDate,
        earliestTradeDate: securityRow.earliestTradeDate,
        latestCachedTradeDate,
        refreshed: shouldRefresh,
        rows: bars.length,
      },
    };
  };

  return {
    upsertSecurity: store.upsertSecurity,
    upsertDailyBars: store.upsertDailyBars,
    listSecurities,
    getDailyBars,
  };
};
