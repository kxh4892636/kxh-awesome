import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getDailyBarsRequestSchema, getDailyBarsResponseSchema } from "./schema";
import type { CreateMarketRoutesParams } from "./types";

/**
 * 创建行情相关路由。
 * POST /market/getDailyBars — 查询日线 K 线数据，请求体和响应体经由 Zod 校验。
 */
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
