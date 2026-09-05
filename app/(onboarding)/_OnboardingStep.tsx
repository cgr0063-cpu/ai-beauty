import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, SectionTitle } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";

export function OnboardingStep({
  title,
  subtitle,
  onSkip,
  skipLabel,
  children,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
}: {
  title: string;
  subtitle?: string;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="" onSkip={onSkip} skipLabel={skipLabel} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionTitle subtitle={subtitle}>{title}</SectionTitle>
        {children}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Button label={primaryLabel} onPress={onPrimaryPress} fullWidth disabled={primaryDisabled} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
});
