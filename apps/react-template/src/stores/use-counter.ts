// Zustand 计数器 Store - 全局共享状态，范围 0-100，使用 es-toolkit clamp 限幅
import { clamp } from "es-toolkit";
import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// useCounter 创建全局计数器，递增/递减均通过 clamp(0, 100) 约束边界
export const useCounter = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: clamp(state.count + 1, 0, 100) })),
  decrement: () => set((state) => ({ count: clamp(state.count - 1, 0, 100) })),
}));
