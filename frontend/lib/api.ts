import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// For direct uploads (bypasses Next.js proxy size limit)
const DIRECT_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const uploadApi = DIRECT_BACKEND
  ? axios.create({ baseURL: `${DIRECT_BACKEND}/api` })
  : api;

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
  account: string
): Promise<IngestResponse> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("account", account);
  const { data } = await uploadApi.post<IngestResponse>("/ingest/archive", fd);
  return data;
}

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
