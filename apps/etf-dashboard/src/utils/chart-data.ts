import type { DailyBar } from "../api/gen/etf-service/etf/v1/etf_pb";

export type ChartPeriod = "day" | "week" | "month" | "quarter" | "year";
export type ChartRange = "1y" | "3y" | "5y" | "10y" | "all";

export interface ChartBar extends DailyBar {
  dateMs: number;
  year: number;
  month: number;
  day: number;
  startDate: string;
  endDate: string;
  label: string;
}

export interface MaSeries {
  period: number;
  color: string;
  values: Array<number | null>;
}

export const PERIOD_OPTIONS: Array<{ label: string; value: ChartPeriod }> = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "quarter", label: "季" },
  { value: "year", label: "年" },
];

export const RANGE_OPTIONS: Array<{ label: string; value: ChartRange; years: number | null }> = [
  { value: "1y", label: "近一年", years: 1 },
  { value: "3y", label: "近三年", years: 3 },
  { value: "5y", label: "近五年", years: 5 },
  { value: "10y", label: "近十年", years: 10 },
  { value: "all", label: "全部", years: null },
];

export const MA_COLORS = [
  "#235fd6",
  "#d58a1f",
  "#7b50b6",
  "#00858a",
  "#c94d8c",
  "#56687a",
  "#7a7d1c",
  "#0d70a6",
];

const parseDateParts = (dateText: string) => {
  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const dateMs = Date.UTC(year, month - 1, day);

  return { year, month, day, dateMs };
};

const formatDateMs = (dateMs: number): string => {
  const date = new Date(dateMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekKey = (record: ChartBar): string => {
  const date = new Date(record.dateMs);
  const day = date.getUTCDay();
  // 周线按自然周一归组，避免周末和跨年边界让同一交易周拆成两段。
  const offset = day === 0 ? -6 : 1 - day;
  return formatDateMs(record.dateMs + offset * 86_400_000);
};

const getPeriodKey = (record: ChartBar, period: ChartPeriod): string => {
  if (period === "week") {
    return getWeekKey(record);
  }
  if (period === "month") {
    return `${record.year}-${String(record.month).padStart(2, "0")}`;
  }
  if (period === "quarter") {
    return `${record.year}-Q${Math.floor((record.month - 1) / 3) + 1}`;
  }
  if (period === "year") {
    return `${record.year}`;
  }
  return record.tradeDate;
};

export const normalizeBars = (bars: DailyBar[]): ChartBar[] =>
  bars.map((bar) => {
    const dateParts = parseDateParts(bar.tradeDate);
    return {
      ...bar,
      ...dateParts,
      startDate: bar.tradeDate,
      endDate: bar.tradeDate,
      label: bar.tradeDate,
    };
  });

export const aggregateBars = (params: { bars: DailyBar[]; period: ChartPeriod }): ChartBar[] => {
  const normalized = normalizeBars(params.bars);
  if (params.period === "day") {
    return normalized;
  }

  const groups: Array<{ key: string; records: ChartBar[] }> = [];
  normalized.forEach((record) => {
    const key = getPeriodKey(record, params.period);
    const current = groups.at(-1);
    if (!current || current.key !== key) {
      groups.push({ key, records: [record] });
      return;
    }
    current.records.push(record);
  });

  return groups.map((group, index) => {
    const first = group.records[0] as ChartBar;
    const last = group.records[group.records.length - 1] as ChartBar;
    const high = Math.max(...group.records.map((record) => record.high));
    const low = Math.min(...group.records.map((record) => record.low));
    const volume = group.records.reduce((sum, record) => sum + record.volume, 0);
    const amount = group.records.reduce((sum, record) => sum + record.amount, 0);
    const previousGroup = groups[index - 1];
    const previousClose = previousGroup?.records.at(-1)?.close;
    // 周/月/季/年 K 线涨跌幅以“上一周期收盘价”为基准，首个周期退回用本期开盘价。
    const baseClose = previousClose ?? first.open;
    const changeAmount = last.close - baseClose;
    const changePercent = baseClose === 0 ? 0 : (changeAmount / baseClose) * 100;

    return {
      ...last,
      open: first.open,
      high,
      low,
      close: last.close,
      volume,
      amount,
      changeAmount,
      changePercent,
      startDate: first.tradeDate,
      endDate: last.tradeDate,
      label: group.key,
    };
  });
};

export const getRangeBars = (params: { bars: ChartBar[]; range: ChartRange }): ChartBar[] => {
  const option = RANGE_OPTIONS.find((item) => item.value === params.range);
  if (!option?.years || params.bars.length === 0) {
    return params.bars;
  }

  const last = params.bars[params.bars.length - 1] as ChartBar;
  const date = new Date(last.dateMs);
  const startMs = Date.UTC(
    date.getUTCFullYear() - option.years,
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return params.bars.filter((bar) => bar.dateMs >= startMs);
};

export const parseMaPeriods = (text: string): number[] => {
  const seen = new Set<number>();
  return text
    .split(/[,\s，、]+/)
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isInteger(value) && value > 0 && value <= 999)
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
};

export const calculateMaSeries = (params: { bars: ChartBar[]; periods: number[] }): MaSeries[] =>
  params.periods.map((period, periodIndex) => {
    const values: Array<number | null> = [];
    let rollingSum = 0;
    // MA 用滚动和滑动窗口，前 period - 1 个点保留 null，让渲染层自然跳过未成形均线。
    params.bars.forEach((record, index) => {
      rollingSum += record.close;
      if (index >= period) {
        rollingSum -= params.bars[index - period]?.close ?? 0;
      }
      values.push(index >= period - 1 ? rollingSum / period : null);
    });

    return {
      period,
      color: MA_COLORS[periodIndex % MA_COLORS.length] ?? "#235fd6",
      values,
    };
  });
