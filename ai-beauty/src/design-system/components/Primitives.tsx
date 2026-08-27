import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { ChevronLeft, Info } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAppTheme } from "../ThemeProvider";

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { theme } = useAppTheme();
  const base = [
    styles.card,
    {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      borderColor: theme.colors.border,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={({ pressed }) => [...base, { opacity: pressed ? 0.9 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? theme.colors.chipBackgroundActive
            : theme.colors.chipBackground,
          borderRadius: theme.radius.pill,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipLabel,
          {
            color: active ? "#FFFFFF" : theme.colors.textSecondary,
            marginLeft: icon ? 6 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontSize: theme.typography.title,
          fontWeight: "700",
        }}
      >
        {children}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.typography.caption,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Every screen must have a working back action — this is the standard header. */
export function ScreenHeader({
  title,
  onSkip,
  skipLabel,
  rightAction,
}: {
  title: string;
  onSkip?: () => void;
  skipLabel?: string;
  rightAction?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          if (router.canGoBack()) router.back();
        }}
        style={styles.headerBtn}
      >
        <ChevronLeft color={theme.colors.textPrimary} size={24} />
      </Pressable>
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontSize: theme.typography.subtitle,
          fontWeight: "700",
          flex: 1,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {onSkip ? (
        <Pressable onPress={onSkip} hitSlop={12} style={styles.headerBtn} accessibilityRole="button">
          <Text style={{ color: theme.colors.accent, fontWeight: "600" }}>
            {skipLabel ?? "Skip"}
          </Text>
        </Pressable>
      ) : rightAction ? (
        <View style={styles.headerBtn}>{rightAction}</View>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

/**
 * Use instead of a disabled/dead button whenever a feature is architecturally
 * present but not yet configured (e.g. no backend AI key, Show It On Me,
 * cloud sync). Always explains WHY and never fakes success.
 */
export function ComingSoonNotice({ title, description }: { title: string; description: string }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.noticeBox,
        { backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius.md },
      ]}
    >
      <Info size={18} color={theme.colors.textMuted} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>{title}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export function Badge({ text, tone = "accent" }: { text: string; tone?: "accent" | "success" | "warning" }) {
  const { theme } = useAppTheme();
  const color =
    tone === "success" ? theme.colors.success : tone === "warning" ? theme.colors.warning : theme.colors.accent;
  return (
    <View style={{ backgroundColor: color + "26", borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerBtn: { width: 60, alignItems: "flex-start", justifyContent: "center" },
  noticeBox: { flexDirection: "row", padding: 14, alignItems: "flex-start" },
});
