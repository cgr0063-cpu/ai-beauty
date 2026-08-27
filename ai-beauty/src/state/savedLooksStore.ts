import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { GeneratedLook } from "@/services/providers/ai/AIProvider";

interface SavedLooksState {
  saved: GeneratedLook[];
  saveLook: (look: GeneratedLook) => void;
  removeLook: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedLooksStore = create<SavedLooksState>()(
  persist(
    (set, get) => ({
      saved: [],
      saveLook: (look) => {
        if (get().saved.some((l) => l.id === look.id)) return;
        set({ saved: [look, ...get().saved].slice(0, 100) });
      },
      removeLook: (id) => set({ saved: get().saved.filter((l) => l.id !== id) }),
      isSaved: (id) => get().saved.some((l) => l.id === id),
    }),
    { name: "aibeauty.savedLooks.v1", storage: createAsyncStorageAdapter() }
  )
);
