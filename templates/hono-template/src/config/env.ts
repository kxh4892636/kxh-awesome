import { resolve } from "node:path";
import { z } from "zod";

// 加载 .env；dev/start 均可用，无需依赖 dotenv
process.loadEnvFile();

// DATABASE_URL 由 .env 提供，支持相对路径
const defaultDatabaseUrl = resolve(process.env.DATABASE_URL ?? "./data/hono-template.sqlite");

const envSchema = z.object({
  port: z.coerce.number().int().min(1).max(65_535).default(8080),
  databaseUrl: z.string().min(1).default(defaultDatabaseUrl),
});

export const config = envSchema.parse({
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
});
