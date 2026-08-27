import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { ModuleId } from "@/data/context";

export interface UserProfile {
  name: string | null;
  age: number | null;
  isGuest: boolean;
  interestedModules: ModuleId[];
  favoriteStyleIds: string[];
  favoriteColors: string[];
  dislikedColors: string[];
  beautyIntensityPreference: "very_light" | "light" | "medium" | "defined" | "glam" | null;
  zodiacSignId: string | null;
  selfieUri: string | null;
  fullBodyPhotoUri: string | null;
  /** true once the required minimum onboarding step ("Get started") is done */
  onboardingStarted: boolean;
  /** true once user reaches the finish screen (does NOT require every field filled) */
  onboardingCompleted: boolean;
}

interface UserState extends UserProfile {
  setName: (name: string) => void;
  setAge: (age: number) => void;
  setGuest: (v: boolean) => void;
  toggleModule: (m: ModuleId) => void;
  setModules: (m: ModuleId[]) => void;
  toggleFavoriteStyle: (id: string) => void;
  setBeautyIntensityPreference: (v: UserProfile["beautyIntensityPreference"]) => void;
  setZodiacSignId: (id: string | null) => void;
  setSelfieUri: (uri: string | null) => void;
  setFullBodyPhotoUri: (uri: string | null) => void;
  setOnboardingStarted: (v: boolean) => void;
  setOnboardingCompleted: (v: boolean) => void;
  resetProfile: () => void;
}

const initialProfile: UserProfile = {
  name: null,
  age: null,
  isGuest: true,
  interestedModules: [],
  favoriteStyleIds: [],
  favoriteColors: [],
  dislikedColors: [],
  beautyIntensityPreference: null,
  zodiacSignId: null,
  selfieUri: null,
  fullBodyPhotoUri: null,
  onboardingStarted: false,
  onboardingCompleted: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialProfile,
      setName: (name) => set({ name }),
      setAge: (age) => set({ age }),
      setGuest: (v) => set({ isGuest: v }),
      toggleModule: (m) => {
        const current = get().interestedModules;
        set({
          interestedModules: current.includes(m)
            ? current.filter((x) => x !== m)
            : [...current, m],
        });
      },
      setModules: (m) => set({ interestedModules: m }),
      toggleFavoriteStyle: (id) => {
        const current = get().favoriteStyleIds;
        set({
          favoriteStyleIds: current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id],
        });
      },
      setBeautyIntensityPreference: (v) => set({ beautyIntensityPreference: v }),
      setZodiacSignId: (id) => set({ zodiacSignId: id }),
      setSelfieUri: (uri) => set({ selfieUri: uri }),
      setFullBodyPhotoUri: (uri) => set({ fullBodyPhotoUri: uri }),
      setOnboardingStarted: (v) => set({ onboardingStarted: v }),
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      resetProfile: () => set({ ...initialProfile }),
    }),
    {
      name: "aibeauty.user.v1",
      storage: createAsyncStorageAdapter(),
    }
  )
);
