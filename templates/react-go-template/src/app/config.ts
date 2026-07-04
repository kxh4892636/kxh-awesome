import { readAppEnv } from "./env";

const appEnv = readAppEnv();

export const appConfig = {
  apiBaseUrl: appEnv.apiBaseUrl,
} as const;
