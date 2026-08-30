import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { GeneratedLook } from "@/services/providers/ai/AIProvider";

export type LookFeedback = "love" | "not_for_me" | "never";

interface SavedLooksState {
  saved: GeneratedLook[];
  feedback: Record<string, LookFeedback>;
  saveLook: (look: GeneratedLook) => void;
  removeLook: (id: string) => void;
  isSaved: (id: string) => boolean;
  setFeedback: (id: string, feedback: LookFeedback | null) => void;
  reset: () => void;
}

export const useSavedLooksStore = create<SavedLooksState>()(
  persist(
    (set, get) => ({
      saved: [],
      feedback: {},
      saveLook: (look) => {
        if (get().saved.some((l) => l.id === look.id)) return;
        set({ saved: [look, ...get().saved] });
      },
      removeLook: (id) => {
        const nextFeedback = { ...get().feedback };
        delete nextFeedback[id];
        set({ saved: get().saved.filter((l) => l.id !== id), feedback: nextFeedback });
      },
      isSaved: (id) => get().saved.some((l) => l.id === id),
      setFeedback: (id, feedback) => {
        const next = { ...get().feedback };
        if (feedback) next[id] = feedback; else delete next[id];
        set({ feedback: next });
      },
      reset: () => set({ saved: [], feedback: {} }),
    }),
    { name: "aibeauty.savedLooks.v1", storage: createAsyncStorageAdapter() }
  )
);
