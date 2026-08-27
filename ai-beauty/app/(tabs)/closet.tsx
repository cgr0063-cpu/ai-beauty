import React from "react";
import { View, Text, FlatList, StyleSheet, Image, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { Plus, Shirt, Trash2 } from "lucide-react-native";
import { Card, SectionTitle } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useWardrobeStore } from "@/state/wardrobeStore";

export default function ClosetScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const addItem = useWardrobeStore((s) => s.addItem);
  const removeItem = useWardrobeStore((s) => s.removeItem);

  const addFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("errors.photoPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      addItem({ photoUri: result.assets[0].uri, category: "other", label: "New item", styleTags: [] });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View style={styles.header}>
        <SectionTitle>{t("closet.title")}</SectionTitle>
        <Button label={t("closet.addItem")} onPress={addFromLibrary} size="sm" icon={<Plus size={16} color="#fff" />} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Shirt size={40} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, textAlign: "center", marginTop: 12, paddingHorizontal: 30 }}>
            {t("closet.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Card style={styles.itemCard}>
              {item.photoUri && <Image source={{ uri: item.photoUri }} style={styles.itemImg} />}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                  {item.label}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("common.cancel")}
                  hitSlop={10}
                  onPress={() => removeItem(item.id)}
                >
                  <Trash2 size={16} color={theme.colors.danger} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  itemCard: { flex: 1, margin: 6, padding: 8 },
  itemImg: { width: "100%", height: 120, borderRadius: 10 },
});
