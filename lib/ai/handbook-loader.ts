import * as fs from 'fs';
import * as path from 'path';

let cachedHandbook: string | null = null;

/**
 * Loads the official student handbook knowledge base from disk.
 * Caches the content in memory to avoid redundant disk reads across API requests.
 */
export function getAIHandbookContext(): string {
  if (cachedHandbook) return cachedHandbook;

  try {
    const filePath = path.join(process.cwd(), 'lib/ai/pulse_handbook.md');
    cachedHandbook = fs.readFileSync(filePath, 'utf-8');
    return cachedHandbook;
  } catch (error) {
    console.error("[AI Handbook Loader Error]:", error);
    return "Official Babcock University Student Portal guidelines and common student FAQs.";
  }
}
