import React from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera as CameraIcon, Upload, Wand2 } from "lucide-react-native";
import { Card, SectionTitle } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";

export default function FitCheckEntryScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const goToEnhance = (uri: string) => {
    router.push({
      pathname: "/camera/enhance",
      params: { photoUri: uri, mode: "photo", returnTo: "/fitcheck" },
    });
  };

  const goStraightToFitCheck = (uri: string) => {
    router.push({ pathname: "/fitcheck", params: { photoUri: uri } });
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("errors.photoPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      goStraightToFitCheck(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("errors.cameraPermission"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      goToEnhance(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View style={styles.container}>
        <SectionTitle subtitle={t("fitCheck.subtitle")}>{t("fitCheck.title")}</SectionTitle>
        <Card>
          <View style={styles.previewBox}>
            <CameraIcon size={40} color={theme.colors.textMuted} />
          </View>
          <View style={{ height: 16 }} />
          <Button
            label={t("fitCheck.uploadCta")}
            onPress={takePhoto}
            fullWidth
            icon={<CameraIcon size={18} color="#fff" />}
          />
          <View style={{ height: 10 }} />
          <Button
            label={t("fitCheck.uploadFromLibrary")}
            onPress={pickFromLibrary}
            variant="secondary"
            fullWidth
            icon={<Upload size={18} color={theme.colors.textPrimary} />}
          />
        </Card>
        <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
          <Wand2 size={14} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginLeft: 6 }}>
            {t("fitCheck.enhanceHint")}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  previewBox: {
    height: 220,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00000011",
    overflow: "hidden",
  },
});
