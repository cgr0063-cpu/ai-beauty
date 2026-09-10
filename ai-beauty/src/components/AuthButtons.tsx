import React from "react";
import { View, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useTranslation } from "react-i18next";

import { Button } from "@/design-system/components/Button";
import { ComingSoonNotice } from "@/design-system/components/Primitives";
import {
  getAuthProvider,
  isAppleSignInConfigured,
  isGoogleSignInConfigured,
} from "@/services/providers/auth";
import { activateSession } from "@/services/sessionLifecycle";

GoogleSignin.configure();

function GoogleAuthButton({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);

  async function handleGoogleSignIn() {
    if (loading) return;

    onError("");
    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        onError(`Google response: ${JSON.stringify(response)}`);
        return;
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        onError("Google error: ID_TOKEN_MISSING");
        return;
      }

      onError("Google step: token received");

      const result = await getAuthProvider().signInWithGoogle({
        idToken,
      });

      onError("Google step: backend accepted");

      await activateSession(result.user, result.scope);

      onError("");
      onSuccess();
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          onError("Google error: SIGN_IN_CANCELLED");
          return;
        }

        onError(
          `Google error: ${error.code}${
            error.message ? ` - ${error.message}` : ""
          }`
        );
        return;
      }

      if (error instanceof Error) {
        onError(`${error.name}: ${error.message}`);
        return;
      }

      onError(`Unknown Google error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      label={t("auth.continueWithGoogle")}
      onPress={handleGoogleSignIn}
      variant="secondary"
      fullWidth
      loading={loading}
    />
  );
}

export function AuthButtons({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [appleAvailable, setAppleAvailable] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  async function handleAppleSignIn() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = credential.fullName
        ? [
            credential.fullName.givenName,
            credential.fullName.familyName,
          ]
            .filter(Boolean)
            .join(" ")
        : null;

      if (!credential.identityToken) {
        throw new Error("apple_identity_token_missing");
      }

      const result = await getAuthProvider().signInWithApple({
        identityToken: credential.identityToken,
        name: fullName,
      });

      await activateSession(result.user, result.scope);
      onSuccess();
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") return;
      onError(t("errors.generic"));
    }
  }

  return (
    <View style={{ gap: 10 }}>
      {isGoogleSignInConfigured ? (
        <GoogleAuthButton
          onSuccess={onSuccess}
          onError={onError}
        />
      ) : (
        <ComingSoonNotice
          title={t("auth.continueWithGoogle")}
          description={t("auth.googleNotConfigured")}
        />
      )}

      {Platform.OS === "ios" &&
        (isAppleSignInConfigured && appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={999}
            style={{ height: 48 }}
            onPress={handleAppleSignIn}
          />
        ) : (
          <ComingSoonNotice
            title={t("auth.continueWithApple")}
            description={t("auth.appleNotConfigured")}
          />
        ))}
    </View>
  );
}
