import { Hono } from "hono";
import { getDailyBars } from "../services/market";
import { securitiesService } from "../services/securities";
import { createMarketRoutes } from "./market";
import { createSecuritiesRoutes } from "./securities";

export const apiRoutes = new Hono()
  .route("/", createSecuritiesRoutes({ securitiesService }))
  .route("/", createMarketRoutes({ marketService: { getDailyBars } }));
