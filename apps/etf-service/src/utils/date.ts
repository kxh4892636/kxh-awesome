const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const compareDate = (left: string, right: string): number => left.localeCompare(right);

export const maxDate = (left: string, right: string): string =>
  compareDate(left, right) >= 0 ? left : right;

export const minDate = (left: string, right: string): string =>
  compareDate(left, right) <= 0 ? left : right;

export const parseDateMs = (dateText: string): number => {
  const match = DATE_PATTERN.exec(dateText);
  if (!match) {
    throw new Error(`Invalid date: ${dateText}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateMs = Date.UTC(year, month - 1, day);
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

export const formatDateMs = (dateMs: number): string => {
  const date = new Date(dateMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (params: { dateText: string; days: number }): string =>
  formatDateMs(parseDateMs(params.dateText) + params.days * 86_400_000);

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

export const isWeekend = (dateText: string): boolean => {
  const day = new Date(parseDateMs(dateText)).getUTCDay();
  return day === 0 || day === 6;
};

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

export const getTMinusOneDate = (now = new Date()): string =>
  addDays({ dateText: getShanghaiToday(now), days: -1 });

export const toUrlDate = (dateText: string): string => dateText.replaceAll("-", "");
