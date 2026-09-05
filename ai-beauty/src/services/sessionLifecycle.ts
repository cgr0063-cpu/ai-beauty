import { useAuthStore } from "@/state/authStore";
import { useEntitlementStore } from "@/state/entitlementStore";
import { useSavedLooksStore } from "@/state/savedLooksStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useUserStore } from "@/state/userStore";
import { useWardrobeStore } from "@/state/wardrobeStore";
import { AuthUser } from "@/services/providers/auth/AuthProvider";
import { getSubscriptionProvider } from "@/services/providers/subscription";
import { getAuthProviderForScope } from "@/services/providers/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/i18n";
import { cancelAllBeautyReminders, syncNotificationSchedules } from "@/services/notifications";


type AccountSnapshot = {
  user: Partial<ReturnType<typeof useUserStore.getState>>;
  wardrobe: { items: ReturnType<typeof useWardrobeStore.getState>["items"] };
  savedLooks: Pick<ReturnType<typeof useSavedLooksStore.getState>, "saved" | "feedback">;
  todayContext: Partial<ReturnType<typeof useTodayContextStore.getState>>;
  settings: Partial<ReturnType<typeof useSettingsStore.getState>>;
};

const accountSnapshotKey = (userId: string) => `aibeauty.account.${encodeURIComponent(userId)}.v1`;

function withoutFunctions<T extends Record<string, any>>(state: T): Partial<T> {
  return Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== "function")) as Partial<T>;
}

async function saveAccountSnapshot(userId: string) {
  const snapshot: AccountSnapshot = {
    user: withoutFunctions(useUserStore.getState()),
    wardrobe: { items: useWardrobeStore.getState().items },
    savedLooks: { saved: useSavedLooksStore.getState().saved, feedback: useSavedLooksStore.getState().feedback },
    todayContext: withoutFunctions(useTodayContextStore.getState()),
    settings: withoutFunctions(useSettingsStore.getState()),
  };
  await AsyncStorage.setItem(accountSnapshotKey(userId), JSON.stringify(snapshot));
}

async function restoreAccountSnapshot(userId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(accountSnapshotKey(userId));
  if (!raw) return false;
  try {
    const snapshot = JSON.parse(raw) as AccountSnapshot;
    if (snapshot.user) useUserStore.setState(snapshot.user);
    if (snapshot.wardrobe?.items) useWardrobeStore.setState({ items: snapshot.wardrobe.items });
    if (snapshot.savedLooks) useSavedLooksStore.setState(snapshot.savedLooks);
    if (snapshot.todayContext) useTodayContextStore.setState(snapshot.todayContext);
    if (snapshot.settings) useSettingsStore.setState(snapshot.settings);
    return true;
  } catch {
    await AsyncStorage.removeItem(accountSnapshotKey(userId));
    return false;
  }
}

/**
 * Device-local personal data must never leak from one signed-in identity to
 * another. Each signed-in account receives an isolated local snapshot; the
 * active Zustand stores only contain the current account's data.
 */
export function resetPersonalData() {
  useUserStore.getState().resetProfile();
  useWardrobeStore.getState().reset();
  useSavedLooksStore.getState().reset();
  useTodayContextStore.getState().reset();
  useSettingsStore.getState().reset();
  useEntitlementStore.getState().reset();
}

export async function activateSession(user: AuthUser, scope: "local" | "remote") {
  const previous = useAuthStore.getState().currentUser;
  if (!previous || previous.id !== user.id) {
    if (previous) await saveAccountSnapshot(previous.id).catch(() => {});
    resetPersonalData();
    await restoreAccountSnapshot(user.id).catch(() => false);
  }

  useAuthStore.getState().setSession(user, scope);
  useUserStore.getState().setGuest(false);
  const ns = useSettingsStore.getState();
  await syncNotificationSchedules({
    dailyEnabled: ns.notificationsEnabled, inactivityEnabled: ns.inactivityReminderEnabled, weeklyTrendEnabled: ns.weeklyTrendNotificationsEnabled, savedLookEnabled: ns.savedLookReminderEnabled,
    copy: { dailyTitle: i18n.t("notifications.dailyTitle"), dailyBody: i18n.t("notifications.dailyBody"), inactivityTitle: i18n.t("notifications.inactivityTitle"), inactivityBody: i18n.t("notifications.inactivityBody"), weeklyTrendTitle: i18n.t("notifications.weeklyTrendTitle"), weeklyTrendBody: i18n.t("notifications.weeklyTrendBody"), savedLookTitle: i18n.t("notifications.savedLookTitle"), savedLookBody: i18n.t("notifications.savedLookBody") },
  }).catch(() => false);

  // Billing identity follows the authenticated app account. If RevenueCat is
  // not configured this is a no-op in development.
  await getSubscriptionProvider().identifyUser(user.id).catch(() => {});
  const entitlement = await getSubscriptionProvider().getEntitlementStatus().catch(() => "free" as const);
  useEntitlementStore.getState().setStatus(entitlement);
}

export async function clearSession(options: { preserveSnapshot?: boolean } = {}) {
  const currentUser = useAuthStore.getState().currentUser;
  const preserveSnapshot = options.preserveSnapshot !== false;
  if (currentUser && preserveSnapshot) await saveAccountSnapshot(currentUser.id).catch(() => {});
  if (currentUser && !preserveSnapshot) await AsyncStorage.removeItem(accountSnapshotKey(currentUser.id)).catch(() => {});
  await getSubscriptionProvider().clearUserIdentity().catch(() => {});
  await cancelAllBeautyReminders().catch(() => {});
  useAuthStore.getState().setSession(null, null);
  resetPersonalData();
  useUserStore.getState().setGuest(true);
}


export async function reconcilePersistedSession() {
  const { currentUser, scope } = useAuthStore.getState();
  if (!currentUser || !scope) return;
  try {
    const provider = getAuthProviderForScope(scope);
    const [providerUser, token] = await Promise.all([provider.getCurrentUser(), provider.getToken()]);
    if (!providerUser || providerUser.id !== currentUser.id || (scope === "remote" && !token)) {
      await clearSession();
      return;
    }
    useAuthStore.getState().setSession(providerUser, scope);
    useUserStore.getState().setGuest(false);
    if (providerUser.name && !useUserStore.getState().name) useUserStore.getState().setName(providerUser.name);
  } catch {
    await clearSession();
  }
}
