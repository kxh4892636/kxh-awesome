import { z } from "zod";

export const adjTypeSchema = z.enum(["none", "qfq", "hfq"]);
export const assetTypeSchema = z.enum(["stock", "etf", "index", "fund", "other"]);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const securitySchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetType: assetTypeSchema,
  exchange: z.string().nullable(),
  currency: z.string().min(1),
  source: z.string().nullable(),
  earliestTradeDate: dateSchema,
  latestCachedTradeDate: dateSchema.nullable(),
});

export const dailyBarSchema = z.object({
  symbol: z.string().min(1),
  adjType: adjTypeSchema,
  tradeDate: dateSchema,
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  amount: z.number(),
  changeAmount: z.number(),
  changePercent: z.number(),
  rawWeekday: z.string(),
});

export const listSecuritiesRequestSchema = z.object({});

export const listSecuritiesResponseSchema = z.object({
  securities: z.array(securitySchema),
});

export const getDailyBarsRequestSchema = z.object({
  symbol: z.string().min(1),
  adjType: adjTypeSchema.default("qfq"),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const getDailyBarsResponseSchema = z.object({
  security: securitySchema,
  bars: z.array(dailyBarSchema),
  meta: z.object({
    cacheStatus: z.enum(["cache", "refreshed", "invalid"]),
    requestedStartDate: dateSchema.nullable(),
    requestedEndDate: dateSchema.nullable(),
    effectiveStartDate: dateSchema.nullable(),
    effectiveEndDate: dateSchema.nullable(),
    earliestTradeDate: dateSchema,
    latestCachedTradeDate: dateSchema.nullable(),
    refreshed: z.boolean(),
    rows: z.number().int(),
  }),
});

export type AdjType = z.infer<typeof adjTypeSchema>;
export type AssetType = z.infer<typeof assetTypeSchema>;
export type Security = z.infer<typeof securitySchema>;
export type DailyBar = z.infer<typeof dailyBarSchema>;
export type ListSecuritiesRequest = z.infer<typeof listSecuritiesRequestSchema>;
export type ListSecuritiesResponse = z.infer<typeof listSecuritiesResponseSchema>;
export type GetDailyBarsRequest = z.infer<typeof getDailyBarsRequestSchema>;
export type GetDailyBarsResponse = z.infer<typeof getDailyBarsResponseSchema>;
