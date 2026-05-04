import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, lang: "ar" | "en" = "ar"): string {
  if (lang === "en") {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "m";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toString();
  }
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ألف";
  return n.toString();
}

const AR_TO_EN_DAY: Record<string, string> = {
  "الأحد": "Sun", "الاثنين": "Mon", "الثلاثاء": "Tue",
  "الأربعاء": "Wed", "الخميس": "Thu", "الجمعة": "Fri", "السبت": "Sat",
};

const AR_TO_EN_DAY_FULL: Record<string, string> = {
  "الأحد": "Sunday", "الاثنين": "Monday", "الثلاثاء": "Tuesday",
  "الأربعاء": "Wednesday", "الخميس": "Thursday", "الجمعة": "Friday", "السبت": "Saturday",
};

export function translateDay(day: string, lang: "ar" | "en", short = false): string {
  if (lang === "ar") return day;
  return short ? (AR_TO_EN_DAY[day] ?? day) : (AR_TO_EN_DAY_FULL[day] ?? day);
}

export function impactColor(impact: string) {
  if (impact === "high")   return "badge-red";
  if (impact === "medium") return "badge-yellow";
  return "badge-blue";
}

export function priorityColor(p: string) {
  if (p === "high")   return "badge-red";
  if (p === "medium") return "badge-yellow";
  return "badge-green";
}
