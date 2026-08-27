export type PlanCategoryId =
  | "everyday"
  | "social"
  | "culture"
  | "special"
  | "sport"
  | "outdoor"
  | "travel"
  | "soloHome";

export interface PlanOption {
  id: string;
  label: string;
  category: PlanCategoryId;
  formality: 0 | 1 | 2 | 3; // 0 relaxed .. 3 formal
  requiresSafetyPriority?: boolean; // outdoor/sport contexts where weather/safety > style
}

export interface PlanCategory {
  id: PlanCategoryId;
  label: string;
}

export const PLAN_CATEGORIES: PlanCategory[] = [
  { id: "everyday", label: "Daily" },
  { id: "social", label: "Social" },
  { id: "culture", label: "Culture" },
  { id: "special", label: "Special" },
  { id: "sport", label: "Sport & fitness" },
  { id: "outdoor", label: "Outdoor & nature" },
  { id: "travel", label: "Travel" },
  { id: "soloHome", label: "Solo & home" },
];

export const PLAN_OPTIONS: PlanOption[] = [
  { id: "daily_casual", label: "Daily / Casual", category: "everyday", formality: 0 },
  { id: "office_work", label: "Office / Work", category: "everyday", formality: 2 },
  { id: "job_interview", label: "Job Interview", category: "everyday", formality: 3 },
  { id: "coffee", label: "Coffee", category: "social", formality: 0 },
  { id: "friends_meetup", label: "Friends Meetup", category: "social", formality: 1 },
  { id: "date_night", label: "Date Night", category: "social", formality: 2 },
  { id: "dinner", label: "Dinner", category: "social", formality: 2 },
  { id: "party", label: "Party", category: "social", formality: 2 },
  { id: "cinema", label: "Cinema", category: "culture", formality: 0 },
  { id: "theatre", label: "Theatre", category: "culture", formality: 2 },
  { id: "concert", label: "Concert", category: "culture", formality: 1 },
  { id: "workshop", label: "Workshop", category: "culture", formality: 1 },
  { id: "museum", label: "Museum / Exhibition", category: "culture", formality: 1 },
  { id: "shopping", label: "Shopping", category: "everyday", formality: 0 },
  { id: "wedding", label: "Wedding", category: "special", formality: 3 },
  { id: "invitation", label: "Invitation", category: "special", formality: 2 },
  { id: "special_occasion", label: "Special Occasion", category: "special", formality: 3 },
  { id: "spontaneous", label: "Spontaneous", category: "everyday", formality: 0 },
  { id: "travel_day", label: "Travel", category: "travel", formality: 0, requiresSafetyPriority: true },
  { id: "vacation", label: "Vacation", category: "travel", formality: 0 },
  { id: "beach", label: "Beach", category: "travel", formality: 0, requiresSafetyPriority: true },
  { id: "ski", label: "Ski", category: "travel", formality: 0, requiresSafetyPriority: true },
  { id: "at_home", label: "At Home", category: "soloHome", formality: 0 },
  { id: "solo_time", label: "Solo / Me Time", category: "soloHome", formality: 0 },
  { id: "pet_walk", label: "Pet Walk", category: "outdoor", formality: 0, requiresSafetyPriority: true },

  // Sport branch — never collapsed into one generic "Gym"
  { id: "gym_weights", label: "Gym / Weight Training", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "crossfit", label: "CrossFit", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "pilates", label: "Pilates", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "yoga", label: "Yoga", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "hiit", label: "HIIT", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "running", label: "Running", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "walking", label: "Walking", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "cycling", label: "Cycling", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "outdoor_training", label: "Outdoor Training", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "swimming", label: "Swimming", category: "sport", formality: 0, requiresSafetyPriority: true },
  { id: "recovery_mobility", label: "Recovery / Mobility", category: "sport", formality: 0, requiresSafetyPriority: true },

  // Outdoor / nature branch
  { id: "park_nature", label: "Park / Nature", category: "outdoor", formality: 0, requiresSafetyPriority: true },
  { id: "trekking", label: "Trekking", category: "outdoor", formality: 0, requiresSafetyPriority: true },
  { id: "hiking", label: "Hiking", category: "outdoor", formality: 0, requiresSafetyPriority: true },
  { id: "nature_trip", label: "Nature Trip", category: "outdoor", formality: 0, requiresSafetyPriority: true },
];

export const GYM_SUBOPTIONS = [
  { id: "upper_body", label: "Upper Body" },
  { id: "lower_body", label: "Lower Body" },
  { id: "full_body", label: "Full Body" },
  { id: "cardio", label: "Cardio" },
  { id: "recovery_day", label: "Light / Recovery Day" },
];

export function getPlanById(id: string): PlanOption | undefined {
  return PLAN_OPTIONS.find((p) => p.id === id);
}

export function isSafetyPriorityPlan(planId: string): boolean {
  return !!getPlanById(planId)?.requiresSafetyPriority;
}
