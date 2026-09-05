export interface StyleDefinition {
  id: string;
  labelKey: string; // fallback label if no translation exists yet
  label: string;
  colorAccents: string[];
  silhouette: string;
  detailNotes: string;
  energy: "low" | "medium" | "high";
}

/**
 * Data-driven and extendable: to add a 25th style, just append an entry here.
 * No screen code needs to change — pickers and the decision engine both
 * read from this list.
 */
export const STYLES: StyleDefinition[] = [
  { id: "clean_girl", label: "Clean Girl", colorAccents: ["#F5E9DD", "#C9A992"], silhouette: "fitted, minimal", detailNotes: "dewy skin, slicked hair, barely-there makeup", energy: "low" },
  { id: "old_money", label: "Old Money", colorAccents: ["#8A7654", "#D8CBAE"], silhouette: "tailored, relaxed structure", detailNotes: "quality fabrics, muted palette, understated accessories", energy: "low" },
  { id: "quiet_luxury", label: "Quiet Luxury", colorAccents: ["#3C3A36", "#B9AE9C"], silhouette: "clean lines, no logos", detailNotes: "investment pieces, neutral tones", energy: "low" },
  { id: "minimal", label: "Minimal", colorAccents: ["#111111", "#F2F2F2"], silhouette: "streamlined", detailNotes: "monochrome, negative space", energy: "low" },
  { id: "casual_chic", label: "Casual Chic", colorAccents: ["#D9C8B4", "#4A4A4A"], silhouette: "relaxed but put-together", detailNotes: "elevated basics", energy: "medium" },
  { id: "streetwear", label: "Streetwear", colorAccents: ["#111111", "#E8442D"], silhouette: "oversized, layered", detailNotes: "sneakers, graphic pieces", energy: "high" },
  { id: "sporty", label: "Sporty", colorAccents: ["#1F2937", "#22C55E"], silhouette: "athletic cut", detailNotes: "technical fabrics", energy: "high" },
  { id: "athleisure", label: "Athleisure", colorAccents: ["#111827", "#A78BFA"], silhouette: "comfortable, structured", detailNotes: "leggings/joggers elevated with accessories", energy: "medium" },
  { id: "romantic", label: "Romantic", colorAccents: ["#F4C6D0", "#8E4A5C"], silhouette: "soft, flowing", detailNotes: "florals, lace, delicate jewelry", energy: "medium" },
  { id: "dark_feminine", label: "Dark Feminine", colorAccents: ["#1A1A1A", "#7A2048"], silhouette: "fitted, structured drama", detailNotes: "deep tones, bold lip", energy: "medium" },
  { id: "boho", label: "Boho", colorAccents: ["#B08968", "#DDA15E"], silhouette: "loose, layered", detailNotes: "natural textures, fringe, warm tones", energy: "medium" },
  { id: "y2k", label: "Y2K", colorAccents: ["#FF6EC7", "#B8FF00"], silhouette: "low-rise, cropped", detailNotes: "metallics, playful accessories", energy: "high" },
  { id: "scandinavian", label: "Scandinavian", colorAccents: ["#E8E6E1", "#3D4B4A"], silhouette: "relaxed minimal", detailNotes: "neutral palette, function-first", energy: "low" },
  { id: "parisian_chic", label: "Parisian Chic", colorAccents: ["#1C1C1C", "#C9A66B"], silhouette: "effortless tailoring", detailNotes: "trench, striped tee, red lip", energy: "medium" },
  { id: "preppy", label: "Preppy", colorAccents: ["#1D3557", "#E63946"], silhouette: "structured, collegiate", detailNotes: "polos, knits, loafers", energy: "medium" },
  { id: "classic", label: "Classic", colorAccents: ["#1B1B1B", "#8C7A5B"], silhouette: "timeless tailoring", detailNotes: "neutral, refined", energy: "low" },
  { id: "edgy", label: "Edgy", colorAccents: ["#0D0D0D", "#8A8A8A"], silhouette: "structured with hard details", detailNotes: "leather, metal hardware", energy: "high" },
  { id: "soft_girl", label: "Soft Girl", colorAccents: ["#FCE1E4", "#B5A8D5"], silhouette: "fitted, cute", detailNotes: "pastels, playful accessories", energy: "medium" },
  { id: "coastal", label: "Coastal", colorAccents: ["#E8F1F2", "#2E6E7A"], silhouette: "relaxed, breezy", detailNotes: "linen, light textures", energy: "low" },
  { id: "vintage", label: "Vintage", colorAccents: ["#7A5C3E", "#C6A15B"], silhouette: "era-inspired tailoring", detailNotes: "retro prints, thrifted feel", energy: "medium" },
  { id: "glam", label: "Glam", colorAccents: ["#111111", "#D4AF37"], silhouette: "fitted, statement", detailNotes: "shine, bold accessories", energy: "high" },
  { id: "business_chic", label: "Business Chic", colorAccents: ["#1F2A44", "#C0C4CC"], silhouette: "tailored", detailNotes: "structured blazer, polished finish", energy: "low" },
  { id: "monochrome", label: "Monochrome", colorAccents: ["#141414", "#DADADA"], silhouette: "single-tone layering", detailNotes: "texture over color for interest", energy: "low" },
  { id: "effortless", label: "Effortless", colorAccents: ["#E4DED4", "#4E4E4E"], silhouette: "relaxed, undone", detailNotes: "natural finish, minimal styling", energy: "medium" },
];

export function getStyleById(id: string): StyleDefinition | undefined {
  return STYLES.find((s) => s.id === id);
}
