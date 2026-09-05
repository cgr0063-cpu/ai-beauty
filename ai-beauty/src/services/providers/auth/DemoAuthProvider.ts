import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { AuthProvider, AuthResult, AuthUser } from "./AuthProvider";

const LOCAL_USERS_KEY = "aibeauty.auth.localUsers.v1";
const CURRENT_USER_KEY = "aibeauty.auth.currentUser.v1";

interface StoredLocalUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
}

async function hash(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

async function loadUsers(): Promise<StoredLocalUser[]> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await AsyncStorage.removeItem(LOCAL_USERS_KEY);
    return [];
  }
}

async function saveUsers(users: StoredLocalUser[]) {
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

/**
 * Fully on-device auth: creates a real local account (hashed password,
 * persisted via AsyncStorage), so sign-up/sign-in genuinely works and
 * persists across app restarts — it just doesn't sync across devices
 * until a backend is configured (see RemoteAuthProvider). Never claims a
 * false success: wrong password / duplicate email are real, checked errors.
 */
export class DemoAuthProvider implements AuthProvider {
  async registerWithEmail(email: string, password: string, name?: string): Promise<AuthResult> {
    const users = await loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("email_taken");
    }
    const passwordHash = await hash(password);
    const user: StoredLocalUser = { id: `local_${Date.now()}`, email, name: name ?? null, passwordHash };
    await saveUsers([...users, user]);
    const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, provider: "email" };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
    return { user: authUser, token: null, scope: "local" };
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const users = await loadUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!match) throw new Error("invalid_credentials");
    const passwordHash = await hash(password);
    if (passwordHash !== match.passwordHash) throw new Error("invalid_credentials");
    const authUser: AuthUser = { id: match.id, email: match.email, name: match.name, provider: "email" };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
    return { user: authUser, token: null, scope: "local" };
  }

  async signInWithGoogle(): Promise<AuthResult> {
    // Local provider has no server to verify against; Google sign-in is
    // only offered when EXPO_PUBLIC_API_BASE_URL + client IDs are set
    // (see AuthButtons.tsx) so this path should not normally be reached.
    throw new Error("google_requires_backend");
  }

  async signInWithApple(): Promise<AuthResult> {
    throw new Error("apple_requires_backend");
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }

  async deleteAccount(): Promise<void> {
    const current = await this.getCurrentUser();
    if (current) {
      const users = await loadUsers();
      await saveUsers(users.filter((u) => u.id !== current.id));
    }
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }

  async exportAccountData(): Promise<unknown | null> {
    const current = await this.getCurrentUser();
    return current ? { account: current, scope: "local", storedOnDeviceOnly: true } : null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  }
  async getToken(): Promise<string | null> { return null; }
}
