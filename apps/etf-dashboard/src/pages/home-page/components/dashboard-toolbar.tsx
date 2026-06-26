import { Button, Input, Segmented, Select, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { Security } from "../../../api/gen/etf-service/etf/v1/etf_pb";
import {
  PERIOD_OPTIONS,
  RANGE_OPTIONS,
  type ChartPeriod,
  type ChartRange,
} from "../../../utils/chart-data";

interface DashboardToolbarProps {
  securities: Security[];
  selectedSymbol: string | null;
  period: ChartPeriod;
  range: ChartRange;
  maText: string;
  isLoading: boolean;
  onSymbolChange: (symbol: string) => void;
  onPeriodChange: (period: ChartPeriod) => void;
  onRangeChange: (range: ChartRange) => void;
  onMaTextChange: (maText: string) => void;
  onRefresh: () => void;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
  const {
    securities,
    selectedSymbol,
    period,
    range,
    maText,
    isLoading,
    onSymbolChange,
    onPeriodChange,
    onRangeChange,
    onMaTextChange,
    onRefresh,
  } = props;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex min-w-[260px] flex-col gap-1">
        <span className="text-xs text-slate-500">标的</span>
        <Select
          value={selectedSymbol ?? undefined}
          loading={isLoading}
          options={securities.map((security) => ({
            value: security.symbol,
            label: `${security.name} ${security.symbol}`,
          }))}
          onChange={onSymbolChange}
          optionFilterProp="label"
          showSearch
        />
      </label>
      <Space orientation="vertical" size={4}>
        <span className="text-xs text-slate-500">周期</span>
        <Segmented<ChartPeriod>
          value={period}
          options={PERIOD_OPTIONS}
          onChange={(value) => onPeriodChange(value)}
        />
      </Space>
      <Space orientation="vertical" size={4}>
        <span className="text-xs text-slate-500">范围</span>
        <Segmented<ChartRange>
          value={range}
          options={RANGE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          onChange={(value) => onRangeChange(value)}
        />
      </Space>
      <label className="flex min-w-[190px] flex-col gap-1">
        <span className="text-xs text-slate-500">均线</span>
        <Input value={maText} onChange={(event) => onMaTextChange(event.target.value)} />
      </label>
      <Button icon={<ReloadOutlined />} loading={isLoading} onClick={onRefresh}>
        刷新
      </Button>
    </div>
  );
};
