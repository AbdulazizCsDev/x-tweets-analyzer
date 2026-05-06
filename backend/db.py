import os
import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path

_data_dir = Path(os.environ.get("DATA_DIR", str(Path(__file__).parent)))
_data_dir.mkdir(parents=True, exist_ok=True)
DB_PATH = _data_dir / "data.db"


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
        # Migrate: if session_id column is missing, recreate tables
        existing = {row[1] for row in conn.execute("PRAGMA table_info(tweets)").fetchall()}
        if "session_id" not in existing:
            conn.executescript("""
                DROP TABLE IF EXISTS tweets;
                DROP TABLE IF EXISTS accounts;
                DROP TABLE IF EXISTS ai_cache;
            """)
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS tweets (
                id          TEXT,
                account     TEXT,
                session_id  TEXT NOT NULL DEFAULT '',
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
                PRIMARY KEY (id, account, session_id)
            );

            CREATE TABLE IF NOT EXISTS accounts (
                handle      TEXT,
                session_id  TEXT NOT NULL DEFAULT '',
                source      TEXT,
                tweet_count INTEGER DEFAULT 0,
                imported_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (handle, session_id)
            );
        """)


def upsert_tweets(tweets: list[dict], account: str, session_id: str):
    with get_conn() as conn:
        conn.executemany("""
            INSERT OR REPLACE INTO tweets
                (id, account, session_id, text, created_at, likes, retweets, replies,
                 impressions, bookmarks, hashtags, mentions, has_media, lang)
            VALUES
                (:id, :account, :session_id, :text, :created_at, :likes, :retweets, :replies,
                 :impressions, :bookmarks, :hashtags, :mentions, :has_media, :lang)
        """, [
            {**t, "account": account, "session_id": session_id,
             "hashtags": json.dumps(t.get("hashtags", []), ensure_ascii=False),
             "mentions": json.dumps(t.get("mentions", []), ensure_ascii=False)}
            for t in tweets
        ])
        conn.execute("""
            INSERT OR REPLACE INTO accounts (handle, session_id, source, tweet_count, imported_at)
            VALUES (?, ?, ?, (SELECT COUNT(*) FROM tweets WHERE account=? AND session_id=?), datetime('now'))
        """, (account, session_id, tweets[0].get("source", "unknown") if tweets else "unknown", account, session_id))


def get_tweets(account: str, session_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM tweets WHERE account=? AND session_id=? ORDER BY created_at DESC",
            (account, session_id)
        ).fetchall()
    return [dict(r) for r in rows]


def delete_account(handle: str, session_id: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM accounts WHERE handle=? AND session_id=?", (handle, session_id))
        conn.execute("DELETE FROM tweets WHERE account=? AND session_id=?", (handle, session_id))


def get_accounts(session_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM accounts WHERE session_id=? ORDER BY imported_at DESC",
            (session_id,)
        ).fetchall()
    return [dict(r) for r in rows]


init_db()
