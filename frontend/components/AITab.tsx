"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles, TrendingUp, Zap, BarChart2, CalendarDays,
  Loader2, RefreshCw, Copy, CheckCheck, TrendingDown, Minus,
  MessageSquare, SendHorizontal, BookOpen,
} from "lucide-react";
import { getAIInsight, chatWithAI } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";

const KINDS = ["content_funnel", "winner_formula", "topic_roi", "action_plan"] as const;
type Kind = typeof KINDS[number];

const ICONS: Record<Kind, React.ReactNode> = {
  content_funnel: <TrendingUp size={18} />,
  winner_formula: <Zap size={18} />,
  topic_roi:      <BarChart2 size={18} />,
  action_plan:    <CalendarDays size={18} />,
};

const COLORS: Record<Kind, { bg: string; border: string }> = {
  content_funnel: { bg: "from-blue-600/15 to-blue-900/5",     border: "#3b82f620" },
  winner_formula: { bg: "from-amber-600/15 to-amber-900/5",   border: "#f59e0b20" },
  topic_roi:      { bg: "from-violet-600/15 to-violet-900/5", border: "#8b5cf620" },
  action_plan:    { bg: "from-emerald-600/15 to-emerald-900/5", border: "#22c55e20" },
};

function isValidKey(key: string): boolean {
  return key.startsWith("sk-ant-") && key.length >= 40;
}

function cacheKey(account: string, kind: string) {
  return `ai_cache:${account}:${kind}`;
}

export default function AITab({ account, apiKey }: { account: string; apiKey: string }) {
  const { t } = useI18n();
  const validKey = isValidKey(apiKey);

  if (!validKey) {
    const hasContent = apiKey.length > 0;
    return (
      <div className="card text-center py-14" style={{ borderColor: hasContent ? "rgba(239,68,68,0.2)" : "rgba(139,92,246,0.15)" }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: hasContent ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg, #8b5cf630, #6d28d930)" }}
        >
          <BookOpen size={28} style={{ color: hasContent ? "#f87171" : "#a78bfa" }} />
        </div>
        {hasContent ? (
          <>
            <h3 className="text-lg font-bold mb-2 text-red-400">{t.aiBadKey}</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.aiBadKeyDesc}
              <br />
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                className="hover:underline mt-2 inline-block"
                style={{ color: "#a78bfa" }}
              >
                {t.aiGetKey}
              </a>
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-2">{t.aiNoKey}</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.aiNoKeyDesc}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {KINDS.map((kind, i) => (
          <InsightCard key={kind} kind={kind} index={i} account={account} apiKey={apiKey} />
        ))}
      </div>
      <ChatSection account={account} apiKey={apiKey} />
    </div>
  );
}

/* ── Insight Card Shell ── */

function InsightCard({ kind, index, account, apiKey }: {
  kind: Kind; index: number; account: string; apiKey: string;
}) {
  const { t } = useI18n();
  const cfg = t.insights[index];
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cached, setCached] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(cacheKey(account, kind));
    if (raw) {
      try {
        setData(JSON.parse(raw));
        setCached(true);
      } catch {
        // bad cache entry — ignore
      }
    }
  }, [account, kind]);

  async function load() {
    setLoading(true); setError(""); setCached(false);
    try {
      const res = await getAIInsight(account, kind, apiKey);
      setData(res.data);
      try {
        localStorage.setItem(cacheKey(account, kind), JSON.stringify(res.data));
      } catch {
        // quota / privacy mode — silently skip
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string }; status?: number }; message?: string };
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      setError(detail || (status ? `${status}: ${err.message}` : err?.message || t.errorData));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`card bg-gradient-to-br ${COLORS[kind].bg}`}
      style={{ borderColor: COLORS[kind].border }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl" style={{ background: "rgba(30,44,85,0.7)", color: "#a78bfa" }}>
            {ICONS[kind]}
          </div>
          <div>
            <h3 className="font-bold">{cfg.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{cfg.desc}</p>
          </div>
        </div>
        {data && (
          <button
            onClick={load}
            className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 text-xs"
            title={t.aiReanalyze}
          >
            <RefreshCw size={12} />
            {cached && <span>{t.aiCached}</span>}
          </button>
        )}
      </div>

      {!data && !loading && !error && (
        <button
          onClick={load}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          <Sparkles size={14} /> {t.aiRunBtn}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">{t.aiRunning}</span>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm py-3">
          {error}
          <button onClick={load} className="block mt-2 text-brand-400 hover:underline text-xs">
            {t.aiRetry}
          </button>
        </div>
      )}

      {data && <Renderer kind={kind} data={data} />}
    </div>
  );
}

/* ── Renderers ── */

