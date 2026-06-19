import assert from "node:assert/strict";
import test from "node:test";
import { SECURITIES } from "../../config/securities";
import type { DailyBar } from "../../routes/market/schema";
import {
  createMarketService,
  type MarketBarInput,
  type MarketCalendarInput,
  type MarketDataStore,
  type MarketSecurityRecord,
} from "./service";

const securityConfig = SECURITIES[0]!;

const securityRow: MarketSecurityRecord = {
  symbol: securityConfig.symbol,
  name: securityConfig.name,
  assetType: securityConfig.assetType,
  exchange: securityConfig.exchange,
  currency: securityConfig.currency,
  source: securityConfig.source,
  earliestTradeDate: "2013-12-31",
};

const createBar = (params: { tradeDate: string; close?: number }): DailyBar => ({
  symbol: securityConfig.symbol,
  adjType: "qfq",
  tradeDate: params.tradeDate,
  open: params.close ?? 100,
  high: params.close ?? 100,
  low: params.close ?? 100,
  close: params.close ?? 100,
  volume: 1,
  amount: 10,
  changeAmount: 0,
  changePercent: 0,
  rawWeekday: "星期五",
});

const createFakeStore = (params?: {
  bars?: DailyBar[];
  latestCachedTradeDate?: string | null;
  calendar?: Map<string, number>;
}) => {
  const calls = {
    upsertDailyBars: [] as Array<{ bars: MarketBarInput[]; exchange: string }>,
    upsertCalendarRows: [] as MarketCalendarInput[][],
    getCalendarMap: [] as Array<{ exchange: string; startDate: string; endDate: string }>,
  };
  const state = {
    bars: [...(params?.bars ?? [])],
    latestCachedTradeDate: params?.latestCachedTradeDate,
    calendar: params?.calendar ?? new Map<string, number>(),
  };

  const getLatestCachedTradeDate = (): string | null => {
    if (state.latestCachedTradeDate !== undefined) {
      return state.latestCachedTradeDate;
    }

    return (
      state.bars.map((bar) => bar.tradeDate).sort((left, right) => right.localeCompare(left))[0] ??
      null
    );
  };

  const store = {
    upsertSecurity: async () => {},
    upsertDailyBars: async (input) => {
      calls.upsertDailyBars.push(input);
      state.bars.push(
        ...input.bars.map((bar) => ({
          symbol: bar.symbol,
          adjType: bar.adjType ?? "none",
          tradeDate: bar.tradeDate,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume ?? 0,
          amount: bar.amount ?? 0,
          changeAmount: bar.changeAmount ?? 0,
          changePercent: bar.changePercent ?? 0,
          rawWeekday: bar.rawWeekday ?? "",
        })),
      );
      state.latestCachedTradeDate = undefined;
    },
    upsertCalendarRows: async (rows) => {
      calls.upsertCalendarRows.push(rows);
      for (const row of rows) {
        state.calendar.set(row.tradeDate, row.isOpen);
      }
    },
    listSecuritiesRows: async () => [securityRow],
    getSecurityRow: async (symbol) => (symbol === securityRow.symbol ? securityRow : null),
    getLatestCachedTradeDate: async () => getLatestCachedTradeDate(),
    listBars: async (input) =>
      state.bars
        .filter(
          (bar) =>
            bar.symbol === input.symbol &&
            bar.adjType === input.adjType &&
            bar.tradeDate >= input.startDate &&
            bar.tradeDate <= input.endDate,
        )
        .sort((left, right) => left.tradeDate.localeCompare(right.tradeDate)),
    getCalendarMap: async (input) => {
      calls.getCalendarMap.push(input);
      return state.calendar;
    },
  } satisfies MarketDataStore;

  return { store, calls };
};

