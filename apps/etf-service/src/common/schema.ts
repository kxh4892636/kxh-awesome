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

export type AdjType = z.infer<typeof adjTypeSchema>;
export type AssetType = z.infer<typeof assetTypeSchema>;
export type Security = z.infer<typeof securitySchema>;
