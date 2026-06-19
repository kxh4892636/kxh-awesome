import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../config/env";
import * as schema from "./schema";

mkdirSync(dirname(config.databaseUrl), { recursive: true });

const databaseUrl = `file:${config.databaseUrl.replaceAll("\\", "/")}`;

const client = createClient({
  url: databaseUrl,
});

export const db = drizzle(client, {
  schema,
});

export const executeSql = async (source: string): Promise<void> => {
  await client.execute(source);
};
