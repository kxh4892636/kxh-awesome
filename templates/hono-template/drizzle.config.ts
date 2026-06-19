import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";

// drizzle-kit 会从 .env 自动加载，但保险起见显式加载
process.loadEnvFile();

const dbUrl = process.env.DATABASE_URL ?? "./data/hono-template.sqlite";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: resolve(dbUrl),
  },
});
