export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  provider: "guest" | "email" | "google" | "apple";
}

export interface AuthResult {
  user: AuthUser;
  token: string | null;
  /** "local" means the account only exists on this device (no backend configured). */
  scope: "local" | "remote";
}

/**
 * Every sign-in path goes through this interface. Screens never call
 * fetch/SecureStore/expo-auth-session directly — see index.ts for the
 * factory that picks Demo vs Remote, and AuthProvider.tsx components for
 * the Google/Apple availability checks.
 */
export interface AuthProvider {
  signInWithEmail(email: string, password: string): Promise<AuthResult>;
  registerWithEmail(email: string, password: string, name?: string): Promise<AuthResult>;
  signInWithGoogle(payload: { email: string; name: string | null; googleSub: string }): Promise<AuthResult>;
  signInWithApple(payload: { email: string | null; name: string | null; appleSub: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
