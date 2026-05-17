// 计数器组件 - 展示 Zustand 全局状态，通过 props 接收 count 和操作回调
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CounterSectionProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const CounterSection = (props: CounterSectionProps) => {
  const { count, onIncrement, onDecrement } = props;

  return (
    <Card id="counter">
      <CardHeader>
        <CardTitle>Zustand Counter + es-toolkit clamp(0, 100)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onDecrement}>
            -
          </Button>
          <span className="text-2xl font-bold">{count}</span>
          <Button onClick={onIncrement}>+</Button>
        </div>
      </CardContent>
    </Card>
  );
};
