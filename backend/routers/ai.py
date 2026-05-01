from fastapi import APIRouter, HTTPException
import anthropic
from models import AIInsightRequest
from db import get_tweets, get_ai_cache, set_ai_cache
from services import claude_service

router = APIRouter()

VALID_KINDS = list(claude_service.KIND_MAP.keys())


@router.post("/{kind}")
def get_insight(kind: str, body: AIInsightRequest):
    if kind not in VALID_KINDS:
        raise HTTPException(400, f"kind غير صالح. الخيارات: {VALID_KINDS}")

    if not body.force_refresh:
        cached = get_ai_cache(body.account, kind)
        if cached:
            return {"data": cached, "cached": True}

    tweets = get_tweets(body.account)
    if not tweets:
        raise HTTPException(404, f"لا توجد بيانات للحساب: {body.account}")

    try:
        fn = claude_service.KIND_MAP[kind]
        result = fn(tweets, body.anthropic_key)
    except anthropic.APIStatusError as e:
        raise HTTPException(e.status_code or 502, f"Claude API: {e.message or str(e)}")
    except anthropic.APIError as e:
        raise HTTPException(502, f"Claude API: {e}")
    except Exception as e:
        raise HTTPException(500, f"خطأ في التحليل: {type(e).__name__}: {e}")

    set_ai_cache(body.account, kind, result)
    return {"data": result, "cached": False}


@router.get("/kinds")
def list_kinds():
    return VALID_KINDS
