export type Lang = "ar" | "en";

const ar = {
  // ── App ──────────────────────────────────────────────────────────────────
  appName: "بين السطور",
 

  // ── Nav ──────────────────────────────────────────────────────────────────
  privacyBadge: "بياناتك محمية",
  newAnalysis: "تحليل جديد",

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroTagline: "ما لا تراه في تغريداتك",
  heroTagline2: "استطيع أن أراه",
  heroDesc: "ارفع أرشيف X واكتشف الأنماط الخفية — قرارات واضحة لا وصف فارغ",
  heroBtn: "ابدأ التحليل",

  // ── Features ─────────────────────────────────────────────────────────────
  featuresTitle: "٤ رؤى تحرك قراراتك",
  featuresSub: "ليس مجرد أرقام — بل إجابات لأسئلة تجارية حقيقية",
  features: [
    { title: "قمع المحتوى",     desc: "TOFU / MOFU / BOFU — اكتشف أين تتسرب فرص التحويل وكيف تسدّها", tag: "محتوى ذكي"     },
    { title: "صيغة الفائزين",   desc: "القالب القابل للنسخ من أعلى تغريداتك أداءً — مع أمثلة جاهزة",  tag: "أنماط خفية"   },
    { title: "مصفوفة المواضيع", desc: "منجم / ذهب / مهدور / ميت — وجّه وقتك للمكان الصحيح",           tag: "ROI للمحتوى" },
    { title: "خطة الأسبوع",     desc: "٧ تغريدات جاهزة للنشر بأسلوبك أنت — بناءً على ما نجح فعلاً",  tag: "جاهز للنشر"   },
  ],

  // ── Chat teaser ───────────────────────────────────────────────────────────
  chatTeaserTitle: "واسأل بياناتك بحرية",
  chatTeaserDesc: "بعد التحليل يمكنك سؤال الذكاء الاصطناعي أي سؤال — \"ما المواضيع الأنجح؟\"، \"متى أنشر؟\"",

  // ── Privacy ──────────────────────────────────────────────────────────────
  privacyTitle: "بياناتك تبقى بين يديك",
  privacySub: "نأخذ الخصوصية بجدية",
  privacy: [
    { icon: "🔑", title: "مفتاح API في متصفحك فقط",  desc: "مفتاح Anthropic يُحفظ في localStorage في متصفحك — لا يصل إليه أحد غيرك" },
    { icon: "🤖", title: "تحليل عبر مفتاحك أنت",      desc: "يُرسل التحليل لـ Anthropic عبر مفتاحك الشخصي — لا مفتاح مشترك"         },
    { icon: "🚫", title: "لا مشاركة تجارية",           desc: "بياناتك لا تُشارك مع أي طرف تجاري — تُستخدم فقط لأغراض التحليل"        },
  ],

  // ── Upload ────────────────────────────────────────────────────────────────
  prevAccounts: "حسابات محللة مسبقاً",
  stepAccount: "الحساب",
  stepFile: "الملف",
  stepAnalyze: "التحليل",
  accountLabel: "اسم حساب X (بدون @)",
  accountPlaceholder: "مثال: elonmusk",
  nextBtn: "التالي ←",
  backBtn: "→ رجوع",
  dropzoneText: "اسحب ملف ZIP هنا أو انقر للاختيار",
  dropzoneNote: "بدون فك الضغط",
  howToTitle: "كيف تنزّل أرشيفك من X؟",
  howToSteps: [
    "افتح X (تويتر) وانتقل إلى الإعدادات",
    "اختر حسابك ← نزّل أرشيفاً من بياناتك",
    "أدخل كلمة مرورك وانتظر رسالة البريد الإلكتروني (قد تصل خلال ٢٤ ساعة)",
    "افتح الرسالة ونزّل ملف ZIP",
    "ارفعه هنا مباشرةً بدون فك الضغط",
  ],
  startBtn: "ابدأ التحليل",
  startSuccess: "تم! جاري التوجيه...",
  processing: "جاري معالجة الأرشيف...",
  progressReading: "قراءة الأرشيف...",
  progressExtracting: (i: number, n: number) => `استخراج التغريدات (${i}/${n})...`,
  progressUploading: "جاري إرسال التغريدات...",
  formError: "أدخل اسم الحساب وارفع ملف ZIP",
  importedTweets: (n: number) => `✓ تم استيراد ${n.toLocaleString("ar")} تغريدة`,

  // ── Footer ───────────────────────────────────────────────────────────────
  footerNote: "بياناتك خاصة",

  // ── Dashboard ────────────────────────────────────────────────────────────
  tweetsAnalyzed: "تغريدة محللة",
  tabAnalytics: "التحليلات",
  tabAI: "رؤى AI",
  loading: "جاري تحميل التحليلات...",
  errorData: "خطأ في جلب البيانات",
  noData: "لا توجد بيانات",
  goHome: "رجوع للصفحة الرئيسية",

  // ── API Key ──────────────────────────────────────────────────────────────
  keyValid: "✓ Anthropic",
  keyEmpty: "⚠ مفتاح AI",
  keyInvalid: "✕ مفتاح خاطئ",
  keyTitle: "مفتاح Anthropic API",
  keyDesc: "مطلوب لتحليلات AI. يُحفظ في متصفحك فقط — لا يصل إليه أحد.",
  keyLink: "احصل على مفتاحك من console.anthropic.com →",

  // ── Stats ────────────────────────────────────────────────────────────────
  statEngagement: "إجمالي التفاعل",
  statImpressions: "المشاهدات",
  statAvg: "متوسط/تغريدة",
  statHour: "أفضل ساعة",
  statDay: "أفضل يوم",
  statMedia: "نسبة الوسائط",

  // ── BasicTab ─────────────────────────────────────────────────────────────
  chartHourly: "متوسط التفاعل حسب الساعة",
  chartDaily: "متوسط التفاعل حسب اليوم",
  heatmapTitle: "خريطة التفاعل — يوم × ساعة",
  top10Title: "أعلى ١٠ تغريدات تفاعلاً",
  hashtagsTitle: "أكثر الهاشتاقات",
  noHashtags: "لا توجد هاشتاقات",
  mentionsTitle: "أكثر الحسابات ذكراً",
  noMentions: "لا توجد منشنات",
  wordsTitle: "أكثر الكلمات تكراراً",
  mediaTitle: "تأثير الوسائط على التفاعل",
  withMedia: "مع وسائط",
  withoutMedia: "بدون وسائط",

  // ── AITab ────────────────────────────────────────────────────────────────
  aiNoKey: "أدخل مفتاح Anthropic لتشغيل التحليلات",
  aiNoKeyDesc: "استخدم زر ⚠ مفتاح AI في الأعلى. المفتاح يُحفظ في متصفحك فقط.",
  aiBadKey: "صيغة المفتاح غير صحيحة",
  aiBadKeyDesc: "مفاتيح Anthropic تبدأ دائماً بـ sk-ant- وطولها أكثر من ٤٠ حرفاً.",
  aiGetKey: "احصل على مفتاحك الصحيح من console.anthropic.com →",
  aiRunBtn: "تشغيل التحليل",
  aiRunning: "جاري التحليل... ٣٠-٦٠ ثانية",
  aiRetry: "حاول مرة أخرى",
  aiCached: "محفوظ",
  aiReanalyze: "تحليل جديد",
  insights: [
    { title: "قمع المحتوى",     desc: "TOFU / MOFU / BOFU — أين تتسرب فرص التحويل؟"            },
    { title: "صيغة الفائزين",   desc: "القالب القابل للاستنساخ من أعلى تغريداتك أداءً"         },
    { title: "مصفوفة المواضيع", desc: "منجم / ذهب / مهدور / ميت — وجّه وقتك للمكان الصحيح"    },
    { title: "خطة الأسبوع",     desc: "٧ تغريدات جاهزة للنشر بناءً على أنجح أساليبك"          },
  ],
  chatTitle: "اسأل بياناتك",
  chatSubtitle: "سؤال حر عن تغريداتك — يجيبك الذكاء الاصطناعي",
  chatPlaceholder: "مثال: ما هي المواضيع التي تناسب جمهوري أكثر؟",
  chatThinking: "جاري التفكير...",
  chatQuestions: [
    "ما هي المواضيع التي تناسب جمهوري أكثر؟",
    "متى أفضل وقت للنشر بناءً على بياناتي؟",
    "ما أسلوب الكتابة الذي يميزني عن غيري؟",
    "كيف أحوّل المتابعين إلى عملاء بمحتواي؟",
  ],
};

