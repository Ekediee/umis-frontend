import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";
import { getSessionToken } from "@/lib/session";

// Custom undici Agent that skips TLS certificate verification.
// NODE_TLS_REJECT_UNAUTHORIZED=0 is ignored by undici (Node's native fetch);
// a dispatcher with rejectUnauthorized:false is the correct fix.
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

/**
 * GET /api/image-proxy?url=<encoded-image-url>
 *
 * Proxies external images through the Next.js server so the browser
 * never directly contacts the backend origin. This solves:
 *   - Expired SSL certificate on umis-sb.babcock.edu.ng (handled via
 *     the insecure undici Agent dispatcher below)
 *   - Browser CORS restrictions on backend static-file responses
 *   - Next.js remotePatterns restrictions for <Image> optimization
 *   - 403 Forbidden: profile pictures are protected; we forward the
 *     student's Bearer token so the backend allows the request.
 *
 * When the backend SSL certificate is renewed this route continues to
 * work transparently — no code changes needed.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Basic safety check — only proxy URLs from the known backend hostname.
  // Prevents open-proxy abuse.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  const allowedHosts = [
    "umis-sb.babcock.edu.ng",
    "bu-pulse-sb.babcock.edu.ng",
  ];

  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return new NextResponse("URL hostname not allowed", { status: 403 });
  }

  try {
    // Normalize the protocol to match API_URL.
    //
    // The backend stores image URLs with https:// in the database, but inside
    // Docker (dev) only HTTP port 80 is reachable — port 443 times out.
    // We rewrite the URL to use whichever protocol API_URL uses so the fetch
    // always goes through the reachable port.
    //
    // In production (cert valid, port 443 open) API_URL will be https:// and
    // no rewrite happens — the original URL is used as-is.
    const apiBase = process.env.API_URL ?? "";
    let fetchUrl = imageUrl;
    if (apiBase) {
      try {
        const apiOrigin = new URL(apiBase);
        if (
          apiOrigin.hostname === parsedUrl.hostname &&
          apiOrigin.protocol !== parsedUrl.protocol
        ) {
          // e.g. rewrite https://umis-sb... → http://umis-sb...
          parsedUrl.protocol = apiOrigin.protocol;
          fetchUrl = parsedUrl.toString();
        }
      } catch {
        // API_URL malformed — fall back to original URL
      }
    }

    // Build request headers. Include the student's Bearer token so the
    // backend allows access to protected resources (profile pictures return
    // 403 without authentication).
    const headers: Record<string, string> = {};
    const token = await getSessionToken().catch(() => null);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Use the insecure undici Agent to bypass the expired backend SSL cert.
    // NODE_TLS_REJECT_UNAUTHORIZED=0 is ignored by undici; this dispatcher is
    // the correct way to disable cert verification for fetch().
    const upstream = await fetch(fetchUrl, {
      headers,
      // 20 s timeout — the backend can be slow.
      signal: AbortSignal.timeout(20000),
      // @ts-expect-error — undici dispatcher is not in the standard fetch types
      dispatcher: insecureAgent,
    });
    
    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";

    // Stream the body directly to the browser response
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 hour in the browser and CDN
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("[image-proxy] Failed to fetch upstream image:", err);
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
