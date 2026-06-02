/**
 * Diagnostic endpoint: GET /api/check-ai
 * Tests connectivity to Google Gemini and validates the API key.
 * Visit http://localhost:3000/api/check-ai in your browser to see results.
 */
import { withLogging, loggedFetch } from "@/lib/logger";

export const GET = withLogging(async function GET(req: Request) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    envKey: {
      GOOGLE_GENERATION_API_KEY: !!process.env.GOOGLE_GENERATION_API_KEY,
      GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      effectiveKey: (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATION_API_KEY)?.slice(0, 12) + '...' || 'MISSING',
    },
    packageAvailable: false,
    networkReachable: false,
    apiKeyValid: false,
    error: null as string | null,
    recommendation: '',
  };

  // 1. Check if @ai-sdk/google is available
  let googleProvider: any = null;
  try {
    const { google } = require('@ai-sdk/google');
    googleProvider = google;
    results.packageAvailable = true;
  } catch {
    results.recommendation = 'Run: npm install @ai-sdk/google';
    return Response.json(results);
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATION_API_KEY;
  if (!apiKey) {
    results.recommendation = 'Add GOOGLE_GENERATIVE_AI_API_KEY to your .env file. Get a key at https://aistudio.google.com/app/apikey';
    return Response.json(results);
  }

  // 2. Check raw network connectivity to Google APIs
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await loggedFetch('https://generativelanguage.googleapis.com/', { signal: ctrl.signal });
    clearTimeout(timeout);
    results.networkReachable = true;
    results.httpStatus = res.status;
  } catch (err: any) {
    results.networkReachable = false;
    results.networkError = err?.message ?? String(err);
    results.recommendation = 'Your machine cannot reach generativelanguage.googleapis.com. Check your internet connection or firewall settings. Your API key may still be valid — test it at https://aistudio.google.com/app/apikey';
    return Response.json(results);
  }

  // 3. Validate the API key with a minimal Gemini call
  try {
    // Set the env key the SDK expects
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;

    const { generateText } = require('ai');
    const model = googleProvider('gemini-2.5-flash');
    const result = await generateText({ model, prompt: 'Reply with exactly one word: working' });
    results.apiKeyValid = true;
    results.testResponse = result.text?.trim();
    results.recommendation = 'Everything is working! Your API key is valid and Google servers are reachable.';
  } catch (err: any) {
    results.apiKeyValid = false;
    results.apiError = err?.message ?? String(err);

    if (err?.message?.includes('API key')) {
      results.recommendation = 'Your API key is invalid or expired. Get a new free key at https://aistudio.google.com/app/apikey — it takes less than 30 seconds.';
    } else if (err?.message?.includes('quota') || err?.message?.includes('429')) {
      results.recommendation = 'You have exceeded your API quota. Check your usage at https://console.cloud.google.com or get a new key at https://aistudio.google.com/app/apikey';
    } else {
      results.recommendation = 'Unknown API error. Try getting a new key at https://aistudio.google.com/app/apikey';
    }
  }

  return Response.json(results, {
    headers: { 'Content-Type': 'application/json' },
  });
});
