import * as FileSystem from "expo-file-system";

const PHOTO_DIR = `${FileSystem.documentDirectory ?? ""}ai-beauty-photos/`;

async function ensureDir() {
  if (!FileSystem.documentDirectory) throw new Error("document_directory_unavailable");
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
}

function extensionFor(mimeType?: string | null) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/** Copy picker/camera output out of temporary caches into app-owned storage. */
export async function persistUserPhoto(uri: string, kind: "closet" | "selfie" | "fitcheck", mimeType?: string | null) {
  await ensureDir();
  const destination = `${PHOTO_DIR}${kind}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${extensionFor(mimeType)}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

export async function deletePersistedPhoto(uri?: string | null) {
  if (!uri || !uri.startsWith(PHOTO_DIR)) return;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function deletePersistedPhotos(uris: Array<string | null | undefined>) {
  const unique = [...new Set(uris.filter((u): u is string => !!u))];
  await Promise.all(unique.map((uri) => deletePersistedPhoto(uri)));
}
