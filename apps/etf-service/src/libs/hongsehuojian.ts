import type { SecurityConfig } from "../config/securities";
import { KLINE_COUNT, KLINE_ENDPOINT, PERIOD_DAY } from "../config/securities";
import { parseKlineJson } from "./kline-parser";
import { getShanghaiToday, toUrlDate } from "../utils/date";

export const buildKlineUrl = (params: { security: SecurityConfig; now?: Date }): URL => {
  const now = params.now ?? new Date();
  const today = getShanghaiToday(now);
  const url = new URL(KLINE_ENDPOINT);
  url.search = new URLSearchParams({
    securityCode: params.security.symbol,
    period: PERIOD_DAY,
    count: KLINE_COUNT,
    begin: toUrlDate(today),
    adjust: params.security.adjust,
    ts: String(now.getTime()),
  }).toString();
  return url;
};

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
