import { Card, Tag } from "antd";
import type { ReactElement } from "react";
import { useCurrentTime } from "../hooks/use-current-time";

export const LiveClockSection = (): ReactElement => {
  const now = useCurrentTime();

  return (
    <Card id="live-clock" title="dayjs - Current Time">
      <Tag color="processing">{now.format("YYYY-MM-DD HH:mm:ss")}</Tag>
    </Card>
  );
};
