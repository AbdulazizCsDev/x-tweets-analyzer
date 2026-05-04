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

            CREATE TABLE IF NOT EXISTS accounts (
                handle      TEXT PRIMARY KEY,
                source      TEXT,
                tweet_count INTEGER DEFAULT 0,
                imported_at TEXT DEFAULT (datetime('now'))
            );

            DROP TABLE IF EXISTS ai_cache;
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


init_db()
