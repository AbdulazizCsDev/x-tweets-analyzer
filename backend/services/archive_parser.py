"""
Parse X (Twitter) data archive ZIP.

Large archives split tweets across multiple files:
  data/tweets.js
  data/tweets-part1.js
  data/tweets-part2.js
  ...
Each file looks like:
  window.YTD.tweets.partN = [ { "tweet": {...} }, ... ]
"""
import re
import json
import zipfile
from datetime import datetime, timezone


_CREATED_AT_FMT = "%a %b %d %H:%M:%S %z %Y"
_TWEETS_FILE_RE = re.compile(r"(?:^|/)tweets(?:-part\d+)?\.js$", re.IGNORECASE)


def _parse_date(raw: str) -> str:
    try:
        dt = datetime.strptime(raw, _CREATED_AT_FMT)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return raw


def _extract_all_tweet_files(zf: zipfile.ZipFile) -> list[str]:
    """Return all tweets*.js file contents — archives split into parts."""
    candidates = sorted(n for n in zf.namelist() if _TWEETS_FILE_RE.search(n))
    if not candidates:
        raise ValueError("لم يتم العثور على ملف tweets.js داخل الأرشيف")
    return [zf.read(n).decode("utf-8", errors="replace") for n in candidates]


def _js_to_json(raw: str) -> list[dict]:
    # Strip the JS assignment prefix: window.YTD.tweets.partN = [...]
    match = re.search(r"=\s*(\[.*)", raw, re.DOTALL)
    if not match:
        raise ValueError("تنسيق tweets.js غير متوقع")
    return json.loads(match.group(1))


def _normalize(tweet_obj: dict) -> dict:
    t = tweet_obj.get("tweet", tweet_obj)

    # Long tweets (>280 chars) store the full content in noteTweet.fullText
    note = t.get("noteTweet", {}).get("core", {}) if isinstance(t.get("noteTweet"), dict) else {}
    full_text = (
        note.get("text")
        or t.get("note_tweet", {}).get("text")
        or t.get("full_text")
        or t.get("text", "")
    )

    hashtags = [h["text"].lower() for h in
                t.get("entities", {}).get("hashtags", [])]
    mentions = [m["screen_name"].lower() for m in
                t.get("entities", {}).get("user_mentions", [])]
    has_media = bool(
        t.get("extended_entities", {}).get("media") or
        t.get("entities", {}).get("media")
    )

    return {
        "id":          t.get("id_str") or str(t.get("id", "")),
        "text":        full_text,
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


def parse_archive(file_path: str, account: str) -> tuple[list[dict], str]:
    """Parse archive ZIP from disk. Returns (tweets, detected_handle)."""
    with zipfile.ZipFile(file_path) as zf:
        raw_files = _extract_all_tweet_files(zf)

    all_items: list[dict] = []
    for raw in raw_files:
        try:
            all_items.extend(_js_to_json(raw))
        except (ValueError, json.JSONDecodeError):
            continue

    if not all_items:
        raise ValueError("الأرشيف لا يحتوي على تغريدات قابلة للقراءة")

    tweets = [_normalize(item) for item in all_items]

    # Filter retweets and deduplicate by ID
    seen: set[str] = set()
    unique: list[dict] = []
    for t in tweets:
        if not t["id"] or t["id"] in seen:
            continue
        if t["text"].startswith("RT @"):
            continue
        seen.add(t["id"])
        unique.append(t)

    return unique, account
