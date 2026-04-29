"""
Parse X (Twitter) data archive ZIP.
The archive contains data/tweets.js with format:
  window.YTD.tweets.part0 = [ { "tweet": {...} }, ... ]
"""
import re
import json
import zipfile
import io
from datetime import datetime, timezone
from pathlib import Path


_CREATED_AT_FMT = "%a %b %d %H:%M:%S %z %Y"


def _parse_date(raw: str) -> str:
    try:
        dt = datetime.strptime(raw, _CREATED_AT_FMT)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return raw


def _extract_tweets_js(zf: zipfile.ZipFile) -> str:
    candidates = [n for n in zf.namelist() if n.endswith("tweets.js")]
    if not candidates:
        raise ValueError("لم يتم العثور على ملف tweets.js داخل الأرشيف")
    return zf.read(candidates[0]).decode("utf-8", errors="replace")


def _js_to_json(raw: str) -> list[dict]:
    # Strip the JS assignment prefix: window.YTD.tweets.partN = [...]
    match = re.search(r"=\s*(\[.*)", raw, re.DOTALL)
    if not match:
        raise ValueError("تنسيق tweets.js غير متوقع")
    return json.loads(match.group(1))


def _normalize(tweet_obj: dict) -> dict:
    t = tweet_obj.get("tweet", tweet_obj)

    hashtags = [h["text"].lower() for h in
                t.get("entities", {}).get("hashtags", [])]
    mentions = [m["screen_name"].lower() for m in
                t.get("entities", {}).get("user_mentions", [])]
    has_media = bool(
        t.get("extended_entities", {}).get("media") or
        t.get("entities", {}).get("media")
    )

    return {
        "id":          t.get("id_str") or t.get("id", ""),
        "text":        t.get("full_text") or t.get("text", ""),
        "created_at":  _parse_date(t.get("created_at", "")),
        "likes":       int(t.get("favorite_count", 0)),
        "retweets":    int(t.get("retweet_count", 0)),
        "replies":     int(t.get("reply_count", 0)),
        "impressions": 0,
        "bookmarks":   int(t.get("bookmark_count", 0)),
        "hashtags":    hashtags,
        "mentions":    mentions,
        "has_media":   has_media,
        "lang":        t.get("lang", ""),
        "source":      "archive",
    }


def parse_archive(file_bytes: bytes, account: str) -> tuple[list[dict], str]:
    """Return (tweets, detected_handle)."""
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        raw = _extract_tweets_js(zf)

    items = _js_to_json(raw)
    tweets = [_normalize(item) for item in items]

    # Filter out retweets (text starts with RT @)
    tweets = [t for t in tweets if not t["text"].startswith("RT @")]

    return tweets, account
