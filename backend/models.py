from pydantic import BaseModel
from typing import Optional


class Tweet(BaseModel):
    id: str
    account: str
    text: str
    created_at: str
    likes: int = 0
    retweets: int = 0
    replies: int = 0
    impressions: int = 0
    bookmarks: int = 0
    hashtags: list[str] = []
    mentions: list[str] = []
    has_media: bool = False
    lang: str = ""
    source: str = ""


class IngestResponse(BaseModel):
    account: str
    count: int
    source: str


class ApifyRequest(BaseModel):
    username: str
    apify_token: str
    max_tweets: int = 10000


class AIInsightRequest(BaseModel):
    account: str
    anthropic_key: str
    force_refresh: bool = False
