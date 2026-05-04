import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models import IngestResponse
from db import upsert_tweets, get_accounts
from services.archive_parser import parse_archive

router = APIRouter()

_CHUNK = 4 * 1024 * 1024  # 4 MB chunks for faster processing


@router.post("/archive", response_model=IngestResponse)
async def ingest_archive(
    file: UploadFile = File(...),
    account: str = Form(""),
):
    if not account.strip():
        raise HTTPException(400, "اسم الحساب مطلوب")
    account = account.strip().lower()
    if not file.filename.endswith(".zip"):
        raise HTTPException(400, "الملف يجب أن يكون ZIP")

    # Stream upload to a temp file in chunks so we don't load 500MB into memory.
    fd, tmp_path = tempfile.mkstemp(suffix=".zip")
    try:
        with os.fdopen(fd, "wb") as out:
            while True:
                chunk = await file.read(_CHUNK)
                if not chunk:
                    break
                out.write(chunk)

        try:
            tweets, handle = parse_archive(tmp_path, account)
        except Exception as e:
            raise HTTPException(422, str(e))
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    if not tweets:
        raise HTTPException(422, "لم يتم العثور على تغريدات في الأرشيف")

    upsert_tweets(tweets, handle)

    return IngestResponse(account=handle, count=len(tweets), source="archive")


@router.get("/accounts")
def list_accounts():
    return get_accounts()
