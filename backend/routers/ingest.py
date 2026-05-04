from fastapi import APIRouter, Header, HTTPException
from models import IngestResponse, IngestTweetsRequest
from db import upsert_tweets, get_accounts

router = APIRouter()


@router.post("/tweets", response_model=IngestResponse)
def ingest_tweets(body: IngestTweetsRequest, x_session_id: str = Header("")):
    """Accept tweets that the browser already parsed out of the X archive.

    The original archive can be 1–5 GB (mostly media); shipping it through
    Railway's HTTP edge fails. The browser opens the ZIP, extracts just the
    tweets-*.js entries, normalises them, and POSTs that small JSON here.
    """
    if not body.account.strip():
        raise HTTPException(400, "اسم الحساب مطلوب")
    if not x_session_id.strip():
        raise HTTPException(400, "session_id مطلوب")
    if not body.tweets:
        raise HTTPException(422, "لم يتم العثور على تغريدات في الأرشيف")

    handle = body.account.strip().lower()
    upsert_tweets(body.tweets, handle, x_session_id)
    return IngestResponse(account=handle, count=len(body.tweets), source="archive")


@router.get("/accounts")
def list_accounts(x_session_id: str = Header("")):
    return get_accounts(x_session_id)
