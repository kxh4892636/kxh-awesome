import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Space, Statistic } from "antd";
import type * as React from "react";
import { useCounter } from "./counter-store";

export const CounterSection: React.FC = (): React.ReactElement => {
  const { count, increment, decrement } = useCounter();

  return (
    <Card id="counter" title="Zustand Counter + es-toolkit clamp(0, 10)">
      <Space align="center" size="middle">
        <Button aria-label="Decrement" icon={<MinusOutlined />} onClick={decrement} />
        <Statistic value={count} styles={{ content: { minWidth: 48, textAlign: "center" } }} />
        <Button aria-label="Increment" type="primary" icon={<PlusOutlined />} onClick={increment} />
      </Space>
    </Card>
  );
};
