# ─── Production Multi-Stage Image ────────────────────────────────────────────
#
# Stage 1 (deps)    — install production node_modules only
# Stage 2 (builder) — install all deps + run `next build` (standalone output)
# Stage 3 (runner)  — minimal image containing only the compiled app
#
# The final image has NO source code, NO devDependencies, NO build tools.
# It is served entirely from the .next/standalone bundle.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install production dependencies ──────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

# Install ONLY production dependencies — devDependencies are excluded
RUN npm ci --omit=dev


# ── Stage 2: Build the application ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for TypeScript, ESLint, etc.)
RUN npm ci

# Copy the full source
COPY . .

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Build Next.js — produces .next/standalone thanks to `output: 'standalone'`
# set in next.config.ts
RUN npm run build


# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Create a non-root user and group for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone server bundle from the builder stage.
# This bundle includes a minimal set of node_modules — no full node_modules needed.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (CSS, JS chunks, images) served under /_next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the public directory (favicon, images, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# Port is internal — Apache maps port 80 → 3000 (see docker-compose.yml)
EXPOSE 3000

# Start the standalone Next.js server
CMD ["node", "server.js"]
