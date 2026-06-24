import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Space, Statistic } from "antd";

interface CounterSectionProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const CounterSection = (props: CounterSectionProps) => {
  const { count, onIncrement, onDecrement } = props;

  return (
    <Card id="counter" title="Zustand Counter + es-toolkit clamp(0, 100)">
      <Space align="center" size="middle">
        <Button aria-label="Decrement" icon={<MinusOutlined />} onClick={onDecrement} />
        <Statistic value={count} valueStyle={{ minWidth: 48, textAlign: "center" }} />
        <Button
          aria-label="Increment"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onIncrement}
        />
      </Space>
    </Card>
  );
};
