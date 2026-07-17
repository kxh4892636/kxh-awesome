import { clamp } from "es-toolkit";
import { create } from "zustand";
import type { StateCreator } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

type CounterStateCreator = StateCreator<CounterState>;
type SetCounterState = Parameters<CounterStateCreator>[0];

const COUNTER_MIN = 0;
const COUNTER_MAX = 10;

const createCounterState: CounterStateCreator = (set: SetCounterState): CounterState => ({
  count: COUNTER_MIN,
  increment: (): void =>
    set(
      (state: CounterState): Partial<CounterState> => ({
        count: clamp(state.count + 1, COUNTER_MIN, COUNTER_MAX),
      }),
    ),
  decrement: (): void =>
    set(
      (state: CounterState): Partial<CounterState> => ({
        count: clamp(state.count - 1, COUNTER_MIN, COUNTER_MAX),
      }),
    ),
});

export const useCounter = create<CounterState>(createCounterState);
