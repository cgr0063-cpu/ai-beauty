import React from "react";
import { View, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { Button } from "@/design-system/components/Button";
import { ComingSoonNotice } from "@/design-system/components/Primitives";
import { getAuthProvider, isAppleSignInConfigured, isGoogleSignInConfigured } from "@/services/providers/auth";
import { activateSession } from "@/services/sessionLifecycle";

WebBrowser.maybeCompleteAuthSession();

export function AuthButtons({ onSuccess, onError }: { onSuccess: () => void; onError: (message: string) => void }) {
  const { t } = useTranslation();
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  React.useEffect(() => {
    if (Platform.OS === "ios") AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  const [, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      handleGoogleToken(googleResponse.params.id_token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  async function handleGoogleToken(idToken: string) {
    try {
      const result = await getAuthProvider().signInWithGoogle({ idToken });
      await activateSession(result.user, result.scope);
      onSuccess();
    } catch (e) {
      onError(t("errors.generic"));
    }
  }

  async function handleAppleSignIn() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
        : null;
      if (!credential.identityToken) throw new Error("apple_identity_token_missing");
      const result = await getAuthProvider().signInWithApple({
        identityToken: credential.identityToken,
        name: fullName,
      });
      await activateSession(result.user, result.scope);
      onSuccess();
    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED") return;
      onError(t("errors.generic"));
    }
  }

  return (
    <View style={{ gap: 10 }}>
      {isGoogleSignInConfigured ? (
        <Button label={t("auth.continueWithGoogle")} onPress={() => googlePromptAsync()} variant="secondary" fullWidth />
      ) : (
        <ComingSoonNotice
          title={t("auth.continueWithGoogle")}
          description={t("auth.googleNotConfigured")}
        />
      )}

      {Platform.OS === "ios" &&
        (isAppleSignInConfigured && appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={999}
            style={{ height: 48 }}
            onPress={handleAppleSignIn}
          />
        ) : (
          <ComingSoonNotice title={t("auth.continueWithApple")} description={t("auth.appleNotConfigured")} />
        ))}
    </View>
  );
}

