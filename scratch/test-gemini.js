require('dotenv').config();
const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log('API Key loaded:', apiKey ? apiKey.slice(0, 10) + '...' : 'NONE');

  if (!apiKey) {
    console.log('No API key found in .env');
    return;
  }

  try {
    const model = google('gemini-2.5-flash');
    console.log('Testing gemini-2.5-flash...');
    const result = await generateText({
      model,
      prompt: 'Reply with exactly one word: working',
    });
    console.log('Success! Response:', result.text);
  } catch (err) {
    console.error('Error occurred:', err.message);
  }
}

test();
