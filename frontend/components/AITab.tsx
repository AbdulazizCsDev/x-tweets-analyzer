"use client";

import { useState } from "react";
import {
  Sparkles, TrendingUp, Zap, BarChart2, CalendarDays,
  Loader2, RefreshCw, Copy, CheckCheck, TrendingDown, Minus,
} from "lucide-react";
import { getAIInsight } from "@/lib/api";

interface InsightConfig {
  kind: string; title: string; desc: string;
  icon: React.ReactNode; color: string;
}

const INSIGHTS: InsightConfig[] = [
  {
    kind: "content_funnel",
    title: "قمع المحتوى",
    desc: "TOFU / MOFU / BOFU — أين تتسرب فرص التحويل؟",
    icon: <TrendingUp size={20} />,
    color: "from-blue-600/20 to-blue-900/10",
  },
  {
    kind: "winner_formula",
    title: "صيغة الفائزين",
    desc: "القالب القابل للاستنساخ من أعلى تغريداتك أداءً",
    icon: <Zap size={20} />,
    color: "from-yellow-600/20 to-yellow-900/10",
  },
  {
    kind: "topic_roi",
    title: "مصفوفة المواضيع",
    desc: "منجم / ذهب / مهدور / ميت — وجّه وقتك للمكان الصحيح",
    icon: <BarChart2 size={20} />,
    color: "from-purple-600/20 to-purple-900/10",
  },
  {
    kind: "action_plan",
    title: "خطة الأسبوع",
    desc: "7 تغريدات جاهزة للنشر بناءً على أنجح أساليبك",
    icon: <CalendarDays size={20} />,
    color: "from-green-600/20 to-green-900/10",
  },
];

export default function AITab({ account, apiKey }: { account: string; apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="card text-center py-12">
        <Sparkles size={40} className="text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">أدخل مفتاح Anthropic لتشغيل التحليلات</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          استخدم زر <span className="text-yellow-400">⚠ أدخل مفتاح Anthropic</span> في الأعلى.
          المفتاح يُحفظ في متصفحك فقط.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {INSIGHTS.map((cfg) => (
        <InsightCard key={cfg.kind} cfg={cfg} account={account} apiKey={apiKey} />
      ))}
    </div>
  );
}

/* ── Insight Card Shell ───────────────────────────────────────────────────── */

