require('dotenv').config();
const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  const model = google('gemini-2.5-flash');
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: 'Say hi' }],
  });
  
  const response = result.toTextStreamResponse();
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
}
test().catch(console.error);
