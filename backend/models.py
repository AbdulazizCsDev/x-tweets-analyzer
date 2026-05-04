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


class IngestTweetsRequest(BaseModel):
    account: str
    tweets: list[dict]


class AIInsightRequest(BaseModel):
    account: str
    anthropic_key: str


class ChatRequest(BaseModel):
    account: str
    anthropic_key: str
    message: str
