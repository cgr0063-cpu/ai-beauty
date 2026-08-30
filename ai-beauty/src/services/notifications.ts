import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const NOTIFICATION_IDS = {
  daily: "aibeauty-morning-look",
  inactivity: "aibeauty-inactivity",
  weeklyTrend: "aibeauty-weekly-trend",
  savedLook: "aibeauty-saved-look",
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureChannels() {
  if (Platform.OS !== "android") return;
  await Promise.all([
    Notifications.setNotificationChannelAsync("daily-look", { name: "Daily look", importance: Notifications.AndroidImportance.DEFAULT }),
    Notifications.setNotificationChannelAsync("style-reminders", { name: "Style reminders", importance: Notifications.AndroidImportance.DEFAULT }),
  ]);
}

export async function scheduleDailyLookReminder(title: string, body: string): Promise<boolean> {
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels();
  await cancelDailyLookReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.daily,
    content: { title, body, sound: false, data: { route: "/(tabs)/home" } },
    trigger: { hour: 8, minute: 0, repeats: true, ...(Platform.OS === "android" ? { channelId: "daily-look" } : {}) } as any,
  });
  return true;
}

export async function scheduleWeeklyTrendReminder(title: string, body: string): Promise<boolean> {
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels();
  await cancelWeeklyTrendReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.weeklyTrend,
    content: { title, body, sound: false, data: { route: "/(tabs)/explore/store" } },
    trigger: { weekday: 2, hour: 9, minute: 0, repeats: true, ...(Platform.OS === "android" ? { channelId: "style-reminders" } : {}) } as any,
  });
  return true;
}

export async function scheduleSavedLookReminder(title: string, body: string): Promise<boolean> {
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels();
  await cancelSavedLookReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.savedLook,
    content: { title, body, sound: false, data: { route: "/(tabs)/saved" } },
    trigger: { weekday: 6, hour: 18, minute: 0, repeats: true, ...(Platform.OS === "android" ? { channelId: "style-reminders" } : {}) } as any,
  });
  return true;
}

/** One-shot reminder moved 72h forward whenever the app becomes active. */
export async function refreshInactivityReminder(enabled: boolean, title: string, body: string): Promise<boolean> {
  await cancelInactivityReminder();
  if (!enabled) return true;
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.inactivity,
    content: { title, body, sound: false, data: { route: "/(tabs)/home" } },
    trigger: { seconds: 72 * 60 * 60, repeats: false, ...(Platform.OS === "android" ? { channelId: "style-reminders" } : {}) } as any,
  });
  return true;
}

export async function cancelDailyLookReminder() { await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.daily).catch(() => {}); }
export async function cancelInactivityReminder() { await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.inactivity).catch(() => {}); }
export async function cancelWeeklyTrendReminder() { await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.weeklyTrend).catch(() => {}); }
export async function cancelSavedLookReminder() { await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.savedLook).catch(() => {}); }

export async function cancelAllBeautyReminders() {
  await Promise.all([cancelDailyLookReminder(), cancelInactivityReminder(), cancelWeeklyTrendReminder(), cancelSavedLookReminder()]);
}

export async function syncNotificationSchedules(options: {
  dailyEnabled: boolean;
  inactivityEnabled: boolean;
  weeklyTrendEnabled: boolean;
  savedLookEnabled: boolean;
  copy: {
    dailyTitle: string; dailyBody: string;
    inactivityTitle: string; inactivityBody: string;
    weeklyTrendTitle: string; weeklyTrendBody: string;
    savedLookTitle: string; savedLookBody: string;
  };
}) {
  const anyEnabled = options.dailyEnabled || options.inactivityEnabled || options.weeklyTrendEnabled || options.savedLookEnabled;
  if (!anyEnabled) { await cancelAllBeautyReminders(); return true; }
  const allowed = await ensureNotificationPermission();
  if (!allowed) { await cancelAllBeautyReminders(); return false; }
  if (options.dailyEnabled) await scheduleDailyLookReminder(options.copy.dailyTitle, options.copy.dailyBody); else await cancelDailyLookReminder();
  if (options.weeklyTrendEnabled) await scheduleWeeklyTrendReminder(options.copy.weeklyTrendTitle, options.copy.weeklyTrendBody); else await cancelWeeklyTrendReminder();
  if (options.savedLookEnabled) await scheduleSavedLookReminder(options.copy.savedLookTitle, options.copy.savedLookBody); else await cancelSavedLookReminder();
  await refreshInactivityReminder(options.inactivityEnabled, options.copy.inactivityTitle, options.copy.inactivityBody);
  return true;
}
