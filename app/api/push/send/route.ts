/**
 * POST /api/push/send: the backend calls this to deliver web push
 * notifications (agreed in the requirements plan: "call the Next route handler
 * to send it"). The backend owns the subscriptions and decides who gets what
 * (categories, quiet hours, daily cap); this route only signs and sends.
 *
 * Auth:    Authorization: Bearer ${PUSH_SEND_SECRET}
 * Body:    { subscriptions: PushSubscriptionJSON[], notification: { title, body, url?, type?, tag?, urgent? } }
 * Returns: { sent, failed, expired: string[] }; the backend deletes expired endpoints.
 */

import { NextResponse } from "next/server";
import webpush from "web-push";
import { timingSafeEqual } from "node:crypto";
import { withLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface Body {
  subscriptions: { endpoint: string; keys: { p256dh: string; auth: string } }[];
  notification: { title: string; body: string; url?: string; type?: string; tag?: string; urgent?: boolean };
}

function authorised(req: Request) {
  const secret = process.env.PUSH_SEND_SECRET;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!secret || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST = withLogging(async (req) => {
  if (!authorised(req)) return NextResponse.json({ status: false, message: "Unauthorised" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ status: false, message: "VAPID keys are not configured" }, { status: 500 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:ict@babcock.edu.ng", publicKey, privateKey);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ status: false, message: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.subscriptions) || !body.notification?.title) {
    return NextResponse.json({ status: false, message: "subscriptions[] and notification.title are required" }, { status: 400 });
  }
  if (body.subscriptions.length > 1000) return NextResponse.json({ status: false, message: "Send at most 1000 subscriptions per call" }, { status: 413 });

  const payload = JSON.stringify(body.notification);
  const results = await Promise.allSettled(
    body.subscriptions.map((s) => webpush.sendNotification(s, payload, { TTL: body.notification.urgent ? 3600 : 86400, urgency: body.notification.urgent ? "high" : "normal" })),
  );

  const expired: string[] = [];
  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") sent++;
    else {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) expired.push(body.subscriptions[i].endpoint);
    }
  });

  return NextResponse.json({ status: true, sent, failed: results.length - sent, expired });
});
