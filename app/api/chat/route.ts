import { streamText, type LanguageModel } from 'ai';
import { google } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { chatModels, NVIDIA_BASE_URL, PROVIDER_OPTIONS, type ChatProvider } from '@/lib/ai/chat-models';
import { withLogging } from '@/lib/logger';
import { getAIHandbookContext } from '../../../lib/ai/handbook-loader';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// One provider per API; lib/ai/chat-models.ts decides which models to try and in what order
const PROVIDERS: Record<ChatProvider, (id: string) => LanguageModel> = {
  google: (id) => google(id),
  nvidia: (id) => nvidia(id),
};
const nvidia = createOpenAICompatible({
  name: 'nvidia',
  baseURL: NVIDIA_BASE_URL,
  apiKey: process.env.NVIDIA_API_KEY,
});

// Stream simulated text for offline/demo fallback
function createOfflineRawTextStream(text: string, delayMs = 15): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const words = text.split(' ');
      for (const word of words) {
        await new Promise(r => setTimeout(r, delayMs));
        controller.enqueue(enc.encode(word + ' '));
      }
      controller.close();
    }
  });
}

const RAW_STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'x-accel-buffering': 'no',
};

const CHAT_MODELS = chatModels();

// Give up on a model that hasn't started answering by then
const FIRST_TEXT_TIMEOUT_MS = 20_000;

type StreamPart = { type: string; text?: string; error?: unknown };

/**
 * Starts the model and waits for its first words. Resolves with a stream of the
 * answer text (the first words included), or throws if the model fails or stalls
 * first, so the caller can move on to the next model.
 */
async function startAnswer(fullStream: AsyncIterable<StreamPart>, abort: AbortController): Promise<ReadableStream> {
  const parts = fullStream[Symbol.asyncIterator]();
  const timer = setTimeout(() => abort.abort(new Error('No answer within the time limit')), FIRST_TEXT_TIMEOUT_MS);
  let first: string;
  try {
    for (;;) {
      const { value, done } = await parts.next();
      if (done) throw new Error('The model returned no answer');
      if (value.type === 'error') throw value.error instanceof Error ? value.error : new Error(String(value.error));
      if (value.type === 'text-delta' && value.text) {
        first = value.text;
        break;
      }
      // reasoning and step markers: keep waiting for the answer itself
    }
  } finally {
    clearTimeout(timer);
  }

  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(first));
      try {
        for (;;) {
          const { value, done } = await parts.next();
          if (done) break;
          if (value.type === 'text-delta' && value.text) controller.enqueue(enc.encode(value.text));
          if (value.type === 'error') throw value.error;
        }
      } catch (error) {
        // Already answering, so it's too late to switch models: say the reply was cut short
        console.warn('[AI chat] Stream broke mid-answer:', error instanceof Error ? error.message : error);
        controller.enqueue(enc.encode('\n\n*(The reply was cut short. Please ask again.)*'));
      }
      controller.close();
    },
  });
}

export const POST = withLogging(async function POST(req: Request) {
  const body = await req.json();
  const rawMessages = body?.messages ?? [];

  // Convert raw message structures into a clean role-content map for streamText
  const messages = Array.isArray(rawMessages)
    ? rawMessages.map((m: any) => ({
        role: m.role ?? 'user',
        content: typeof m.content === 'string' ? m.content : '',
      }))
    : [];

  // Live answer when at least one model has its API key
  if (CHAT_MODELS.length > 0) {
    const handbookContext = getAIHandbookContext();
    const system = `You are the Babcock University Student Portal AI Support Agent (Pulse).
Your job is to assist students with 100% accuracy. Always prioritize the official portal knowledge base and university guidelines provided below. 

Tone: Highly professional, empathetic, clear, and direct. Keep your answers reasonably concise since this is a chat bubble layout.
If the student's question is not directly covered in the provided guidelines, use your own broad AI knowledge to answer the query as helpfully as possible, while keeping the response tailored to a university student context.

---
OFFICIAL UNIVERSITY PORTAL & FAQ KNOWLEDGE BASE:
${handbookContext}
---`;

    let lastError: unknown = null;
    for (const [i, spec] of CHAT_MODELS.entries()) {
      const abort = new AbortController();
      // Retrying a failing model only delays the student when another model is waiting
      const isLast = i === CHAT_MODELS.length - 1;
      // Some failures end the stream without an error part; keep the real reason for the log
      let reported: unknown = null;
      try {
        const result = streamText({
          model: PROVIDERS[spec.provider](spec.id),
          providerOptions: PROVIDER_OPTIONS[spec.provider] as Parameters<typeof streamText>[0]['providerOptions'],
          messages,
          system,
          maxRetries: isLast ? 2 : 0,
          abortSignal: abort.signal,
          onError: ({ error }) => {
            reported = error;
          },
        });
        const answer = await startAnswer(result.fullStream as AsyncIterable<StreamPart>, abort);
        return new Response(answer, { headers: { ...RAW_STREAM_HEADERS, 'x-ai-model': spec.label } });
      } catch (error) {
        abort.abort();
        lastError = reported ?? error;
        console.warn(`[AI chat] ${spec.label} failed, trying the next model:`, lastError instanceof Error ? lastError.message : lastError);
      }
    }

    const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
    const errorResponse = `I encountered an error trying to reach my live AI model:

**Error:** ${errMsg}

Please check your API key, network connection, or quota.`;
    return new Response(createOfflineRawTextStream(errorResponse), {
      headers: RAW_STREAM_HEADERS,
    });
  }

  // Offline/Demo fallback mode
  const demoText = "Hello! I am your Babcock Pulse Support Agent. I am currently running in demo mode because this environment cannot reach Google's servers or no API key is provided. Once deployed online with a valid API key, I will be fully powered by Gemini. How can I help you with registration, fees, or academic matters?";

  return new Response(createOfflineRawTextStream(demoText), {
    headers: RAW_STREAM_HEADERS,
  });
});
