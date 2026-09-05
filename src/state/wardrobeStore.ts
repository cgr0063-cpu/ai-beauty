import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";

export interface ClosetItem {
  id: string;
  photoUri: string | null;
  category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "other";
  label: string;
  color?: string;
  brand?: string;
  styleTags: string[];
  createdAt: number;
}

interface WardrobeState {
  items: ClosetItem[];
  addItem: (item: Omit<ClosetItem, "id" | "createdAt">) => void;
  updateItem: (id: string, patch: Partial<Pick<ClosetItem, "category" | "label" | "color" | "brand" | "styleTags">>) => void;
  removeItem: (id: string) => void;
  clearPhotoUris: () => void;
  reset: () => void;
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set({
          items: [
            ...get().items,
            { ...item, id: `${Date.now()}_${Math.round(Math.random() * 1e6)}`, createdAt: Date.now() },
          ],
        }),
      updateItem: (id, patch) => set({ items: get().items.map((i) => i.id === id ? { ...i, ...patch } : i) }),
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clearPhotoUris: () => set({ items: get().items.map((i) => ({ ...i, photoUri: null })) }),
      reset: () => set({ items: [] }),
    }),
    {
      name: "aibeauty.wardrobe.v1",
      storage: createAsyncStorageAdapter(),
    }
  )
);
