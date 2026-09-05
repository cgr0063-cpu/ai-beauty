import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { EntitlementStatus } from "@/services/providers/subscription/SubscriptionProvider";

interface EntitlementState {
  status: EntitlementStatus;
  setStatus: (s: EntitlementStatus) => void;
  reset: () => void;
}

export const useEntitlementStore = create<EntitlementState>()(
  persist(
    (set) => ({
      status: "free",
      setStatus: (s) => set({ status: s }),
      reset: () => set({ status: "free" }),
    }),
    { name: "aibeauty.entitlementCache.v1", storage: createAsyncStorageAdapter() }
  )
);

/** Free-tier save limit used by the paywall gating example on Home. */
export const FREE_SAVED_LOOKS_LIMIT = 5;
