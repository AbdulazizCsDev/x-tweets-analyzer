from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingest, analytics, ai

app = FastAPI(title="X Tweets Analyzer API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router,    prefix="/api/ingest",    tags=["ingest"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai.router,        prefix="/api/ai",        tags=["ai"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
