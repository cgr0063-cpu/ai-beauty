# AI Beauty P2 checkpoint — wardrobe/photo lifecycle

Implemented in this checkpoint:
- Closet picker/camera photos are copied from temporary picker/cache URIs into app-owned document storage.
- Deleting a closet item also deletes its app-owned photo and requires destructive confirmation.
- Closet add supports camera and gallery.
- Remote AI wardrobe-item vision classification endpoint added (category, label, visible color, style tags, confidence).
- Production demo provider does not pretend to visually classify wardrobe images.
- Fit Check receives richer closet descriptors (label/category/color/style tags) instead of generic labels only.
- Closet add/delete/analyze UI strings added with EN/TR/RU parity.

Still intentionally open:
- Client-side re-encode/resize/EXIF stripping (requires adding/validating expo-image-manipulator against the target Expo SDK).
- Uploading actual closet images alongside Fit Check (current approach uses AI-derived closet metadata to avoid sending many private images/costly vision calls).
- Full typecheck/build remains required after dependency install.
