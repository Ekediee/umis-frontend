require('dotenv').config();
const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  const model = google('gemini-3.5-flash');
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: 'Say hello world in 2 words' }],
  });
  
  const response = result.toUIMessageStreamResponse();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let done = false;
  while (!done) {
    const { value, readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      console.log(decoder.decode(value, { stream: true }));
    }
  }
}
test().catch(console.error);
