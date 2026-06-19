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

/**
 * 在配置列表中查找证券定义，找不到抛 404。
 * 先从静态配置确认该证券是系统支持的品种，再做后续查询。
 */
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

/** 将存储行 + 最新缓存日期合并为 API 返回的 Security 对象 */
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

/**
 * 找出指定区间内「最近的需要远端刷新的日期」。
 * 从 endDate 倒序遍历，跳过已知休市日（calendar=0）和周末；
 * 第一个确认开市或状态未知的日期即为需要补齐的最近交易日。
 * 返回 null 表示整个区间都是休市日，无需刷新。
 */
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

/**
 * 远端刷新后，将仍缺失的工作日标记为休市。
 * 这样下次请求同一区间时不会重复尝试拉取，直接走缓存。
 */
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

/**
 * 创建行情服务实例（工厂函数）。
 *
 * 核心流程（getDailyBars）分为三个阶段：
 * 1. 日期裁剪 —— 将请求区间约束到 [最早上市日, T-1]，保证不返回未完整交易日数据；
 * 2. 缓存刷新 —— 按交易日历判断是否需要拉取远端，需要时抓取并写入；
 * 3. 休市标记 —— 刷新后仍缺失的交易日标记为休市，避免重复远端请求。
 *
 * 依赖通过 CreateMarketServiceParams 注入，与具体存储/抓取实现解耦。
 */
export const createMarketService = (params: CreateMarketServiceParams): MarketService => {
  const { securities, store, fetchRemoteKlineBars, getTMinusOneDate } = params;

  /** 列出全部证券，逐条附加最新缓存日期 */
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

  /**
   * 查询日线数据，自动处理缓存命中/远端刷新/日期裁剪/休市标记。
   *
   * 阶段一：日期裁剪
   * - 未传 startDate 退回 earliestTradeDate
   * - 未传 endDate 退回 T-1（保证不返回当天盘中数据）
   * - effectiveStart/End 经最早上市日和 T-1 双重约束
   * - 若 effectiveEnd < effectiveStart（区间无交集），返回空 bars + cacheStatus="invalid"
   *
   * 阶段二：缓存刷新决策
   * - 从区间末尾向前找最近"应开市"日期（排除已知休市和周末）
   * - 若该日期 > 最新缓存日期，触发远端抓取
   * - 远端返回后二次过滤 T-1 之后的数据，防止盘中/未来数据污染缓存
   *
   * 阶段三：休市标记
   * - 刷新后仍缺失的交易日批量写入 calendar（isOpen=0）
   * - 避免下次请求同一区间时重复远端拉取
   */
  const getDailyBars = async (request: GetDailyBarsRequest): Promise<GetDailyBarsResponse> => {
    const securityConfig = findSecurityConfig({ securities, symbol: request.symbol });
    const securityRow = await store.getSecurityRow(request.symbol);
    if (!securityRow) {
      throw new HTTPException(404, { message: `Unknown security: ${request.symbol}` });
    }

    // ---- 阶段一：日期裁剪 ----
    const tMinusOne = getTMinusOneDate();
    const requestedStartDate = request.startDate ?? securityRow.earliestTradeDate;
    const requestedEndDate = request.endDate ?? tMinusOne;
    // 行情源可能返回当天未收盘数据，对外查询统一裁剪到 T-1，保证 K 线都是完整交易日。
    const effectiveStartDate = maxDate(requestedStartDate, securityRow.earliestTradeDate);
    const effectiveEndDate = minDate(requestedEndDate, tMinusOne);
    const latestCachedBefore = await store.getLatestCachedTradeDate(request);
    const security = toSecurity({ row: securityRow, latestCachedTradeDate: latestCachedBefore });

    // 请求区间完全无效：结束日期早于开始日期，返回空结果
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

    // ---- 阶段二：缓存刷新决策 ----
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

    // 查询最终结果（包含本次刷新写入的 K 线）
    const bars = await store.listBars({
      symbol: request.symbol,
      adjType: request.adjType,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    });

    // ---- 阶段三：休市标记 ----
    if (shouldRefresh) {
      await markClosedMissingDates({
        store,
        exchange: securityConfig.exchange,
        // 从「上次缓存日 + 1 天」开始标记，避免重复标记已确认的缓存日
        startDate: addDays({ dateText: latestCachedBefore ?? effectiveStartDate, days: 1 }),
        endDate: effectiveEndDate,
        bars,
      });
    }

    // 刷新后重新查询最新缓存日期，保证 meta 中 latestCachedTradeDate 是最新值
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
    // store 的 upsert 操作直接透传（无额外业务逻辑）
    upsertSecurity: store.upsertSecurity,
    upsertDailyBars: store.upsertDailyBars,
    listSecurities,
    getDailyBars,
  };
};
