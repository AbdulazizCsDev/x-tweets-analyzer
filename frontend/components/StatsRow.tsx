import { Heart, Eye, TrendingUp, Clock, Calendar, Image } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function StatsRow({ summary }: { summary: Record<string, number | string> }) {
  const stats = [
    { icon: <Heart size={18} />, label: "إجمالي التفاعل", value: formatNumber(summary.total_engagement as number), color: "text-pink-400" },
    { icon: <Eye size={18} />, label: "إجمالي المشاهدات", value: formatNumber(summary.total_impressions as number), color: "text-blue-400" },
    { icon: <TrendingUp size={18} />, label: "متوسط التفاعل/تغريدة", value: (summary.avg_engagement as number).toFixed(0), color: "text-green-400" },
    { icon: <Clock size={18} />, label: "أفضل ساعة للنشر", value: `${summary.best_hour}:00`, color: "text-yellow-400" },
    { icon: <Calendar size={18} />, label: "أفضل يوم", value: summary.best_day as string, color: "text-purple-400" },
    { icon: <Image size={18} />, label: "نسبة الوسائط", value: `${summary.with_media_pct}%`, color: "text-cyan-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="card flex items-center gap-3">
          <div className={`${s.color} bg-slate-800/50 p-2 rounded-lg`}>{s.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 truncate">{s.label}</p>
            <p className="text-lg font-bold truncate">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