void test("日期完全早于最早数据时不访问远端且返回无效范围", async () => {
  const { store, calls } = createFakeStore({ latestCachedTradeDate: null });
  let fetchCount = 0;
  const service = createMarketService({
    securities: SECURITIES,
    store,
    fetchRemoteKlineBars: async () => {
      fetchCount += 1;
      return { bars: [] };
    },
    getTMinusOneDate: () => "2026-05-30",
  });

  const response = await service.getDailyBars({
    symbol: securityConfig.symbol,
    adjType: "qfq",
    startDate: "2012-01-01",
    endDate: "2013-01-01",
  });

  assert.equal(response.meta.cacheStatus, "invalid");
  assert.equal(response.meta.refreshed, false);
  assert.equal(response.bars.length, 0);
  assert.equal(fetchCount, 0);
  assert.equal(calls.getCalendarMap.length, 0);
  assert.equal(calls.upsertDailyBars.length, 0);
});

void test("数据库缓存覆盖请求区间时直接返回缓存数据", async () => {
  const { store, calls } = createFakeStore({
    bars: [createBar({ tradeDate: "2026-05-29", close: 101 })],
    latestCachedTradeDate: "2026-05-29",
  });
  let fetchCount = 0;
  const service = createMarketService({
    securities: SECURITIES,
    store,
    fetchRemoteKlineBars: async () => {
      fetchCount += 1;
      return { bars: [] };
    },
    getTMinusOneDate: () => "2026-05-30",
  });

  const response = await service.getDailyBars({
    symbol: securityConfig.symbol,
    adjType: "qfq",
    startDate: "2026-05-29",
    endDate: "2026-05-30",
  });

  assert.equal(response.meta.cacheStatus, "cache");
  assert.equal(response.meta.refreshed, false);
  assert.equal(response.bars.length, 1);
  assert.equal(response.bars[0]?.tradeDate, "2026-05-29");
  assert.equal(fetchCount, 0);
  assert.equal(calls.upsertDailyBars.length, 0);
});

void test("数据库缺少有效交易日时拉取远端并过滤当天之后的数据", async () => {
  const { store, calls } = createFakeStore({
    bars: [createBar({ tradeDate: "2026-05-28", close: 100 })],
    latestCachedTradeDate: "2026-05-28",
  });
  const remoteBars: MarketBarInput[] = [
    createBar({ tradeDate: "2026-05-29", close: 101 }),
    createBar({ tradeDate: "2026-05-31", close: 102 }),
  ];
  let fetchCount = 0;
  const service = createMarketService({
    securities: SECURITIES,
    store,
    fetchRemoteKlineBars: async () => {
      fetchCount += 1;
      return { bars: remoteBars };
    },
    getTMinusOneDate: () => "2026-05-30",
  });

  const response = await service.getDailyBars({
    symbol: securityConfig.symbol,
    adjType: "qfq",
    startDate: "2026-05-28",
    endDate: "2026-05-31",
  });

  assert.equal(response.meta.cacheStatus, "refreshed");
  assert.equal(response.meta.refreshed, true);
  assert.equal(response.meta.effectiveEndDate, "2026-05-30");
  assert.equal(fetchCount, 1);
  assert.equal(calls.upsertDailyBars.length, 1);
  assert.deepEqual(
    calls.upsertDailyBars[0]?.bars.map((bar) => bar.tradeDate),
    ["2026-05-29"],
  );
  assert.deepEqual(
    response.bars.map((bar) => bar.tradeDate),
    ["2026-05-28", "2026-05-29"],
  );
});

void test("证券列表会返回每只证券的最早日期和最新缓存日期", async () => {
  const { store } = createFakeStore({
    bars: [createBar({ tradeDate: "2026-05-29", close: 101 })],
  });
  const service = createMarketService({
    securities: SECURITIES,
    store,
    fetchRemoteKlineBars: async () => ({ bars: [] }),
    getTMinusOneDate: () => "2026-05-30",
  });

  const securities = await service.listSecurities();

  assert.equal(securities.length, 1);
  assert.equal(securities[0]?.symbol, securityConfig.symbol);
  assert.equal(securities[0]?.earliestTradeDate, "2013-12-31");
  assert.equal(securities[0]?.latestCachedTradeDate, "2026-05-29");
});
