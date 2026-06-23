import * as fs from 'fs';
import * as path from 'path';

let cachedHandbook: string | null = null;

let cachedCurriculum: string | null = null;

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

/**
 * Loads the official curriculum database from disk.
 * Caches the content in memory to avoid redundant disk reads across API requests.
 */
export function getAICurriculumContext(): string {
  if (cachedCurriculum) return cachedCurriculum;

  try {
    const filePath = path.join(process.cwd(), 'lib/ai/curriculum.md');
    cachedCurriculum = fs.readFileSync(filePath, 'utf-8');
    return cachedCurriculum;
  } catch (error) {
    console.error("[AI Curriculum Loader Error]:", error);
    return "Babcock University course catalog and curriculum information.";
  }
}
