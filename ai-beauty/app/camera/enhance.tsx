import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { Download, Share2, Check, ImageOff } from "lucide-react-native";
import { ScreenHeader, Chip } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useSettingsStore } from "@/state/settingsStore";
import { CAMERA_FILTERS, getFilterById, CameraFilterId, CameraMode } from "@/data/cameraFilters";

export default function CameraEnhanceScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri: string; mode?: CameraMode; returnTo?: string }>();
  const settings = useSettingsStore();

  const [filterId, setFilterId] = useState<CameraFilterId>((settings.defaultCameraFilterId as CameraFilterId) ?? "clean");
  const [intensity, setIntensity] = useState(settings.defaultCameraIntensity ?? 40); // 0-100
  const [showOriginal, setShowOriginal] = useState(false);
  const [saving, setSaving] = useState(false);

  const captureViewRef = useRef<View>(null);
  const filter = getFilterById(filterId);
  const effectiveOpacity = showOriginal ? 0 : (intensity / 100) * filter.maxOverlayOpacity;

  const onSaveDefault = () => {
    settings.setDefaultCameraStyle(filterId, intensity);
    Alert.alert(t("camera.savedDefaultTitle"), t("camera.savedDefaultBody"));
  };

  const flattenAndGetUri = async (): Promise<string | null> => {
    if (!captureViewRef.current) return null;
    return captureRef(captureViewRef, { format: "jpg", quality: 0.92 });
  };

  const onConfirm = async () => {
    try {
      const finalUri = showOriginal || effectiveOpacity === 0 ? params.photoUri : await flattenAndGetUri();
      if (params.returnTo) {
        router.replace({ pathname: params.returnTo as any, params: { photoUri: finalUri ?? params.photoUri } });
      } else {
        router.back();
      }
    } catch {
      // Baking the filter failed — fall back to the original photo rather than blocking the flow.
      if (params.returnTo) {
        router.replace({ pathname: params.returnTo as any, params: { photoUri: params.photoUri } });
      } else {
        router.back();
      }
    }
  };

  const onSaveToDevice = async () => {
    if (!params.photoUri) {
      Alert.alert(t("camera.noPhoto"));
      return;
    }
    setSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("errors.photoPermission"));
        return;
      }
      const uri = await flattenAndGetUri();
      if (!uri) throw new Error("capture_failed");
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(t("common.done"), t("camera.savedToDevice"));
    } catch {
      Alert.alert(t("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    if (!params.photoUri) {
      Alert.alert(t("camera.noPhoto"));
      return;
    }
    try {
      const uri = await flattenAndGetUri();
      if (!uri) throw new Error("capture_failed");
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(t("errors.generic"));
        return;
      }
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert(t("errors.generic"));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader
        title={t(modeTitleKey(params.mode))}
        rightAction={
          <Pressable accessibilityRole="button" accessibilityLabel={t("common.done")} onPress={onConfirm}>
            <Check size={22} color={theme.colors.accent} />
          </Pressable>
        }
      />

      <View style={styles.previewWrap}>
        <View ref={captureViewRef} collapsable={false} style={styles.previewBox}>
          {params.photoUri ? (
            <Image source={{ uri: params.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.emptyState, { backgroundColor: theme.colors.cardAlt }]}>
              <ImageOff size={36} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, marginTop: 10, fontSize: 13 }}>
                {t("camera.noPhoto")}
              </Text>
            </View>
          )}

          {/* Real rendered color-grading overlay — tint intensity driven by the slider. */}
          {effectiveOpacity > 0 && (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: filter.overlayColor, opacity: effectiveOpacity }]}
              pointerEvents="none"
            />
          )}
          {filter.glow && !showOriginal && (
            <LinearGradient
              colors={["#FFFFFF00", `#FFFFFF${Math.round(effectiveOpacity * 60).toString(16).padStart(2, "0")}`]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          {filter.vignette && !showOriginal && (
            <LinearGradient
              colors={["#00000000", "#00000000", `#00000${Math.round(effectiveOpacity * 90).toString(16).padStart(2, "0")}`]}
              locations={[0, 0.6, 1]}
              start={{ x: 0.5, y: 0.3 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 14 }}>
          <Chip label={t("camera.original")} active={showOriginal} onPress={() => setShowOriginal(true)} />
          <Chip label={t("camera.enhanced")} active={!showOriginal} onPress={() => setShowOriginal(false)} />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
          {CAMERA_FILTERS.filter((f) => f.id !== "none").map((f) => (
            <Chip
              key={f.id}
              label={t(f.labelKey)}
              active={filterId === f.id}
              onPress={() => {
                setFilterId(f.id);
                setShowOriginal(false);
              }}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 2 }}>
          {t("camera.intensity")}: {intensity}%
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={intensity}
          onValueChange={setIntensity}
          minimumTrackTintColor={theme.colors.accent}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.accent}
          disabled={showOriginal}
          accessibilityLabel={t("camera.intensity")}
        />

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Button label={t("camera.setAsDefault")} onPress={onSaveDefault} variant="secondary" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.save")}
              onPress={onSaveToDevice}
              variant="secondary"
              icon={<Download size={16} color={theme.colors.textPrimary} />}
              fullWidth
              loading={saving}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.share")}
              onPress={onShare}
              variant="secondary"
              icon={<Share2 size={16} color={theme.colors.textPrimary} />}
              fullWidth
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function modeTitleKey(mode?: CameraMode): string {
  if (mode === "runway") return "camera.runwayTitle";
  if (mode === "selfie") return "camera.selfieTitle";
  return "camera.photoTitle";
}

const styles = StyleSheet.create({
  previewWrap: { flex: 1, padding: 16 },
  previewBox: { flex: 1, borderRadius: 22, overflow: "hidden", backgroundColor: "#00000011" },
  controls: { padding: 20, paddingTop: 4 },
  emptyState: { alignItems: "center", justifyContent: "center" },
});
