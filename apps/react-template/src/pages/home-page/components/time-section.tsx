import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Card, Tag } from "antd";

export const TimeSection = () => {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card id="time" title="dayjs - Current Time">
      <Tag color="green">{now.format("YYYY-MM-DD HH:mm:ss")}</Tag>
    </Card>
  );
};
