import { getAuthProvider } from "@/services/providers/auth";
import { AIProvider, ClosetItemAnalysis, FitCheckInput, FitCheckResult, GeneratedLook, LookRequestInput } from "./AIProvider";

const REQUEST_TIMEOUT_MS = 15_000;

export class RemoteAIProvider implements AIProvider {
  constructor(private baseUrl: string) {}

  private async authHeaders(json = false): Promise<Record<string, string>> {
    const token = await getAuthProvider().getToken();
    if (!token) throw new Error("authentication_required");
    return { Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) };
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal });
      if (!res.ok) throw new Error(`AI backend error ${res.status} on ${path}`);
      return (await res.json()) as T;
    } finally { clearTimeout(timer); }
  }

  private async sendLook(path: string, input: LookRequestInput, direction?: string): Promise<GeneratedLook> {
    if (!input.selfieUri) {
      const body = direction ? { input, direction } : input;
      return this.request(path, { method: "POST", headers: await this.authHeaders(true), body: JSON.stringify(body) });
    }
    const form = new FormData();
    form.append("input", JSON.stringify({ ...input, selfieUri: null }));
    if (direction) form.append("direction", direction);
    form.append("selfie", { uri: input.selfieUri, name: "selfie.jpg", type: "image/jpeg" } as unknown as Blob);
    return this.request(path, { method: "POST", headers: await this.authHeaders(false), body: form });
  }

  async generateTodaysLook(input: LookRequestInput): Promise<GeneratedLook> {
    const result = await this.sendLook("/v1/looks/generate", input);
    return { ...result, source: "remote" };
  }

  async regenerateLook(input: LookRequestInput, direction: "bolder" | "softer" | "office" | "dateNight" | "another"): Promise<GeneratedLook> {
    const result = await this.sendLook("/v1/looks/regenerate", input, direction);
    return { ...result, source: "remote" };
  }

  async analyzeClosetItem(photoUri: string, languageCode: string): Promise<ClosetItemAnalysis> {
    const form = new FormData();
    form.append("photo", { uri: photoUri, name: "closet-item.jpg", type: "image/jpeg" } as unknown as Blob);
    form.append("languageCode", languageCode);
    return this.request<ClosetItemAnalysis>("/v1/closet/analyze", { method: "POST", headers: await this.authHeaders(false), body: form });
  }

  async analyzeStoreProduct(photoUri: string, languageCode: string): Promise<ClosetItemAnalysis> {
    const form = new FormData();
    form.append("photo", { uri: photoUri, name: "store-product.jpg", type: "image/jpeg" } as unknown as Blob);
    form.append("languageCode", languageCode);
    return this.request<ClosetItemAnalysis>("/v1/store/analyze", { method: "POST", headers: await this.authHeaders(false), body: form });
  }

  async analyzeFitCheck(input: FitCheckInput): Promise<FitCheckResult> {
    const form = new FormData();
    form.append("photo", { uri: input.photoUri, name: "fitcheck.jpg", type: "image/jpeg" } as unknown as Blob);
    form.append("planId", input.planId ?? "");
    form.append("styleId", input.styleId ?? "");
    form.append("weatherCondition", input.weatherCondition ?? "");
    form.append("closetItemLabels", JSON.stringify(input.closetItemLabels));
    form.append("languageCode", input.languageCode);
    const result = await this.request<FitCheckResult>("/v1/fit-check/analyze", { method: "POST", headers: await this.authHeaders(false), body: form });
    return { ...result, source: "remote" };
  }
}
