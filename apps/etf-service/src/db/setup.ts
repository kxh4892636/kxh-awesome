import { executeSqlBatch } from "./client";
import { seedDatabase } from "./seed";

let isInitialized = false;

const schemaStatements = [
  "PRAGMA journal_mode = WAL;",
  `
    CREATE TABLE IF NOT EXISTS securities (
      symbol TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL CHECK (
        asset_type IN ('stock', 'etf', 'index', 'fund', 'other')
      ),
      exchange TEXT,
      currency TEXT NOT NULL DEFAULT 'CNY',
      source TEXT,
      earliest_trade_date TEXT NOT NULL CHECK (
        earliest_trade_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      ),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) WITHOUT ROWID;
  `,
  `
    CREATE TABLE IF NOT EXISTS daily_bars (
      symbol TEXT NOT NULL,
      adj_type TEXT NOT NULL DEFAULT 'none' CHECK (
        adj_type IN ('none', 'qfq', 'hfq')
      ),
      trade_date TEXT NOT NULL CHECK (
        trade_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      ),
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume REAL,
      amount REAL,
      change_amount REAL,
      change_percent REAL,
      raw_weekday TEXT,
      PRIMARY KEY (symbol, adj_type, trade_date)
    ) WITHOUT ROWID;
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_daily_bars_date
    ON daily_bars (trade_date, symbol, adj_type);
  `,
  `
    CREATE TABLE IF NOT EXISTS trading_calendar (
      exchange TEXT NOT NULL,
      trade_date TEXT NOT NULL CHECK (
        trade_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      ),
      is_open INTEGER NOT NULL CHECK (is_open IN (0, 1)),
      PRIMARY KEY (exchange, trade_date)
    ) WITHOUT ROWID;
  `,
];

export const ensureDatabase = async (): Promise<void> => {
  await executeSqlBatch(schemaStatements);
};

export const initializeDatabase = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  await ensureDatabase();
  await seedDatabase();
  isInitialized = true;
};
