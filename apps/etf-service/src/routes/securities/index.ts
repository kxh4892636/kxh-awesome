import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { listSecuritiesRequestSchema, listSecuritiesResponseSchema } from "./securities-schema";
import type { CreateSecuritiesRoutesParams } from "./securities-types";

export const createSecuritiesRoutes = (params: CreateSecuritiesRoutesParams) => {
  const { securitiesService } = params;

  return new Hono().post(
    "/securities/list",
    zValidator("json", listSecuritiesRequestSchema),
    async (c) => {
      const request = c.req.valid("json");
      const response = listSecuritiesResponseSchema.parse(
        await securitiesService.listSecurities(request),
      );

      return c.json(response, 200);
    },
  );
};
