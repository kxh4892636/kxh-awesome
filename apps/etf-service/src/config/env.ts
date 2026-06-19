import { resolve } from "node:path";
import { z } from "zod";

// 加载 .env；dev/start 均可用，无需依赖 dotenv
process.loadEnvFile();

/** DATABASE_URL 默认解析为 CWD 下 data/etf-service.sqlite 的绝对路径 */
const defaultDatabaseUrl = resolve(process.env.DATABASE_URL ?? "./data/etf-service.sqlite");

const envSchema = z.object({
  port: z.coerce.number().int().min(1).max(65_535).default(8080),
  databaseUrl: z.string().min(1).default(defaultDatabaseUrl),
});

/** 应用配置，从 .env 和环境变量加载，缺失字段使用 Zod default */
export const config = envSchema.parse({
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
});
