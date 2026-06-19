import { HTTPException } from "hono/http-exception";
import type {
  DailyBar,
  CreateMarketServiceParams,
  GetDailyBarsRequest,
  GetDailyBarsResponse,
  MarketDataStore,
  MarketSecurityRecord,
  MarketService,
} from "./types";
import type { Security } from "../../common/schema";
import type { SecurityConfig } from "../../config/securities";
import { addDays, compareDate, isWeekend, listDates, maxDate, minDate } from "../../utils/date";

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

  // 只要求补齐“确认开市或未知”的最近交易日；已标记休市和周末不应触发远端刷新。
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
  // 远端刷新后仍缺失的工作日按休市记录，避免下次请求同一区间时重复拉取。
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
    // 行情源可能返回当天未收盘数据，对外查询统一裁剪到 T-1，保证 K 线都是完整交易日。
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
    // 刷新判断以最近“应开市”的日期为准，休市日缺口不会把缓存状态误判为过期。
    const shouldRefresh =
      requiredOpenDate !== null &&
      (latestCachedBefore === null || compareDate(latestCachedBefore, requiredOpenDate) < 0);

    if (shouldRefresh) {
      const parsed = await fetchRemoteKlineBars({ security: securityConfig });
      // 再次过滤 T-1 之后的数据，防止远端接口返回盘中或未来占位行污染缓存。
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
