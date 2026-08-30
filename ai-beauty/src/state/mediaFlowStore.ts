import { create } from "zustand";
import { CameraMode } from "@/data/cameraFilters";

type EnhancePurpose = "selfie" | "generic";

interface MediaFlowState {
  pendingSelfieCapture: boolean;
  enhancePhotoUri: string | null;
  enhanceMode: CameraMode | null;
  enhancePurpose: EnhancePurpose | null;
  fitCheckPhotoUri: string | null;
  tailorAdvice: string[] | null;
  requestSelfieCapture: () => void;
  consumeSelfieCaptureRequest: () => void;
  beginEnhance: (photoUri: string, mode: CameraMode, purpose?: EnhancePurpose) => void;
  clearEnhance: () => void;
  setFitCheckPhotoUri: (photoUri: string | null) => void;
  setTailorAdvice: (advice: string[] | null) => void;
}

/**
 * Ephemeral media hand-off state.
 * Local file URIs deliberately stay out of route/query params so they do not
 * leak into deep links, logs or restored navigation state.
 */
export const useMediaFlowStore = create<MediaFlowState>((set) => ({
  pendingSelfieCapture: false,
  enhancePhotoUri: null,
  enhanceMode: null,
  enhancePurpose: null,
  fitCheckPhotoUri: null,
  tailorAdvice: null,
  requestSelfieCapture: () => set({ pendingSelfieCapture: true }),
  consumeSelfieCaptureRequest: () => set({ pendingSelfieCapture: false }),
  beginEnhance: (enhancePhotoUri, enhanceMode, enhancePurpose = "generic") =>
    set({ enhancePhotoUri, enhanceMode, enhancePurpose }),
  clearEnhance: () => set({ pendingSelfieCapture: false, enhancePhotoUri: null, enhanceMode: null, enhancePurpose: null }),
  setFitCheckPhotoUri: (fitCheckPhotoUri) => set({ fitCheckPhotoUri }),
  setTailorAdvice: (tailorAdvice) => set({ tailorAdvice }),
}));
