"use client";

import { formatNumber, translateDay } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

interface Stat { value: string; label: string; glow?: string; }

const AR_TO_EN_DAY: Record<string, string> = {
  "الأحد": "Sunday", "الاثنين": "Monday", "الثلاثاء": "Tuesday",
  "الأربعاء": "Wednesday", "الخميس": "Thursday", "الجمعة": "Friday", "السبت": "Saturday",
};

export default function StatsRow({ summary }: { summary: Record<string, number | string> }) {
  const { t, lang } = useI18n();
  const stats: Stat[] = [
    {
      value: formatNumber(summary.total_engagement as number, lang),
      label: t.statEngagement,
      glow: "rgba(244,114,182,0.6)",
    },
    {
      value: formatNumber(summary.total_impressions as number, lang),
      label: t.statImpressions,
      glow: "rgba(96,165,250,0.6)",
    },
    {
      value: (summary.avg_engagement as number).toFixed(0),
      label: t.statAvg,
      glow: "rgba(74,222,128,0.6)",
    },
    {
      value: `${summary.best_hour}:00`,
      label: t.statHour,
      glow: "rgba(251,191,36,0.6)",
    },
    {
      value: translateDay(summary.best_day as string, lang),
      label: t.statDay,
      glow: "rgba(167,139,250,0.6)",
    },
    {
      value: `${summary.with_media_pct}%`,
      label: t.statMedia,
      glow: "rgba(34,211,238,0.6)",
    },
  ];

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap gap-x-2 gap-y-3">
        {stats.map((s, i) => (
          <div key={i} className="flex items-baseline gap-1.5 px-3">
            <span
              className="text-lg font-black"
              style={{ color: s.glow ? s.glow.replace("0.6)", "1)") : "#e9ecef" }}
            >
              {s.value}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {s.label}
            </span>
            {i < stats.length - 1 && (
              <span
                className="text-xs mr-3 hidden sm:inline"
                style={{ color: "var(--border2)", paddingRight: "6px" }}
              >
                ·
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
