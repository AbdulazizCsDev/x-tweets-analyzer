"use client";

import { useState } from "react";
import { Sparkles, Layers, Activity, User, AlertTriangle, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { getAIInsight } from "@/lib/api";
import { impactColor, priorityColor } from "@/lib/utils";

interface InsightConfig {
  kind: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const INSIGHTS: InsightConfig[] = [
  { kind: "clustering",      title: "تجميع المواضيع",       desc: "اكتشاف 5-8 مجموعات موضوعية رئيسية",        icon: <Layers size={20} />,        color: "from-blue-600/20 to-blue-900/10" },
  { kind: "patterns",        title: "أنماط التفاعل",        desc: "أنماط خفية لا يلاحظها الشخص العادي",       icon: <Activity size={20} />,      color: "from-purple-600/20 to-purple-900/10" },
  { kind: "voice_profile",   title: "ملف الصوت",            desc: "شخصية الكاتب وأسلوبه وجمهوره",            icon: <User size={20} />,          color: "from-pink-600/20 to-pink-900/10" },
  { kind: "anomalies",       title: "التغريدات الشاذة",      desc: "أي تغريدات نجحت أو فشلت بشكل غير متوقع",  icon: <AlertTriangle size={20} />, color: "from-amber-600/20 to-amber-900/10" },
  { kind: "recommendations", title: "توصيات قابلة للتطبيق",  desc: "5 توصيات عملية لتحسين التفاعل",           icon: <Lightbulb size={20} />,     color: "from-green-600/20 to-green-900/10" },
];

export default function AITab({ account, apiKey }: { account: string; apiKey: string }) {
  if (!apiKey) {
    return (
      <div className="card text-center py-12">
        <Sparkles size={40} className="text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">أدخل مفتاح Anthropic لتشغيل تحليلات AI</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          استخدم زر &ldquo;⚠ أدخل مفتاح Anthropic&rdquo; في الأعلى. المفتاح يُحفظ في متصفحك فقط — لن يُرسل لأي خادم غير Anthropic.
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

/* ── single insight card ─────────────────────────────────────────────────── */

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
      setData(res.data);
      setCached(res.cached);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || "خطأ في تشغيل التحليل");
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
        {data && cached && (
          <button
            onClick={() => load(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw size={12} /> تحديث
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
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 size={20} className="animate-spin ml-2" />
          <span className="text-sm">جاري التحليل... قد يستغرق 30-60 ثانية</span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm py-3">
          {error}
          <button onClick={() => load(false)} className="block mt-2 text-brand-400 hover:underline">
            حاول مرة أخرى
          </button>
        </div>
      )}

      {data && <Renderer kind={cfg.kind} data={data} />}
    </div>
  );
}

/* ── renderers per insight kind ──────────────────────────────────────────── */

function Renderer({ kind, data }: { kind: string; data: Record<string, unknown> }) {
  if (kind === "clustering")      return <ClustersView data={data} />;
  if (kind === "patterns")        return <PatternsView data={data} />;
  if (kind === "voice_profile")   return <VoiceView data={data} />;
  if (kind === "anomalies")       return <AnomaliesView data={data} />;
  if (kind === "recommendations") return <RecommendationsView data={data} />;
  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}

interface Cluster { name: string; description: string; tweet_count: number; avg_engagement: number; example: string; }
function ClustersView({ data }: { data: Record<string, unknown> }) {
  const clusters = (data.clusters as Cluster[]) || [];
  return (
    <div className="space-y-3 mt-2">
      {clusters.map((c, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">{c.name}</h4>
            <span className="badge badge-blue text-xs">{c.tweet_count}</span>
          </div>
          <p className="text-sm text-slate-400 mb-2">{c.description}</p>
          <p className="text-xs text-slate-500 italic">&ldquo;{c.example}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}

interface Pattern { title: string; insight: string; evidence: string; impact: string; }
function PatternsView({ data }: { data: Record<string, unknown> }) {
  const patterns = (data.patterns as Pattern[]) || [];
  return (
    <div className="space-y-3 mt-2">
      {patterns.map((p, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{p.title}</h4>
            <span className={`badge ${impactColor(p.impact)} text-xs`}>{p.impact}</span>
          </div>
          <p className="text-sm text-slate-300 mb-2">{p.insight}</p>
          <p className="text-xs text-slate-500"><span className="text-slate-400">دليل:</span> {p.evidence}</p>
        </div>
      ))}
    </div>
  );
}

interface Voice {
  tone: string; personality_traits: string[]; writing_style: string;
  audience_persona: string; strengths: string[]; summary: string;
}
function VoiceView({ data }: { data: Record<string, unknown> }) {
  const v = data as unknown as Voice;
  return (
    <div className="space-y-4 mt-2">
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
        <p className="text-sm italic text-pink-300">&ldquo;{v.summary}&rdquo;</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">النبرة</p>
        <p className="text-sm">{v.tone}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">سمات شخصية</p>
        <div className="flex flex-wrap gap-1.5">
          {v.personality_traits?.map((t, i) => <span key={i} className="badge badge-blue">{t}</span>)}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">أسلوب الكتابة</p>
        <p className="text-sm">{v.writing_style}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">الجمهور المستهدف</p>
        <p className="text-sm">{v.audience_persona}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">نقاط القوة</p>
        <ul className="text-sm list-disc list-inside text-slate-300 space-y-1">
          {v.strengths?.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    </div>
  );
}

interface AnomalyItem { text: string; reason: string; }
interface Anomalies { overperformers: AnomalyItem[]; underperformers: AnomalyItem[]; }
function AnomaliesView({ data }: { data: Record<string, unknown> }) {
  const a = data as unknown as Anomalies;
  return (
    <div className="space-y-4 mt-2">
      {a.overperformers && a.overperformers.length > 0 && (
        <div>
          <p className="text-xs text-green-400 mb-2 font-semibold">📈 نجحت بشكل غير متوقع</p>
          <div className="space-y-2">
            {a.overperformers.map((it, i) => (
              <div key={i} className="bg-green-900/10 border border-green-700/30 rounded-lg p-3">
                <p className="text-sm mb-2">&ldquo;{it.text}&rdquo;</p>
                <p className="text-xs text-slate-400">السبب: {it.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {a.underperformers && a.underperformers.length > 0 && (
        <div>
          <p className="text-xs text-red-400 mb-2 font-semibold">📉 فشلت رغم التوقعات</p>
          <div className="space-y-2">
            {a.underperformers.map((it, i) => (
              <div key={i} className="bg-red-900/10 border border-red-700/30 rounded-lg p-3">
                <p className="text-sm mb-2">&ldquo;{it.text}&rdquo;</p>
                <p className="text-xs text-slate-400">السبب: {it.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Recommendation { title: string; action: string; why: string; priority: string; }
function RecommendationsView({ data }: { data: Record<string, unknown> }) {
  const recs = (data.recommendations as Recommendation[]) || [];
  return (
    <div className="space-y-3 mt-2">
      {recs.map((r, i) => (
        <div key={i} className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="text-brand-400">{i + 1}.</span> {r.title}
            </h4>
            <span className={`badge ${priorityColor(r.priority)} text-xs`}>{r.priority}</span>
          </div>
          <p className="text-sm text-slate-300 mb-2">{r.action}</p>
          <p className="text-xs text-slate-500"><span className="text-slate-400">لماذا:</span> {r.why}</p>
        </div>
      ))}
    </div>
  );
}
