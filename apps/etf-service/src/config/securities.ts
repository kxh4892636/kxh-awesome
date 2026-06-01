import { fileURLToPath } from "node:url";
import type { AdjType, AssetType } from "../routes/market/schema";

export interface SecurityConfig {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string;
  currency: string;
  source: string;
  adjType: AdjType;
  adjust: string;
  seedFile: string;
}

export const KLINE_ENDPOINT = "https://hongsehuojian.com/fundex-quote/line/kline";

export const KLINE_COUNT = "-1000";

export const PERIOD_DAY = "day";

export const SECURITIES: SecurityConfig[] = [
  {
    symbol: "932315.CSI",
    name: "中证红利质量",
    assetType: "index",
    exchange: "CSI",
    currency: "CNY",
    source: "hongsehuojian",
    adjType: "qfq",
    adjust: "1",
    seedFile: "中证红利质量.json",
  },
  {
    symbol: "930955.CSI",
    name: "红利低波100",
    assetType: "index",
    exchange: "CSI",
    currency: "CNY",
    source: "hongsehuojian",
    adjType: "qfq",
    adjust: "1",
    seedFile: "红利低波100.json",
  },
];

export const getSeedFilePath = (params: { seedFile: string }): string =>
  fileURLToPath(new URL(`../../data/${params.seedFile}`, import.meta.url));
