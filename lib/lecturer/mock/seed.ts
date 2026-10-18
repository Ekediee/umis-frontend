/**
 * Deterministic generators for mock data. Same seed → same students on server
 * and client, so nothing shifts between renders or reloads.
 */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof mulberry32>;

export const pick = <T,>(rng: Rng, list: readonly T[]) => list[Math.floor(rng() * list.length)];
export const int = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const chance = (rng: Rng, p: number) => rng() < p;

export const FIRST_NAMES = [
  "Adaeze", "Tobi", "Chinedu", "Funmilayo", "Ifeoluwa", "Emeka", "Zainab", "Oluwaseun", "Ngozi", "Damilola",
  "Kelechi", "Temitope", "Aisha", "Babatunde", "Chiamaka", "Segun", "Yetunde", "Obinna", "Halima", "Tolulope",
  "Uche", "Bisola", "Ikenna", "Amarachi", "Kayode", "Folake", "Ebuka", "Hauwa", "Gbenga", "Nkechi",
  "Toluwani", "Somto", "Fiyinfoluwa", "Ayomide", "Precious", "David", "Esther", "Daniel", "Grace", "Samuel",
] as const;

export const LAST_NAMES = [
  "Adeyemi", "Okafor", "Balogun", "Eze", "Ogunleye", "Nwosu", "Bello", "Afolabi", "Okonkwo", "Adebayo",
  "Ibrahim", "Olawale", "Nnamdi", "Akinola", "Uzor", "Ogundipe", "Musa", "Chukwu", "Fashola", "Obi",
  "Oyelaran", "Adeleke", "Onyeka", "Lawal", "Ajayi", "Ekwueme", "Salami", "Igwe", "Oladipo", "Danjuma",
] as const;

export const PROGRAMMES = ["Software Engineering", "Computer Science", "Information Technology"] as const;

/** Babcock-style matric: 21/0412 */
export function matric(rng: Rng, entryYear: number) {
  return `${String(entryYear).slice(-2)}/${String(int(rng, 100, 2999)).padStart(4, "0")}`;
}
