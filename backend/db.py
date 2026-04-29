import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "data.db"


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS tweets (
                id          TEXT,
                account     TEXT,
                text        TEXT,
                created_at  TEXT,
                likes       INTEGER DEFAULT 0,
                retweets    INTEGER DEFAULT 0,
                replies     INTEGER DEFAULT 0,
                impressions INTEGER DEFAULT 0,
                bookmarks   INTEGER DEFAULT 0,
                hashtags    TEXT DEFAULT '[]',
                mentions    TEXT DEFAULT '[]',
                has_media   INTEGER DEFAULT 0,
                lang        TEXT DEFAULT '',
                PRIMARY KEY (id, account)
            );

            CREATE TABLE IF NOT EXISTS ai_cache (
                account     TEXT,
                kind        TEXT,
                payload     TEXT,
                created_at  TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (account, kind)
            );

            CREATE TABLE IF NOT EXISTS accounts (
                handle      TEXT PRIMARY KEY,
                source      TEXT,
                tweet_count INTEGER DEFAULT 0,
                imported_at TEXT DEFAULT (datetime('now'))
            );
        """)


def upsert_tweets(tweets: list[dict], account: str):
    with get_conn() as conn:
        conn.executemany("""
            INSERT OR REPLACE INTO tweets
                (id, account, text, created_at, likes, retweets, replies,
                 impressions, bookmarks, hashtags, mentions, has_media, lang)
            VALUES
                (:id, :account, :text, :created_at, :likes, :retweets, :replies,
                 :impressions, :bookmarks, :hashtags, :mentions, :has_media, :lang)
        """, [
            {**t, "account": account,
             "hashtags": json.dumps(t.get("hashtags", []), ensure_ascii=False),
             "mentions": json.dumps(t.get("mentions", []), ensure_ascii=False)}
            for t in tweets
        ])
        conn.execute("""
            INSERT OR REPLACE INTO accounts (handle, source, tweet_count, imported_at)
            VALUES (?, ?, (SELECT COUNT(*) FROM tweets WHERE account=?), datetime('now'))
        """, (account, tweets[0].get("source", "unknown") if tweets else "unknown", account))


def get_tweets(account: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM tweets WHERE account=? ORDER BY created_at DESC",
            (account,)
        ).fetchall()
    return [dict(r) for r in rows]


def get_accounts() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM accounts ORDER BY imported_at DESC").fetchall()
    return [dict(r) for r in rows]


def get_ai_cache(account: str, kind: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT payload FROM ai_cache WHERE account=? AND kind=?",
            (account, kind)
        ).fetchone()
    return json.loads(row["payload"]) if row else None


def set_ai_cache(account: str, kind: str, payload: dict):
    with get_conn() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO ai_cache (account, kind, payload, created_at)
            VALUES (?, ?, ?, datetime('now'))
        """, (account, kind, json.dumps(payload, ensure_ascii=False)))


def invalidate_ai_cache(account: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM ai_cache WHERE account=?", (account,))


init_db()
