"""
Business-focused AI insights via Claude claude-sonnet-4-6.
4 insights that drive real decisions — not just descriptions.
"""
import re
import json
import random
import anthropic

_SAMPLE_SIZE = 500
_MODEL = "claude-sonnet-4-6"

SYSTEM_BASE = """أنت مستشار تسويق رقمي متخصص في تحليل محتوى X/Twitter لأغراض تجارية.
هدفك: استخراج رؤى قابلة للتطبيق الفوري — قرارات واضحة، لا وصف.
أرجع JSON صالح فقط بدون أي نص خارجه.
اللغة: نفس لغة أغلب التغريدات."""


def _sample(tweets: list[dict], n: int = _SAMPLE_SIZE) -> list[dict]:
    if len(tweets) <= n:
        return tweets
    return random.sample(tweets, n)


def _eng(t: dict) -> int:
    return t.get("likes", 0) + t.get("retweets", 0) + t.get("replies", 0)


def _fmt(tweets: list[dict], label: str = "") -> str:
    prefix = f"[{label}] " if label else ""
    return "\n".join(
        f"{prefix}{i+1}. [{t.get('created_at','')[:10]}] "
        f"❤️{t.get('likes',0)} 🔁{t.get('retweets',0)} 💬{t.get('replies',0)} "
        f"| {t.get('text','')[:250]}"
        for i, t in enumerate(tweets)
    )


