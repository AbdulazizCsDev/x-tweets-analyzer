from fastapi import APIRouter, Header, HTTPException
from db import get_tweets
from services import analytics

router = APIRouter()


@router.get("/{account}")
def get_analytics(account: str, x_session_id: str = Header("")):
    tweets = get_tweets(account, x_session_id)
    if not tweets:
        raise HTTPException(404, f"لا توجد بيانات للحساب: {account}")
    return analytics.run(tweets)
