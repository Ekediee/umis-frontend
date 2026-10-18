"use server";

import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { getSessionUser, getSessionToken, type UMISResponse } from "@/lib/session";
import { getStudentProfileAction } from "@/app/actions/user";
import { getSchoolOfficerAction } from "@/app/actions/academic-details";
import { loggedFetch } from "@/lib/logger";
import {
  EXAM_PORTAL_URLS,
  EXAM_AUTH_USERNAME,
  EXAM_AUTH_PASSWORD,
  type ExamPortalPayload,
  type AccessExamPortalResult,
} from "@/app/actions/exam-portal.types";

const username = EXAM_AUTH_USERNAME;
const password = EXAM_AUTH_PASSWORD;

/**
 * Extracts the profile picture URL or base64 string from any shape of UMISResponse.
 */
function extractRawPhotoValue(data: UMISResponse | null | undefined): string | null {
  if (!data) return null;
  const d = data as unknown as Record<string, unknown>;
  const ud = (d?.user_data ?? {}) as Record<string, unknown>;
  const pi = (ud?.personal_information ?? d?.personal_information ?? {}) as Record<string, unknown>;

  const candidate =
    pi.profile_picture_url ||
    pi.profile_picture ||
    pi.picture_url ||
    pi.picture ||
    pi.photo_url ||
    pi.photo ||
    pi.avatar_url ||
    pi.avatar ||
    ud.profile_picture_url ||
    ud.profile_picture ||
    ud.picture_url ||
    ud.picture ||
    ud.photo_url ||
    ud.photo ||
    ud.avatar_url ||
    ud.avatar ||
    d.profile_picture_url ||
    d.profile_picture ||
    d.picture_url ||
    d.picture ||
    d.photo_url ||
    d.photo ||
    d.avatar_url ||
    d.avatar;

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}

/**
 * Resolves the student's profile photo as a Base64-encoded string.
 * Supports data URLs, remote/relative backend image URLs, and falls back to
 * the default student avatar in public/images/student-image.png.
 */
async function resolveStudentPhotoBase64(
  userData: UMISResponse,
  token: string | null | undefined
): Promise<string> {
  const rawPhoto = extractRawPhotoValue(userData);

  if (rawPhoto) {
    // 1. Data URL (e.g. "data:image/jpeg;base64,/9j/4AAQ...")
    if (rawPhoto.startsWith("data:")) {
      const commaIdx = rawPhoto.indexOf(",");
      return commaIdx !== -1 ? rawPhoto.slice(commaIdx + 1).trim() : rawPhoto;
    }

    // 2. Already raw base64 (not a URL or file path)
    if (
      !rawPhoto.startsWith("http://") &&
      !rawPhoto.startsWith("https://") &&
      !rawPhoto.startsWith("/") &&
      !rawPhoto.includes(".")
    ) {
      return rawPhoto;
    }

    // 3. Remote or relative backend image URL
    if (!rawPhoto.startsWith("/images/")) {
      try {
        const apiBase =
          process.env.API_URL ||
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://umis-sb.babcock.edu.ng";

        let parsedUrl: URL;
        if (rawPhoto.startsWith("http://") || rawPhoto.startsWith("https://")) {
          parsedUrl = new URL(rawPhoto);
        } else {
          const cleanPath = rawPhoto.startsWith("/") ? rawPhoto : `/${rawPhoto}`;
          parsedUrl = new URL(cleanPath, apiBase);
        }

        // Match API_URL protocol if pointing at the same host
        if (process.env.API_URL) {
          try {
            const apiOrigin = new URL(process.env.API_URL);
            if (
              apiOrigin.hostname === parsedUrl.hostname &&
              apiOrigin.protocol !== parsedUrl.protocol
            ) {
              parsedUrl.protocol = apiOrigin.protocol;
            }
          } catch {
            // ignore malformed API_URL
          }
        }

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const imgRes = await loggedFetch(parsedUrl.toString(), {
          method: "GET",
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });

        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          return Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("[exam-portal] Could not fetch remote student photo, using fallback:", err);
      }
    }
  }

  // Fallback to default local avatar
  try {
    const defaultAvatarPath = path.join(process.cwd(), "public", "images", "student-image.png");
    if (fs.existsSync(defaultAvatarPath)) {
      return fs.readFileSync(defaultAvatarPath).toString("base64");
    }
  } catch {
    // ignore fs errors in restricted environments
  }

  return "";
}

