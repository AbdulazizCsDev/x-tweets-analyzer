"""
Fetch tweets via Apify.
Primary:  apidojo/twitter-user-scraper  (user timeline — works for any public account)
Fallback: apidojo/tweet-scraper         (search-based — for large/indexed accounts)
"""
import re
import json
from datetime import datetime, timezone
from apify_client import ApifyClient


PRIMARY_ACTOR  = "apidojo/twitter-user-scraper"
FALLBACK_ACTOR = "apidojo/tweet-scraper"


# ── helpers ───────────────────────────────────────────────────────────────

def _dig(obj, *keys):
    """Recursively find first non-empty value for any key anywhere in obj."""
    if isinstance(obj, dict):
        for k in keys:
            if k in obj and obj[k] not in (None, "", 0, [], {}):
                return obj[k]
        # dig one level deeper
        for v in obj.values():
            if isinstance(v, dict):
                found = _dig(v, *keys)
                if found not in (None, "", 0, [], {}):
                    return found
    return None


def _int(v) -> int:
    try:
        return int(v) if v is not None else 0
    except (ValueError, TypeError):
        return 0


def _parse_date(raw) -> str:
    if not raw:
        return ""
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z",
                "%a %b %d %H:%M:%S %z %Y"):
        try:
            dt = datetime.strptime(str(raw).replace("Z", "+00:00")
                                           .replace("+0000", "+00:00"), fmt)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    try:
        dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return str(raw)


def _normalize(item: dict) -> dict | None:
    # Skip sentinel rows
    if "noResults" in item or list(item.keys()) == ["noResults"]:
        return None

    # ── tweet ID (check many possible names + nested) ─────────────────────
    tweet_id = _dig(item,
        "id", "id_str", "tweetId", "tweet_id", "rest_id",
        "conversationId", "twitterId")
    if not tweet_id:
        return None

    text = _dig(item, "text", "full_text", "fullText", "tweet_text") or ""
    created_raw = _dig(item, "createdAt", "created_at", "date", "timestamp", "timeParsed")

    likes     = _int(_dig(item, "likeCount", "favoriteCount", "favorite_count", "likes"))
    retweets  = _int(_dig(item, "retweetCount", "retweet_count", "retweets"))
    replies   = _int(_dig(item, "replyCount",   "reply_count",   "replies"))
    views     = _int(_dig(item, "viewCount", "impressionCount", "views", "impressions"))
    bookmarks = _int(_dig(item, "bookmarkCount", "bookmark_count"))

    hashtags = [h.lower() for h in re.findall(r"#(\w+)", str(text))]
    mentions = [m.lower() for m in re.findall(r"@(\w+)", str(text))]
    has_media = bool(_dig(item, "media", "photos", "videos"))

    return {
        "id":          str(tweet_id),
        "text":        str(text),
        "created_at":  _parse_date(created_raw),
        "likes":       likes,
        "retweets":    retweets,
        "replies":     replies,
        "impressions": views,
        "bookmarks":   bookmarks,
        "hashtags":    hashtags,
        "mentions":    mentions,
        "has_media":   has_media,
        "lang":        str(_dig(item, "lang", "language") or ""),
        "source":      "apify",
    }


def _run_actor(client: ApifyClient, actor_id: str, run_input: dict) -> list[dict]:
    run = client.actor(actor_id).call(run_input=run_input)
    dataset_id = run.get("defaultDatasetId")
    if not dataset_id:
        raise RuntimeError(f"{actor_id}: لم يُرجع dataset")
    return list(client.dataset(dataset_id).iterate_items())


# ── public API ────────────────────────────────────────────────────────────

def fetch_tweets(username: str, apify_token: str, max_tweets: int = 10000) -> list[dict]:
    client = ApifyClient(apify_token)
    raw_items: list[dict] = []

    # 1) Primary: user timeline
    try:
        raw_items = _run_actor(client, PRIMARY_ACTOR, {
            "twitterHandles": [username],
            "maxItems":       max_tweets,
        })
    except Exception:
        pass

    # 2) Fallback: search-based
    if not raw_items or all("noResults" in i for i in raw_items):
        try:
            raw_items = _run_actor(client, FALLBACK_ACTOR, {
                "searchTerms": [f"from:{username}"],
                "maxItems":    max_tweets,
                "sort":        "Latest",
            })
        except Exception as e:
            raise RuntimeError(f"فشل جلب التغريدات من كلا المصدرين: {e}") from e

    if not raw_items:
        raise RuntimeError(
            f"لم يُرجع Apify أي بيانات للحساب @{username}. "
            "تأكد أن الحساب عام وأن التوكن صحيح."
        )

    # ── normalize + dedup ─────────────────────────────────────────────────
    seen: set[str] = set()
    tweets: list[dict] = []

    for item in raw_items:
        t = _normalize(item)
        if not t or t["id"] in seen:
            continue
        if t["text"].startswith("RT @"):
            continue
        seen.add(t["id"])
        tweets.append(t)

    if not tweets:
        # Debug: show actual keys from first item
        sample = json.dumps(list(raw_items[0].keys())[:20], ensure_ascii=False) if raw_items else "[]"
        raise RuntimeError(
            f"تم استلام {len(raw_items)} عنصر لكن فشل استخراج بيانات صالحة. "
            f"الحقول المتاحة: {sample}"
        )

    return tweets
