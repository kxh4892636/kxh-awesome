import { useEffect, useMemo, useRef, useState } from "react";
import { Empty } from "antd";
import {
  getChartLayout,
  getVisibleIndexFromX,
  isPointInPlot,
  renderKlineCanvas,
} from "./chart-renderer";
import { calculateMaSeries, parseMaPeriods, type ChartBar } from "../../../utils/chart-data";
import { formatLargeNumber, formatNumber, formatPercent } from "../../../utils/format";

const MIN_VISIBLE_CANDLES = 20;
const WHEEL_ZOOM_IN_RATE = 0.82;
const WHEEL_ZOOM_OUT_RATE = 1.22;

interface KlineChartProps {
  bars: ChartBar[];
  maBars: ChartBar[];
  maText: string;
}

interface ZoomWindow {
  start: number;
  end: number;
}

interface TooltipState {
  index: number;
  left: number;
  top: number;
}

interface DragState {
  startX: number;
  zoomStart: number;
  visibleCount: number;
  totalCount: number;
  step: number;
}

const getCanvasPoint = (params: {
  canvas: HTMLCanvasElement;
  event: React.MouseEvent | MouseEvent;
}) => {
  const rect = params.canvas.getBoundingClientRect();
  return {
    rect,
    x: params.event.clientX - rect.left,
    y: params.event.clientY - rect.top,
  };
};

const normalizeZoom = (params: { zoom: ZoomWindow | null; totalCount: number }): ZoomWindow => {
  if (!params.zoom || params.totalCount <= 0) {
    return { start: 0, end: params.totalCount };
  }

  const minVisible = Math.min(MIN_VISIBLE_CANDLES, params.totalCount);
  const currentCount = Math.max(minVisible, params.zoom.end - params.zoom.start);
  const visibleCount = Math.min(currentCount, params.totalCount);
  const start = Math.min(
    Math.max(params.zoom.start, 0),
    Math.max(0, params.totalCount - visibleCount),
  );

  return { start, end: start + visibleCount };
};

const getMaStartIndex = (params: { bars: ChartBar[]; maBars: ChartBar[] }): number => {
  const firstBar = params.bars[0];
  if (!firstBar) {
    return 0;
  }

  const identityIndex = params.maBars.indexOf(firstBar);
  if (identityIndex >= 0) {
    return identityIndex;
  }

  const matchedIndex = params.maBars.findIndex(
    (record) =>
      record.startDate === firstBar.startDate &&
      record.endDate === firstBar.endDate &&
      record.label === firstBar.label,
  );
  return Math.max(matchedIndex, 0);
};

