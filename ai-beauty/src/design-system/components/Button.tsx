import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../ThemeProvider";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

/**
 * Rule: never render a Button whose onPress is a no-op stub.
 * If a feature isn't wired up yet, don't use this component — use
 * ComingSoonNotice instead so the UI never presents a dead button.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  fullWidth,
  accessibilityHint,
}: ButtonProps) {
  const { theme } = useAppTheme();
  const paddingV = size === "sm" ? 10 : size === "lg" ? 18 : 14;
  const fontSize = size === "sm" ? theme.typography.caption : theme.typography.body;

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    Haptics.selectionAsync().catch(() => {});
    onPress(e);
  };

  const content = (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : theme.colors.accent}
          size="small"
        />
      ) : (
        icon
      )}
      <Text
        style={[
          styles.label,
          {
            fontSize,
            color:
              variant === "primary"
                ? "#FFFFFF"
                : variant === "danger"
                ? theme.colors.danger
                : theme.colors.textPrimary,
            marginLeft: icon || loading ? 8 : 0,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  const commonProps = {
    accessibilityRole: "button" as const,
    accessibilityState: { disabled: !!disabled || !!loading },
    accessibilityHint,
    onPress: handlePress,
    disabled: disabled || loading,
    style: ({ pressed }: { pressed: boolean }) => [
      { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      fullWidth && { width: "100%" as const },
    ],
  };

  if (variant === "primary") {
    return (
      <Pressable {...commonProps}>
        <LinearGradient
          colors={theme.colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { borderRadius: theme.radius.pill, paddingVertical: paddingV },
          ]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === "secondary"
      ? theme.colors.chipBackground
      : variant === "danger"
      ? "transparent"
      : "transparent";
  const border =
    variant === "ghost" ? "transparent" : variant === "danger" ? theme.colors.danger : theme.colors.border;

  return (
    <Pressable {...commonProps}>
      <View
        style={[
          styles.base,
          {
            backgroundColor: bg,
            borderRadius: theme.radius.pill,
            paddingVertical: paddingV,
            borderWidth: variant === "ghost" ? 0 : 1,
            borderColor: border,
          },
        ]}
      >
        {content}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  contentRow: { flexDirection: "row", alignItems: "center" },
  label: { fontWeight: "600" },
});
