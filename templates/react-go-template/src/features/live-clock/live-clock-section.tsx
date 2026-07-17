import { Card, Tag } from "antd";
import type * as React from "react";
import { useCurrentTime } from "./use-current-time";

export const LiveClockSection: React.FC = (): React.ReactElement => {
  const now = useCurrentTime();

  return (
    <Card id="live-clock" title="dayjs - Current Time">
      <Tag color="processing">{now.format("YYYY-MM-DD HH:mm:ss")}</Tag>
    </Card>
  );
};