function InsightCard({ cfg, account, apiKey }: {
  cfg: InsightConfig; account: string; apiKey: string;
}) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cached, setCached] = useState(false);

  async function load(force = false) {
    setLoading(true); setError("");
    try {
      const res = await getAIInsight(account, cfg.kind, apiKey, force);
      setData(res.data); setCached(res.cached);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string }; status?: number }; message?: string };
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      setError(detail || (status ? `خطأ ${status}: ${err.message}` : err?.message || "خطأ في تشغيل التحليل"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`card bg-gradient-to-br ${cfg.color}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-slate-800/60 p-2.5 rounded-lg text-white">{cfg.icon}</div>
          <div>
            <h3 className="font-bold text-lg">{cfg.title}</h3>
            <p className="text-xs text-slate-400">{cfg.desc}</p>
          </div>
        </div>
        {data && (
          <button
            onClick={() => load(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            title="تحديث التحليل"
          >
            <RefreshCw size={12} />
            {cached && <span>محفوظ</span>}
          </button>
        )}
      </div>

      {!data && !loading && !error && (
        <button
          onClick={() => load(false)}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          <Sparkles size={14} /> تشغيل التحليل
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">جاري التحليل... 30-60 ثانية</span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm py-3">
          {error}
          <button onClick={() => load(false)} className="block mt-2 text-brand-400 hover:underline text-xs">
            حاول مرة أخرى
          </button>
        </div>
      )}

      {data && <Renderer kind={cfg.kind} data={data} />}
    </div>
  );
}

/* ── Renderers ────────────────────────────────────────────────────────────── */

function Renderer({ kind, data }: { kind: string; data: Record<string, unknown> }) {
  if (kind === "content_funnel") return <ContentFunnelView data={data} />;
  if (kind === "winner_formula") return <WinnerFormulaView data={data} />;
  if (kind === "topic_roi")      return <TopicROIView data={data} />;
  if (kind === "action_plan")    return <ActionPlanView data={data} />;
  return <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}

/* ── 1. Content Funnel ───────────────────────────────────────────────────── */

interface FunnelBucket { count: number; pct: number; avg_eng: number; best_example: string; }
interface ContentFunnelData {
  distribution: { TOFU: FunnelBucket; MOFU: FunnelBucket; BOFU: FunnelBucket };
  diagnosis: string; top_recommendation: string; missed_opportunity: string;
}

function ContentFunnelView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as ContentFunnelData;
  const dist = d.distribution;
  const levels = [
    { key: "TOFU" as const, label: "TOFU", sub: "تعليمي / ترفيهي", color: "bg-blue-500",   ideal: 70 },
    { key: "MOFU" as const, label: "MOFU", sub: "رأي / خبرة / قصة",  color: "bg-purple-500", ideal: 20 },
    { key: "BOFU" as const, label: "BOFU", sub: "دعوة لعمل / تحويل", color: "bg-green-500",  ideal: 10 },
  ];

  return (
    <div className="space-y-4 mt-2">
      {levels.map(({ key, label, sub, color, ideal }) => {
        const bucket = dist?.[key];
        const pct = bucket?.pct ?? 0;
        const gap = pct - ideal;
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="font-semibold">{label} <span className="text-slate-400 font-normal text-xs">— {sub}</span></span>
              <span className="text-xs text-slate-400">
                {pct}% <span className={gap > 15 ? "text-red-400" : gap < -5 ? "text-amber-400" : "text-slate-500"}>
                  (مثالي {ideal}%)
                </span>
              </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{bucket?.count ?? 0} تغريدة</span>
              <span>متوسط تفاعل: {bucket?.avg_eng ?? 0}</span>
            </div>
            {bucket?.best_example && (
              <p className="text-xs text-slate-500 italic mt-1 pr-2 border-r border-slate-700">
                &ldquo;{bucket.best_example.slice(0, 100)}&rdquo;
              </p>
            )}
          </div>
        );
      })}

      {d.diagnosis && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-sm text-red-300">
          🔍 {d.diagnosis}
        </div>
      )}
      {d.top_recommendation && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm text-green-300">
          ✅ {d.top_recommendation}
        </div>
      )}
      {d.missed_opportunity && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-xs text-amber-300">
          💸 {d.missed_opportunity}
        </div>
      )}
    </div>
  );
}

/* ── 2. Winner Formula ───────────────────────────────────────────────────── */

interface WinnerPattern { name: string; description: string; winner_avg: number; loser_avg: number; multiplier: number; example: string; }
interface WinnerFormulaData { patterns: WinnerPattern[]; template: string; avoid: string[]; ready_examples: string[]; }

function WinnerFormulaView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as WinnerFormulaData;
  return (
    <div className="space-y-4 mt-2">
      {d.template && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
          <p className="text-xs text-yellow-400 font-semibold mb-1">القالب الفائز</p>
          <p className="text-sm text-yellow-100">{d.template}</p>
        </div>
      )}

      {d.patterns?.map((p, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm">{p.name}</h4>
            <span className="text-xs font-bold text-green-400">{p.multiplier}×</span>
          </div>
          <p className="text-xs text-slate-300 mb-2">{p.description}</p>
          <div className="flex gap-4 text-xs text-slate-500 mb-2">
            <span>فائزات: <span className="text-green-400">{p.winner_avg}</span></span>
            <span>خاسرات: <span className="text-red-400">{p.loser_avg}</span></span>
          </div>
          {p.example && <p className="text-xs text-slate-500 italic">&ldquo;{p.example.slice(0, 120)}&rdquo;</p>}
        </div>
      ))}

      {d.avoid && d.avoid.length > 0 && (
        <div className="bg-red-900/10 border border-red-700/20 rounded-lg p-3">
          <p className="text-xs text-red-400 font-semibold mb-2">تجنّب</p>
          <ul className="space-y-1">
            {d.avoid.map((a, i) => <li key={i} className="text-xs text-slate-400 flex gap-2"><span>✕</span>{a}</li>)}
          </ul>
        </div>
      )}

      {d.ready_examples && d.ready_examples.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-semibold mb-2">تغريدات جاهزة للنشر</p>
          <div className="space-y-2">
            {d.ready_examples.map((ex, i) => <CopyCard key={i} text={ex} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 3. Topic ROI Matrix ─────────────────────────────────────────────────── */

interface Topic { name: string; count: number; avg_eng: number; trend: string; quadrant: string; recommendation: string; }
interface TopicROIData { topics: Topic[]; biggest_opportunity: string; immediate_cut: string; }

const QUADRANT_STYLE: Record<string, { badge: string; icon: string }> = {
  "منجم": { badge: "bg-green-900/40 text-green-300 border-green-700/40",  icon: "💎" },
  "ذهب":  { badge: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40", icon: "⭐" },
  "مهدور":{ badge: "bg-red-900/40 text-red-300 border-red-700/40",          icon: "📉" },
  "ميت":  { badge: "bg-slate-800/60 text-slate-400 border-slate-700/40",    icon: "💤" },
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "يصعد")  return <TrendingUp size={12} className="text-green-400" />;
  if (trend === "يهبط") return <TrendingDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-slate-400" />;
}

function TopicROIView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as TopicROIData;
  return (
    <div className="space-y-3 mt-2">
      {d.topics?.map((t, i) => {
        const style = QUADRANT_STYLE[t.quadrant] ?? QUADRANT_STYLE["ميت"];
        return (
          <div key={i} className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{style.icon}</span>
                <h4 className="font-semibold text-sm">{t.name}</h4>
                <TrendIcon trend={t.trend} />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${style.badge}`}>{t.quadrant}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-500 mb-2">
              <span>{t.count} تغريدة</span>
              <span>متوسط: {t.avg_eng}</span>
              <span className="text-slate-400">{t.trend}</span>
            </div>
            <p className="text-xs text-slate-400">{t.recommendation}</p>
          </div>
        );
      })}

      {d.biggest_opportunity && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm text-green-300">
          🚀 {d.biggest_opportunity}
        </div>
      )}
      {d.immediate_cut && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-sm text-red-300">
          ✂️ {d.immediate_cut}
        </div>
      )}
    </div>
  );
}

