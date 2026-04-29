"""
Fetch tweets via Apify using the apidojo/twitter-user-scraper actor.
User provides their own Apify token (free tier = $5/month ≈ 12K tweets).
"""
import re
from datetime import datetime, timezone
from apify_client import ApifyClient


ACTOR_ID = "apidojo/twitter-user-scraper"


def _normalize(item: dict) -> dict:
    created_raw = item.get("createdAt") or item.get("created_at", "")
    try:
        dt = datetime.fromisoformat(created_raw.replace("Z", "+00:00"))
        created_at = dt.astimezone(timezone.utc).isoformat()
    except Exception:
        created_at = created_raw

    text = item.get("text") or item.get("full_text", "")
    hashtags = [h.lower() for h in re.findall(r"#(\w+)", text)]
    mentions = [m.lower() for m in re.findall(r"@(\w+)", text)]

    return {
        "id":          str(item.get("id") or item.get("tweetId", "")),
        "text":        text,
        "created_at":  created_at,
        "likes":       int(item.get("likeCount") or item.get("favoriteCount") or 0),
        "retweets":    int(item.get("retweetCount") or 0),
        "replies":     int(item.get("replyCount") or 0),
        "impressions": int(item.get("viewCount") or item.get("impressionCount") or 0),
        "bookmarks":   int(item.get("bookmarkCount") or 0),
        "hashtags":    hashtags,
        "mentions":    mentions,
        "has_media":   bool(item.get("extendedEntities") or item.get("media")),
        "lang":        item.get("lang") or item.get("language", ""),
        "source":      "apify",
    }


def fetch_tweets(username: str, apify_token: str, max_tweets: int = 10000) -> list[dict]:
    client = ApifyClient(apify_token)

    run = client.actor(ACTOR_ID).call(run_input={
        "twitterHandles": [username],
        "maxItems": max_tweets,
        "addUserInfo": False,
    })

    dataset_id = run.get("defaultDatasetId")
    if not dataset_id:
        raise RuntimeError("Apify: لم يُرجع الـ actor بيانات — تحقق من صحة التوكن")

    items = list(client.dataset(dataset_id).iterate_items())
    tweets = [_normalize(item) for item in items]

    # Filter retweets
    tweets = [t for t in tweets if not t["text"].startswith("RT @")]
    return tweets
