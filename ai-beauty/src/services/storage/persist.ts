import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * Local-first persistence. Every store in /src/state uses this so the app
 * remains fully useful offline / before any backend is configured.
 *
 * Cloud sync (future): swap this adapter for one that also writes to a
 * remote store, keyed by userId, without changing any store's shape —
 * stores never talk to AsyncStorage directly, only through this file.
 */
export function createAsyncStorageAdapter<T>(): PersistStorage<T> {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      const raw = await AsyncStorage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: StorageValue<T>) => {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: async (name: string) => {
      await AsyncStorage.removeItem(name);
    },
  };
}

export async function clearAllAppStorage(keys: string[]) {
  await AsyncStorage.multiRemove(keys);
}
