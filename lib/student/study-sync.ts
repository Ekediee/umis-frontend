"use client";

/**
 * Study sessions are saved on the device first (idb-keyval), then sent to
 * `POST /student/study-sessions`. Anything that fails to send waits in the
 * queue and is retried when the browser comes back online.
 */

import { get, set } from "idb-keyval";
import { studentApi } from "./api";
import { invalidateStudent } from "./query";
import type { StudySession } from "./types";

const QUEUE_KEY = "pulse-student:pending-study-sessions";

async function readQueue(): Promise<StudySession[]> {
  try {
    return ((await get(QUEUE_KEY)) as StudySession[] | undefined) ?? [];
  } catch {
    return [];
  }
}

async function writeQueue(items: StudySession[]) {
  try {
    await set(QUEUE_KEY, items);
  } catch {
    // IndexedDB unavailable (private mode): the session is lost only if sending also failed
  }
}

export async function pendingStudySessions() {
  return readQueue();
}

/** Logs a finished session; returns true when it reached the server, false when queued. */
export async function recordStudySession(input: { courseId: string; startedAt: string; minutes: number }): Promise<boolean> {
  const session: StudySession = { id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}`, ...input };
  try {
    await studentApi.logStudySession(session);
    invalidateStudent("study");
    invalidateStudent("today");
    return true;
  } catch {
    await writeQueue([...(await readQueue()), { ...session, pending: true }]);
    return false;
  }
}

let flushing = false;

export async function flushStudyQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const queue = await readQueue();
    if (!queue.length) return;
    const left: StudySession[] = [];
    for (const s of queue) {
      try {
        await studentApi.logStudySession({ id: s.id, courseId: s.courseId, startedAt: s.startedAt, minutes: s.minutes });
      } catch {
        left.push(s);
      }
    }
    await writeQueue(left);
    if (left.length !== queue.length) {
      invalidateStudent("study");
      invalidateStudent("today");
    }
  } finally {
    flushing = false;
  }
}