/**
 * Extracts the HTML document string from either a parsed JSON payload or raw response text.
 */
function extractHtmlFromPayload(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidateKeys = ["html", "data", "content", "page", "body", "view"];

    for (const key of candidateKeys) {
      const val = record[key];
      if (typeof val === "string" && val.trim()) {
        return val;
      }
      if (val && typeof val === "object") {
        const nested = extractHtmlFromPayload(val);
        if (nested) return nested;
      }
    }

    // Fallback: look for any string value resembling HTML
    for (const val of Object.values(record)) {
      if (
        typeof val === "string" &&
        (/<!doctype\s+html/i.test(val) || /<html[\s>]/i.test(val) || /<body[\s>]/i.test(val))
      ) {
        return val;
      }
    }
  }

  return null;
}

/**
 * Initiates an Online Exam Portal session by sending a Basic-Auth POST request
 * to a randomly selected Babcock Exam Portal server and returning the full HTML page.
 */
export async function accessExamPortalAction(): Promise<AccessExamPortalResult> {
  try {
    const token = await getSessionToken().catch(() => null);
    const userData = (await getSessionUser()) ?? (await getStudentProfileAction());

    if (!userData) {
      return {
        success: false,
        error: "You are not authenticated. Please log in again.",
      };
    }

    const ud = userData.user_data;
    const pi = ud?.personal_information;

    const session_id = randomUUID();
    const student_id =
      pi?.matric_number ||
      ud?.matric_number ||
      (userData.entity_id !== null && userData.entity_id !== undefined
        ? String(userData.entity_id)
        : "");

    const student_name =
      userData.entity_name ||
      pi?.student_name ||
      ud?.student_name ||
      "";

    let faculty = ud?.school_name || "";
    if (!faculty) {
      try {
        const officerResult = await getSchoolOfficerAction();
        if (officerResult.data?.school) {
          faculty = officerResult.data.school;
        }
      } catch {
        // Non-fatal fallback
      }
    }

    const department = ud?.department || "";
    const program = ud?.degree_name || ud?.department || "";
    const photo = await resolveStudentPhotoBase64(userData, token);

    const payload: ExamPortalPayload = {
      auth_type: "ba",
      session_id,
      student_id,
      student_name,
      photo,
      faculty,
      department,
      program,
    };

    // Randomly select one of the configured exam portal URLs
    const url = EXAM_PORTAL_URLS[Math.floor(Math.random() * EXAM_PORTAL_URLS.length)];
    const portalOrigin = new URL(url).origin;

    const response = await loggedFetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // Clone before calling .json() so we can fall back to .text() if the server
    // returns raw text/html despite the Accept: application/json header.
    const cloned = typeof response.clone === "function" ? response.clone() : null;
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      if (cloned && typeof cloned.text === "function") {
        data = await cloned.text();
      } else if (typeof response.text === "function") {
        data = await response.text();
      }
    }

    console.log("Request successful:", typeof data === "string" ? `[HTML ${data.length} chars]` : data);

    const html = extractHtmlFromPayload(data);
    if (!html) {
      return {
        success: false,
        error: "Received an empty or invalid response from the exam portal.",
      };
    }

    return {
      success: true,
      html,
      portalUrl: url,
      portalOrigin,
    };
  } catch (error) {
    console.error("Request failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect to the Online Exam Portal. Please try again.";
    return {
      success: false,
      error: message,
    };
  }
}
