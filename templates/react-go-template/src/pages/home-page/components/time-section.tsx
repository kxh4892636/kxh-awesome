// 实时时钟组件 - 使用 dayjs + setInterval 每 1 秒刷新当前时间
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TimeSection = () => {
  const [now, setNow] = useState(dayjs());

  // 挂载时启动定时器，卸载时清除，避免内存泄漏
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card id="time">
      <CardHeader>
        <CardTitle>dayjs - Current Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{now.format("YYYY-MM-DD HH:mm:ss")}</Badge>
      </CardContent>
    </Card>
  );
};
