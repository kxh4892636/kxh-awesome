import { index, primaryKey, real, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { AdjType, AssetType } from "../../common/schema";

export const securities = sqliteTable("securities", {
  symbol: text("symbol").primaryKey(),
  name: text("name").notNull(),
  assetType: text("asset_type").$type<AssetType>().notNull(),
  exchange: text("exchange"),
  currency: text("currency").notNull().default("CNY"),
  source: text("source"),
  earliestTradeDate: text("earliest_trade_date").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const dailyBars = sqliteTable(
  "daily_bars",
  {
    symbol: text("symbol").notNull(),
    adjType: text("adj_type").$type<AdjType>().notNull().default("none"),
    tradeDate: text("trade_date").notNull(),
    open: real("open").notNull(),
    high: real("high").notNull(),
    low: real("low").notNull(),
    close: real("close").notNull(),
    volume: real("volume"),
    amount: real("amount"),
    changeAmount: real("change_amount"),
    changePercent: real("change_percent"),
    rawWeekday: text("raw_weekday"),
  },
  (table) => [
    primaryKey({ columns: [table.symbol, table.adjType, table.tradeDate] }),
    index("idx_daily_bars_date").on(table.tradeDate, table.symbol, table.adjType),
  ],
);

export const tradingCalendar = sqliteTable(
  "trading_calendar",
  {
    exchange: text("exchange").notNull(),
    tradeDate: text("trade_date").notNull(),
    isOpen: integer("is_open").notNull(),
  },
  (table) => [primaryKey({ columns: [table.exchange, table.tradeDate] })],
);

export type SecurityRow = typeof securities.$inferSelect;
export type NewSecurityRow = typeof securities.$inferInsert;
export type DailyBarRow = typeof dailyBars.$inferSelect;
export type NewDailyBarRow = typeof dailyBars.$inferInsert;
export type NewTradingCalendarRow = typeof tradingCalendar.$inferInsert;
