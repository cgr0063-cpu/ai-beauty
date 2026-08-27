import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { WeatherCondition } from "@/data/context";

export interface TodayContext {
  dateKey: string | null; // yyyy-mm-dd this context belongs to
  moodId: string | null;
  planId: string | null;
  gymSubOptionId: string | null;
  styleId: string | null;
  weatherCondition: WeatherCondition | null;
  temperatureC: number | null;
  zodiacApplied: boolean;
  tarotCardId: string | null;
}

interface TodayContextState extends TodayContext {
  setMood: (id: string | null) => void;
  setPlan: (id: string | null) => void;
  setGymSubOption: (id: string | null) => void;
  setStyle: (id: string | null) => void;
  setWeather: (condition: WeatherCondition | null, temperatureC?: number | null) => void;
  setZodiacApplied: (v: boolean) => void;
  setTarotCard: (id: string | null) => void;
  startNewDay: (dateKey: string) => void;
  reset: () => void;
}

const empty: TodayContext = {
  dateKey: null,
  moodId: null,
  planId: null,
  gymSubOptionId: null,
  styleId: null,
  weatherCondition: null,
  temperatureC: null,
  zodiacApplied: false,
  tarotCardId: null,
};

export const useTodayContextStore = create<TodayContextState>()(
  persist(
    (set) => ({
      ...empty,
      setMood: (id) => set({ moodId: id }),
      setPlan: (id) => set({ planId: id, gymSubOptionId: null }),
      setGymSubOption: (id) => set({ gymSubOptionId: id }),
      setStyle: (id) => set({ styleId: id }),
      setWeather: (condition, temperatureC = null) => set({ weatherCondition: condition, temperatureC }),
      setZodiacApplied: (v) => set({ zodiacApplied: v }),
      setTarotCard: (id) => set({ tarotCardId: id }),
      // Editing an earlier choice never wipes the rest — only startNewDay resets everything.
      startNewDay: (dateKey) => set({ ...empty, dateKey }),
      reset: () => set({ ...empty }),
    }),
    {
      name: "aibeauty.todayContext.v1",
      storage: createAsyncStorageAdapter(),
    }
  )
);
