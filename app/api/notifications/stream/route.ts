export const dynamic = 'force-dynamic';
import { withLogging } from "@/lib/logger";
import { getSemesterRegistrationStatusAction } from "@/app/actions/registration-semester";
import { registrationTriggers, type Notice } from "@/lib/notifications/triggers";

/** How often live state is re-checked while the app is open */
const POLL_MS = 10 * 60 * 1000;
const KEEPALIVE_MS = 15 * 1000;

/**
 * Live notification stream for the signed-in student.
 *
 * Instead of scripted demo events, it reads the student's real state from the
 * backend (with their session) and runs the trigger rules in
 * lib/notifications/triggers.ts: registration open, closing at 7/3/1/0 days,
 * semester ending. It re-checks every 10 minutes and sends every notice that
 * still applies on each check, so the student sees a toast each time. Each
 * notice has a stable key; the inbox lists it once, across checks and sessions.
 */
export const GET = withLogging(async function GET(req: Request) {
  const encoder = new TextEncoder();
  let closed = false;
  let poll: ReturnType<typeof setInterval> | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      const send = (data: Notice | { type: "connected"; message: string }) => write(`data: ${JSON.stringify(data)}\n\n`);

      send({ type: "connected", message: "SSE connected" });

      const check = async () => {
        try {
          const status = await getSemesterRegistrationStatusAction();
          if (closed || !status.data) return;
          for (const notice of registrationTriggers(status.data, new Date())) send(notice);
        } catch (error) {
          // A failed check just waits for the next one; the stream stays up
          console.error("notifications stream: live check failed", error);
        }
      };

      void check();
      poll = setInterval(check, POLL_MS);
      keepalive = setInterval(() => write(": keepalive\n\n"), KEEPALIVE_MS);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(poll);
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      closed = true;
      clearInterval(poll);
      clearInterval(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
});
