"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Twitter, Loader2, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { uploadArchive, fetchApify, getAccounts, Account } from "@/lib/api";

type Source = "archive" | "apify" | null;
type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const router = useRouter();
  const [source, setSource] = useState<Source>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Archive form state
  const [archiveHandle, setArchiveHandle] = useState("");
  const [archiveFile, setArchiveFile] = useState<File | null>(null);

  // Apify form state
  const [apifyUser, setApifyUser] = useState("");
  const [apifyToken, setApifyToken] = useState("");
  const [maxTweets, setMaxTweets] = useState(10000);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  async function handleArchive() {
    if (!archiveFile || !archiveHandle.trim()) {
      setMsg("أدخل اسم الحساب وارفع ملف ZIP"); setStatus("error"); return;
    }
    setStatus("loading"); setMsg("جاري معالجة الأرشيف...");
    try {
      const res = await uploadArchive(archiveFile, archiveHandle.trim());
      setMsg(`✓ تم استيراد ${res.count.toLocaleString()} تغريدة`);
      setStatus("success");
      setTimeout(() => router.push(`/dashboard/${res.account}`), 1200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setMsg(err?.response?.data?.detail || "خطأ في معالجة الملف"); setStatus("error");
    }
  }

  async function handleApify() {
    if (!apifyUser.trim() || !apifyToken.trim()) {
      setMsg("أدخل اسم الحساب وتوكن Apify"); setStatus("error"); return;
    }
    setStatus("loading"); setMsg(`جاري جلب تغريدات @${apifyUser}... قد يستغرق بضع دقائق`);
    try {
      const res = await fetchApify(apifyUser.trim(), apifyToken.trim(), maxTweets);
      setMsg(`✓ تم جلب ${res.count.toLocaleString()} تغريدة`);
      setStatus("success");
      setTimeout(() => router.push(`/dashboard/${res.account}`), 1200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setMsg(err?.response?.data?.detail || "خطأ في جلب البيانات — تحقق من التوكن"); setStatus("error");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Hero */}
      <div className="text-center mb-10 max-w-xl">
        <div className="inline-flex items-center gap-2 badge badge-blue mb-4">
          <Twitter size={14} /> محلل تغريدات X
        </div>
        <h1 className="text-4xl font-extrabold mb-3 leading-tight">
          اكتشف أنماطاً خفية<br />
          <span className="text-brand-500">في تغريداتك بالذكاء الاصطناعي</span>
        </h1>
        <p className="text-slate-400 text-lg">
          استورد آلاف التغريدات مجاناً وحللها بـ Claude
        </p>
      </div>

      {/* Previous accounts */}
      {accounts.length > 0 && !source && (
        <div className="w-full max-w-lg mb-6">
          <p className="text-slate-400 text-sm mb-2">حسابات محللة مسبقاً:</p>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.handle}
                onClick={() => router.push(`/dashboard/${a.handle}`)}
                className="badge badge-blue hover:opacity-80 transition cursor-pointer"
              >
                @{a.handle}
                <span className="opacity-60 mr-1">({a.tweet_count.toLocaleString()})</span>
                <ChevronLeft size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Source selector */}
      {!source && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          <SourceCard
            icon={<Upload size={28} className="text-brand-400" />}
            title="رفع أرشيف X"
            desc="نزّل أرشيفك من إعدادات X وارفعه هنا — مجاني وشامل لكل تاريخك"
            badge="مجاني كامل"
            badgeClass="badge-green"
            onClick={() => setSource("archive")}
          />
          <SourceCard
            icon={<Twitter size={28} className="text-sky-400" />}
            title="جلب عبر Apify"
            desc="حلل أي حساب عام — استخدم التوكن المجاني ($5 شهرياً ≈ 12K تغريدة)"
            badge="أي حساب"
            badgeClass="badge-blue"
            onClick={() => setSource("apify")}
          />
        </div>
      )}

      {/* Archive form */}
      {source === "archive" && (
        <div className="card w-full max-w-lg">
          <BackBtn onClick={() => { setSource(null); setStatus("idle"); setMsg(""); }} />
          <h2 className="text-xl font-bold mb-4">رفع أرشيف X</h2>

          <label className="block text-sm text-slate-400 mb-1">اسم الحساب (بدون @)</label>
          <input
            value={archiveHandle}
            onChange={(e) => setArchiveHandle(e.target.value)}
            placeholder="مثال: elonmusk"
            className="input mb-4"
          />

          <label className="block text-sm text-slate-400 mb-1">ملف الأرشيف (.zip)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500 transition mb-4"
          >
            {archiveFile ? (
              <p className="text-green-400 font-semibold">{archiveFile.name}</p>
            ) : (
              <>
                <Upload size={32} className="text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">اسحب الملف هنا أو انقر للاختيار</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => setArchiveFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <HowToArchive />

          <ActionBtn status={status} onClick={handleArchive} label="ابدأ التحليل" />
          <StatusMsg status={status} msg={msg} />
        </div>
      )}

      {/* Apify form */}
      {source === "apify" && (
        <div className="card w-full max-w-lg">
          <BackBtn onClick={() => { setSource(null); setStatus("idle"); setMsg(""); }} />
          <h2 className="text-xl font-bold mb-4">جلب عبر Apify</h2>

          <label className="block text-sm text-slate-400 mb-1">اسم الحساب (بدون @)</label>
          <input
            value={apifyUser}
            onChange={(e) => setApifyUser(e.target.value)}
            placeholder="مثال: elonmusk"
            className="input mb-4"
          />

          <label className="block text-sm text-slate-400 mb-1">Apify API Token</label>
          <input
            value={apifyToken}
            onChange={(e) => setApifyToken(e.target.value)}
            type="password"
            placeholder="apify_api_xxxx"
            className="input mb-4"
          />

          <label className="block text-sm text-slate-400 mb-1">
            أقصى عدد تغريدات: <span className="text-white font-bold">{maxTweets.toLocaleString()}</span>
          </label>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={maxTweets}
            onChange={(e) => setMaxTweets(+e.target.value)}
            className="w-full mb-6 accent-blue-500"
          />

          <HowToApify />

          <ActionBtn status={status} onClick={handleApify} label="ابدأ الجلب والتحليل" />
          <StatusMsg status={status} msg={msg} />
        </div>
      )}
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function SourceCard({ icon, title, desc, badge, badgeClass, onClick }: {
  icon: React.ReactNode; title: string; desc: string;
  badge: string; badgeClass: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card text-right hover:border-brand-500 transition-all hover:shadow-lg hover:shadow-blue-900/20 cursor-pointer group"
    >
      <div className="mb-3">{icon}</div>
      <div className={`badge ${badgeClass} mb-2`}>{badge}</div>
      <h3 className="text-lg font-bold mb-1 group-hover:text-brand-400 transition">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4">
      <ChevronLeft size={14} /> رجوع
    </button>
  );
}

function ActionBtn({ status, onClick, label }: {
  status: Status; onClick: () => void; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "loading" || status === "success"}
      className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {status === "loading" && <Loader2 size={18} className="animate-spin" />}
      {label}
    </button>
  );
}

function StatusMsg({ status, msg }: { status: Status; msg: string }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 mt-3 text-sm ${
      status === "error"   ? "text-red-400" :
      status === "success" ? "text-green-400" : "text-slate-400"
    }`}>
      {status === "error"   && <AlertCircle size={14} />}
      {status === "success" && <CheckCircle size={14} />}
      {msg}
    </div>
  );
}

function HowToArchive() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 mb-4 text-sm text-slate-400">
      <p className="font-semibold text-slate-300 mb-2">كيف تنزّل أرشيفك؟</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>افتح X → الإعدادات → حسابك</li>
        <li>اضغط &ldquo;تنزيل أرشيف X الخاص بك&rdquo;</li>
        <li>انتظر البريد (عادةً أقل من 24 ساعة)</li>
        <li>ارفع ملف ZIP هنا مباشرةً</li>
      </ol>
    </div>
  );
}

function HowToApify() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 mb-4 text-sm text-slate-400">
      <p className="font-semibold text-slate-300 mb-2">كيف تحصل على التوكن؟</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>سجل مجاناً في apify.com</li>
        <li>افتح Settings → Integrations</li>
        <li>انسخ &ldquo;Personal API token&rdquo;</li>
        <li>الحساب المجاني يشمل $5 شهرياً ≈ 12K تغريدة</li>
      </ol>
    </div>
  );
}
