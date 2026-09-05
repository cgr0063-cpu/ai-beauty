import { FitCheckInput, FitCheckResult } from "@/services/providers/ai/AIProvider";

/**
 * Development-only fallback. It deliberately DOES NOT pretend to inspect pixels.
 * Production never reaches DemoAIProvider (provider selection fails closed).
 */
export function evaluateFitCheck(input: FitCheckInput): FitCheckResult {
  const lang = (input.languageCode || "en").toLowerCase();
  const tr = lang.startsWith("tr");
  const ru = lang.startsWith("ru");
  return {
    outcome: "keep",
    confidence: "low",
    whatWorks: [],
    whatToChange: [],
    why: tr
      ? "Geliştirme modundaki çevrimdışı demo fotoğraf piksellerini analiz etmez. Gerçek Fit Check için güvenli AI backend bağlantısı gerekir."
      : ru
        ? "Офлайн-демо в режиме разработки не анализирует пиксели фотографии. Для реального Fit Check требуется защищённое подключение к AI-бэкенду."
        : "The offline development demo does not analyze photo pixels. A secure AI backend connection is required for a real Fit Check.",
    closetAlternative: null,
    tailorAdvice: null,
    shopSuggestion: null,
    detectedItems: [],
    source: "demo",
  };
}
