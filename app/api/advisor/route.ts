import { streamText } from 'ai';
import { withLogging } from '@/lib/logger';

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
      const result = await streamText({
        model: googleProvider('gemini-3.5-flash'),
        messages,
        system: `You are the Babcock University AI Course Advisor. 
Your goal is to analyze the student's selected courses and overall academic status (e.g. CGPA, credit units) to:
1. Advise on optimizing their GPA.
2. Flag potential prerequisite issues (e.g., remind them that 300L courses require 200L foundational courses).
3. Ensure they do not exceed the 23-unit limit per semester.
4. Recommend matching electives that balance their workload.
5. Provide a realistic and encouraging roadmap to graduate on time.

Format your output neatly using Markdown. Use clear headings, bullet points, and bold text to emphasize actions.`,
      });

      return new Response(createLiveRawTextStream(result.textStream as unknown as AsyncIterable<string>), {
        headers: RAW_STREAM_HEADERS,
      });
    } catch (error: any) {
      console.warn("[Gemini Advisor - Offline fallback]:", error?.message ?? error);
      const errMsg = error?.message || String(error);
      const errorResponse = `I encountered an error trying to reach my live AI model:\n\n**Error:** ${errMsg}\n\nPlease check your API key, network connection, or quota.`;
      return new Response(createOfflineRawTextStream(errorResponse), {
        headers: RAW_STREAM_HEADERS,
      });
    }
  }

  // Offline/Demo fallback mode
  const demoText = `Based on your academic profile, here is my analysis:

**GPA Optimization:** Your current CGPA is 3.67. To reach a First Class (4.50+), you need to achieve an average of 4.80 over your remaining semesters. Focus on high-unit core courses this semester.

**Prerequisite Warnings:** 
- *Database Systems (COSC 311)* requires *Data Structures (COSC 211)*. You are cleared!
- *Software Engineering II (COSC 314)* requires *Software Engineering I (COSC 313)*. You are cleared!

**Recommended Electives:**
1. *Web Development (COSC 321)* - Strong grade averages and pairs well with your software engineering goals.
2. *Cloud Computing (COSC 331)* - Valuable skill, but heavier workload.

**Optimal Path for On-Time Graduation:** 
Stick to the 21-unit maximum this semester. I strongly recommend dropping one elective to avoid overload during core courses.

> Note: Running in demo mode. Deploy online with a valid Gemini API key for live academic AI analysis.`;

  return new Response(createOfflineRawTextStream(demoText), {
    headers: RAW_STREAM_HEADERS,
  });
});
