"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Twitter, Loader2, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { uploadArchive, getAccounts, Account } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [archiveHandle, setArchiveHandle] = useState("");
  const [archiveFile, setArchiveFile] = useState<File | null>(null);

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10 max-w-xl">
        <div className="inline-flex items-center gap-2 badge badge-blue mb-4">
          <Twitter size={14} /> محلل تغريدات X
        </div>
        <h1 className="text-4xl font-extrabold mb-3 leading-tight">
          اكتشف أنماطاً خفية<br />
          <span className="text-brand-500">في تغريداتك بالذكاء الاصطناعي</span>
        </h1>
        <p className="text-slate-400 text-lg">
          ارفع أرشيف X وحلل آلاف التغريدات بـ Claude
        </p>
      </div>

      {accounts.length > 0 && (
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

      <div className="card w-full max-w-lg">
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
              <p className="text-slate-400">اسحب ملف ZIP هنا أو انقر للاختيار</p>
              <p className="text-slate-500 text-xs mt-1">ارفع الملف كما هو — لا تفك الضغط</p>
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

        <button
          onClick={handleArchive}
          disabled={status === "loading" || status === "success"}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "loading" && <Loader2 size={18} className="animate-spin" />}
          ابدأ التحليل
        </button>

        {msg && (
          <div className={`flex items-center gap-2 mt-3 text-sm ${
            status === "error"   ? "text-red-400" :
            status === "success" ? "text-green-400" : "text-slate-400"
          }`}>
            {status === "error"   && <AlertCircle size={14} />}
            {status === "success" && <CheckCircle size={14} />}
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}

function HowToArchive() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 mb-4 text-sm text-slate-400">
      <p className="font-semibold text-slate-300 mb-2">كيف تنزّل أرشيفك؟</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>افتح X → الإعدادات → حسابك → نزّل أرشيفاً من بياناتك</li>
        <li>أدخل كلمة المرور وانتظر البريد (24 ساعة عادةً)</li>
        <li>نزّل ملف ZIP من الرابط في البريد</li>
        <li>ارفعه هنا مباشرةً <span className="text-amber-400">بدون فك الضغط</span></li>
      </ol>
    </div>
  );
}
