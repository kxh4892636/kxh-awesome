import { fileURLToPath } from "node:url";
import type { AdjType, AssetType } from "../common/schema";

/** 单个证券的静态配置 */
export interface SecurityConfig {
  /** 证券代码，如 "932315.CSI" */
  symbol: string;
  /** 中文简称 */
  name: string;
  assetType: AssetType;
  /** 交易所代码：CSI=中证，SSE=上交所，SZSE=深交所 */
  exchange: string;
  currency: string;
  /** 数据来源标识 */
  source: string;
  adjType: AdjType;
  /** 红色火箭 API 的 adjust 参数值（"1"=前复权） */
  adjust: string;
  /** data/ 下的种子数据文件名，用于首次导入 */
  seedFile: string;
}

/** 红色火箭 K 线 API 地址 */
export const KLINE_ENDPOINT = "https://hongsehuojian.com/fundex-quote/line/kline";

/** 红色火箭 API 的 count 参数：-1000 表示取最近 1000 条（倒序） */
export const KLINE_COUNT = "-1000";

export const PERIOD_DAY = "day";

/** 系统支持的全部证券列表（静态配置） */
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

/** 获取种子数据文件的绝对路径（用于首次数据导入） */
export const getSeedFilePath = (params: { seedFile: string }): string =>
  fileURLToPath(new URL(`../../data/${params.seedFile}`, import.meta.url));