function Renderer({ kind, data }: { kind: string; data: Record<string, unknown> }) {
  if (kind === "content_funnel") return <ContentFunnelView data={data} />;
  if (kind === "winner_formula") return <WinnerFormulaView data={data} />;
  if (kind === "topic_roi")      return <TopicROIView data={data} />;
  if (kind === "action_plan")    return <ActionPlanView data={data} />;
  return <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}

/* ── 1. Content Funnel ── */

interface FunnelBucket { count: number; pct: number; avg_eng: number; best_example: string; }
interface ContentFunnelData {
  distribution: { TOFU: FunnelBucket; MOFU: FunnelBucket; BOFU: FunnelBucket };
  diagnosis: string; top_recommendation: string; missed_opportunity: string;
}

function ContentFunnelView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as ContentFunnelData;
  const dist = d.distribution;
  const levels = [
    { key: "TOFU" as const, label: "TOFU", color: "#3b82f6", ideal: 70 },
    { key: "MOFU" as const, label: "MOFU", color: "#8b5cf6", ideal: 20 },
    { key: "BOFU" as const, label: "BOFU", color: "#22c55e", ideal: 10 },
  ];

  return (
    <div className="space-y-4 mt-2">
      {levels.map(({ key, label, color, ideal }) => {
        const bucket = dist?.[key];
        const pct = bucket?.pct ?? 0;
        const gap = pct - ideal;
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="font-semibold">{label}</span>
              <span className="text-xs text-slate-400">
                {pct}%{" "}
                <span style={{ color: gap > 15 ? "#f87171" : gap < -5 ? "#fbbf24" : "#6b7280" }}>
                  ({ideal}%)
                </span>
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden mb-1" style={{ background: "#141c38" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, background: color }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{bucket?.count ?? 0}</span>
              <span>{bucket?.avg_eng ?? 0}</span>
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
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          🔍 {d.diagnosis}
        </div>
      )}
      {d.top_recommendation && (
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(20,83,45,0.2)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac" }}>
          ✅ {d.top_recommendation}
        </div>
      )}
      {d.missed_opportunity && (
        <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(120,53,15,0.2)", border: "1px solid rgba(245,158,11,0.2)", color: "#fcd34d" }}>
          💸 {d.missed_opportunity}
        </div>
      )}
    </div>
  );
}

/* ── 2. Winner Formula ── */

interface WinnerPattern { name: string; description: string; winner_avg: number; loser_avg: number; multiplier: number; example: string; }
interface WinnerFormulaData { patterns: WinnerPattern[]; template: string; avoid: string[]; ready_examples: string[]; }

function WinnerFormulaView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as WinnerFormulaData;
  return (
    <div className="space-y-4 mt-2">
      {d.template && (
        <div className="rounded-xl p-3" style={{ background: "rgba(120,53,15,0.2)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-sm" style={{ color: "#fef3c7" }}>{d.template}</p>
        </div>
      )}

      {d.patterns?.map((p, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "rgba(20,28,56,0.6)", border: "1px solid rgba(30,44,85,0.8)" }}>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm">{p.name}</h4>
            <span className="text-xs font-bold" style={{ color: "#4ade80" }}>{p.multiplier}×</span>
          </div>
          <p className="text-xs text-slate-300 mb-2">{p.description}</p>
          <div className="flex gap-4 text-xs text-slate-500 mb-2">
            <span style={{ color: "#4ade80" }}>{p.winner_avg}</span>
            <span style={{ color: "#f87171" }}>{p.loser_avg}</span>
          </div>
          {p.example && <p className="text-xs text-slate-500 italic">&ldquo;{p.example.slice(0, 120)}&rdquo;</p>}
        </div>
      ))}

      {d.avoid && d.avoid.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: "rgba(127,29,29,0.15)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <ul className="space-y-1">
            {d.avoid.map((a, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2"><span>✕</span>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {d.ready_examples && d.ready_examples.length > 0 && (
        <div className="space-y-2">
          {d.ready_examples.map((ex, i) => <CopyCard key={i} text={ex} />)}
        </div>
      )}
    </div>
  );
}

/* ── 3. Topic ROI Matrix ── */

interface Topic { name: string; count: number; avg_eng: number; trend: string; quadrant: string; recommendation: string; }
interface TopicROIData { topics: Topic[]; biggest_opportunity: string; immediate_cut: string; }

const QUADRANT_STYLE: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "منجم": { bg: "rgba(20,83,45,0.3)",   text: "#86efac", border: "rgba(34,197,94,0.25)",  icon: "💎" },
  "ذهب":  { bg: "rgba(120,53,15,0.3)",   text: "#fcd34d", border: "rgba(245,158,11,0.25)", icon: "⭐" },
  "مهدور":{ bg: "rgba(127,29,29,0.3)",   text: "#fca5a5", border: "rgba(239,68,68,0.25)",  icon: "📉" },
  "ميت":  { bg: "rgba(20,28,56,0.5)",    text: "#94a3b8", border: "rgba(30,44,85,0.6)",    icon: "💤" },
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "يصعد")  return <TrendingUp size={11} style={{ color: "#4ade80" }} />;
  if (trend === "يهبط") return <TrendingDown size={11} style={{ color: "#f87171" }} />;
  return <Minus size={11} className="text-slate-400" />;
}

