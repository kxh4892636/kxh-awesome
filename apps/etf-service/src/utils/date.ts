/** YYYY-MM-DD 格式正则，parseDateMs 依赖此模式解析并验证日期合法性 */
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 按字符串字典序比较两个 YYYY-MM-DD 日期。返回负数=left早于right，0=相等，正数=left晚于right。 */
export const compareDate = (left: string, right: string): number => left.localeCompare(right);

/** 返回两个日期中较晚的那个 */
export const maxDate = (left: string, right: string): string =>
  compareDate(left, right) >= 0 ? left : right;

/** 返回两个日期中较早的那个 */
export const minDate = (left: string, right: string): string =>
  compareDate(left, right) <= 0 ? left : right;

/**
 * 将 YYYY-MM-DD 字符串解析为 UTC 毫秒时间戳。
 * 使用 Date.UTC 避免本地时区干扰，并回校验年月日确保日期合法（排除 2-30 等无效日期）。
 * 抛出 Error 如果格式不匹配或日期不合法。
 */
export const parseDateMs = (dateText: string): number => {
  const match = DATE_PATTERN.exec(dateText);
  if (!match) {
    throw new Error(`Invalid date: ${dateText}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateMs = Date.UTC(year, month - 1, day);
  // 回校验：Date.UTC 会自动修正越界日期（如 2-30 → 3-2），必须排除
  const date = new Date(dateMs);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${dateText}`);
  }

  return dateMs;
};

/** 将 UTC 毫秒时间戳格式化为 YYYY-MM-DD */
export const formatDateMs = (dateMs: number): string => {
  const date = new Date(dateMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** 在指定日期上增加/减少天数，返回 YYYY-MM-DD */
export const addDays = (params: { dateText: string; days: number }): string =>
  formatDateMs(parseDateMs(params.dateText) + params.days * 86_400_000);

/** 列出 [startDate, endDate] 区间内每一天的 YYYY-MM-DD 数组（闭区间） */
export const listDates = (params: { startDate: string; endDate: string }): string[] => {
  const dates: string[] = [];
  let currentMs = parseDateMs(params.startDate);
  const endMs = parseDateMs(params.endDate);

  while (currentMs <= endMs) {
    dates.push(formatDateMs(currentMs));
    currentMs += 86_400_000;
  }

  return dates;
};

/** 判断给定日期是否为周六或周日（UTC 时区） */
export const isWeekend = (dateText: string): boolean => {
  const day = new Date(parseDateMs(dateText)).getUTCDay();
  return day === 0 || day === 6;
};

/**
 * 获取上海时区的当前日期（YYYY-MM-DD）。
 * 使用 Intl.DateTimeFormat 而非 TZ 环境变量，避免跨平台时区不一致。
 */
export const getShanghaiToday = (now = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

/**
 * 获取 T-1（上海时区的昨天），用于裁剪 K 线数据。
 * 保证不返回当天可能未收盘的盘中数据。
 */
export const getTMinusOneDate = (now = new Date()): string =>
  addDays({ dateText: getShanghaiToday(now), days: -1 });

/** 将 YYYY-MM-DD 转为 YYYYMMDD 格式，用于拼接远端 API URL 参数 */
export const toUrlDate = (dateText: string): string => dateText.replaceAll("-", "");
