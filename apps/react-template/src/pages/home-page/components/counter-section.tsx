import { Button, Card } from "antd";

interface CounterSectionProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const CounterSection = (props: CounterSectionProps) => {
  const { count, onIncrement, onDecrement } = props;

  return (
    <Card id="counter" title="Zustand Counter + es-toolkit clamp(0, 100)">
      <div className="flex items-center gap-4">
        <Button onClick={onDecrement}>-</Button>
        <span className="text-2xl font-bold">{count}</span>
        <Button type="primary" onClick={onIncrement}>
          +
        </Button>
      </div>
    </Card>
  );
};
