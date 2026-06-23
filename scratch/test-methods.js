require('dotenv').config();
const { streamText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return console.log('No key');
  
  const model = google('gemini-3.5-flash');
  const result = await streamText({
    model,
    messages: [{ role: 'user', content: 'test' }],
  });
  
  console.log('Result keys:', Object.keys(result));
  console.log('Is toDataStreamResponse a function?', typeof result.toDataStreamResponse);
  console.log('Is toUIMessageStreamResponse a function?', typeof result.toUIMessageStreamResponse);
  console.log('Is toTextStreamResponse a function?', typeof result.toTextStreamResponse);
  console.log('Is toAIStreamResponse a function?', typeof result.toAIStreamResponse);
}
test();
