"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, BarChart3, BookOpen } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import StatsRow from "@/components/StatsRow";
import BasicTab from "@/components/BasicTab";
import AITab from "@/components/AITab";

type Tab = "basic" | "ai";

export default function Dashboard({ params }: { params: Promise<{ account: string }> }) {
  const { account } = use(params);
  const router = useRouter();

  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>("basic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Anthropic key (stored in localStorage)
  const [anthropicKey, setAnthropicKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("anthropic_key");
    if (stored) setAnthropicKey(stored);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAnalytics(account)
      .then(setAnalytics)
      .catch((e) => setError(e?.response?.data?.detail || "خطأ في جلب البيانات"))
      .finally(() => setLoading(false));
  }, [account]);

  function saveKey(key: string) {
    setAnthropicKey(key);
    if (key) localStorage.setItem("anthropic_key", key);
    else localStorage.removeItem("anthropic_key");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <p className="text-red-400 mb-4">{error || "لا توجد بيانات"}</p>
          <button
            onClick={() => router.push("/")}
            className="text-brand-400 hover:underline"
          >
            رجوع للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics.summary as Record<string, number | string>;

  return (
    <main className="min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: "rgba(7,11,24,0.85)", backdropFilter: "blur(16px)", borderColor: "#1e2c55" }}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-white transition flex items-center gap-1.5 text-sm"
            >
              <ArrowRight size={18} />
            </button>
            {/* Logo */}
            <div className="flex items-center gap-2 border-r border-slate-800 pl-4 pr-0">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
                <BookOpen size={12} className="text-white" />
              </div>
              <span className="font-extrabold text-sm gradient-text hidden sm:block">بين السطور</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">@{account}</h1>
              <p className="text-xs text-slate-500">
                {(summary.total_tweets as number).toLocaleString()} تغريدة محللة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <KeyInput value={anthropicKey} onChange={saveKey} />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          <TabBtn active={tab === "basic"} onClick={() => setTab("basic")} icon={<BarChart3 size={15} />} label="التحليلات" />
          <TabBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={<Sparkles size={15} />} label="رؤى AI" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <StatsRow summary={summary} />

        <div className="mt-6">
          {tab === "basic" && <BasicTab data={analytics} />}
          {tab === "ai" && <AITab account={account} apiKey={anthropicKey} />}
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
      className={`flex items-center gap-2 px-5 py-3 font-semibold border-b-2 transition text-sm ${
        active ? "border-brand-500 text-brand-400" : "border-transparent text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function KeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`badge ${value ? "badge-green" : "badge-yellow"} cursor-pointer`}
      >
        {value ? "✓ Anthropic" : "⚠ أدخل مفتاح Anthropic"}
      </button>
      {open && (
        <div className="absolute left-0 top-10 card w-80 z-40" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
          <p className="text-sm font-semibold mb-2">مفتاح Anthropic API</p>
          <p className="text-xs text-slate-400 mb-3">
            مطلوب لتشغيل تحليلات الذكاء الاصطناعي. يُحفظ محلياً في متصفحك فقط.
          </p>
          <input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="sk-ant-..."
            className="input mb-2"
          />
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            className="text-xs text-brand-400 hover:underline"
          >
            احصل على مفتاح من console.anthropic.com →
          </a>
        </div>
      )}
    </div>
  );
}
