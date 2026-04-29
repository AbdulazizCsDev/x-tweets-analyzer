"use client";

import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { Heart, Repeat, MessageCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Top10Item {
  id: string; text: string; engagement: number;
  likes: number; retweets: number; replies: number; created_at: string;
}
interface Hashtag { tag: string; count: number; avg_eng: number; }
interface Mention { account: string; count: number; }
interface WordItem { word: string; count: number; }
interface Bigram { phrase: string; count: number; }
interface Emoji { emoji: string; count: number; }

const CHART_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#f43f5e"];

export default function BasicTab({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyChart data={data.hourly_avg as { hour: number; avg: number }[]} />
        <DailyChart data={data.daily_avg as { day: string; avg: number }[]} />
      </div>

      <Heatmap data={data.heatmap as Record<string, Record<string, number>>} />

      <Top10 items={data.top10 as Top10Item[]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Hashtags items={data.top_hashtags as Hashtag[]} />
        <Mentions items={data.top_mentions as Mention[]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Words items={data.word_freq as WordItem[]} />
        <Bigrams items={data.top_bigrams as Bigram[]} />
        <SentimentCard data={data.sentiment as Record<string, number>} />
      </div>

      <MediaImpact data={data.media_impact as { with_media_avg: number; without_media_avg: number }} />

      <StyleCard data={data.style as Record<string, unknown>} />
    </div>
  );
}

/* ── charts ──────────────────────────────────────────────────────────────── */

function HourlyChart({ data }: { data: { hour: number; avg: number }[] }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">⏰ متوسط التفاعل حسب الساعة</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DailyChart({ data }: { data: { day: string; avg: number }[] }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">📅 متوسط التفاعل حسب اليوم</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Bar dataKey="avg" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Heatmap({ data }: { data: Record<string, Record<string, number>> }) {
  const days = Object.keys(data);
  const max = Math.max(...days.flatMap(d => Object.values(data[d])));

  return (
    <div className="card">
      <h3 className="font-bold mb-4">🔥 خريطة التفاعل (يوم × ساعة)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th className="p-1 text-slate-400"></th>
              {Array.from({ length: 24 }).map((_, h) => (
                <th key={h} className="p-1 text-slate-400 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d}>
                <td className="p-1 text-slate-400 font-semibold pl-3">{d}</td>
                {Array.from({ length: 24 }).map((_, h) => {
                  const v = data[d]?.[h.toString()] || 0;
                  const intensity = max > 0 ? v / max : 0;
                  return (
                    <td
                      key={h}
                      className="p-0 w-6 h-6 rounded-sm"
                      style={{
                        background: intensity > 0
                          ? `rgba(59, 130, 246, ${0.15 + intensity * 0.85})`
                          : "rgba(30, 41, 59, 0.3)",
                      }}
                      title={`${d} ${h}:00 — ${v.toFixed(1)}`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Top10({ items }: { items: Top10Item[] }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">🏆 أعلى 10 تغريدات تفاعلاً</h3>
      <div className="space-y-2">
        {items.map((t, i) => (
          <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition">
            <div className="text-2xl font-extrabold text-brand-400 w-8 text-center">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed mb-2">{t.text}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Heart size={12} className="text-pink-400" />{formatNumber(t.likes)}</span>
                <span className="flex items-center gap-1"><Repeat size={12} className="text-green-400" />{formatNumber(t.retweets)}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} className="text-blue-400" />{formatNumber(t.replies)}</span>
                <span className="text-slate-500">{t.created_at?.slice(0, 10)}</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-brand-400">{formatNumber(t.engagement)}</div>
              <div className="text-xs text-slate-500">تفاعل</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hashtags({ items }: { items: Hashtag[] }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">🏷️ أكثر الهاشتاقات</h3>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm">لا توجد هاشتاقات</p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 10).map((h) => (
            <div key={h.tag} className="flex items-center justify-between text-sm py-1">
              <span className="text-brand-400">#{h.tag}</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{h.count}× استخدام</span>
                <span className="text-green-400">{h.avg_eng} متوسط</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Mentions({ items }: { items: Mention[] }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">👥 أكثر الحسابات منشن</h3>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm">لا توجد منشنات</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((m) => (
            <span key={m.account} className="badge badge-blue">
              @{m.account}
              <span className="opacity-60 mr-1">({m.count})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Words({ items }: { items: WordItem[] }) {
  const max = items[0]?.count || 1;
  return (
    <div className="card">
      <h3 className="font-bold mb-4">💬 أكثر الكلمات</h3>
      <div className="space-y-1">
        {items.slice(0, 15).map((w) => (
          <div key={w.word} className="flex items-center gap-2 text-sm">
            <div className="flex-1 truncate">{w.word}</div>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500" style={{ width: `${(w.count / max) * 100}%` }} />
            </div>
            <div className="text-xs text-slate-400 w-8 text-left">{w.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bigrams({ items }: { items: Bigram[] }) {
  return (
    <div className="card">
      <h3 className="font-bold mb-4">📚 أكثر العبارات</h3>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm">لا توجد عبارات كافية</p>
      ) : (
        <div className="space-y-1">
          {items.slice(0, 12).map((b, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-300">{b.phrase}</span>
              <span className="text-xs text-slate-500">{b.count}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentCard({ data }: { data: Record<string, number> }) {
  const items = [
    { name: "إيجابي", value: data.positive, color: "#10b981" },
    { name: "محايد", value: data.neutral, color: "#94a3b8" },
    { name: "سلبي", value: data.negative, color: "#ef4444" },
  ];
  return (
    <div className="card">
      <h3 className="font-bold mb-4">😊 توزيع المشاعر</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={items} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
            {items.map((it, i) => <Cell key={i} fill={it.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function MediaImpact({ data }: { data: { with_media_avg: number; without_media_avg: number } }) {
  const items = [
    { name: "مع وسائط", value: data.with_media_avg },
    { name: "بدون وسائط", value: data.without_media_avg },
  ];
  return (
    <div className="card">
      <h3 className="font-bold mb-4">🎥 تأثير الوسائط على التفاعل</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={items} layout="vertical">
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 12 }} width={100} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {items.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StyleCard({ data }: { data: Record<string, unknown> }) {
  const emojis = data.top_emojis as { emoji: string; count: number }[];
  return (
    <div className="card">
      <h3 className="font-bold mb-4">📝 أسلوب الكتابة</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="متوسط الطول" value={`${data.avg_length} حرف`} />
        <Stat label="نسبة الأسئلة" value={`${data.has_question_pct}%`} />
        <Stat label="نسبة التعجب" value={`${data.has_exclaim_pct}%`} />
        <Stat label="عدد الإيموجيات" value={emojis.length.toString()} />
      </div>
      {emojis.length > 0 && (
        <>
          <p className="text-sm text-slate-400 mb-2">أكثر الإيموجيات استخداماً:</p>
          <div className="flex flex-wrap gap-2">
            {emojis.map((e) => (
              <div key={e.emoji} className="bg-slate-800/50 rounded-lg px-3 py-2 text-sm">
                <span className="text-xl">{e.emoji}</span>
                <span className="text-slate-400 mr-2 text-xs">×{e.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
