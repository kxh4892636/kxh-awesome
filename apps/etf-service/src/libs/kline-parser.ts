import type { AdjType } from "../common/schema";
import type { NewDailyBarRow } from "../db/schema";
import { compareDate, parseDateMs } from "../utils/date";

export interface ParsedKlineData {
  /** 远端返回的证券代码（验证用） */
  securityCode: string;
  /** K 线数据的最早交易日 */
  earliestTradeDate: string;
  /** K 线数据的最新交易日 */
  latestTradeDate: string;
  /** 已按交易日升序排列的 K 线条数 */
  bars: NewDailyBarRow[];
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** 将 unknown 转为有限数字，失败抛出明确错误 */
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

/**
 * 解析红色火箭 API 返回的 K 线 JSON。
 *
 * 数据格式：columns 定义字段顺序（逗号分隔），items 用分号分隔行、逗号分隔列。
 * 容错策略：
 * - 根节点可能直接包含数据，也可能嵌套在 data 节点下
 * - 可选字段（volume、amount、change、changePercent、week）缺失时使用默认值
 * - 涨跌额/涨跌幅缺失时退回 close-open / (close-open)/open 作为近似
 */
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
  // 离线 fixture 和远端响应兼容两种形态：根节点直出，或包在 data 节点下。
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
  // 红色火箭接口用 columns 定义字段顺序、items 用分号分隔行；解析时不能假定固定列位置。
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
    // 部分历史行缺少涨跌字段，兜底只用于可视化展示，不反向修正行情源原始口径。
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

  // 源数据不保证按日期升序；下游 earliest/latest 和区间查询都依赖排序后的顺序。
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
