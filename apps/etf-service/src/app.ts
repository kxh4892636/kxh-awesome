import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { apiRoutes } from "./routes";

const baseApp = new Hono();

baseApp.use("*", logger());
baseApp.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

baseApp.get("/", (c) =>
  c.json(
    {
      name: "etf-service",
      ok: true,
    },
    200,
  ),
);

export const app = baseApp.route("/api", apiRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  console.error("etf-service error", error);

  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  return c.json({ error: "Internal Server Error" }, 500);
});
