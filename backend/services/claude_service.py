"""
AI insights via Claude claude-sonnet-4-6.
Uses prompt caching for tweet data (cache_control: ephemeral).
Each kind is a separate API call that returns structured JSON.
"""
import json
import random
import anthropic


_SAMPLE_SIZE = 500
_MODEL = "claude-sonnet-4-6"


def _sample(tweets: list[dict], n: int = _SAMPLE_SIZE) -> list[dict]:
    if len(tweets) <= n:
        return tweets
    return random.sample(tweets, n)


def _tweets_text(tweets: list[dict]) -> str:
    lines = []
    for i, t in enumerate(tweets, 1):
        eng = t.get("likes", 0) + t.get("retweets", 0) + t.get("replies", 0)
        lines.append(
            f"{i}. [{t.get('created_at','')[:10]}] "
            f"❤️{t.get('likes',0)} 🔁{t.get('retweets',0)} 💬{t.get('replies',0)} "
            f"👁{t.get('impressions',0)} | {t.get('text','')[:200]}"
        )
    return "\n".join(lines)


def _call(client: anthropic.Anthropic, system: str, tweet_block: str, user_prompt: str) -> dict:
    response = client.messages.create(
        model=_MODEL,
        max_tokens=2000,
        system=[
            {
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral"},
            },
            {
                "type": "text",
                "text": f"<tweets>\n{tweet_block}\n</tweets>",
                "cache_control": {"type": "ephemeral"},
            },
        ],
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text.strip()
    # Extract JSON if wrapped in code fences
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


SYSTEM_BASE = """أنت محلل متخصص في محتوى تويتر/X.
ستحلل مجموعة تغريدات وتُرجع نتائجك دائماً كـ JSON صالح فقط — بدون أي نص خارج الـ JSON.
اللغة الافتراضية للإجابة: نفس لغة أغلب التغريدات (عربي إذا كانت عربية)."""


def clustering(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sample = _sample(tweets)
    block  = _tweets_text(sample)

    return _call(
        client, SYSTEM_BASE, block,
        """حلل التغريدات وحدد 5-8 مجموعات موضوعية رئيسية.
        أرجع JSON بالشكل:
        {
          "clusters": [
            {
              "name": "اسم المجموعة",
              "description": "وصف مختصر",
              "tweet_count": 0,
              "avg_engagement": 0,
              "example": "مثال على تغريدة من هذه المجموعة"
            }
          ]
        }"""
    )


def patterns(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sample = _sample(tweets)
    block  = _tweets_text(sample)

    return _call(
        client, SYSTEM_BASE, block,
        """اكتشف أنماط التفاعل الخفية في هذه التغريدات.
        ابحث عن: الأوقات، الأساليب، أنواع المحتوى، العناصر المشتركة في الأعلى تفاعلاً.
        أرجع JSON بالشكل:
        {
          "patterns": [
            {
              "title": "عنوان النمط",
              "insight": "الاستنتاج بالتفصيل",
              "evidence": "دليل من البيانات",
              "impact": "high|medium|low"
            }
          ]
        }"""
    )


def voice_profile(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sample = _sample(tweets, 300)
    block  = _tweets_text(sample)

    return _call(
        client, SYSTEM_BASE, block,
        """حلل أسلوب الكتابة وشخصية هذا الحساب.
        أرجع JSON بالشكل:
        {
          "tone": "وصف النبرة العامة",
          "personality_traits": ["سمة 1","سمة 2","سمة 3"],
          "writing_style": "وصف أسلوب الكتابة",
          "audience_persona": "وصف الجمهور المستهدف",
          "strengths": ["نقطة قوة 1","نقطة قوة 2"],
          "summary": "ملخص في جملة واحدة"
        }"""
    )


def anomalies(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sample = _sample(tweets)
    block  = _tweets_text(sample)

    return _call(
        client, SYSTEM_BASE, block,
        """حدد التغريدات الشاذة: إما نجحت بشكل غير متوقع، أو فشلت بشكل غير متوقع.
        أرجع JSON بالشكل:
        {
          "overperformers": [
            {
              "text": "نص التغريدة (مختصر)",
              "reason": "لماذا نجحت؟"
            }
          ],
          "underperformers": [
            {
              "text": "نص التغريدة (مختصر)",
              "reason": "لماذا فشلت؟"
            }
          ]
        }"""
    )


def recommendations(tweets: list[dict], api_key: str) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    sample = _sample(tweets)
    block  = _tweets_text(sample)

    return _call(
        client, SYSTEM_BASE, block,
        """بناءً على تحليل هذه التغريدات، قدّم 5 توصيات عملية وقابلة للتطبيق فوراً لتحسين التفاعل.
        أرجع JSON بالشكل:
        {
          "recommendations": [
            {
              "title": "عنوان التوصية",
              "action": "ماذا تفعل تحديداً؟",
              "why": "لماذا؟ (دليل من البيانات)",
              "priority": "high|medium|low"
            }
          ]
        }"""
    )


KIND_MAP = {
    "clustering":       clustering,
    "patterns":         patterns,
    "voice_profile":    voice_profile,
    "anomalies":        anomalies,
    "recommendations":  recommendations,
}
