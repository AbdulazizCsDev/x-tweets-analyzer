import axios from "axios";
import { parseArchiveInBrowser, type ProgressUpdate } from "./archive-parser";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("x_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("x_session_id", sid);
  }
  return sid;
}

// In production set NEXT_PUBLIC_BACKEND_URL on Vercel to the Railway backend URL
// (e.g. https://x-analyzer-api.up.railway.app). The browser then talks
// directly to Railway, bypassing Vercel's 60s proxy timeout — important
// because AI insight calls can take 90–180s — and also avoids the proxy's
// upload size limit.
const DIRECT_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const API_BASE = DIRECT_BACKEND ? `${DIRECT_BACKEND}/api` : "/api";

const api = axios.create({ baseURL: API_BASE, timeout: 300_000 });
api.interceptors.request.use((config) => {
  config.headers["x-session-id"] = getSessionId();
  return config;
});

export interface IngestResponse {
  account: string;
  count: number;
  source: string;
}

export interface Account {
  handle: string;
  source: string;
  tweet_count: number;
  imported_at: string;
}

export async function uploadArchive(
  file: File,
  account: string,
  onProgress?: (p: ProgressUpdate) => void
): Promise<IngestResponse> {
  // Parse the archive in the browser so we never upload a multi-GB ZIP.
  // The user's media stays on their machine; only normalised tweet JSON
  // (a few MB at most) is sent to the backend.
  const tweets = await parseArchiveInBrowser(file, onProgress);
  const { data } = await api.post<IngestResponse>("/ingest/tweets", {
    account,
    tweets,
  });
  return data;
}

export type { ProgressUpdate } from "./archive-parser";

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>("/ingest/accounts");
  return data;
}

export async function getAnalytics(account: string) {
  const { data } = await api.get(`/analytics/${account}`);
  return data;
}

export async function chatWithAI(
  account: string,
  message: string,
  anthropicKey: string
): Promise<{ answer: string }> {
  const { data } = await api.post<{ answer: string }>("/ai/chat", {
    account,
    anthropic_key: anthropicKey,
    message,
  });
  return data;
}

export async function getAIInsight(
  account: string,
  kind: string,
  anthropicKey: string
) {
  const { data } = await api.post(`/ai/${kind}`, {
    account,
    anthropic_key: anthropicKey,
  });
  return data;
}
