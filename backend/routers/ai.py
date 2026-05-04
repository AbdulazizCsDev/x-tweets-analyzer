from fastapi import APIRouter, HTTPException
import anthropic
import traceback
from models import AIInsightRequest, ChatRequest
from db import get_tweets
from services import claude_service

router = APIRouter()

VALID_KINDS = list(claude_service.KIND_MAP.keys())


@router.get("/kinds")
def list_kinds():
    return VALID_KINDS


# /chat must be defined BEFORE /{kind} — FastAPI matches routes in order
# and /{kind} would swallow /chat if it came first.
@router.post("/chat")
def chat_endpoint(body: ChatRequest):
    if not body.message.strip():
        raise HTTPException(400, "الرسالة فارغة")

    tweets = get_tweets(body.account)
    if not tweets:
        raise HTTPException(404, f"لا توجد بيانات للحساب: {body.account}")

    try:
        return claude_service.chat(tweets, body.message, body.anthropic_key)
    except anthropic.AuthenticationError:
        raise HTTPException(401, "مفتاح Anthropic غير صحيح — تحقق من sk-ant-...")
    except anthropic.RateLimitError:
        raise HTTPException(429, "تجاوزت حد الاستخدام في Anthropic — انتظر قليلاً وأعد المحاولة")
    except anthropic.APIStatusError as e:
        traceback.print_exc()
        raise HTTPException(e.status_code or 502, f"Claude API {e.status_code}: {e.message}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"{type(e).__name__}: {e}")


@router.post("/{kind}")
def get_insight(kind: str, body: AIInsightRequest):
    if kind not in VALID_KINDS:
        raise HTTPException(400, f"kind غير صالح. الخيارات: {VALID_KINDS}")

    tweets = get_tweets(body.account)
    if not tweets:
        raise HTTPException(404, f"لا توجد بيانات للحساب: {body.account}")

    try:
        fn = claude_service.KIND_MAP[kind]
        result = fn(tweets, body.anthropic_key)
    except anthropic.AuthenticationError:
        raise HTTPException(401, "مفتاح Anthropic غير صحيح — تحقق من sk-ant-...")
    except anthropic.RateLimitError:
        raise HTTPException(429, "تجاوزت حد الاستخدام في Anthropic — انتظر قليلاً وأعد المحاولة")
    except anthropic.APIStatusError as e:
        traceback.print_exc()
        raise HTTPException(e.status_code or 502, f"Claude API {e.status_code}: {e.message}")
    except anthropic.APIError as e:
        traceback.print_exc()
        raise HTTPException(502, f"Claude API: {e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"{type(e).__name__}: {e}")

    return {"data": result}
