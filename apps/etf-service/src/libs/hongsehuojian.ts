import type { SecurityConfig } from "../config/securities";
import { KLINE_COUNT, KLINE_ENDPOINT, PERIOD_DAY } from "../config/securities";
import { parseKlineJson } from "./kline-parser";
import { getShanghaiToday, toUrlDate } from "../utils/date";

/** 构造红色火箭 K 线 API 的完整 URL，包含所有查询参数 */
export const buildKlineUrl = (params: { security: SecurityConfig; now?: Date }): URL => {
  const now = params.now ?? new Date();
  // 使用上海时区当前日期作为 begin 参数（远端返回倒序数据）
  const today = getShanghaiToday(now);
  const url = new URL(KLINE_ENDPOINT);
  url.search = new URLSearchParams({
    securityCode: params.security.symbol,
    period: PERIOD_DAY,
    count: KLINE_COUNT,
    begin: toUrlDate(today),
    adjust: params.security.adjust,
    // ts 参数用于绕过 CDN 缓存
    ts: String(now.getTime()),
  }).toString();
  return url;
};

/**
 * 从红色火箭 API 抓取并解析 K 线数据。
 * 返回原始条数（非裁剪后），由上层 service 负责裁剪 T-1 之后的数据。
 */
export const fetchRemoteKlineBars = async (params: { security: SecurityConfig }) => {
  const url = buildKlineUrl({ security: params.security });
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `${params.security.name} 下载失败: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const text = await response.text();
  return parseKlineJson({
    text,
    fileName: url.toString(),
    fallbackSymbol: params.security.symbol,
    adjType: params.security.adjType,
  });
};
