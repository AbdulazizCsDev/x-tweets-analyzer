"""
Compute all basic analytics from a list of tweet dicts.
Pure functions — no DB calls, no side effects.
"""
import re
import json
from collections import Counter
from datetime import datetime, timezone


_AR_STOP = {
    "في","على","من","عن","الى","إلى","و","أو","او","ما","لا","هذا","هذه",
    "ذلك","هذي","انا","أنا","انت","أنت","هو","هي","هم","هن","مع","تم","قد",
    "كان","كانت","كيف","ليش","ليه","the","a","an","and","or","to","of","in",
    "on","with","is","are","am","it","this","that","for","at","by","but","not",
    "https","http","co","t",
}


def _to_dt(raw: str) -> datetime | None:
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


def _engagement(t: dict) -> int:
    return t.get("likes", 0) + t.get("retweets", 0) + t.get("replies", 0)


def _normalize_text(text: str) -> str:
    s = re.sub(r"http\S+|www\S+|@\S+", " ", text)
    s = re.sub(r"#", " ", s)
    s = re.sub(r"[ؗ-ًؚ-ْٰۖ-ۭـ]", "", s)
    s = s.replace("أ","ا").replace("إ","ا").replace("آ","ا")
    s = s.replace("ى","ي").replace("ة","ه")
    s = re.sub(r"(.)\1{2,}", r"\1", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def _tokens(text: str) -> list[str]:
    normalized = _normalize_text(text)
    toks = re.findall(r"[a-zA-Z؀-ۿ]+", normalized)
    return [t for t in toks if len(t) >= 2 and t not in _AR_STOP]



def run(tweets: list[dict]) -> dict:
    if not tweets:
        return {}

    for t in tweets:
        if isinstance(t.get("hashtags"), str):
            try:
                t["hashtags"] = json.loads(t["hashtags"])
            except Exception:
                t["hashtags"] = []
        if isinstance(t.get("mentions"), str):
            try:
                t["mentions"] = json.loads(t["mentions"])
            except Exception:
                t["mentions"] = []

    total = len(tweets)
    dts = [(t, _to_dt(t.get("created_at", ""))) for t in tweets]
    dts = [(t, dt) for t, dt in dts if dt]

    # ── engagement per tweet ──────────────────────────────────────────────
    for t in tweets:
        t["_eng"] = _engagement(t)

    top10 = sorted(tweets, key=lambda t: t["_eng"], reverse=True)[:10]

    # ── hourly distribution ──────────────────────────────────────────────
    hourly: dict[int, list[int]] = {h: [] for h in range(24)}
    daily: dict[str, list[int]] = {}
    day_names = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"]
    for h in day_names:
        daily[h] = []

    py_day_map = {6:"الأحد",0:"الاثنين",1:"الثلاثاء",2:"الأربعاء",3:"الخميس",4:"الجمعة",5:"السبت"}
    tweet_count_by_hour: dict[int, int] = {h: 0 for h in range(24)}

    for t, dt in dts:
        hourly[dt.hour].append(t["_eng"])
        tweet_count_by_hour[dt.hour] += 1
        day_ar = py_day_map.get(dt.weekday(), "")
        if day_ar:
            daily[day_ar].append(t["_eng"])

    hourly_avg = {h: (sum(v)/len(v) if v else 0) for h, v in hourly.items()}
    daily_avg  = {d: (sum(v)/len(v) if v else 0) for d, v in daily.items()}

    # ── heatmap ──────────────────────────────────────────────────────────
    heatmap = {}
    for d in day_names:
        heatmap[d] = {}
        for h in range(24):
            heatmap[d][str(h)] = 0

    for t, dt in dts:
        day_ar = py_day_map.get(dt.weekday(), "")
        if day_ar:
            heatmap[day_ar][str(dt.hour)] = (
                heatmap[day_ar][str(dt.hour)] + t["_eng"]
            ) / 2 if heatmap[day_ar][str(dt.hour)] else t["_eng"]

    # ── hashtags ─────────────────────────────────────────────────────────
    tag_counter: Counter = Counter()
    tag_eng: dict[str, list[int]] = {}
    for t in tweets:
        for h in t.get("hashtags", []):
            tag_counter[h] += 1
            tag_eng.setdefault(h, []).append(t["_eng"])

    top_hashtags = [
        {"tag": k, "count": v, "avg_eng": round(sum(tag_eng[k])/len(tag_eng[k]), 1)}
        for k, v in tag_counter.most_common(20)
    ]

    # ── mentions ──────────────────────────────────────────────────────────
    mention_counter: Counter = Counter()
    for t in tweets:
        for m in t.get("mentions", []):
            mention_counter[m] += 1
    top_mentions = [{"account": k, "count": v} for k, v in mention_counter.most_common(15)]

    # ── word freq / ngrams ────────────────────────────────────────────────
    all_tokens: list[str] = []
    for t in tweets:
        all_tokens.extend(_tokens(t.get("text", "")))

    word_freq = [{"word": w, "count": c} for w, c in Counter(all_tokens).most_common(50)]

    # ── media impact ──────────────────────────────────────────────────────
    with_media    = [t["_eng"] for t in tweets if t.get("has_media")]
    without_media = [t["_eng"] for t in tweets if not t.get("has_media")]
    media_impact = {
        "with_media_avg":    round(sum(with_media)/len(with_media), 1)    if with_media    else 0,
        "without_media_avg": round(sum(without_media)/len(without_media), 1) if without_media else 0,
    }

    # ── summary metrics ───────────────────────────────────────────────────
    total_eng = sum(t["_eng"] for t in tweets)
    total_imp = sum(t.get("impressions", 0) for t in tweets)
    avg_eng   = round(total_eng / total, 1) if total else 0
    eng_rate  = round(total_eng / total_imp * 100, 3) if total_imp > 0 else 0

    best_hour = max(hourly_avg, key=hourly_avg.get)
    best_day  = max(daily_avg, key=daily_avg.get)

    return {
        "summary": {
            "total_tweets":   total,
            "total_engagement": total_eng,
            "total_impressions": total_imp,
            "avg_engagement": avg_eng,
            "engagement_rate": eng_rate,
            "best_hour":      best_hour,
            "best_day":       best_day,
            "with_media_pct": round(sum(1 for t in tweets if t.get("has_media")) / total * 100, 1),
        },
        "top10":         [{"id": t["id"], "text": t["text"][:120], "engagement": t["_eng"],
                            "likes": t["likes"], "retweets": t["retweets"],
                            "replies": t["replies"], "created_at": t.get("created_at","")}
                           for t in top10],
        "hourly_avg":    [{"hour": h, "avg": round(v, 1)} for h, v in sorted(hourly_avg.items())],
        "tweet_by_hour": [{"hour": h, "count": tweet_count_by_hour[h]} for h in range(24)],
        "daily_avg":     [{"day": d, "avg": round(daily_avg[d], 1)} for d in day_names],
        "heatmap":       heatmap,
        "top_hashtags":  top_hashtags,
        "top_mentions":  top_mentions,
        "word_freq":     word_freq,
        "media_impact":  media_impact,
    }
