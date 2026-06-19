import { Hono } from "hono";
import { SECURITIES } from "../config/securities";
import { fetchRemoteKlineBars } from "../libs/hongsehuojian";
import { marketRepository } from "../repositories/market-repository";
import { createMarketService } from "../services/market";
import { createSecuritiesService } from "../services/securities";
import { getTMinusOneDate } from "../utils/date";
import { createMarketRoutes } from "./market";
import { createSecuritiesRoutes } from "./securities";

export const createApiRoutes = () => {
  const marketService = createMarketService({
    securities: SECURITIES,
    store: marketRepository,
    fetchRemoteKlineBars,
    getTMinusOneDate,
  });
  const securitiesService = createSecuritiesService({
    listSecurities: marketService.listSecurities,
  });

  return new Hono()
    .route("/", createSecuritiesRoutes({ securitiesService }))
    .route("/", createMarketRoutes({ marketService }));
};
