export const dynamic = 'force-dynamic';
import { withLogging } from "@/lib/logger";

export const GET = withLogging(async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial connected message
      controller.enqueue(encoder.encode('data: {"type": "connected", "message": "SSE connected"}\n\n'));

      // Simulate real-time events over time
      const events = [
        { delay: 10000, type: "REGISTRATION_OPEN", message: "Course registration is now open!" },
        { delay: 35000, type: "REGISTRATION_CLOSING_SOON", message: "Registration closes in 48 hours." },
        { delay: 60000, type: "PAYMENT_REQUIRED", message: "A payment of ₦20,000 is required to complete clearance." },
      ];

      for (const event of events) {
        setTimeout(() => {
          try {
            const data = JSON.stringify({ type: event.type, message: event.message });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (e) {
            // connection might be closed
          }
        }, event.delay);
      }

      // Keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
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
