import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { useTranslation } from "react-i18next";
import { ScreenHeader, Card } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useEntitlementStore } from "@/state/entitlementStore";

const GUIDES = ["WALK", "TURN", "HOLD"] as const;

export default function RunwayScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const router = useRouter();
  const entitlement = useEntitlementStore((s) => s.status);
  const cameraRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [guideIndex, setGuideIndex] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setGuideIndex((v) => Math.min(v + 1, GUIDES.length - 1)), 2200);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => () => {
    if (videoUri) FileSystem.deleteAsync(videoUri, { idempotent: true }).catch(() => {});
  }, [videoUri]);

  const ensurePermissions = async () => {
    const cam = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    const mic = micPermission?.granted ? micPermission : await requestMicPermission();
    if (!cam.granted || !mic.granted) {
      Alert.alert(t("runway.permissionTitle"), t("runway.permissionBody"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("runway.openSettings"), onPress: () => Linking.openSettings() },
      ]);
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (!(await ensurePermissions())) return;
    setError(null);
    if (videoUri) await FileSystem.deleteAsync(videoUri, { idempotent: true }).catch(() => {});
    setVideoUri(null);
    for (const n of [3, 2, 1]) {
      setCountdown(n);
      await new Promise((r) => setTimeout(r, 700));
    }
    setCountdown(null);
    setGuideIndex(0);
    setRecording(true);
    try {
      const result = await cameraRef.current?.recordAsync({ maxDuration: 8 });
      if (!result?.uri) throw new Error("no_video");
      const dest = `${FileSystem.cacheDirectory}runway_${Date.now()}.mp4`;
      await FileSystem.copyAsync({ from: result.uri, to: dest });
      setVideoUri(dest);
    } catch {
      setError(t("runway.recordError"));
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = () => cameraRef.current?.stopRecording?.();
  const shareVideo = async () => {
    if (!videoUri) return;
    await Share.share({ message: t("runway.shareMessage"), url: videoUri });
  };

  if (entitlement !== "plus") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title={t("runway.title")} />
        <View style={styles.body}>
          <Card>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: 18 }}>{t("subscription.plusRequiredTitle")}</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 8, marginBottom: 16 }}>{t("subscription.runwayPlusBody")}</Text>
            <Button label={t("subscription.viewPlus")} onPress={() => router.push("/subscription/paywall")} fullWidth />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (!cameraPermission) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" }}><View accessibilityRole="progressbar" accessibilityLabel={t("common.loading")}><ActivityIndicator color={theme.colors.accent} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("runway.title")} />
      <View style={styles.body}>
        {!cameraPermission.granted ? (
          <Card>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", marginBottom: 8 }}>{t("runway.permissionTitle")}</Text>
            <Text style={{ color: theme.colors.textMuted, marginBottom: 16 }}>{t("runway.permissionBody")}</Text>
            <Button label={t("runway.allowCamera")} onPress={ensurePermissions} fullWidth />
          </Card>
        ) : (
          <>
            <View style={styles.cameraWrap}>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mode="video" mute={false} />
              {(countdown !== null || recording) && (
                <View style={styles.overlay} pointerEvents="none">
                  <Text style={styles.guideText}>{countdown ?? GUIDES[guideIndex]}</Text>
                </View>
              )}
            </View>
            <View style={styles.row}>
              <Button label={t("runway.flipCamera")} variant="secondary" onPress={() => setFacing((v) => (v === "front" ? "back" : "front"))} disabled={recording} />
              <Button label={recording ? t("runway.stop") : t("runway.record")} onPress={recording ? stopRecording : startRecording} />
            </View>
            {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, marginTop: 10 }}>{error}</Text>}
            {videoUri && (
              <Card style={{ marginTop: 14 }}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("runway.readyTitle")}</Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 6, marginBottom: 14 }}>{t("runway.readyBody")}</Text>
                <Button label={t("runway.share")} onPress={shareVideo} fullWidth />
                <View style={{ height: 8 }} />
                <Button label={t("runway.retake")} variant="ghost" onPress={async () => { if (videoUri) await FileSystem.deleteAsync(videoUri, { idempotent: true }).catch(() => {}); setVideoUri(null); }} fullWidth />
              </Card>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 16 },
  cameraWrap: { flex: 1, minHeight: 420, overflow: "hidden", borderRadius: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  guideText: { color: "#fff", fontSize: 36, fontWeight: "900", letterSpacing: 3, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 14 },
});
