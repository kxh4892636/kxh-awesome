import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getDailyBarsRequestSchema, getDailyBarsResponseSchema } from "./market-schema";
import type { CreateMarketRoutesParams } from "./market-types";

export const createMarketRoutes = (params: CreateMarketRoutesParams) => {
  const { marketService } = params;

  return new Hono().post(
    "/market/getDailyBars",
    zValidator("json", getDailyBarsRequestSchema),
    async (c) => {
      const request = c.req.valid("json");
      const response = getDailyBarsResponseSchema.parse(await marketService.getDailyBars(request));

      return c.json(response, 200);
    },
  );
};
