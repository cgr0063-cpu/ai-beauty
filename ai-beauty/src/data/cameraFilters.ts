export type CameraFilterId = "none" | "warm" | "cool" | "goldenHour" | "clean" | "glam";

export interface CameraFilterDefinition {
  id: CameraFilterId;
  labelKey: string;
  /** Overlay tint applied at the given intensity — real, rendered color grading
   * (a soft-light-style tinted overlay + gentle vignette + subtle glow), not a
   * cosmetic label with no visual effect. */
  overlayColor: string;
  /** Baseline opacity at 100% intensity slider. */
  maxOverlayOpacity: number;
  vignette: boolean;
  glow: boolean;
}

export const CAMERA_FILTERS: CameraFilterDefinition[] = [
  { id: "none", labelKey: "camera.original", overlayColor: "#000000", maxOverlayOpacity: 0, vignette: false, glow: false },
  { id: "warm", labelKey: "camera.styles.warm", overlayColor: "#FF9D5C", maxOverlayOpacity: 0.22, vignette: false, glow: true },
  { id: "cool", labelKey: "camera.styles.cool", overlayColor: "#5CA6FF", maxOverlayOpacity: 0.18, vignette: false, glow: false },
  { id: "goldenHour", labelKey: "camera.styles.goldenHour", overlayColor: "#FFC15C", maxOverlayOpacity: 0.28, vignette: true, glow: true },
  { id: "clean", labelKey: "camera.styles.clean", overlayColor: "#FFFFFF", maxOverlayOpacity: 0.12, vignette: false, glow: true },
  { id: "glam", labelKey: "camera.styles.glam", overlayColor: "#D96FA0", maxOverlayOpacity: 0.24, vignette: true, glow: true },
];

export function getFilterById(id: CameraFilterId): CameraFilterDefinition {
  return CAMERA_FILTERS.find((f) => f.id === id) ?? CAMERA_FILTERS[0];
}

export type CameraMode = "selfie" | "photo" | "runway";
