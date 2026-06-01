import { serve } from "@hono/node-server";
import { app } from "./app";
import { config } from "./config/env";
import { initializeDatabase } from "./db/setup";

await initializeDatabase();

const server = serve({
  fetch: app.fetch,
  port: config.port,
});

console.log(`Hono server listening on http://localhost:${config.port}`);

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`Received ${signal}, shutting down Hono server`);
  server.close((error?: Error) => {
    if (error) {
      console.error("server shutdown error", error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
