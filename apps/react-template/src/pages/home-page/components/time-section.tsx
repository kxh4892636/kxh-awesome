// 实时时钟组件 - 使用 dayjs + setInterval 每 1 秒刷新当前时间
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Card, Tag } from "antd";

export const TimeSection = () => {
  const [now, setNow] = useState(dayjs());

  // 挂载时启动定时器，卸载时清除，避免内存泄漏
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
