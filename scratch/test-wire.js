require('dotenv').config();
const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  const model = google('gemini-3.5-flash');
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: 'test' }],
  });
  
  const response = result.toUIMessageStreamResponse();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      console.log(decoder.decode(value, { stream: true }));
    }
  }
}
test();
