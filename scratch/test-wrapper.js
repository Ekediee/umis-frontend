require('dotenv').config();
const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');

function createLiveGeminiStream(textStream) {
  return new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const textId = `live-text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const startChunk = JSON.stringify({ type: 'text-start', id: textId });
      controller.enqueue(enc.encode(`data: ${startChunk}\n\n`));
      try {
        for await (const textDelta of textStream) {
          if (!textDelta) continue;
          const deltaChunk = JSON.stringify({ type: 'text-delta', id: textId, delta: textDelta });
          controller.enqueue(enc.encode(`data: ${deltaChunk}\n\n`));
        }
      } catch (error) {
        console.warn("[Gemini Live Stream Error]:", error.message);
      }
      const endChunk = JSON.stringify({ type: 'text-end', id: textId });
      controller.enqueue(enc.encode(`data: ${endChunk}\n\n`));
      controller.close();
    }
  });
}

async function test() {
  const model = google('gemini-2.5-flash');
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: 'Say hello in 1 word' }],
  });
  
  const stream = createLiveGeminiStream(result.textStream);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) console.log(decoder.decode(value));
  }
}
test();
