"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Loader2, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Shield, Zap, BookOpen, Lock,
  BarChart2, CalendarDays, TrendingUp, MessageSquare,
} from "lucide-react";
import { uploadArchive, getAccounts, Account } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import LangToggle from "@/components/LangToggle";

type Status = "idle" | "loading" | "success" | "error";
type Step = 1 | 2 | 3;

const FEATURE_ICONS = [
  <TrendingUp size={20} key="t" />,
  <Zap size={20} key="z" />,
  <BarChart2 size={20} key="b" />,
  <CalendarDays size={20} key="c" />,
];

const FEATURE_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#22c55e"];

export default function Home() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const [archiveHandle, setArchiveHandle] = useState("");
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function nextStep() {
    if (step === 1 && !archiveHandle.trim()) return;
    if (step === 2 && !archiveFile) return;
    setStep((s) => Math.min(s + 1, 3) as Step);
  }

  async function handleArchive() {
    if (!archiveFile || !archiveHandle.trim()) {
      setMsg(t.formError);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMsg(t.processing);
    try {
      const res = await uploadArchive(archiveFile, archiveHandle.trim());
      setMsg(t.importedTweets(res.count));
      setStatus("success");
      const dest = res.account && res.account !== "unknown" ? res.account : archiveHandle.trim();
      setTimeout(() => router.push(`/dashboard/${dest}`), 1200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setMsg(err?.response?.data?.detail || t.errorData);
      setStatus("error");
    }
  }

  const ChevronStart = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen">

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 glass" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LangToggle />
            <span className="badge badge-green text-xs hidden sm:inline-flex gap-1">
              <Lock size={10} /> {t.privacyBadge}
            </span>
            {accounts.length > 0 && (
              <button onClick={scrollToUpload} className="badge badge-violet cursor-pointer hover:opacity-80 transition">
                {t.newAnalysis}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        <div
          className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full pointer-events-none animate-pulse-orb"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)" }}
        />

        <div className="text-center max-w-2xl relative z-10">
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-4 leading-tight animate-fade-in-up delay-100">
            <span className="gradient-text">{t.appName}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 mb-2 leading-relaxed animate-fade-in-up delay-200">
            {t.heroTagline}
          </p>
          <p className="text-slate-400 mb-3 animate-fade-in-up delay-200">
            {t.heroTagline2}
          </p>
          <p className="text-slate-500 text-sm mb-10 max-w-lg mx-auto animate-fade-in-up delay-300">
            {t.heroDesc}
          </p>
          <div className="animate-fade-in-up delay-400">
            <button
              onClick={scrollToUpload}
              className="inline-flex items-center gap-2 text-white font-bold text-lg px-8 py-4 rounded-2xl transition shadow-lg"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                boxShadow: "0 8px 32px rgba(109,40,217,0.35)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {t.heroBtn}
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-700 animate-bounce">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-2">{t.featuresTitle}</h2>
          <p className="text-slate-400 text-center mb-12 text-sm">{t.featuresSub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.features.map((f, i) => {
              const color = FEATURE_COLORS[i];
              return (
                <div
                  key={i}
                  className="card group hover:scale-[1.02] transition-transform cursor-default"
                  style={{ borderColor: color + "28" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                    style={{ background: color + "18", color }}
                  >
                    {FEATURE_ICONS[i]}
                  </div>
                  <h3 className="font-bold mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{f.desc}</p>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: color + "18", color }}
                  >
                    {f.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Chat teaser ── */}
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto glass text-center py-8 px-6" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
          <MessageSquare size={32} className="mx-auto mb-3" style={{ color: "#a78bfa" }} />
          <h3 className="text-xl font-bold mb-2">{t.chatTeaserTitle}</h3>
          <p className="text-slate-400 text-sm">{t.chatTeaserDesc}</p>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass py-8 px-6 text-center" style={{ borderColor: "rgba(74,222,128,0.15)" }}>
            <Shield size={34} className="mx-auto mb-3" style={{ color: "#4ade80" }} />
            <h2 className="text-2xl font-bold mb-1">{t.privacyTitle}</h2>
            <p className="text-slate-400 text-sm mb-6">{t.privacySub}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {t.privacy.map((p, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 ${isAr ? "text-right" : "text-left"}`}
                  style={{ background: "rgba(30,44,85,0.5)" }}
                >
                  <p className="text-2xl mb-2">{p.icon}</p>
                  <p className="font-semibold text-sm mb-1">{p.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Upload / Stepper ── */}
      <section ref={uploadRef} className="py-16 px-6" id="upload">
        <div className="max-w-lg mx-auto">
          {accounts.length > 0 && (
            <div className="mb-8 text-center">
              <p className="text-slate-400 text-sm mb-3">{t.prevAccounts}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.handle}
                    onClick={() => router.push(`/dashboard/${a.handle}`)}
                    className="badge badge-violet hover:opacity-80 transition cursor-pointer"
                  >
                    @{a.handle}
                    <span className="opacity-60 mr-1">({a.tweet_count.toLocaleString()})</span>
                    <ChevronStart size={12} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-6">
              <Logo small />
            </div>

            <Stepper current={step} />

            <div className="mt-6">
              {step === 1 && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-semibold mb-2 text-slate-300">
                    {t.accountLabel}
                  </label>
                  <input
                    value={archiveHandle}
                    onChange={(e) => setArchiveHandle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && nextStep()}
                    placeholder={t.accountPlaceholder}
                    className="input mb-4"
                    autoFocus
                  />
                  <button
                    onClick={nextStep}
                    disabled={!archiveHandle.trim()}
                    className="w-full py-3 rounded-xl font-bold transition disabled:opacity-40 text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                  >
                    {t.nextBtn}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in-up">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f?.name.endsWith(".zip")) setArchiveFile(f);
                    }}
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4"
                    style={{
                      borderColor: archiveFile ? "#4ade80" : dragOver ? "#8b5cf6" : "#1e2c55",
                      background: dragOver ? "rgba(139,92,246,0.05)" : "transparent",
                    }}
                  >
                    {archiveFile ? (
                      <div style={{ color: "#4ade80" }}>
                        <CheckCircle size={28} className="mx-auto mb-2" />
                        <p className="font-semibold text-sm">{archiveFile.name}</p>
                        <p className="text-xs mt-1 text-slate-400">
                          {(archiveFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">{t.dropzoneText}</p>
                        <p className="text-slate-600 text-xs mt-1">{t.dropzoneNote}</p>
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 rounded-xl border text-slate-400 hover:text-white text-sm font-semibold transition"
                      style={{ borderColor: "#1e2c55" }}
                    >
                      {t.backBtn}
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!archiveFile}
                      className="flex-[2] py-2.5 px-6 rounded-xl font-bold text-sm transition disabled:opacity-40 text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                    >
                      {t.nextBtn}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-fade-in-up">
                  <div className="rounded-xl p-4 mb-5 text-sm" style={{ background: "rgba(30,44,85,0.5)" }}>
                    <div className="flex justify-between mb-2.5">
                      <span className="text-slate-400">{t.stepAccount}</span>
                      <span className="font-bold text-brand-400">@{archiveHandle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t.stepFile}</span>
                      <span className="font-semibold text-xs truncate max-w-44 text-slate-200">
                        {archiveFile?.name}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleArchive}
                    disabled={status === "loading" || status === "success"}
                    className="w-full py-3.5 rounded-xl font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-white"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      boxShadow: "0 8px 32px rgba(109,40,217,0.3)",
                    }}
                  >
                    {status === "loading" && <Loader2 size={20} className="animate-spin" />}
                    {status === "success" ? t.startSuccess : t.startBtn}
                  </button>

                  <button
                    onClick={() => setStep(2)}
                    className="mt-3 w-full text-slate-500 hover:text-slate-300 text-xs transition"
                  >
                    {t.backBtn}
                  </button>

                  {msg && (
                    <div className={`flex items-center justify-center gap-2 mt-3 text-sm ${
                      status === "error" ? "text-red-400" : status === "success" ? "text-green-400" : "text-slate-400"
                    }`}>
                      {status === "error" && <AlertCircle size={14} />}
                      {status === "success" && <CheckCircle size={14} />}
                      {msg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 text-center border-t" style={{ borderColor: "#1e2c55" }}>
        <div className="flex justify-center mb-2">
          <Logo small />
        </div>
        <p className="text-slate-600 text-xs mt-1">{t.footerNote}</p>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function Logo({ small }: { small?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          width: small ? 28 : 34,
          height: small ? 28 : 34,
          background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
        }}
      >
        <BookOpen size={small ? 13 : 16} className="text-white" />
      </div>
      <span
        className="font-extrabold gradient-text"
        style={{ fontSize: small ? "1rem" : "1.15rem" }}
      >
        {t.appName}
      </span>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const { t } = useI18n();
  const steps = [
    { n: 1, label: t.stepAccount },
    { n: 2, label: t.stepFile },
    { n: 3, label: t.stepAnalyze },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: s.n < current ? "#4ade80" : s.n === current ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "#141c38",
                color: s.n <= current ? "white" : "#4a5568",
                border: s.n > current ? "1px solid #1e2c55" : "none",
              }}
            >
              {s.n < current ? "✓" : s.n}
            </div>
            <span
              className="text-xs mt-1 font-medium"
              style={{ color: s.n === current ? "#a78bfa" : s.n < current ? "#4ade80" : "#4a5568" }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="flex-1 h-0.5 mb-5 mx-1 transition-all"
              style={{ background: s.n < current ? "#4ade8060" : "#1e2c55" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function HowToArchive() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #1e2c55" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white transition"
        style={{ background: "rgba(20,28,56,0.6)" }}
      >
        <span>{t.howToTitle}</span>
        <span className="text-slate-500 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 text-sm text-slate-400" style={{ background: "rgba(13,18,40,0.5)" }}>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            {t.howToSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
