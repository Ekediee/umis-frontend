/**
 * Which models the AI chat tries, in order, and how to reach each one.
 *
 * A model is written "provider:model-id". A bare id means Google, so
 * "gemini-3.5-flash-lite" and "google:gemini-3.5-flash-lite" are the same.
 *
 *   google:<id>   Gemini API, needs GOOGLE_GENERATIVE_AI_API_KEY
 *   nvidia:<id>   NVIDIA API (build.nvidia.com, OpenAI-compatible), needs NVIDIA_API_KEY
 *
 * Defaults: Gemini first, NVIDIA as the backup. AI_CHAT_MODEL and
 * AI_CHAT_FALLBACK_MODEL override them. Models whose key is missing are skipped.
 */

export type ChatProvider = "google" | "nvidia";

export interface ChatModelSpec {
  provider: ChatProvider;
  id: string;
  /** "provider:id", as shown in logs and the x-ai-model header */
  label: string;
}

export const DEFAULT_PRIMARY = "google:gemini-3.5-flash-lite";
// Fastest NVIDIA model in testing (~1 s to the first words with thinking off)
export const DEFAULT_FALLBACK = "nvidia:nvidia/nemotron-3.5-lightning-30b-a3b";

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

/**
 * Request options per provider. Nemotron models "think" before answering by default,
 * which delayed the first words by 15 s to over 40 s; with thinking off they start in ~1 s.
 */
export const PROVIDER_OPTIONS: Record<ChatProvider, Record<string, Record<string, unknown>> | undefined> = {
  google: undefined,
  nvidia: { nvidia: { chat_template_kwargs: { enable_thinking: false, thinking: false } } },
};

const KEY_FOR: Record<ChatProvider, string> = {
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  nvidia: "NVIDIA_API_KEY",
};

export function parseChatModel(raw: string): ChatModelSpec | null {
  const value = raw.trim();
  if (!value) return null;
  const match = /^(google|nvidia):(.*)$/.exec(value);
  const provider: ChatProvider = match ? (match[1] as ChatProvider) : "google";
  const id = (match ? match[2] : value).trim();
  return id ? { provider, id, label: `${provider}:${id}` } : null;
}

/** The models to try, in order, leaving out duplicates and any without a key */
export function chatModels(env: Record<string, string | undefined> = process.env): ChatModelSpec[] {
  const wanted = [env.AI_CHAT_MODEL || DEFAULT_PRIMARY, env.AI_CHAT_FALLBACK_MODEL ?? DEFAULT_FALLBACK];
  const out: ChatModelSpec[] = [];
  for (const raw of wanted) {
    const spec = raw ? parseChatModel(raw) : null;
    if (!spec || !env[KEY_FOR[spec.provider]]) continue;
    if (!out.some((m) => m.label === spec.label)) out.push(spec);
  }
  return out;
}
