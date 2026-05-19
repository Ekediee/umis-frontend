import { get, set, del } from 'idb-keyval';

export const OFFLINE_COURSE_CART_KEY = 'offline-course-cart';

export async function saveOfflineDraft<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, data);
    console.log(`[OfflineStorage] Saved draft for ${key}`);
  } catch (error) {
    console.error(`[OfflineStorage] Failed to save draft for ${key}:`, error);
  }
}

export async function getOfflineDraft<T>(key: string): Promise<T | undefined> {
  try {
    const data = await get<T>(key);
    console.log(`[OfflineStorage] Retrieved draft for ${key}`);
    return data;
  } catch (error) {
    console.error(`[OfflineStorage] Failed to retrieve draft for ${key}:`, error);
    return undefined;
  }
}

export async function clearOfflineDraft(key: string): Promise<void> {
  try {
    await del(key);
    console.log(`[OfflineStorage] Cleared draft for ${key}`);
  } catch (error) {
    console.error(`[OfflineStorage] Failed to clear draft for ${key}:`, error);
  }
}
