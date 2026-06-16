import "server-only";
import * as fs from "fs";
import * as path from "path";

// Ensure the logs directory exists at startup/import time
const logsDir = path.join(process.cwd(), "logs");
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  console.error("Failed to create logs directory:", err);
}

const appLogPath = path.join(logsDir, "app.log");
const errorLogPath = path.join(logsDir, "error.log");

/**
 * Safely sanitizes sensitive fields (passwords, tokens, etc.) from metadata and payloads.
 */
export function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // If it's a JSON string, try to parse, sanitize, and stringify
    const trimmed = obj.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(obj);
        return JSON.stringify(sanitize(parsed));
      } catch {
        // Fallback to regex masking if parsing fails
      }
    }

    // Fallback: search and replace patterns in query strings or raw strings
    let sanitizedStr = obj;
    // Regex to mask "password":"..." or password=...
    sanitizedStr = sanitizedStr.replace(
      /("password"\s*:\s*")([^"]+)(")/gi,
      '$1*****$3'
    );
    sanitizedStr = sanitizedStr.replace(
      /(password\s*=\s*)([^&]+)/gi,
      '$1*****'
    );
    sanitizedStr = sanitizedStr.replace(
      /("token"\s*:\s*")([^"]+)(")/gi,
      '$1*****$3'
    );
    sanitizedStr = sanitizedStr.replace(
      /(token\s*=\s*)([^&]+)/gi,
      '$1*****'
    );
    sanitizedStr = sanitizedStr.replace(
      /("secret"\s*:\s*")([^"]+)(")/gi,
      '$1*****$3'
    );
    sanitizedStr = sanitizedStr.replace(
      /(secret\s*=\s*)([^&]+)/gi,
      '$1*****'
    );
    return sanitizedStr;
  }

  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("jwt") ||
      lowerKey.includes("authorization")
    ) {
      sanitized[key] = "*****";
    } else if (typeof value === "object" || typeof value === "string") {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Write a formatted log line to file.
 */
function writeToFile(filePath: string, level: string, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = meta ? sanitize(meta) : null;
  const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : "";
  const logLine = `[${timestamp}] [${level}] ${message}${metaStr}\n`;

  // Asynchronously append to file to avoid blocking event loop
  fs.appendFile(filePath, logLine, "utf8", (err) => {
    if (err) {
      console.error(`[Logger Error] Failed to write log line:`, err);
    }
  });
}

/**
 * Core application logger. Writes to files and prints to system console.
 */
export const logger = {
  info(message: string, meta?: any) {
    // Print to server console
    console.log(`[INFO] ${message}`, meta ? sanitize(meta) : "");
    // Write to app.log
    writeToFile(appLogPath, "INFO", message, meta);
  },

  warn(message: string, meta?: any) {
    // Print to server console
    console.warn(`[WARN] ${message}`, meta ? sanitize(meta) : "");
    // Write to app.log
    writeToFile(appLogPath, "WARN", message, meta);
  },

  error(message: string, meta?: any) {
    // Print to server console
    console.error(`[ERROR] ${message}`, meta ? sanitize(meta) : "");
    // Write to app.log and error.log
    writeToFile(appLogPath, "ERROR", message, meta);
    writeToFile(errorLogPath, "ERROR", message, meta);
  },
};

/**
 * Outgoing fetch API wrapper with automatic logging and duration tracking.
 */
export async function loggedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const startTime = Date.now();
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
  const method = init?.method || "GET";

  // Sanitize and prepare headers for logs
  let requestHeaders: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((val, key) => {
        requestHeaders[key] = val;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, val]) => {
        requestHeaders[key] = val;
      });
    } else {
      requestHeaders = { ...init.headers } as Record<string, string>;
    }
  }

  logger.info(`Outgoing API Request: ${method} ${url}`, {
    headers: requestHeaders,
    body: init?.body ? String(init.body) : undefined,
  });

  try {
    const response = await fetch(input, init);
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.info(
        `Outgoing API Response Success: ${method} ${url} - Status: ${response.status} - Duration: ${duration}ms`
      );
    } else {
      let bodyText = "";
      try {
        const cloned = response.clone();
        bodyText = await cloned.text();
        if (bodyText.length > 300) {
          bodyText = bodyText.substring(0, 300) + "...";
        }
      } catch {
        // fallback if cloning/reading fails
      }

      logger.error(
         `Outgoing API Response Error: ${method} ${url} - Status: ${response.status} (${response.statusText}) - Duration: ${duration}ms${bodyText ? ` - Body: ${bodyText}` : ""}`
      );
    }

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(
      `Outgoing API Response Exception: ${method} ${url} - Error: ${
        error.message || String(error)
      } - Duration: ${duration}ms`,
      { stack: error.stack }
    );
    throw error;
  }
}

/**
 * Next.js API Route Handler wrapper (HOF) to log incoming requests, status and duration.
 */
export function withLogging(
  handler: (req: Request, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]) => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const method = req.method;

    logger.info(`Incoming API Request: ${method} ${url.pathname}`);

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;

      if (response.ok) {
        logger.info(
          `Incoming API Response Success: ${method} ${url.pathname} - Status: ${response.status} - Duration: ${duration}ms`
        );
      } else {
        logger.error(
          `Incoming API Response Error: ${method} ${url.pathname} - Status: ${response.status} - Duration: ${duration}ms`
        );
      }
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(
        `Incoming API Exception: ${method} ${url.pathname} - Error: ${
          error.message || String(error)
        } - Duration: ${duration}ms`,
        { stack: error.stack }
      );
      throw error;
    }
  };
}
