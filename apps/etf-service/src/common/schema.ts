import { z } from "zod";

/** 复权类型：none=不复权，qfq=前复权，hfq=后复权 */
export const adjTypeSchema = z.enum(["none", "qfq", "hfq"]);
/** 资产类型 */
export const assetTypeSchema = z.enum(["stock", "etf", "index", "fund", "other"]);
/** YYYY-MM-DD 格式日期字符串 */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 证券信息 schema，供 API 响应校验和前端类型导出 */
export const securitySchema = z.object({
  /** 证券代码 */
  symbol: z.string().min(1),
  /** 中文名称 */
  name: z.string().min(1),
  assetType: assetTypeSchema,
  /** 交易所代码，非交易所品种可为 null */
  exchange: z.string().nullable(),
  currency: z.string().min(1),
  /** 数据来源标识 */
  source: z.string().nullable(),
  /** 最早上市交易日 */
  earliestTradeDate: dateSchema,
  /** 最新缓存交易日，未缓存为 null */
  latestCachedTradeDate: dateSchema.nullable(),
});

export type AdjType = z.infer<typeof adjTypeSchema>;
export type AssetType = z.infer<typeof assetTypeSchema>;
export type Security = z.infer<typeof securitySchema>;
