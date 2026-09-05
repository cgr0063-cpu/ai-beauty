import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { AuthUser } from "@/services/providers/auth/AuthProvider";

interface AuthState {
  currentUser: AuthUser | null;
  scope: "local" | "remote" | null;
  setSession: (user: AuthUser | null, scope: "local" | "remote" | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      scope: null,
      setSession: (user, scope) => set({ currentUser: user, scope }),
    }),
    { name: "aibeauty.authSession.v1", storage: createAsyncStorageAdapter() }
  )
);
