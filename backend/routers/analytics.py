from fastapi import APIRouter, HTTPException
from db import get_tweets
from services import analytics

router = APIRouter()


@router.get("/{account}")
def get_analytics(account: str):
    tweets = get_tweets(account)
    if not tweets:
        raise HTTPException(404, f"لا توجد بيانات للحساب: {account}")
    return analytics.run(tweets)
