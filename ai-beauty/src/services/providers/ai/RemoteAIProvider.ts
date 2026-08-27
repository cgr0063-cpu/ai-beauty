import { AIProvider, FitCheckInput, FitCheckResult, GeneratedLook, LookRequestInput } from "./AIProvider";

/**
 * Talks ONLY to your own backend (EXPO_PUBLIC_API_BASE_URL), never directly
 * to an AI vendor. Your backend holds the real provider key (OpenAI,
 * Anthropic, etc.) and should implement:
 *
 *   POST {BASE_URL}/v1/looks/generate        body: LookRequestInput           -> GeneratedLook
 *   POST {BASE_URL}/v1/looks/regenerate       body: { input, direction }       -> GeneratedLook
 *   POST {BASE_URL}/v1/fit-check/analyze      body: FitCheckInput (multipart)  -> FitCheckResult
 *
 * See /backend-notes.md at the project root for a minimal reference
 * implementation you can deploy to a serverless function.
 */
export class RemoteAIProvider implements AIProvider {
  constructor(private baseUrl: string) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`AI backend error ${res.status} on ${path}`);
    }
    return (await res.json()) as T;
  }

  async generateTodaysLook(input: LookRequestInput): Promise<GeneratedLook> {
    const result = await this.post<GeneratedLook>("/v1/looks/generate", input);
    return { ...result, source: "remote" };
  }

  async regenerateLook(
    input: LookRequestInput,
    direction: "bolder" | "softer" | "office" | "dateNight" | "another"
  ): Promise<GeneratedLook> {
    const result = await this.post<GeneratedLook>("/v1/looks/regenerate", { input, direction });
    return { ...result, source: "remote" };
  }

  async analyzeFitCheck(input: FitCheckInput): Promise<FitCheckResult> {
    const form = new FormData();
    // React Native FormData file shape (uri/name/type), not a web File object.
    form.append("photo", {
      uri: input.photoUri,
      name: "fitcheck.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    form.append("planId", input.planId ?? "");
    form.append("styleId", input.styleId ?? "");
    form.append("weatherCondition", input.weatherCondition ?? "");
    form.append("closetItemLabels", JSON.stringify(input.closetItemLabels));

    const res = await fetch(`${this.baseUrl}/v1/fit-check/analyze`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: form,
    });
    if (!res.ok) throw new Error(`AI backend error ${res.status} on /v1/fit-check/analyze`);
    const result = (await res.json()) as FitCheckResult;
    return { ...result, source: "remote" };
  }
}
