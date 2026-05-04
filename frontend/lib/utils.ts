import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ك";
  return n.toString();
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