const en: typeof ar = {
  appName: "Between the Lines",
  

  privacyBadge: "Your data is protected",
  newAnalysis: "New Analysis",

  heroTagline: "What you can't see in your tweets",
  heroTagline2: "I can see it now",
  heroDesc: "Upload your X archive and discover hidden patterns — clear decisions, not empty descriptions",
  heroBtn: "Start Analysis",

  featuresTitle: "4 Insights That Drive Decisions",
  featuresSub: "Not just numbers — answers to real business questions",
  features: [
    { title: "Content Funnel",  desc: "TOFU / MOFU / BOFU — find where conversions leak and how to fix it",   tag: "Smart Content"    },
    { title: "Winner Formula",  desc: "The repeatable template from your top tweets — with ready examples",    tag: "Hidden Patterns"  },
    { title: "Topic Matrix",    desc: "Gold mine / Gold / Wasted / Dead — direct your time to the right place", tag: "Content ROI"      },
    { title: "Weekly Plan",     desc: "7 ready-to-post tweets in your own style — based on what actually worked", tag: "Ready to Post" },
  ],

  chatTeaserTitle: "Ask Your Data Freely",
  chatTeaserDesc: "After analysis, ask the AI anything — \"What topics work best?\", \"When should I post?\"",

  privacyTitle: "Your Data Stays in Your Hands",
  privacySub: "We take privacy seriously",
  privacy: [
    { icon: "🔑", title: "API Key in Your Browser Only",  desc: "Your Anthropic key is stored in localStorage — nobody else can access it"       },
    { icon: "🤖", title: "Analysis via Your Own Key",      desc: "Analysis is sent to Anthropic via your personal key — no shared keys"           },
    { icon: "🚫", title: "No Commercial Data Sharing",    desc: "Your data is never shared with any third party — used only for analysis"         },
  ],

  prevAccounts: "Previously analyzed accounts",
  stepAccount: "Account",
  stepFile: "File",
  stepAnalyze: "Analyze",
  accountLabel: "X account name (without @)",
  accountPlaceholder: "e.g. elonmusk",
  nextBtn: "Next →",
  backBtn: "← Back",
  dropzoneText: "Drag ZIP file here or click to select",
  dropzoneNote: "Do not unzip",
  howToTitle: "How to download your X archive?",
  howToSteps: [
    "Open X (Twitter) and go to Settings",
    "Choose Your account → Download an archive of your data",
    "Enter your password and wait for the email (up to 24 hours)",
    "Open the email and download the ZIP file",
    "Upload it here directly — do not unzip",
  ],
  startBtn: "Start Analysis",
  startSuccess: "Done! Redirecting...",
  processing: "Processing archive...",
  progressReading: "Reading archive...",
  progressExtracting: (i: number, n: number) => `Extracting tweets (${i}/${n})...`,
  progressUploading: "Sending tweets...",
  formError: "Enter an account name and upload a ZIP file",
  importedTweets: (n: number) => `✓ Imported ${n.toLocaleString()} tweets`,

  footerNote: "Your data stays private",

  tweetsAnalyzed: "tweets analyzed",
  tabAnalytics: "Analytics",
  tabAI: "AI Insights",
  loading: "Loading analytics...",
  errorData: "Error fetching data",
  noData: "No data available",
  goHome: "Back to Home",

  keyValid: "✓ Anthropic",
  keyEmpty: "⚠ Add AI Key",
  keyInvalid: "✕ Invalid Key",
  keyTitle: "Anthropic API Key",
  keyDesc: "Required for AI analysis. Stored locally in your browser only.",
  keyLink: "Get your key from console.anthropic.com →",

  statEngagement: "Total Engagement",
  statImpressions: "Impressions",
  statAvg: "Avg/Tweet",
  statHour: "Best Hour",
  statDay: "Best Day",
  statMedia: "Media Rate",

  chartHourly: "Avg Engagement by Hour",
  chartDaily: "Avg Engagement by Day",
  heatmapTitle: "Engagement Heatmap — Day × Hour",
  top10Title: "Top 10 Most Engaging Tweets",
  hashtagsTitle: "Top Hashtags",
  noHashtags: "No hashtags found",
  mentionsTitle: "Most Mentioned Accounts",
  noMentions: "No mentions found",
  wordsTitle: "Most Frequent Words",
  mediaTitle: "Media Impact on Engagement",
  withMedia: "With media",
  withoutMedia: "Without media",

  aiNoKey: "Enter your Anthropic key to run AI analysis",
  aiNoKeyDesc: "Use the ⚠ Add AI Key button above. The key is stored in your browser only.",
  aiBadKey: "Invalid key format",
  aiBadKeyDesc: "Anthropic keys always start with sk-ant- and are at least 40 characters long.",
  aiGetKey: "Get your correct key from console.anthropic.com →",
  aiRunBtn: "Run Analysis",
  aiRunning: "Analyzing... 30-60 seconds",
  aiRetry: "Try again",
  aiCached: "Cached",
  aiReanalyze: "Re-analyze",
  insights: [
    { title: "Content Funnel",  desc: "TOFU / MOFU / BOFU — where are your conversions leaking?"            },
    { title: "Winner Formula",  desc: "The repeatable template from your top performing tweets"              },
    { title: "Topic Matrix",    desc: "Gold mine / Gold / Wasted / Dead — direct your time to the right place" },
    { title: "Weekly Plan",     desc: "7 ready-to-post tweets based on your most effective style"            },
  ],
  chatTitle: "Ask Your Data",
  chatSubtitle: "Free-form questions about your tweets — AI answers",
  chatPlaceholder: "e.g. What topics resonate most with my audience?",
  chatThinking: "Thinking...",
  chatQuestions: [
    "What topics resonate most with my audience?",
    "When is the best time to post based on my data?",
    "What writing style makes me stand out?",
    "How can I convert followers into customers?",
  ],
};

export const translations = { ar, en };
export type Translations = typeof ar;
