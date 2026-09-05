import * as SecureStore from "expo-secure-store";
import { AuthProvider, AuthResult, AuthUser } from "./AuthProvider";

const TOKEN_KEY = "aibeauty_auth_token";
const USER_KEY = "aibeauty_auth_user";

export class RemoteAuthProvider implements AuthProvider {
  constructor(private baseUrl: string) {}

  private async post(path: string, body: unknown): Promise<{ token: string; user: AuthUser }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error: any) {
      if (error?.name === "AbortError") throw new Error("auth_timeout");
      throw new Error("auth_network_error");
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error ?? `auth_error_${res.status}`);
    }
    return res.json();
  }

  private async persist(token: string, user: AuthUser) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const { token, user } = await this.post("/v1/auth/login", { email, password });
    await this.persist(token, user);
    return { user, token, scope: "remote" };
  }

  async registerWithEmail(email: string, password: string, name?: string): Promise<AuthResult> {
    const { token, user } = await this.post("/v1/auth/register", { email, password, name });
    await this.persist(token, user);
    return { user, token, scope: "remote" };
  }

  async signInWithGoogle(payload: { idToken: string }): Promise<AuthResult> {
    const { token, user } = await this.post("/v1/auth/google", payload);
    await this.persist(token, user);
    return { user, token, scope: "remote" };
  }

  async signInWithApple(payload: { identityToken: string; name: string | null }): Promise<AuthResult> {
    const { token, user } = await this.post("/v1/auth/apple", payload);
    await this.persist(token, user);
    return { user, token, scope: "remote" };
  }

  async signOut(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  async deleteAccount(): Promise<void> {
    const token = await this.getToken();
    if (!token) throw new Error("not_authenticated");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${this.baseUrl}/v1/me`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `delete_account_${res.status}`);
      }
      await this.signOut();
    } finally { clearTimeout(timeout); }
  }

  async exportAccountData(): Promise<unknown | null> {
    const token = await this.getToken();
    if (!token) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${this.baseUrl}/v1/me/export`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!res.ok) throw new Error(`export_account_${res.status}`);
      return res.json();
    } finally { clearTimeout(timeout); }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
}
