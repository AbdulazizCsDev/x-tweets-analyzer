// Client-side X archive parser.
//
// X archive ZIPs can be 1–5 GB because of media files, but the actual tweets
// live in a small set of JS files: data/tweets.js, data/tweets-part1.js, etc.
// We extract just those, parse them in the browser, and ship a tiny JSON
// payload to the backend — the user's archive never leaves their machine.
//
// Mirrors backend/services/archive_parser.py so analytics stay identical.

import JSZip from "jszip";

export interface NormalizedTweet {
  id: string;
  text: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  bookmarks: number;
  hashtags: string[];
  mentions: string[];
  has_media: boolean;
  lang: string;
  source: string;
}

const TWEETS_FILE_RE = /(?:^|\/)tweets(?:-part\d+)?\.js$/i;

// X stores dates like "Wed Mar 15 12:34:56 +0000 2023" — convert to ISO UTC.
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(raw: string): string {
  // "Wed Mar 15 12:34:56 +0000 2023"
  const m = raw.match(/^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})\s+(\d{4})$/);
  if (!m) return raw;
  const [, mon, day, hh, mm, ss, tz, year] = m;
  const month = MONTHS[mon];
  if (month === undefined) return raw;
  const tzMin = (parseInt(tz.slice(1, 3)) * 60 + parseInt(tz.slice(3))) * (tz[0] === "-" ? -1 : 1);
  const utc = Date.UTC(+year, month, +day, +hh, +mm, +ss) - tzMin * 60_000;
  return new Date(utc).toISOString();
}

function jsToJson(raw: string): unknown[] {
  // Strip the JS assignment prefix: window.YTD.tweets.partN = [...]
  const idx = raw.indexOf("=");
  if (idx < 0) throw new Error("تنسيق tweets.js غير متوقع");
  const arrayStart = raw.indexOf("[", idx);
  if (arrayStart < 0) throw new Error("تنسيق tweets.js غير متوقع");
  return JSON.parse(raw.slice(arrayStart));
}

function normalize(item: Record<string, unknown>): NormalizedTweet {
  const t = (item.tweet as Record<string, unknown>) ?? item;

  // Long tweets (>280 chars) store full content in noteTweet
  const note = (t.noteTweet as { core?: { text?: string } })?.core ?? {};
  const noteFallback = (t.note_tweet as { text?: string })?.text;
  const fullText =
    note.text ??
    noteFallback ??
    (t.full_text as string) ??
    (t.text as string) ??
    "";

  const entities = (t.entities as Record<string, unknown>) ?? {};
  const extEntities = (t.extended_entities as Record<string, unknown>) ?? {};

  const hashtags = ((entities.hashtags as { text: string }[]) ?? [])
    .map((h) => (h.text || "").toLowerCase());
  const mentions = ((entities.user_mentions as { screen_name: string }[]) ?? [])
    .map((m) => (m.screen_name || "").toLowerCase());
  const hasMedia = Boolean(extEntities.media || entities.media);

  return {
    id:          (t.id_str as string) || String(t.id ?? ""),
    text:        fullText,
    created_at:  parseDate((t.created_at as string) ?? ""),
    likes:       Number(t.favorite_count ?? 0) | 0,
    retweets:    Number(t.retweet_count  ?? 0) | 0,
    replies:     Number(t.reply_count    ?? 0) | 0,
    impressions: 0,
    bookmarks:   Number(t.bookmark_count ?? 0) | 0,
    hashtags,
    mentions,
    has_media:   hasMedia,
    lang:        (t.lang as string) ?? "",
    source:      "archive",
  };
}

export interface ProgressUpdate {
  phase: "reading" | "extracting" | "parsing" | "done";
  filesDone: number;
  filesTotal: number;
}

export async function parseArchiveInBrowser(
  file: File,
  onProgress?: (p: ProgressUpdate) => void
): Promise<NormalizedTweet[]> {
  onProgress?.({ phase: "reading", filesDone: 0, filesTotal: 1 });

  // Read the bytes ourselves rather than letting JSZip hold the File reference.
  // Some browsers (esp. when the file lives on a cloud-synced folder like
  // OneDrive/iCloud) throw NotReadableError if the underlying file changes
  // between selection and read. Surfacing a clear, actionable message helps.
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new Error(
      "تعذّر قراءة الملف. قد يكون الملف قد نُقل أو عُدّل — الرجاء إعادة اختياره من جديد."
    );
  }

  const zip = await JSZip.loadAsync(buffer);
  const tweetFiles = Object.keys(zip.files)
    .filter((name) => TWEETS_FILE_RE.test(name))
    .sort();

  if (tweetFiles.length === 0) {
    throw new Error("لم يتم العثور على ملف tweets.js داخل الأرشيف");
  }

  const total = tweetFiles.length;
  const allItems: unknown[] = [];

  for (let i = 0; i < tweetFiles.length; i++) {
    onProgress?.({ phase: "extracting", filesDone: i, filesTotal: total });
    const raw = await zip.files[tweetFiles[i]].async("string");
    onProgress?.({ phase: "parsing", filesDone: i, filesTotal: total });
    try {
      const items = jsToJson(raw);
      allItems.push(...items);
    } catch {
      // Skip files we can't parse — archives sometimes have stub files
    }
  }

  if (allItems.length === 0) {
    throw new Error("الأرشيف لا يحتوي على تغريدات قابلة للقراءة");
  }

  // Filter retweets and dedupe by id (mirror of the Python logic)
  const seen = new Set<string>();
  const unique: NormalizedTweet[] = [];
  for (const raw of allItems) {
    const t = normalize(raw as Record<string, unknown>);
    if (!t.id || seen.has(t.id)) continue;
    if (t.text.startsWith("RT @")) continue;
    seen.add(t.id);
    unique.push(t);
  }

  onProgress?.({ phase: "done", filesDone: total, filesTotal: total });
  return unique;
}
