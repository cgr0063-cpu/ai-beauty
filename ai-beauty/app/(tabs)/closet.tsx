import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, Alert, Pressable, ActivityIndicator, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { Pencil, Plus, Shirt, Trash2, X } from "lucide-react-native";
import { Card, SectionTitle } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { ClosetItem, useWardrobeStore } from "@/state/wardrobeStore";
import { getAIProvider } from "@/services/providers/ai";
import { deletePersistedPhoto, persistUserPhoto } from "@/services/storage/photoLibrary";
import { ensureAiPhotoConsent } from "@/services/privacy/photoConsent";

const CATEGORIES: ClosetItem["category"][] = ["top", "bottom", "dress", "outerwear", "shoes", "accessory", "other"];

export default function ClosetScreen() {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const addItem = useWardrobeStore((s) => s.addItem);
  const updateItem = useWardrobeStore((s) => s.updateItem);
  const removeItem = useWardrobeStore((s) => s.removeItem);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ClosetItem | null>(null);
  const [draft, setDraft] = useState({ label: "", color: "", brand: "", tags: "", category: "other" as ClosetItem["category"] });

  const openEdit = (item: ClosetItem) => {
    setEditing(item);
    setDraft({ label: item.label, color: item.color ?? "", brand: item.brand ?? "", tags: item.styleTags.join(", "), category: item.category });
  };

  const saveEdit = () => {
    if (!editing || !draft.label.trim()) return;
    updateItem(editing.id, {
      label: draft.label.trim().slice(0, 80),
      color: draft.color.trim().slice(0, 40) || undefined,
      brand: draft.brand.trim().slice(0, 80) || undefined,
      category: draft.category,
      styleTags: draft.tags.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 8),
    });
    setEditing(null);
  };

  const saveAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!(await ensureAiPhotoConsent(t))) return;
    setAdding(true);
    let durableUri: string | null = null;
    try {
      durableUri = await persistUserPhoto(asset.uri, "closet", asset.mimeType);
      const analysis = await getAIProvider().analyzeClosetItem(durableUri, i18n.language || "en");
      addItem({ photoUri: durableUri, category: analysis.category, label: analysis.label, color: analysis.color ?? undefined, brand: undefined, styleTags: analysis.styleTags });
    } catch {
      if (durableUri) await deletePersistedPhoto(durableUri);
      Alert.alert(t("closet.analysisFailed"));
    } finally { setAdding(false); }
  };

  const pickLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert(t("errors.photoPermission"));
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) await saveAsset(result.assets[0]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert(t("errors.cameraPermission"));
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) await saveAsset(result.assets[0]);
  };

  const chooseSource = () => Alert.alert(t("closet.addItem"), t("closet.aiMetadataHint"), [
    { text: t("closet.camera"), onPress: takePhoto }, { text: t("closet.library"), onPress: pickLibrary }, { text: t("common.cancel"), style: "cancel" },
  ]);

  const confirmDelete = (id: string, photoUri: string | null) => Alert.alert(t("closet.deleteTitle"), t("closet.deleteBody"), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("closet.delete"), style: "destructive", onPress: async () => { removeItem(id); await deletePersistedPhoto(photoUri); } },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View style={styles.header}><SectionTitle>{t("closet.title")}</SectionTitle><Button label={t("closet.addItem")} onPress={chooseSource} disabled={adding} size="sm" icon={adding ? <ActivityIndicator color="#fff" /> : <Plus size={16} color="#fff" />} /></View>
      <Text style={{ color: theme.colors.textMuted, paddingHorizontal: 20, paddingTop: 8, fontSize: 12 }}>{t("closet.metadataTruthNote")}</Text>
      {items.length === 0 ? <View style={styles.empty}><Shirt size={40} color={theme.colors.textMuted} /><Text style={{ color: theme.colors.textMuted, textAlign: "center", marginTop: 12, paddingHorizontal: 30 }}>{t("closet.empty")}</Text></View> : (
        <FlatList data={items} keyExtractor={(i) => i.id} numColumns={2} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            {item.photoUri && <Image source={{ uri: item.photoUri }} style={styles.itemImg} />}
            <Text style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: "700", marginTop: 8 }} numberOfLines={1}>{item.label}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{[item.brand, item.color, t(`closet.category.${item.category}`)].filter(Boolean).join(" · ")}</Text>
            <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={t("closet.edit")} hitSlop={10} onPress={() => openEdit(item)}><Pencil size={16} color={theme.colors.textPrimary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={t("closet.delete")} hitSlop={10} onPress={() => confirmDelete(item.id, item.photoUri)}><Trash2 size={16} color={theme.colors.danger} /></Pressable></View>
          </Card>
        )} />
      )}

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}><View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
          <View style={styles.sheetHeader}><Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "800", flexShrink: 1 }}>{t("closet.editTitle")}</Text><Pressable accessibilityRole="button" accessibilityLabel={t("common.cancel")} onPress={() => setEditing(null)} hitSlop={12}><X size={22} color={theme.colors.textPrimary} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={[styles.label,{color:theme.colors.textSecondary}]}>{t("closet.itemName")}</Text><TextInput value={draft.label} onChangeText={(label) => setDraft((d) => ({...d,label}))} style={[styles.input,{borderColor:theme.colors.border,color:theme.colors.textPrimary}]} />
            <Text style={[styles.label,{color:theme.colors.textSecondary}]}>{t("closet.brand")}</Text><TextInput value={draft.brand} onChangeText={(brand) => setDraft((d) => ({...d,brand}))} placeholder={t("closet.brandOptional")} placeholderTextColor={theme.colors.textMuted} style={[styles.input,{borderColor:theme.colors.border,color:theme.colors.textPrimary}]} />
            <Text style={[styles.label,{color:theme.colors.textSecondary}]}>{t("closet.color")}</Text><TextInput value={draft.color} onChangeText={(color) => setDraft((d) => ({...d,color}))} style={[styles.input,{borderColor:theme.colors.border,color:theme.colors.textPrimary}]} />
            <Text style={[styles.label,{color:theme.colors.textSecondary}]}>{t("closet.categoryLabel")}</Text><View style={styles.chips}>{CATEGORIES.map((category) => <Pressable key={category} onPress={() => setDraft((d) => ({...d,category}))} style={[styles.chip,{borderColor:theme.colors.border}, draft.category===category && {backgroundColor:theme.colors.chipBackgroundActive}]}><Text style={{color:theme.colors.textPrimary,fontWeight:draft.category===category?"700":"500"}}>{t(`closet.category.${category}`)}</Text></Pressable>)}</View>
            <Text style={[styles.label,{color:theme.colors.textSecondary}]}>{t("closet.styleTags")}</Text><TextInput value={draft.tags} onChangeText={(tags) => setDraft((d) => ({...d,tags}))} placeholder={t("closet.styleTagsHint")} placeholderTextColor={theme.colors.textMuted} style={[styles.input,{borderColor:theme.colors.border,color:theme.colors.textPrimary}]} />
            <Text style={{color:theme.colors.textMuted,fontSize:12,marginBottom:14}}>{t("closet.editTruthNote")}</Text>
            <Button label={t("common.save")} onPress={saveEdit} disabled={!draft.label.trim()} fullWidth />
          </ScrollView>
        </View></KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:20,paddingBottom:0},empty:{flex:1,alignItems:"center",justifyContent:"center"},itemCard:{flex:1,margin:6,padding:8},itemImg:{width:"100%",height:120,borderRadius:10},actions:{flexDirection:"row",justifyContent:"flex-end",gap:16,marginTop:10},backdrop:{flex:1,backgroundColor:"rgba(0,0,0,0.45)",justifyContent:"flex-end"},sheet:{maxHeight:"88%",borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:32},sheetHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:12},label:{fontSize:12,fontWeight:"700",marginTop:10,marginBottom:5},input:{borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:10},chips:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{borderWidth:1,borderRadius:999,paddingHorizontal:11,paddingVertical:8} });
