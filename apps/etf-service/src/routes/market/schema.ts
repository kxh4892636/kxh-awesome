import { z } from "zod";
import { adjTypeSchema, dateSchema, securitySchema } from "../../common/schema";
import type {
  DailyBar,
  GetDailyBarsRequest,
  GetDailyBarsResponse,
} from "../../services/market/types";

/** 日线 K 线的 Zod schema，与 DailyBar 接口保持 satisfies 约束 */
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

/** 日线查询请求 schema：adjType 默认为前复权，startDate/endDate 可选 */
export const getDailyBarsRequestSchema = z.object({
  symbol: z.string().min(1),
  adjType: adjTypeSchema.default("qfq"),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}) satisfies z.ZodType<GetDailyBarsRequest>;

/** 日线查询响应 schema：用于校验 service 返回并传递给前端 */
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

/** 重导出 DailyBar 等类型，供 RPC 层和前端消费 */
export type { DailyBar, GetDailyBarsRequest, GetDailyBarsResponse };