const buildTooltipRows = (
  record: ChartBar,
  maValues: Array<{ label: string; value: number; color: string }>,
) => {
  const trendClass = record.changeAmount >= 0 ? "text-red-600" : "text-emerald-600";
  const title =
    record.startDate !== record.endDate
      ? `${record.startDate} 至 ${record.endDate}`
      : record.tradeDate;

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-4 font-medium">
        <span>{title}</span>
        <span className={trendClass}>{formatPercent(record.changePercent)}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs">
        <span>开盘</span>
        <b className="text-right">{formatNumber(record.open, 4)}</b>
        <span>最高</span>
        <b className="text-right">{formatNumber(record.high, 4)}</b>
        <span>最低</span>
        <b className="text-right">{formatNumber(record.low, 4)}</b>
        <span>收盘</span>
        <b className="text-right">{formatNumber(record.close, 4)}</b>
        <span>涨跌额</span>
        <b className={`text-right ${trendClass}`}>
          {record.changeAmount >= 0 ? "+" : ""}
          {formatNumber(record.changeAmount, 4)}
        </b>
        <span>成交量</span>
        <b className="text-right">{formatLargeNumber(record.volume)}</b>
        <span>成交额</span>
        <b className="text-right">{formatLargeNumber(record.amount)}</b>
      </div>
      {maValues.length > 0 && (
        <div className="mt-2 border-t border-slate-200 pt-2 text-xs">
          {maValues.map((item) => (
            <div key={item.label} className="flex justify-between gap-4">
              <span>{item.label}</span>
              <b style={{ color: item.color }}>{formatNumber(item.value, 2)}</b>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export const KlineChart = (props: KlineChartProps) => {
  const { bars, maBars, maText } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [zoom, setZoom] = useState<ZoomWindow | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hiddenPeriods, setHiddenPeriods] = useState<Set<number>>(new Set());

  const maPeriods = useMemo(() => parseMaPeriods(maText), [maText]);
  const zoomWindow = normalizeZoom({ zoom, totalCount: bars.length });
  const visibleBars = bars.slice(zoomWindow.start, zoomWindow.end);
  const maStartIndex = useMemo(() => getMaStartIndex({ bars, maBars }), [bars, maBars]);
  const maSourceSeries = useMemo(
    () => calculateMaSeries({ bars: maBars, periods: maPeriods }),
    [maBars, maPeriods],
  );
  const maSeries = useMemo(
    () =>
      maSourceSeries
        .filter((series) => !hiddenPeriods.has(series.period))
        .map((series) => ({
          ...series,
          values: series.values.slice(
            maStartIndex + zoomWindow.start,
            maStartIndex + zoomWindow.end,
          ),
        })),
    [hiddenPeriods, maSourceSeries, maStartIndex, zoomWindow.end, zoomWindow.start],
  );

  useEffect(() => {
    setZoom(null);
    setTooltip(null);
    setHiddenPeriods(new Set());
  }, [bars, maText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    renderKlineCanvas({
      canvas,
      bars: visibleBars,
      maSeries,
      hoverIndex: tooltip?.index ?? null,
    });
  }, [maSeries, tooltip?.index, visibleBars]);

  const updateTooltip = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas || dragRef.current || visibleBars.length === 0) {
      return;
    }
    const { rect, x, y } = getCanvasPoint({ canvas, event });
    const layout = getChartLayout({ width: rect.width, height: rect.height });
    if (!isPointInPlot({ layout, x, y })) {
      setTooltip(null);
      return;
    }
    const index = getVisibleIndexFromX({ x, layout, visibleLength: visibleBars.length });
    setTooltip({
      index,
      left: Math.min(Math.max(x + 14, 8), Math.max(8, rect.width - 250)),
      top: Math.min(Math.max(y + 14, 8), Math.max(8, rect.height - 250)),
    });
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement> | WheelEvent): void => {
    const canvas = canvasRef.current;
    if (!canvas || visibleBars.length === 0) {
      return;
    }
    const { rect, x, y } = getCanvasPoint({ canvas, event });
    const layout = getChartLayout({ width: rect.width, height: rect.height });
    if (!isPointInPlot({ layout, x, y })) {
      return;
    }
    event.preventDefault();
    const visibleIndex = getVisibleIndexFromX({ x, layout, visibleLength: visibleBars.length });
    const anchorIndex = zoomWindow.start + visibleIndex;
    const anchorRatio = visibleBars.length <= 1 ? 0 : visibleIndex / (visibleBars.length - 1);
    const rate = event.deltaY < 0 ? WHEEL_ZOOM_IN_RATE : WHEEL_ZOOM_OUT_RATE;
    const minVisible = Math.min(MIN_VISIBLE_CANDLES, bars.length);
    const nextVisible = Math.min(
      Math.max(Math.round(visibleBars.length * rate), minVisible),
      bars.length,
    );
    if (nextVisible === bars.length) {
      setZoom(null);
      return;
    }
    const nextStart = Math.round(anchorIndex - anchorRatio * (nextVisible - 1));
    setZoom({
      start: Math.min(Math.max(nextStart, 0), Math.max(0, bars.length - nextVisible)),
      end: Math.min(Math.max(nextStart, 0), Math.max(0, bars.length - nextVisible)) + nextVisible,
    });
    setTooltip(null);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas || event.button !== 0 || bars.length <= visibleBars.length) {
      return;
    }
    const { rect, x, y } = getCanvasPoint({ canvas, event });
    const layout = getChartLayout({ width: rect.width, height: rect.height });
    if (!isPointInPlot({ layout, x, y })) {
      return;
    }

    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      zoomStart: zoomWindow.start,
      visibleCount: visibleBars.length,
      totalCount: bars.length,
      step: layout.plotWidth / Math.max(visibleBars.length, 1),
    };
    setTooltip(null);
  };

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", handleWheel, true);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (!tooltip) {
      return;
    }

    const handleWindowMove = (event: MouseEvent): void => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) {
        setTooltip(null);
      }
    };

    window.addEventListener("mousemove", handleWindowMove);
    return () => {
      window.removeEventListener("mousemove", handleWindowMove);
    };
  }, [tooltip]);

  useEffect(() => {
    const handleMove = (event: MouseEvent): void => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const delta = Math.round((event.clientX - drag.startX) / Math.max(drag.step, 1));
      const start = Math.min(
        Math.max(drag.zoomStart - delta, 0),
        drag.totalCount - drag.visibleCount,
      );
      setZoom({ start, end: start + drag.visibleCount });
    };
    const handleUp = (): void => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const tooltipRecord = tooltip ? visibleBars[tooltip.index] : null;
  const tooltipMaValues = tooltip
    ? maSeries
        .map((series) => ({
          label: `MA${series.period}`,
          value: series.values[tooltip.index],
          color: series.color,
        }))
        .filter((item): item is { label: string; value: number; color: string } =>
          Number.isFinite(item.value),
        )
    : [];

  return (
    <div className="relative min-h-[440px] overflow-hidden rounded border border-slate-200 bg-white">
      {bars.length === 0 ? (
        <div className="flex h-[440px] items-center justify-center">
          <Empty description="当前筛选下没有可展示的数据" />
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="block h-[440px] w-full cursor-crosshair select-none"
            onMouseMove={updateTooltip}
            onMouseLeave={() => setTooltip(null)}
            onMouseDown={handleMouseDown}
          />
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-2">
            {maSourceSeries.map((series) => (
              <button
                key={series.period}
                type="button"
                className={`rounded border px-2 py-1 text-xs ${
                  hiddenPeriods.has(series.period)
                    ? "border-slate-200 text-slate-400"
                    : "border-slate-300"
                }`}
                onClick={() => {
                  setHiddenPeriods((current) => {
                    const next = new Set(current);
                    if (next.has(series.period)) {
                      next.delete(series.period);
                    } else {
                      next.add(series.period);
                    }
                    return next;
                  });
                }}
              >
                <span
                  className="mr-1 inline-block size-2 rounded-full"
                  style={{ background: series.color }}
                />
                MA{series.period}
              </button>
            ))}
          </div>
          {tooltip && tooltipRecord && (
            <div
              className="pointer-events-none absolute z-10 w-[236px] rounded border border-slate-200 bg-white/95 p-3 text-slate-700 shadow-lg"
              style={{ left: tooltip.left, top: tooltip.top }}
            >
              {buildTooltipRows(tooltipRecord, tooltipMaValues)}
            </div>
          )}
        </>
      )}
    </div>
  );
};
