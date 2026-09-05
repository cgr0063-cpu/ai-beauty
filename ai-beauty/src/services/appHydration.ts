import { useAuthStore } from "@/state/authStore";
import { useEntitlementStore } from "@/state/entitlementStore";
import { useSavedLooksStore } from "@/state/savedLooksStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useUserStore } from "@/state/userStore";
import { useWardrobeStore } from "@/state/wardrobeStore";

const stores = [useAuthStore, useEntitlementStore, useSavedLooksStore, useSettingsStore, useTodayContextStore, useUserStore, useWardrobeStore] as const;
export function arePersistedStoresHydrated() { return stores.every((s) => s.persist.hasHydrated()); }
export function subscribeToHydration(listener: () => void) { const unsubs = stores.map((s) => s.persist.onFinishHydration(listener)); return () => unsubs.forEach((u) => u()); }
