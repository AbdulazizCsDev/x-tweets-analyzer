from fastapi import APIRouter, UploadFile, File, HTTPException
from models import ApifyRequest, IngestResponse
from db import upsert_tweets, get_accounts, invalidate_ai_cache
from services.archive_parser import parse_archive
from services.apify_client import fetch_tweets

router = APIRouter()


@router.post("/archive", response_model=IngestResponse)
async def ingest_archive(
    file: UploadFile = File(...),
    account: str = "unknown",
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(400, "الملف يجب أن يكون ZIP")

    content = await file.read()
    try:
        tweets, handle = parse_archive(content, account)
    except Exception as e:
        raise HTTPException(422, str(e))

    if not tweets:
        raise HTTPException(422, "لم يتم العثور على تغريدات في الأرشيف")

    upsert_tweets(tweets, handle)
    invalidate_ai_cache(handle)

    return IngestResponse(account=handle, count=len(tweets), source="archive")


@router.post("/apify", response_model=IngestResponse)
async def ingest_apify(body: ApifyRequest):
    try:
        tweets = fetch_tweets(body.username, body.apify_token, body.max_tweets)
    except Exception as e:
        raise HTTPException(422, str(e))

    if not tweets:
        raise HTTPException(422, "لم يتم العثور على تغريدات — تحقق من صحة اسم الحساب")

    upsert_tweets(tweets, body.username)
    invalidate_ai_cache(body.username)

    return IngestResponse(account=body.username, count=len(tweets), source="apify")


@router.get("/accounts")
def list_accounts():
    return get_accounts()
