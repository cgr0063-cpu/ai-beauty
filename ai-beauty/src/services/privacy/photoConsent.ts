import { Alert } from "react-native";
import { TFunction } from "i18next";
import { useSettingsStore } from "@/state/settingsStore";

export async function ensureAiPhotoConsent(t: TFunction): Promise<boolean> {
  if (useSettingsStore.getState().photoAiConsentAccepted) return true;
  return new Promise((resolve) => {
    Alert.alert(
      t("privacy.photoAiTitle"),
      t("privacy.photoAiBody"),
      [
        { text: t("common.cancel"), style: "cancel", onPress: () => resolve(false) },
        {
          text: t("privacy.photoAiAccept"),
          onPress: () => {
            useSettingsStore.getState().setPhotoAiConsentAccepted(true);
            resolve(true);
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
