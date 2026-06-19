import { z } from "zod";
import { adjTypeSchema, dateSchema, securitySchema } from "../../common/schema";
import type {
  DailyBar,
  GetDailyBarsRequest,
  GetDailyBarsResponse,
} from "../../services/market/types";

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
}) satisfies z.ZodType<DailyBar>;

export const getDailyBarsRequestSchema = z.object({
  symbol: z.string().min(1),
  adjType: adjTypeSchema.default("qfq"),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}) satisfies z.ZodType<GetDailyBarsRequest>;

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
}) satisfies z.ZodType<GetDailyBarsResponse>;

export type { DailyBar, GetDailyBarsRequest, GetDailyBarsResponse };
