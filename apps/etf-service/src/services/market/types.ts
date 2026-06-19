import type { AdjType, Security } from "../../common/schema";
import type { SecurityConfig } from "../../config/securities";

/**
 * 缓存状态：cache=命中本地缓存，refreshed=本次触发远端刷新，invalid=请求区间无有效交集
 */
export type MarketCacheStatus = "cache" | "refreshed" | "invalid";

/**
 * 单根日线 K 线数据。
 * 前端通过 @kxh-awesome/etf-service/rpc 直接导入本类型，字段变更会自动传播。
 */
export interface DailyBar {
  /** 证券代码，如 "930955.CSI" */
  symbol: string;
  /** 复权类型：none=不复权，qfq=前复权，hfq=后复权 */
  adjType: AdjType;
  /** 交易日，YYYY-MM-DD */
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** 成交量（股） */
  volume: number;
  /** 成交额（元） */
  amount: number;
  /** 涨跌额，以行情源原始口径为准；部分历史行可能退回 close - open */
  changeAmount: number;
  /** 涨跌幅（%），以行情源原始口径为准 */
  changePercent: number;
  /** 源数据中的星期字段，仅用于调试，不参与业务逻辑 */
  rawWeekday: string;
}

/**
 * 日线查询请求。前端通过 RPC 调用，参数由 Zod schema 校验。
 */
export interface GetDailyBarsRequest {
  symbol: string;
  adjType: AdjType;
  /** 可选起始日期，不传则退回到证券最早上市日 */
  startDate?: string;
  /** 可选结束日期，不传则裁剪到 T-1（保证 K 线是完整交易日数据） */
  endDate?: string;
}

/**
 * 日线查询响应。meta 字段面向前端展示和排查缓存行为，
 * 字段名保持业务语义，避免前端反推服务端裁剪逻辑。
 */
export interface GetDailyBarsResponse {
  /** 证券基本信息（含最早上市日和最新缓存日期） */
  security: Security;
  /** 按交易日升序排列的日线数据 */
  bars: DailyBar[];
  /** 查询元信息：用于前端展示缓存状态、数据范围，以及排查缓存行为 */
  meta: {
    /** 本次查询的缓存状态 */
    cacheStatus: MarketCacheStatus;
    /** 前端请求的原始起始日期，未传则为 null */
    requestedStartDate: string | null;
    /** 前端请求的原始结束日期，未传则为 null */
    requestedEndDate: string | null;
    /** 经最早上市日和 T-1 裁剪后的实际起始日期；为 null 表示请求区间无有效交集 */
    effectiveStartDate: string | null;
    /** 经最早上市日和 T-1 裁剪后的实际结束日期；为 null 表示请求区间无有效交集 */
    effectiveEndDate: string | null;
    /** 该证券最早上市交易日 */
    earliestTradeDate: string;
    /** 当前已缓存的最新交易日，未缓存则为 null */
    latestCachedTradeDate: string | null;
    /** 本次查询是否触发了远端刷新 */
    refreshed: boolean;
    /** 返回的 K 线条数 */
    rows: number;
  };
}

/** 数据库中 securities 表的行记录 */
export interface MarketSecurityRecord {
  symbol: string;
  name: string;
  assetType: Security["assetType"];
  /** 交易所代码，如 "CSI"、"SSE"；非交易所品种可为 null */
  exchange: string | null;
  currency: string;
  /** 数据来源标识，如 "hongsehuojian" */
  source: string | null;
  /** 该证券在数据源中最早可用的交易日 */
  earliestTradeDate: string;
}

/**
 * K 线写入用的宽松输入类型。
 * 与 DailyBar 的区别：adjType 可选，数值字段允许 null/undefined，
 * 以兼容不同行情源返回的缺失字段。
 */
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

/** 交易日历写入行：标记某个交易日在某个交易所是否开市（1=开市，0=休市） */
export interface MarketCalendarInput {
  exchange: string;
  tradeDate: string;
  isOpen: number;
}

/**
 * 行情数据存储层接口（repository 的 seam）。
 * 当前唯一适配器是 SQLite/Drizzle（market-repository.ts）。
 * 第二个适配器出现时（如内存 fake 用于测试），这个 seam 才真正证明价值。
 */
export interface MarketDataStore {
  /** 插入或更新证券基本信息 */
  upsertSecurity: (params: {
    security: SecurityConfig;
    earliestTradeDate: string;
  }) => Promise<void>;
  /** 批量 upsert K 线数据，同时自动标记对应日期为开市 */
  upsertDailyBars: (params: { bars: MarketBarInput[]; exchange: string }) => Promise<void>;
  /** 批量 upsert 交易日历（开市/休市标记） */
  upsertCalendarRows: (rows: MarketCalendarInput[]) => Promise<void>;
  /** 列出全部证券行（不含最新缓存日期） */
  listSecuritiesRows: () => Promise<MarketSecurityRecord[]>;
  /** 按代码查单条证券，不存在返回 null */
  getSecurityRow: (symbol: string) => Promise<MarketSecurityRecord | null>;
  /** 查某证券某复权类型的最新缓存交易日，未缓存返回 null */
  getLatestCachedTradeDate: (params: {
    symbol: string;
    adjType: AdjType;
  }) => Promise<string | null>;
  /** 按日期区间查询 K 线，结果按交易日升序 */
  listBars: (params: {
    symbol: string;
    adjType: AdjType;
    startDate: string;
    endDate: string;
  }) => Promise<DailyBar[]>;
  /** 获取指定区间内的交易日历 Map<日期, isOpen>，用于刷新决策 */
  getCalendarMap: (params: {
    exchange: string;
    startDate: string;
    endDate: string;
  }) => Promise<Map<string, number>>;
}

/**
 * 行情服务接口（业务层的 seam）。
 * 当前适配器由 createMarketService 工厂创建，
 * 接口与 MarketDataStore 有重叠是因为业务层允许透传部分存储操作。
 */
export interface MarketService {
  /** 插入或更新证券基本信息（透传 store） */
  upsertSecurity: (params: {
    security: SecurityConfig;
    earliestTradeDate: string;
  }) => Promise<void>;
  /** 批量 upsert K 线（透传 store，同时标记开市） */
  upsertDailyBars: (params: { bars: MarketBarInput[]; exchange: string }) => Promise<void>;
  /** 列出全部证券，含最新缓存日期 */
  listSecurities: () => Promise<Security[]>;
  /** 查询日线数据，自动处理缓存命中/刷新/日期裁剪/休市标记 */
  getDailyBars: (params: GetDailyBarsRequest) => Promise<GetDailyBarsResponse>;
}

/**
 * createMarketService 的依赖注入参数。
 * 将可变的外部依赖（配置、存储、远端抓取、日期工具）集中注入，
 * 使 service 本身与具体实现解耦。
 */
export interface CreateMarketServiceParams {
  /** 证券配置列表（静态配置） */
  securities: SecurityConfig[];
  /** 行情数据存储适配器 */
  store: MarketDataStore;
  /** 远端 K 线抓取函数（当前适配器：红色火箭 API） */
  fetchRemoteKlineBars: (params: { security: SecurityConfig }) => Promise<{
    bars: MarketBarInput[];
  }>;
  /** 获取 T-1 日期（上海时区），用于裁剪未完整交易日数据 */
  getTMinusOneDate: () => string;
}