/* ── 4. Action Plan ──────────────────────────────────────────────────────── */

interface DayPlan { day: string; best_time: string; topic: string; format: string; hook: string; full_tweet: string; }
interface ActionPlanData { week_plan: DayPlan[]; key_insight: string; quick_win: string; }

function ActionPlanView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as ActionPlanData;
  return (
    <div className="space-y-4 mt-2">
      {d.key_insight && (
        <div className="bg-brand-900/30 border border-brand-700/30 rounded-lg p-3 text-sm text-brand-300">
          💡 {d.key_insight}
        </div>
      )}
      {d.quick_win && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm text-green-300">
          ⚡ <span className="font-semibold">ابدأ اليوم:</span> {d.quick_win}
        </div>
      )}

      <div className="space-y-3">
        {d.week_plan?.map((day, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand-400">{day.day}</span>
                <span className="text-xs text-slate-500">{day.best_time}</span>
              </div>
              <div className="flex gap-2">
                <span className="badge badge-blue text-xs">{day.format}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-1">📌 {day.topic}</p>
            {day.hook && <p className="text-xs text-slate-500 mb-2">🪝 {day.hook}</p>}
            <CopyCard text={day.full_tweet} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Copy Card ────────────────────────────────────────────────────────────── */

function CopyCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3 relative group">
      <p className="text-xs text-slate-300 leading-relaxed pl-6">{text}</p>
      <button
        onClick={copy}
        className="absolute top-2 left-2 text-slate-500 hover:text-white transition opacity-0 group-hover:opacity-100"
        title="نسخ"
      >
        {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
