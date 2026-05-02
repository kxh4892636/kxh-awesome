import { clamp } from "es-toolkit";
import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounter = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: clamp(state.count + 1, 0, 100) })),
  decrement: () => set((state) => ({ count: clamp(state.count - 1, 0, 100) })),
}));
