"""
Fetch tweets via Apify using apidojo/tweet-scraper with search query.
Reliable parameters and flexible field mapping handle different actor schemas.
"""
import re
from datetime import datetime, timezone
from apify_client import ApifyClient


ACTOR_ID = "apidojo/tweet-scraper"


def _first(item: dict, *keys, default=None):
    """Return the first non-empty value from item for any of the given keys."""
    for k in keys:
        v = item.get(k)
        if v not in (None, "", 0):
            return v
    # also try with 0 as valid
    for k in keys:
        if k in item and item[k] is not None:
            return item[k]
    return default


def _to_int(v) -> int:
    try:
        return int(v) if v is not None else 0
    except (ValueError, TypeError):
        return 0


def _parse_date(raw) -> str:
    if not raw:
        return ""
    try:
        if isinstance(raw, (int, float)):
            return datetime.fromtimestamp(raw, tz=timezone.utc).isoformat()
        s = str(raw).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        # Fallback: Twitter classic format "Wed Oct 10 12:00:00 +0000 2021"
        try:
            dt = datetime.strptime(str(raw), "%a %b %d %H:%M:%S %z %Y")
            return dt.astimezone(timezone.utc).isoformat()
        except Exception:
            return str(raw)


def _normalize(item: dict) -> dict | None:
    tweet_id = _first(item, "id", "id_str", "tweetId", "tweet_id", "rest_id", "conversationId")
    if not tweet_id:
        return None

    text = _first(item, "text", "full_text", "fullText", "tweet_text", default="")
    created_raw = _first(item, "createdAt", "created_at", "date", "timestamp")

    likes      = _to_int(_first(item, "likeCount", "favoriteCount", "favorite_count", "likes", "favourite_count"))
    retweets   = _to_int(_first(item, "retweetCount", "retweet_count", "retweets"))
    replies    = _to_int(_first(item, "replyCount", "reply_count", "replies"))
    views      = _to_int(_first(item, "viewCount", "impressionCount", "view_count", "views", "impressions"))
    bookmarks  = _to_int(_first(item, "bookmarkCount", "bookmark_count", "bookmarks"))

    hashtags = [h.lower() for h in re.findall(r"#(\w+)", text or "")]
    mentions = [m.lower() for m in re.findall(r"@(\w+)", text or "")]

    has_media = bool(
        item.get("media") or
        item.get("extendedEntities") or
        item.get("photos") or
        (item.get("entities") or {}).get("media")
    )

    return {
        "id":          str(tweet_id),
        "text":        str(text or ""),
        "created_at":  _parse_date(created_raw),
        "likes":       likes,
        "retweets":    retweets,
        "replies":     replies,
        "impressions": views,
        "bookmarks":   bookmarks,
        "hashtags":    hashtags,
        "mentions":    mentions,
        "has_media":   has_media,
        "lang":        _first(item, "lang", "language", default=""),
        "source":      "apify",
    }


def fetch_tweets(username: str, apify_token: str, max_tweets: int = 10000) -> list[dict]:
    client = ApifyClient(apify_token)

    run_input = {
        "searchTerms":   [f"from:{username}"],
        "maxItems":      max_tweets,
        "sort":          "Latest",
        "tweetLanguage": "any",
    }

    run = client.actor(ACTOR_ID).call(run_input=run_input)

    dataset_id = run.get("defaultDatasetId")
    if not dataset_id:
        raise RuntimeError("Apify لم يُرجع dataset — تحقق من صحة التوكن")

    raw_items = list(client.dataset(dataset_id).iterate_items())
    if not raw_items:
        raise RuntimeError(
            f"لم يتم العثور على تغريدات للحساب @{username}. "
            f"تأكد من اسم الحساب وأنه عام (غير مقفول)."
        )

    seen_ids: set[str] = set()
    tweets: list[dict] = []
    for item in raw_items:
        normalized = _normalize(item)
        if not normalized:
            continue
        if normalized["id"] in seen_ids:
            continue
        # Skip retweets
        if normalized["text"].startswith("RT @"):
            continue
        seen_ids.add(normalized["id"])
        tweets.append(normalized)

    if not tweets:
        sample_keys = list(raw_items[0].keys())[:15] if raw_items else []
        raise RuntimeError(
            f"تم جلب {len(raw_items)} عنصر من Apify لكن فشل استخراج معرّفات صالحة. "
            f"الحقول المتاحة: {sample_keys}"
        )

    return tweets