function TopicROIView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as TopicROIData;
  return (
    <div className="space-y-3 mt-2">
      {d.topics?.map((t, i) => {
        const style = QUADRANT_STYLE[t.quadrant] ?? QUADRANT_STYLE["ميت"];
        return (
          <div key={i} className="rounded-xl p-3" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{style.icon}</span>
                <h4 className="font-semibold text-sm">{t.name}</h4>
                <TrendIcon trend={t.trend} />
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
              >
                {t.quadrant}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-slate-500 mb-1.5">
              <span>{t.count}</span>
              <span>{t.avg_eng}</span>
              <span className="text-slate-400">{t.trend}</span>
            </div>
            <p className="text-xs text-slate-400">{t.recommendation}</p>
          </div>
        );
      })}

      {d.biggest_opportunity && (
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(20,83,45,0.2)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac" }}>
          🚀 {d.biggest_opportunity}
        </div>
      )}
      {d.immediate_cut && (
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          ✂️ {d.immediate_cut}
        </div>
      )}
    </div>
  );
}

/* ── 4. Action Plan ── */

interface DayPlan { day: string; best_time: string; topic: string; format: string; hook: string; full_tweet: string; }
interface ActionPlanData { week_plan: DayPlan[]; key_insight: string; quick_win: string; }

function ActionPlanView({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as ActionPlanData;
  return (
    <div className="space-y-4 mt-2">
      {d.key_insight && (
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(76,29,149,0.25)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd" }}>
          💡 {d.key_insight}
        </div>
      )}
      {d.quick_win && (
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(20,83,45,0.2)", border: "1px solid rgba(34,197,94,0.2)", color: "#86efac" }}>
          ⚡ {d.quick_win}
        </div>
      )}

      <div className="space-y-3">
        {d.week_plan?.map((day, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: "rgba(20,28,56,0.6)", border: "1px solid rgba(30,44,85,0.8)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: "#a78bfa" }}>{day.day}</span>
                <span className="text-xs text-slate-500">{day.best_time}</span>
              </div>
              <span className="badge badge-violet text-xs">{day.format}</span>
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

/* ── Copy Card ── */

function CopyCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-xl p-3 relative group" style={{ background: "rgba(20,28,56,0.7)", border: "1px solid rgba(30,44,85,0.8)" }}>
      <p className="text-xs text-slate-300 leading-relaxed pl-6">{text}</p>
      <button
        onClick={copy}
        className="absolute top-2.5 left-2.5 text-slate-500 hover:text-white transition opacity-0 group-hover:opacity-100"
      >
        {copied ? <CheckCheck size={13} style={{ color: "#4ade80" }} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

/* ── Chat Section ── */

interface ChatMessage { role: "user" | "ai"; text: string; }

function ChatSection({ account, apiKey }: { account: string; apiKey: string }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await chatWithAI(account, q, apiKey);
      setMessages((prev) => [...prev, { role: "ai", text: res.answer }]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail || t.errorData;
      setMessages((prev) => [...prev, { role: "ai", text: detail }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl" style={{ background: "rgba(76,29,149,0.3)", color: "#a78bfa" }}>
          <MessageSquare size={18} />
        </div>
        <div>
          <h3 className="font-bold">{t.chatTitle}</h3>
          <p className="text-xs text-slate-500">{t.chatSubtitle}</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {t.chatQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              disabled={loading}
              className="text-start text-xs px-3 py-2.5 rounded-xl transition disabled:opacity-50"
              style={{
                background: "rgba(20,28,56,0.6)",
                border: "1px solid rgba(30,44,85,0.8)",
                color: "#94a3b8",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c4b5fd"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,44,85,0.8)"; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto px-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className="max-w-[88%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={
                  m.role === "user"
                    ? { background: "rgba(76,29,149,0.25)", border: "1px solid rgba(139,92,246,0.2)", color: "#e2e8f0" }
                    : { background: "rgba(20,28,56,0.8)", border: "1px solid rgba(30,44,85,0.8)", color: "#cbd5e1" }
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div
                className="px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm text-slate-400"
                style={{ background: "rgba(20,28,56,0.8)", border: "1px solid rgba(30,44,85,0.8)" }}
              >
                <Loader2 size={14} className="animate-spin" />
                {t.chatThinking}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={t.chatPlaceholder}
          className="input flex-1 text-sm"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="px-4 py-2 rounded-xl transition disabled:opacity-40 flex items-center gap-1.5 text-sm font-semibold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <SendHorizontal size={15} />}
        </button>
      </div>
    </div>
  );
}
