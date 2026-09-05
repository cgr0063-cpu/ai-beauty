export interface MoodDefinition {
  id: string;
  label: string;
  emoji: string; // playful, non-navigational use only, per brand rules
  intensityBias: number; // -2..+2, shifts makeup/accessory intensity
  energyWord: "low" | "medium" | "high";
}

export const MOODS: MoodDefinition[] = [
  { id: "energetic", label: "Energetic", emoji: "⚡️", intensityBias: 1, energyWord: "high" },
  { id: "calm", label: "Calm", emoji: "🕊️", intensityBias: -1, energyWord: "low" },
  { id: "confident", label: "Confident", emoji: "🔥", intensityBias: 1, energyWord: "high" },
  { id: "romantic", label: "Romantic", emoji: "🌷", intensityBias: 0, energyWord: "medium" },
  { id: "bold", label: "Bold", emoji: "💥", intensityBias: 2, energyWord: "high" },
  { id: "soft", label: "Soft", emoji: "🤍", intensityBias: -1, energyWord: "low" },
  { id: "cool", label: "Cool", emoji: "🧊", intensityBias: 0, energyWord: "medium" },
  { id: "happy", label: "Happy", emoji: "🌞", intensityBias: 1, energyWord: "high" },
  { id: "peaceful", label: "Peaceful", emoji: "🌿", intensityBias: -1, energyWord: "low" },
  { id: "focused", label: "Focused", emoji: "🎯", intensityBias: 0, energyWord: "medium" },
  { id: "sensitive", label: "Sensitive", emoji: "🩶", intensityBias: -1, energyWord: "low" },
  { id: "tired", label: "Tired", emoji: "🌙", intensityBias: -2, energyWord: "low" },
  { id: "low_energy", label: "Low-energy", emoji: "🫧", intensityBias: -2, energyWord: "low" },
  { id: "social", label: "Social", emoji: "🎉", intensityBias: 1, energyWord: "high" },
  { id: "playful", label: "Playful", emoji: "✨", intensityBias: 1, energyWord: "medium" },
  { id: "minimal_today", label: "Minimal today", emoji: "◻️", intensityBias: -2, energyWord: "low" },
  { id: "surprise_me", label: "Surprise me", emoji: "🎲", intensityBias: 0, energyWord: "medium" },
];
