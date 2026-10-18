"use client";

/**
 * Offline write queue (1.2d / 3.4b): attendance saves locally first and syncs
 * when the connection is back. Stored in localStorage so a refresh loses nothing.
 */

import { lecturerApi } from "./api";

const KEY = "pulse-lecturer:queue";

type Job = { id: string; kind: "register"; payload: Parameters<typeof lecturerApi.saveRegister>[0]; at: number };

function read(): Job[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Job[];
  } catch {
    return [];
  }
}

function write(jobs: Job[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs));
    window.dispatchEvent(new Event("pulse-queue"));
  } catch {
    // storage unavailable — the in-flight save still runs when online
  }
}

export function queuedCount() {
  return read().length;
}

export function enqueueRegister(payload: Job["payload"]) {
  write([...read().filter((j) => !(j.payload.sessionId === payload.sessionId && j.payload.date === payload.date)), { id: `${payload.sessionId}:${payload.date}`, kind: "register", payload, at: Date.now() }]);
}

export async function flushQueue() {
  const jobs = read();
  const left: Job[] = [];
  for (const job of jobs) {
    try {
      await lecturerApi.saveRegister(job.payload);
    } catch {
      left.push(job);
    }
  }
  write(left);
  return jobs.length - left.length;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushQueue());
}
