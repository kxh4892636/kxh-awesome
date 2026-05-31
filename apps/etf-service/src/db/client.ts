import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../config/env";
import * as schema from "./schema";

mkdirSync(dirname(config.databaseFile), { recursive: true });

const databaseUrl = `file:${config.databaseFile.replaceAll("\\", "/")}`;

const client = createClient({
  url: databaseUrl,
});

export const db = drizzle(client, {
  schema,
});

export const executeSql = async (source: string): Promise<void> => {
  await client.execute(source);
};

export const executeSqlBatch = async (sources: string[]): Promise<void> => {
  for (const source of sources) {
    await executeSql(source);
  }
};
