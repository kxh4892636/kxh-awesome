import { useCallback, useEffect, useRef, useState, type FC, type ReactElement } from "react";
import { Empty } from "antd";
import type { ChartBar, MaSeries } from "./chart-data";
import { renderKlineCanvas } from "./kline-canvas";
import { useKlineInteractions } from "./kline-interactions";
import { KlineTooltip, type TooltipMaValue } from "./kline-tooltip";
import { MaLegend } from "./ma-legend";
import { useMaSeries } from "./use-ma-series";

interface KlineChartProps {
  bars: ChartBar[];
  maBars: ChartBar[];
  maText: string;
  virtualMaText?: string;
}

const getTooltipMaValues = (params: { series: MaSeries[]; index: number }): TooltipMaValue[] =>
  params.series
    .map(
      (series: MaSeries): TooltipMaValue => ({
        label: `MA${series.period}`,
        value: series.values[params.index] ?? Number.NaN,
        color: series.color,
      }),
    )
    .filter((item: TooltipMaValue): boolean => Number.isFinite(item.value));

/** K 线入口只编排行情、均线和交互模块，对页面保持单一稳定接口。 */
export const KlineChart: FC<KlineChartProps> = (props: KlineChartProps): ReactElement => {
  const { bars, maBars, maText, virtualMaText = "" } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hiddenPeriods, setHiddenPeriods] = useState<Set<number>>(new Set());
  const [isVirtualMaHidden, setIsVirtualMaHidden] = useState(false);
  const interactions = useKlineInteractions({ canvasRef, bars });
  const { maSourceSeries, maSeries, virtualMa } = useMaSeries({
    maText,
    virtualMaText,
    maBars,
    bars,
    zoomWindow: interactions.zoomWindow,
    hiddenPeriods,
  });

  useEffect((): void => setHiddenPeriods(new Set()), [bars, maText]);
  // 虚拟图例显隐只随表达式重置，不联动 MA 图例的 hiddenPeriods。
  useEffect((): void => setIsVirtualMaHidden(false), [virtualMaText]);
  useEffect((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderKlineCanvas({
      canvas,
      bars: interactions.visibleBars,
      maSeries,
      virtualMa: isVirtualMaHidden ? null : virtualMa,
      hoverIndex: interactions.tooltip?.index ?? null,
    });
  }, [
    interactions.tooltip?.index,
    interactions.visibleBars,
    isVirtualMaHidden,
    maSeries,
    virtualMa,
  ]);

  const toggleMa = useCallback((period: number): void => {
    setHiddenPeriods((current: Set<number>): Set<number> => {
      const next = new Set(current);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }, []);

  const toggleVirtualMa = useCallback((): void => {
    setIsVirtualMaHidden((current: boolean): boolean => !current);
  }, []);

  const tooltipRecord = interactions.tooltip
    ? interactions.visibleBars[interactions.tooltip.index]
    : undefined;
  const tooltipMaValues = interactions.tooltip
    ? getTooltipMaValues({ series: maSeries, index: interactions.tooltip.index })
    : [];
  const tooltipVirtualMaValue = ((): TooltipMaValue | null => {
    if (!interactions.tooltip || !virtualMa || isVirtualMaHidden) return null;
    const value = virtualMa.values[interactions.tooltip.index];
    if (!Number.isFinite(value)) return null;
    return { label: "虚拟均线", value: value as number, color: virtualMa.color };
  })();

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
            onMouseMove={interactions.handleMouseMove}
            onMouseLeave={interactions.clearTooltip}
            onMouseDown={interactions.handleMouseDown}
          />
          <MaLegend
            series={maSourceSeries}
            hiddenPeriods={hiddenPeriods}
            onToggle={toggleMa}
            virtualMa={
              virtualMa
                ? { color: virtualMa.color, hidden: isVirtualMaHidden, onToggle: toggleVirtualMa }
                : null
            }
          />
          {interactions.tooltip && tooltipRecord && (
            <KlineTooltip
              record={tooltipRecord}
              maValues={tooltipMaValues}
              virtualMaValue={tooltipVirtualMaValue}
              left={interactions.tooltip.left}
              top={interactions.tooltip.top}
            />
          )}
        </>
      )}
    </div>
  );
};
