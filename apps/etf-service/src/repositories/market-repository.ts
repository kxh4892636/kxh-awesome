import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { dailyBars, securities, tradingCalendar, type DailyBarRow } from "../db/schema";
import type { DailyBar, MarketCalendarInput, MarketDataStore } from "../services/market/types";

// SQLite 参数数量有限（默认 999），行情批量导入保持分片，避免一次 upsert 过大导致驱动报错。
const INSERT_CHUNK_SIZE = 250;

/** 将数组按固定大小分片，用于 SQLite 批量插入 */
const chunk = <T>(params: { values: T[]; size: number }): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < params.values.length; index += params.size) {
    chunks.push(params.values.slice(index, index + params.size));
  }
  return chunks;
};

/** 将数据库行映射为 DailyBar 领域对象，可选字段回退默认值 */
const toDailyBar = (row: DailyBarRow): DailyBar => ({
  symbol: row.symbol,
  adjType: row.adjType,
  tradeDate: row.tradeDate,
  open: row.open,
  high: row.high,
  low: row.low,
  close: row.close,
  volume: row.volume ?? 0,
  amount: row.amount ?? 0,
  changeAmount: row.changeAmount ?? 0,
  changePercent: row.changePercent ?? 0,
  rawWeekday: row.rawWeekday ?? "",
});

const upsertCalendarRows = async (rows: MarketCalendarInput[]): Promise<void> => {
  for (const values of chunk({ values: rows, size: INSERT_CHUNK_SIZE })) {
    await db
      .insert(tradingCalendar)
      .values(values)
      .onConflictDoUpdate({
        target: [tradingCalendar.exchange, tradingCalendar.tradeDate],
        set: {
          isOpen: sql`excluded.is_open`,
        },
      });
  }
};

/**
 * 行情数据 SQLite 存储适配器。
 *
 * 实现 MarketDataStore 接口，是当前唯一的存储适配器。
 * 关键设计：
 * - upsertDailyBars 在写入 K 线后自动标记对应日期为开市（isOpen=1），无需调用方额外维护 calendar
 * - 批量 upsert 按 INSERT_CHUNK_SIZE=250 分片，避免 SQLite 参数上限
 * - onConflictDoUpdate 确保重复插入时更新价格数据而非报错
 */
export const marketRepository = {
  upsertSecurity: async (params) => {
    await db
      .insert(securities)
      .values({
        symbol: params.security.symbol,
        name: params.security.name,
        assetType: params.security.assetType,
        exchange: params.security.exchange,
        currency: params.security.currency,
        source: params.security.source,
        earliestTradeDate: params.earliestTradeDate,
      })
      .onConflictDoUpdate({
        target: securities.symbol,
        set: {
          name: params.security.name,
          assetType: params.security.assetType,
          exchange: params.security.exchange,
          currency: params.security.currency,
          source: params.security.source,
          earliestTradeDate: params.earliestTradeDate,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
  },
  upsertDailyBars: async (params) => {
    for (const values of chunk({ values: params.bars, size: INSERT_CHUNK_SIZE })) {
      await db
        .insert(dailyBars)
        .values(values)
        .onConflictDoUpdate({
          target: [dailyBars.symbol, dailyBars.adjType, dailyBars.tradeDate],
          set: {
            open: sql`excluded.open`,
            high: sql`excluded.high`,
            low: sql`excluded.low`,
            close: sql`excluded.close`,
            volume: sql`excluded.volume`,
            amount: sql`excluded.amount`,
            changeAmount: sql`excluded.change_amount`,
            changePercent: sql`excluded.change_percent`,
            rawWeekday: sql`excluded.raw_weekday`,
          },
        });
    }

    // 只要有 K 线落库，就同时把对应日期标记为开市，供后续缓存刷新判断复用。
    const calendarRows = [...new Set(params.bars.map((bar) => bar.tradeDate))].map((tradeDate) => ({
      exchange: params.exchange,
      tradeDate,
      isOpen: 1,
    }));
    await upsertCalendarRows(calendarRows);
  },
  upsertCalendarRows,
  listSecuritiesRows: async () => db.select().from(securities).orderBy(asc(securities.symbol)),
  getSecurityRow: async (symbol) => {
    const [row] = await db.select().from(securities).where(eq(securities.symbol, symbol)).limit(1);
    return row ?? null;
  },
  getLatestCachedTradeDate: async (params) => {
    const [row] = await db
      .select({ tradeDate: dailyBars.tradeDate })
      .from(dailyBars)
      .where(and(eq(dailyBars.symbol, params.symbol), eq(dailyBars.adjType, params.adjType)))
      .orderBy(desc(dailyBars.tradeDate))
      .limit(1);

    return row?.tradeDate ?? null;
  },
  listBars: async (params) => {
    const rows = await db
      .select()
      .from(dailyBars)
      .where(
        and(
          eq(dailyBars.symbol, params.symbol),
          eq(dailyBars.adjType, params.adjType),
          gte(dailyBars.tradeDate, params.startDate),
          lte(dailyBars.tradeDate, params.endDate),
        ),
      )
      .orderBy(asc(dailyBars.tradeDate));

    return rows.map(toDailyBar);
  },
  getCalendarMap: async (params) => {
    const rows = await db
      .select()
      .from(tradingCalendar)
      .where(
        and(
          eq(tradingCalendar.exchange, params.exchange),
          gte(tradingCalendar.tradeDate, params.startDate),
          lte(tradingCalendar.tradeDate, params.endDate),
        ),
      );

    return new Map(rows.map((row) => [row.tradeDate, row.isOpen]));
  },
} satisfies MarketDataStore;
