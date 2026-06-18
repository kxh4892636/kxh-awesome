import { z } from "zod";
import { securitySchema } from "../../common/schema";

export const listSecuritiesRequestSchema = z.object({});

export const listSecuritiesResponseSchema = z.object({
  securities: z.array(securitySchema),
});

export type ListSecuritiesRequest = z.infer<typeof listSecuritiesRequestSchema>;
export type ListSecuritiesResponse = z.infer<typeof listSecuritiesResponseSchema>;
