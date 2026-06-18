import type { AdjType } from "../common/schema";
import type { NewDailyBarRow } from "../db/schema";
import { compareDate, parseDateMs } from "../utils/date";

export interface ParsedKlineData {
  securityCode: string;
  earliestTradeDate: string;
  latestTradeDate: string;
  bars: NewDailyBarRow[];
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const toFiniteNumber = (params: {
  value: unknown;
  fieldName: string;
  rowNumber: number;
}): number => {
  const number = Number(params.value);
  if (!Number.isFinite(number)) {
    throw new Error(`第 ${params.rowNumber} 行的 ${params.fieldName} 不是有效数字`);
  }
  return number;
};

const readOptionalNumber = (params: {
  value: unknown;
  fieldName: string;
  rowNumber: number;
  fallback: number;
}): number => {
  if (params.value === undefined || params.value === "") {
    return params.fallback;
  }

  return toFiniteNumber(params);
};

const parseDate = (params: { value: unknown; rowNumber: number }): string => {
  if (typeof params.value !== "string") {
    throw new Error(`第 ${params.rowNumber} 行的 tradeDate 不是 YYYY-MM-DD`);
  }
  const text = params.value;
  parseDateMs(text);
  return text;
};

export const parseKlineJson = (params: {
  text: string;
  fileName: string;
  fallbackSymbol: string;
  adjType: AdjType;
}): ParsedKlineData => {
  let payload: unknown;
  try {
    payload = JSON.parse(params.text);
  } catch (error) {
    throw new Error(`${params.fileName} JSON 格式错误: ${(error as Error).message}`);
  }

  const root = asRecord(payload);
  const dataNode = asRecord(root?.data);
  const indexPayload = dataNode ?? root;
  const columnsText = indexPayload?.columns;
  const itemsText = indexPayload?.items;

  if (typeof columnsText !== "string" || typeof itemsText !== "string") {
    throw new Error(`${params.fileName} 缺少 columns 或 items 字符串`);
  }

  const columns = columnsText
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
  const missing = ["tradeDate", "open", "high", "low", "close"].filter(
    (field) => !columns.includes(field),
  );

  if (missing.length > 0) {
    throw new Error(`${params.fileName} 缺少必要字段: ${missing.join(", ")}`);
  }

  const securityCode =
    typeof indexPayload?.securityCode === "string" && indexPayload.securityCode.length > 0
      ? indexPayload.securityCode
      : params.fallbackSymbol;
  const lines = itemsText.split(";").filter((line) => line.trim().length > 0);
  const bars = lines.map((line, index) => {
    const rowNumber = index + 1;
    const values = line.split(",");
    if (values.length < columns.length) {
      throw new Error(`${params.fileName} 第 ${rowNumber} 行字段数量不足`);
    }

    const record = Object.fromEntries(
      columns.map((column, columnIndex) => [column, values[columnIndex]]),
    );
    const tradeDate = parseDate({ value: record.tradeDate, rowNumber });
    const open = toFiniteNumber({ value: record.open, fieldName: "open", rowNumber });
    const high = toFiniteNumber({ value: record.high, fieldName: "high", rowNumber });
    const low = toFiniteNumber({ value: record.low, fieldName: "low", rowNumber });
    const close = toFiniteNumber({ value: record.close, fieldName: "close", rowNumber });
    const volume = readOptionalNumber({
      value: record.volume,
      fieldName: "volume",
      rowNumber,
      fallback: 0,
    });
    const amount = readOptionalNumber({
      value: record.amount,
      fieldName: "amount",
      rowNumber,
      fallback: 0,
    });
    const changeAmount = readOptionalNumber({
      value: record.change,
      fieldName: "change",
      rowNumber,
      fallback: close - open,
    });
    const changePercent = readOptionalNumber({
      value: record.changePercent,
      fieldName: "changePercent",
      rowNumber,
      fallback: open === 0 ? 0 : ((close - open) / open) * 100,
    });

    return {
      symbol: params.fallbackSymbol,
      adjType: params.adjType,
      tradeDate,
      open,
      high,
      low,
      close,
      volume,
      amount,
      changeAmount,
      changePercent,
      rawWeekday: String(record.week ?? ""),
    };
  });

  bars.sort((left, right) => compareDate(left.tradeDate, right.tradeDate));

  if (bars.length === 0 || !bars[0] || !bars[bars.length - 1]) {
    throw new Error(`${params.fileName} items 中没有可用数据`);
  }

  return {
    securityCode,
    earliestTradeDate: bars[0].tradeDate,
    latestTradeDate: bars[bars.length - 1].tradeDate,
    bars,
  };
};
