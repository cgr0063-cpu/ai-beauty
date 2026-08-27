export interface TrendItem {
  id: string;
  title: string;
  imageUri: string | null;
  verdict: "buy" | "consider" | "skip";
  reason: string;
}

export interface TrendProvider {
  getStoreModeSuggestions(input: { styleId: string | null; closetGaps: string[] }): Promise<TrendItem[]>;
}

/**
 * Store Mode reuses the app's own BUY / CONSIDER / SKIP decision philosophy
 * (closet-first, gap-driven) rather than a generic product feed. This is a
 * local placeholder — wire a real catalog/backend behind the same
 * interface when ready. Never fabricates real product links.
 */
export class DemoTrendProvider implements TrendProvider {
  async getStoreModeSuggestions(input: { styleId: string | null; closetGaps: string[] }): Promise<TrendItem[]> {
    if (input.closetGaps.length === 0) {
      return [
        {
          id: "demo_1",
          title: "Your closet already covers today's needs",
          imageUri: null,
          verdict: "skip",
          reason: "No genuine gap detected yet — check back after a Fit Check.",
        },
      ];
    }
    return input.closetGaps.slice(0, 3).map((gap, i) => ({
      id: `demo_gap_${i}`,
      title: gap,
      imageUri: null,
      verdict: "consider",
      reason: `Identified as a real gap during Fit Check — worth considering, not urgent.`,
    }));
  }
}

export function getTrendProvider(): TrendProvider {
  return new DemoTrendProvider();
}
