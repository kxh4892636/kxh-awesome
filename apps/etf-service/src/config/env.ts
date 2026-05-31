import { fileURLToPath } from "node:url";
import { z } from "zod";

const defaultDatabaseFile = fileURLToPath(
  new URL("../../data/etf-service.sqlite", import.meta.url),
);

const envSchema = z.object({
  port: z.coerce.number().int().min(1).max(65_535).default(8080),
  databaseFile: z.string().min(1).default(defaultDatabaseFile),
});

export const config = envSchema.parse({
  port: process.env.PORT,
  databaseFile: process.env.DATABASE_FILE,
});
