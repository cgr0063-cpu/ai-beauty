import React from "react";
import { View, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { Button } from "@/design-system/components/Button";
import { ComingSoonNotice } from "@/design-system/components/Primitives";
import { getAuthProvider, isAppleSignInConfigured, isGoogleSignInConfigured } from "@/services/providers/auth";
import { useAuthStore } from "@/state/authStore";

WebBrowser.maybeCompleteAuthSession();

export function AuthButtons({ onSuccess, onError }: { onSuccess: () => void; onError: (message: string) => void }) {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

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
      const decoded = decodeJwtPayload(idToken);
      const result = await getAuthProvider().signInWithGoogle({
        email: decoded.email,
        name: decoded.name ?? null,
        googleSub: decoded.sub,
      });
      setSession(result.user, result.scope);
      onSuccess();
    } catch (e) {
      onError((e as Error).message);
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
      const result = await getAuthProvider().signInWithApple({
        email: credential.email,
        name: fullName,
        appleSub: credential.user,
      });
      setSession(result.user, result.scope);
      onSuccess();
    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED") return;
      onError(e.message ?? "apple_sign_in_failed");
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
        (isAppleSignInConfigured ? (
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

function decodeJwtPayload(token: string): any {
  const [, payload] = token.split(".");
  const json = base64UrlDecode(payload);
  return JSON.parse(json);
}

/** Minimal base64url decoder — avoids relying on Buffer/atob, neither of
 * which is guaranteed present in the Hermes JS engine RN uses. */
function base64UrlDecode(input: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of str) {
    if (char === "=") break;
    const value = chars.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  try {
    return decodeURIComponent(
      output
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return output;
  }
}
