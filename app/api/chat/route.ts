import { streamText } from 'ai';
import { withLogging } from '@/lib/logger';
import { getAIHandbookContext } from '../../../lib/ai/handbook-loader';

// Safely attempt to load the Google AI provider dynamically
let googleProvider: any = null;
try {
  const { google } = require('@ai-sdk/google');
  googleProvider = google;
} catch (e) {
  console.warn("[Gemini Integration] @ai-sdk/google is not available. Running in demo mode.");
}

// Stream live Gemini text deltas as raw, unencoded text chunks
function createLiveRawTextStream(textStream: AsyncIterable<string>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const textDelta of textStream) {
          if (textDelta) {
            controller.enqueue(enc.encode(textDelta));
          }
        }
      } catch (error: any) {
        console.warn("[Gemini Live Stream Error]:", error?.message ?? error);
        const errMsg = error?.message || String(error);
        controller.enqueue(enc.encode(`\n\n*(Error: ${errMsg})*`));
      }
      controller.close();
    }
  });
}

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

  // Attempt live Gemini stream if provider + key are available
  if (googleProvider && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const handbookContext = getAIHandbookContext();

      const result = await streamText({
        model: googleProvider('gemini-2.5-flash'),
        messages,
        system: `You are the Babcock University Student Portal AI Support Agent (Pulse).
Your job is to assist students with 100% accuracy. Always prioritize the official portal knowledge base and university guidelines provided below. 

Tone: Highly professional, empathetic, clear, and direct. Keep your answers reasonably concise since this is a chat bubble layout.
If the student's question is not directly covered in the provided guidelines, use your own broad AI knowledge to answer the query as helpfully as possible, while keeping the response tailored to a university student context.

---
OFFICIAL UNIVERSITY PORTAL & FAQ KNOWLEDGE BASE:
${handbookContext}
---`,
      });

      return new Response(createLiveRawTextStream(result.textStream as unknown as AsyncIterable<string>), {
        headers: RAW_STREAM_HEADERS,
      });
    } catch (error: any) {
      console.warn("[Gemini AI - Offline fallback]:", error?.message ?? error);
      const errMsg = error?.message || String(error);
      const errorResponse = `I encountered an error trying to reach my live AI model:\n\n**Error:** ${errMsg}\n\nPlease check your API key, network connection, or quota.`;
      return new Response(createOfflineRawTextStream(errorResponse), {
        headers: RAW_STREAM_HEADERS,
      });
    }
  }

  // Offline/Demo fallback mode
  const demoText = "Hello! I am your Babcock Pulse Support Agent. I am currently running in demo mode because this environment cannot reach Google's servers or no API key is provided. Once deployed online with a valid API key, I will be fully powered by Gemini. How can I help you with registration, fees, or academic matters?";

  return new Response(createOfflineRawTextStream(demoText), {
    headers: RAW_STREAM_HEADERS,
  });
});
