from pydantic import BaseModel


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


class AIInsightRequest(BaseModel):
    account: str
    anthropic_key: str
    force_refresh: bool = False


class ChatRequest(BaseModel):
    account: str
    anthropic_key: str
    message: str
