import { z } from "zod";
import { securitySchema } from "../../common/schema";
import type {
  ListSecuritiesRequest,
  ListSecuritiesResponse,
} from "../../services/securities/types";

export const listSecuritiesRequestSchema = z.object({}) satisfies z.ZodType<ListSecuritiesRequest>;

export const listSecuritiesResponseSchema = z.object({
  securities: z.array(securitySchema),
}) satisfies z.ZodType<ListSecuritiesResponse>;

export type { ListSecuritiesRequest, ListSecuritiesResponse };