def _call(client: anthropic.Anthropic, tweet_block: str, user_prompt: str) -> dict:
    response = client.messages.create(
        model=_MODEL,
        max_tokens=3000,
        system=[
            {"type": "text", "text": SYSTEM_BASE, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": f"<tweets>\n{tweet_block}\n</tweets>", "cache_control": {"type": "ephemeral"}},
        ],
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text.strip()
    m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    return json.loads(raw)


# ── 1. Content Funnel ─────────────────────────────────────────────────────────

def content_funnel(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    block = _fmt(_sample(tweets))
    return _call(client, block, """
صنّف كل تغريدة في إحدى 3 فئات بناءً على نيتها التجارية:
- TOFU: تعليمي/ترفيهي/إخباري — يجذب جمهوراً جديداً، لا يطلب شيئاً
- MOFU: رأي شخصي / خبرة / قصة / case study — يبني ثقة وسلطة
- BOFU: دعوة لعمل مباشرة (رابط، DM، كورس، خدمة، اشتراك) — يحوّل إلى عميل

بعد التصنيف احسب التوزيع ومتوسط التفاعل لكل فئة.
التوزيع المثالي: 70% TOFU، 20% MOFU، 10% BOFU.

أرجع JSON:
{
  "distribution": {
    "TOFU": {"count": 0, "pct": 0, "avg_eng": 0, "best_example": "..."},
    "MOFU": {"count": 0, "pct": 0, "avg_eng": 0, "best_example": "..."},
    "BOFU": {"count": 0, "pct": 0, "avg_eng": 0, "best_example": "..."}
  },
  "diagnosis": "جملة واحدة تصف المشكلة الجوهرية في التوزيع الحالي",
  "top_recommendation": "توصية واحدة محددة قابلة للتطبيق هذا الأسبوع",
  "missed_opportunity": "تقدير نوعي للفرص الضائعة بسبب اختلال التوزيع"
}
""")


# ── 2. Winner Formula ─────────────────────────────────────────────────────────

def winner_formula(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sorted_t = sorted(tweets, key=_eng, reverse=True)
    n = max(10, min(50, len(sorted_t) // 7))
    top_block    = _fmt(sorted_t[:n],  "فائزة")
    bottom_block = _fmt(sorted_t[-n:], "خاسرة")
    combined = (
        f"=== أعلى {n} تغريدة تفاعلاً (الفائزات) ===\n{top_block}\n\n"
        f"=== أدنى {n} تغريدة تفاعلاً (الخاسرات) ===\n{bottom_block}"
    )
    return _call(client, combined, """
قارن الفائزات ضد الخاسرات واستخرج الفروق الجوهرية القابلة للتطبيق فوراً.
لا تكتف بـ"كتابة جيدة" — ابحث عن أنماط محددة: طول، بنية، افتتاحية، أرقام، أسئلة، إلخ.

أرجع JSON:
{
  "patterns": [
    {
      "name": "اسم النمط",
      "description": "ما تفعله الفائزات تحديداً؟",
      "winner_avg": 0,
      "loser_avg": 0,
      "multiplier": 0.0,
      "example": "مثال من الفائزات"
    }
  ],
  "template": "الهيكل الكامل: [افتح بـ...] + [وسط...] + [اختم بـ...]",
  "avoid": ["نمط يقلل التفاعل 1", "نمط 2", "نمط 3"],
  "ready_examples": [
    "تغريدة كاملة جاهزة للنشر — مثال 1",
    "تغريدة كاملة جاهزة للنشر — مثال 2",
    "تغريدة كاملة جاهزة للنشر — مثال 3"
  ]
}
""")


# ── 3. Topic ROI Matrix ───────────────────────────────────────────────────────

def topic_roi(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    block = _fmt(_sample(tweets))
    return _call(client, block, """
حدد 6-10 مواضيع رئيسية، ثم لكل موضوع:
- عدد التغريدات فيه
- متوسط التفاعل
- الاتجاه (قارن التغريدات الأحدث بالأقدم): يصعد / ثابت / يهبط
- التصنيف:
  منجم = تفاعل عالٍ + استخدام نادر → أكثر منه
  ذهب  = تفاعل عالٍ + استخدام كثير → استمر
  مهدور = تفاعل منخفض + استخدام كثير → قلّل أو طوّر
  ميت  = تفاعل منخفض + استخدام نادر → احذف

أرجع JSON:
{
  "topics": [
    {
      "name": "اسم الموضوع",
      "count": 0,
      "avg_eng": 0,
      "trend": "يصعد|ثابت|يهبط",
      "quadrant": "منجم|ذهب|مهدور|ميت",
      "recommendation": "ماذا تفعل به؟"
    }
  ],
  "biggest_opportunity": "الموضوع المنجم الأول وكيف تستثمره فوراً",
  "immediate_cut": "الموضوع الأكثر هدراً ولماذا"
}
""")


# ── 4. Action Plan ────────────────────────────────────────────────────────────

def action_plan(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sorted_t = sorted(tweets, key=_eng, reverse=True)
    top30 = sorted_t[:30]
    rest  = _sample(sorted_t[30:], 70)
    block = _fmt(top30 + rest)
    return _call(client, block, """
بناءً على أعلى التغريدات تفاعلاً وأنجح أساليبها، قدّم خطة محتوى لأسبوع كامل.
لكل يوم: الموضوع الأنسب + القالب الأنجح + hook افتتاحي + تغريدة كاملة جاهزة للنشر.
اجعل التغريدات واقعية ومكتوبة بنفس أسلوب صاحب الحساب تماماً.

أرجع JSON:
{
  "week_plan": [
    {
      "day": "الأحد",
      "best_time": "21:00",
      "topic": "...",
      "format": "قائمة مرقمة|سؤال|رأي شخصي|قصة|إحصائية|نصيحة",
      "hook": "الجملة الافتتاحية فقط",
      "full_tweet": "التغريدة الكاملة جاهزة للنشر"
    }
  ],
  "key_insight": "أهم استنتاج واحد يجب أن يعرفه صاحب الحساب",
  "quick_win": "شيء واحد محدد ينفّذه اليوم قبل أي شيء آخر"
}
""")


KIND_MAP = {
    "content_funnel": content_funnel,
    "winner_formula": winner_formula,
    "topic_roi":      topic_roi,
    "action_plan":    action_plan,
}
