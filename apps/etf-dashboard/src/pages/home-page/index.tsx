import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Spin, Typography } from "antd";
import { useDailyBars, useSecurities } from "../../hooks/use-market";
import { DashboardToolbar } from "./components/dashboard-toolbar";
import { KlineChart } from "./components/kline-chart";
import { MarketSummary } from "./components/market-summary";
import {
  aggregateBars,
  getRangeBars,
  type ChartPeriod,
  type ChartRange,
} from "../../utils/chart-data";

/**
 * 首页负责串起标的选择、行情查询和图表视图，是 ETF 看板的主要用户工作流入口。
 */
export const HomePage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>("day");
  const [range, setRange] = useState<ChartRange>("all");
  const [maText, setMaText] = useState("5 8 13 21 34 55");
  const securitiesQuery = useSecurities();
  const dailyBarsQuery = useDailyBars(selectedSymbol);

  useEffect(() => {
    // 首屏自动选择第一个可用标的，让看板在证券列表返回后立即形成有效查询。
    if (!selectedSymbol && securitiesQuery.data.length > 0) {
      setSelectedSymbol(securitiesQuery.data[0]?.symbol ?? null);
    }
  }, [securitiesQuery.data, selectedSymbol]);

  const fullChartBars = useMemo(() => {
    const bars = dailyBarsQuery.data?.bars ?? [];
    return aggregateBars({ bars, period });
  }, [dailyBarsQuery.data?.bars, period]);

  const chartBars = useMemo(
    () =>
      getRangeBars({
        bars: fullChartBars,
        range,
      }),
    [fullChartBars, range],
  );

  const selectedSecurity = securitiesQuery.data.find((item) => item.symbol === selectedSymbol);
  const hasError = securitiesQuery.isError || dailyBarsQuery.isError;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
      <div>
        <Typography.Title level={3} className="m-0">
          ETF K 线看板
        </Typography.Title>
        <Typography.Text type="secondary">
          {selectedSecurity
            ? `${selectedSecurity.name} · ${selectedSecurity.symbol}`
            : "加载可用标的"}
        </Typography.Text>
      </div>
      <Card>
        <DashboardToolbar
          securities={securitiesQuery.data}
          selectedSymbol={selectedSymbol}
          period={period}
          range={range}
          maText={maText}
          isLoading={securitiesQuery.isLoading || dailyBarsQuery.isFetching}
          onSymbolChange={setSelectedSymbol}
          onPeriodChange={setPeriod}
          onRangeChange={setRange}
          onMaTextChange={setMaText}
          onRefresh={() => {
            void dailyBarsQuery.refetch();
          }}
        />
      </Card>
      {hasError && (
        <Alert type="error" showIcon message="数据加载失败，请确认 etf-service 已启动" />
      )}
      <MarketSummary data={dailyBarsQuery.data} />
      <Card
        title="K 线"
        extra={
          dailyBarsQuery.data?.meta ? (
            <Typography.Text type="secondary">
              {dailyBarsQuery.data.meta.cacheStatus} · {dailyBarsQuery.data.meta.rows} 条
            </Typography.Text>
          ) : null
        }
      >
        <Spin spinning={dailyBarsQuery.isLoading && !dailyBarsQuery.data}>
          <KlineChart bars={chartBars} maBars={fullChartBars} maText={maText} />
        </Spin>
      </Card>
    </div>
  );
};
