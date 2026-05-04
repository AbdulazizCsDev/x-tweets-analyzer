import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingest, analytics, ai
from db import init_db

app = FastAPI(title="X Tweets Analyzer API", version="2.0.0")

init_db()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router,    prefix="/api/ingest",    tags=["ingest"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai.router,        prefix="/api/ai",        tags=["ai"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
