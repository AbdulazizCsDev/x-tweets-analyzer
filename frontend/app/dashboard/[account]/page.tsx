"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Sparkles, BarChart3, BookOpen } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import StatsRow from "@/components/StatsRow";
import BasicTab from "@/components/BasicTab";
import AITab from "@/components/AITab";
import LangToggle from "@/components/LangToggle";

type Tab = "basic" | "ai";

export default function Dashboard({ params }: { params: Promise<{ account: string }> }) {
  const { account } = use(params);
  const router = useRouter();
  const { t, lang } = useI18n();
  const isAr = lang === "ar";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>("basic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("anthropic_key");
    if (stored) setAnthropicKey(stored);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAnalytics(account)
      .then(setAnalytics)
      .catch((e) => setError(e?.response?.data?.detail || t.errorData))
      .finally(() => setLoading(false));
  }, [account, t.errorData]);

  function saveKey(key: string) {
    setAnthropicKey(key);
    if (key) localStorage.setItem("anthropic_key", key);
    else localStorage.removeItem("anthropic_key");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-4 animate-spin"
            style={{ borderColor: "#8b5cf6", borderTopColor: "transparent" }}
          />
          <p style={{ color: "var(--muted)" }} className="text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <p className="text-red-400 mb-4">{error || t.noData}</p>
          <button onClick={() => router.push("/")} className="text-brand-400 hover:underline text-sm">
            {t.goHome}
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics.summary as Record<string, number | string>;

  return (
    <main className="min-h-screen pb-16">

      <div
        className="h-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0010 0%, #1a0035 40%, #0a0018 100%)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 120% at 30% 60%, rgba(139,92,246,0.35) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 80% at 80% 40%, rgba(245,158,11,0.12) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: "rgba(0,0,9,0.88)",
          backdropFilter: "blur(20px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="transition rounded-full p-1.5"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e9ecef")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              <BackIcon size={18} />
            </button>

            <div
              className="flex items-center gap-2 pr-3 border-r"
              style={{ borderColor: "var(--border2)" }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}
              >
                <BookOpen size={12} className="text-white" />
              </div>
              <span className="font-extrabold text-sm gradient-text hidden sm:block">{t.appName}</span>
            </div>

            <div>
              <h1 className="text-sm font-bold leading-tight">@{account}</h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {(summary.total_tweets as number).toLocaleString()} {t.tweetsAnalyzed}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LangToggle compact />
            <KeyInput value={anthropicKey} onChange={saveKey} />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 flex">
          <TabBtn active={tab === "basic"} onClick={() => setTab("basic")} icon={<BarChart3 size={15} />} label={t.tabAnalytics} />
          <TabBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={<Sparkles size={15} />} label={t.tabAI} />
        </div>
      </header>

      <div
        className="border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0 -mt-8 ring-4"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}
          >
            {account[0]?.toUpperCase() ?? "X"}
          </div>
          <div>
            <p className="font-black text-base leading-tight">@{account}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {t.appName}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-5">
        <StatsRow summary={summary} />

        <div className="mt-5">
          {tab === "basic" && <BasicTab data={analytics} />}
          {tab === "ai"    && <AITab account={account} apiKey={anthropicKey} />}
        </div>
      </div>
    </main>
  );
}

function TabBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-5 py-3 text-sm font-bold border-b-2 transition"
      style={{
        borderColor: active ? "#8b5cf6" : "transparent",
        color: active ? "#a78bfa" : "var(--muted)",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#e9ecef"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
    >
      {icon} {label}
    </button>
  );
}

function isValidKey(key: string) {
  return key.startsWith("sk-ant-") && key.length >= 40;
}

function KeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const valid = isValidKey(value);
  const badgeClass = valid ? "badge-green" : value.length > 0 ? "badge-red" : "badge-yellow";
  const label = valid ? t.keyValid : value.length > 0 ? t.keyInvalid : t.keyEmpty;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`badge cursor-pointer ${badgeClass}`}
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute left-0 top-10 card w-80 z-40"
          style={{ borderColor: "rgba(139,92,246,0.25)" }}
        >
          <p className="text-sm font-bold mb-1">{t.keyTitle}</p>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            {t.keyDesc}
          </p>
          <input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="sk-ant-..."
            className="input mb-3"
          />
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            className="text-xs hover:underline"
            style={{ color: "#a78bfa" }}
          >
            {t.keyLink}
          </a>
        </div>
      )}
    </div>
  );
}
