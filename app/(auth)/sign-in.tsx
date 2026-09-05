import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { AuthButtons } from "@/components/AuthButtons";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { getAuthProvider, isBackendAuthConfigured } from "@/services/providers/auth";
import { useUserStore } from "@/state/userStore";
import { activateSession } from "@/services/sessionLifecycle";

export default function SignInScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const setGuest = useUserStore((s) => s.setGuest);
  const setName = useUserStore((s) => s.setName);
  const setOnboardingStarted = useUserStore((s) => s.setOnboardingStarted);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await getAuthProvider().signInWithEmail(email.trim(), password);
      await activateSession(result.user, result.scope);
      setGuest(false);
      if (result.user.name) setName(result.user.name);
      if (useUserStore.getState().onboardingCompleted) router.replace("/(tabs)/home");
      else { setOnboardingStarted(true); router.replace("/(onboarding)/language"); }
    } catch (e: any) {
      setError(e.message === "invalid_credentials" ? t("auth.invalidCredentials") : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const onSuccessSocial = () => {
    setGuest(false);
    if (useUserStore.getState().onboardingCompleted) router.replace("/(tabs)/home");
    else { setOnboardingStarted(true); router.replace("/(onboarding)/language"); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("auth.signInTitle")} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {!isBackendAuthConfigured && (
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 14 }}>
              {t("auth.localOnlyNotice")}
            </Text>
          )}

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t("auth.email")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel={t("auth.email")}
            style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            placeholderTextColor={theme.colors.textMuted}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t("auth.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel={t("auth.password")}
            style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            placeholderTextColor={theme.colors.textMuted}
          />

          {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text>}

          <Button
            label={t("auth.signIn")}
            onPress={onSubmit}
            fullWidth
            loading={loading}
            disabled={!email || password.length < 8}
          />

          <View style={{ height: 20 }} />
          <AuthButtons onSuccess={onSuccessSocial} onError={(m) => setError(m)} />

          <View style={{ height: 20 }} />
          <Button
            label={t("auth.goToSignUp")}
            onPress={() => router.push("/(auth)/sign-up")}
            variant="ghost"
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, flexGrow: 1 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
});
