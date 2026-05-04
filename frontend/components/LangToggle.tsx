"use client";

import { useI18n } from "@/lib/i18n-context";

export default function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const next = lang === "ar" ? "en" : "ar";
  const label = lang === "ar" ? "EN" : "ع";

  return (
    <button
      onClick={() => setLang(next)}
      className={`badge cursor-pointer hover:opacity-80 transition ${compact ? "text-[11px] px-2 py-0.5" : ""}`}
      style={{
        background: "rgba(139,92,246,0.12)",
        color: "#a78bfa",
        border: "1px solid rgba(139,92,246,0.25)",
      }}
      title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {label}
    </button>
  );
}
