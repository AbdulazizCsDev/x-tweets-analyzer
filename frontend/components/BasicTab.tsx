"use client";

import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { Heart, Repeat2, MessageCircle } from "lucide-react";
import { formatNumber, translateDay } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

interface Top10Item {
  id: string; text: string; engagement: number;
  likes: number; retweets: number; replies: number; created_at: string;
}
interface Hashtag  { tag: string; count: number; avg_eng: number; }
interface Mention  { account: string; count: number; }
interface WordItem { word: string; count: number; }

const TOOLTIP_STYLE = {
  background: "#0e0e16",
  border: "1px solid #2a2a3a",
  borderRadius: 8,
  color: "#e9ecef",
  fontSize: 12,
};

const AXIS = { stroke: "#2a2a3a", tick: { fill: "#6b7280", fontSize: 11 } };

export default function BasicTab({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HourlyChart data={data.hourly_avg as { hour: number; avg: number }[]} />
        <DailyChart  data={data.daily_avg  as { day:  string; avg: number }[]} />
      </div>

      <Heatmap data={data.heatmap as Record<string, Record<string, number>>} />

      <Top10 items={data.top10 as Top10Item[]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Hashtags items={data.top_hashtags as Hashtag[]} />
        <Mentions items={data.top_mentions as Mention[]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Words      items={data.word_freq   as WordItem[]} />
        <MediaImpact data={data.media_impact as { with_media_avg: number; without_media_avg: number }} />
      </div>
    </div>
  );
}

/* ── Hourly Chart ── */
function HourlyChart({ data }: { data: { hour: number; avg: number }[] }) {
  const { t } = useI18n();
  const maxVal = Math.max(...data.map(d => d.avg), 1);
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>
        {t.chartHourly}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={10}>
          <XAxis dataKey="hour" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={`rgba(139,92,246,${0.3 + (d.avg / maxVal) * 0.7})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Daily Chart ── */
function DailyChart({ data }: { data: { day: string; avg: number }[] }) {
  const { t, lang } = useI18n();
  const translated = data.map(d => ({ ...d, day: translateDay(d.day, lang, true) }));
  const maxVal = Math.max(...data.map(d => d.avg), 1);
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>
        {t.chartDaily}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={translated} barSize={26}>
          <XAxis dataKey="day" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {translated.map((d, i) => (
              <Cell key={i} fill={`rgba(245,158,11,${0.3 + (d.avg / maxVal) * 0.7})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Heatmap ── */
function Heatmap({ data }: { data: Record<string, Record<string, number>> }) {
  const { t, lang } = useI18n();
  const days = Object.keys(data);
  const max  = Math.max(...days.flatMap(d => Object.values(data[d])), 1);
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>
        {t.heatmapTitle}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th className="p-1 text-right font-normal" style={{ color: "var(--muted)", minWidth: 55 }}></th>
              {Array.from({ length: 24 }).map((_, h) => (
                <th key={h} className="p-1 text-center font-normal" style={{ color: "var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d}>
                <td className="p-1 font-semibold" style={{ color: "var(--muted)" }}>{translateDay(d, lang, true)}</td>
                {Array.from({ length: 24 }).map((_, h) => {
                  const v = data[d]?.[h.toString()] || 0;
                  const pct = v / max;
                  return (
                    <td
                      key={h}
                      className="w-5 h-5 rounded-sm"
                      style={{
                        background: pct > 0
                          ? `rgba(139,92,246,${0.1 + pct * 0.9})`
                          : "rgba(30,30,46,0.4)",
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

/* ── Top 10 — X Tweet Style ── */

const RANK_GRADIENT = [
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#94a3b8,#64748b)",
  "linear-gradient(135deg,#c97c3a,#a0522d)",
];
const MEDALS = ["🥇", "🥈", "🥉"];

function Top10({ items }: { items: Top10Item[] }) {
  const { t } = useI18n();
  return (
    <div className="card overflow-hidden p-0">
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-bold text-sm">{t.top10Title}</h3>
      </div>
      <div>
        {items.map((t, i) => (
          <TweetCard key={t.id} tweet={t} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

function TweetCard({ tweet, rank }: { tweet: Top10Item; rank: number }) {
  const { lang } = useI18n();
  const gradient = RANK_GRADIENT[rank - 1] ?? "linear-gradient(135deg,#8b5cf6,#6d28d9)";
  return (
    <div className="x-tweet">
      {/* Rank avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs"
          style={{ background: gradient }}
        >
          {rank <= 3 ? MEDALS[rank - 1] : <span className="font-black">{rank}</span>}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {tweet.created_at?.slice(0, 10)}
          </span>
          <span
            className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}
          >
            {formatNumber(tweet.engagement, lang)}
          </span>
        </div>

        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text)" }}>
          {tweet.text}
        </p>

        {/* X-style engagement row */}
        <div className="flex items-center gap-5">
          <EngStat icon={<Heart size={13} />}         count={tweet.likes}    hover="hover:text-pink-400" />
          <EngStat icon={<Repeat2 size={13} />}       count={tweet.retweets} hover="hover:text-green-400" />
          <EngStat icon={<MessageCircle size={13} />} count={tweet.replies}  hover="hover:text-blue-400" />
        </div>
      </div>
    </div>
  );
}

function EngStat({ icon, count, hover }: { icon: React.ReactNode; count: number; hover: string }) {
  const { lang } = useI18n();
  return (
    <span
      className={`flex items-center gap-1.5 text-xs transition cursor-default select-none ${hover}`}
      style={{ color: "var(--muted)" }}
    >
      {icon}
      {formatNumber(count, lang)}
    </span>
  );
}

/* ── Hashtags ── */
function Hashtags({ items }: { items: Hashtag[] }) {
  const { t } = useI18n();
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>{t.hashtagsTitle}</h3>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>{t.noHashtags}</p>
      ) : (
        <div className="space-y-1">
          {items.slice(0, 10).map((h) => (
            <div
              key={h.tag}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "#a78bfa" }}>#{h.tag}</span>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                <span>{h.count}×</span>
                <span style={{ color: "#4ade80" }}>{h.avg_eng}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Mentions ── */
function Mentions({ items }: { items: Mention[] }) {
  const { t } = useI18n();
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>{t.mentionsTitle}</h3>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>{t.noMentions}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((m) => (
            <span
              key={m.account}
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                background: "rgba(139,92,246,0.08)",
                color: "#a78bfa",
                border: "1px solid rgba(139,92,246,0.18)",
              }}
            >
              @{m.account}
              <span className="opacity-50 mr-1">({m.count})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Words ── */
function Words({ items }: { items: WordItem[] }) {
  const { t } = useI18n();
  const max = items[0]?.count || 1;
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>{t.wordsTitle}</h3>
      <div className="space-y-2.5">
        {items.slice(0, 15).map((w) => (
          <div key={w.word} className="flex items-center gap-3 text-sm">
            <div className="flex-1 truncate" style={{ color: "var(--text)" }}>{w.word}</div>
            <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "var(--border2)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(w.count / max) * 100}%`,
                  background: "linear-gradient(90deg, #8b5cf6, #f59e0b)",
                }}
              />
            </div>
            <div className="text-xs w-7 text-right tabular-nums" style={{ color: "var(--muted)" }}>
              {w.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Media Impact ── */
function MediaImpact({ data }: { data: { with_media_avg: number; without_media_avg: number } }) {
  const { t } = useI18n();
  const items = [
    { name: t.withMedia,    value: data.with_media_avg },
    { name: t.withoutMedia, value: data.without_media_avg },
  ];
  return (
    <div className="card">
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--muted)" }}>{t.mediaTitle}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={items} layout="vertical" barSize={22}>
          <XAxis type="number" {...AXIS} />
          <YAxis dataKey="name" type="category" width={88} tick={{ fill: "#6b7280", fontSize: 12 }} stroke="#2a2a3a" />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            <Cell fill="#8b5cf6" />
            <Cell fill="#f59e0b" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
