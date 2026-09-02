# UMIS Pulse Frontend — Professional Engineering Review

> **Reviewed by:** Antigravity AI Engineering Review  
> **Date:** 2026-08-18  
> **Project:** `giant-orbit` / UMIS Pulse Student Portal  
> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Zustand 5 · Serwist PWA · Vitest

---

## Executive Summary

This is a well-structured, thoughtfully engineered student information system portal with a strong technical foundation. The project demonstrates mature architectural thinking in several areas — particularly its server action pattern, state management strategy, security layering, and deployment infrastructure. There are, however, several systemic weaknesses across type safety, code duplication, component size, and test coverage that should be addressed as the project scales.

**Overall Rating: 7.5 / 10**

---

## Architecture Overview

```
app/
├── (student-page)/        # Authenticated student shell (layout + routes)
│   ├── dashboard/         # Main dashboard
│   ├── academic-details/  # CGPA, courses, results, transcript
│   ├── registration/      # Course + fee registration multi-step flow
│   ├── profile/           # Profile management
│   └── notifications/
├── actions/               # Server Actions (auth, user, registration, academic-details)
├── api/                   # Next.js Route Handlers (image-proxy, notifications, chat, AI)
components/
├── layout/                # Sidebar, Header, Mobile Nav
├── dashboard/             # Dashboard widgets
├── academic-details/      # Charts, simulators
├── registration/          # Multi-step registration stepper
├── fees/                  # Fee payment flow
├── shared/                # AI chat, profile banner
└── providers/             # Context providers (session, registration, notifications)
lib/                       # session.ts, logger.ts, auth-cleanup.ts, AI utils
hooks/                     # Zustand stores + custom hooks
contexts/                  # UserDataContext
```

The App Router convention is followed cleanly. Server Components are used for data-fetching layouts, and Client Components are isolated to interactive leaf nodes — a textbook pattern.

---

## ✅ Strengths

### 1. Excellent Server Action Architecture

The `app/actions/` layer is the strongest part of the codebase. Every action follows a consistent, disciplined pattern:
- Guard clauses for missing `API_URL` and missing session tokens at the top
- Raw API shape interfaces vs normalized UI-facing interfaces (e.g., `RawRegisteredCourse` → `RegisteredCourse`)
- Consistent error envelope handling (`{ error, data, message }`)
- `cache: "no-store"` on all authenticated requests
- `loggedFetch` abstraction for centralized logging and TLS workaround

```typescript
// Clean guard-first pattern in all actions
const apiUrl = process.env.API_URL;
if (!apiUrl) return { error: "Internal server error: Missing API configuration" };
const token = await getSessionToken();
if (!token) return { error: "You are not authenticated. Please log in again." };
```

This is production-grade and consistent across all 6 action files.

---

### 2. Thoughtful Security Implementation

- **HTTP-only cookies** for token and user data storage — no JWT exposed to JavaScript
- **Middleware route guard** cleanly separates auth/unauth routes
- **Image proxy** (`/api/image-proxy`) with allowlist-only hostname validation prevents open-proxy abuse
- **Session cleanup** on logout is thorough: HTTP-only cookies, Zustand stores, localStorage — all cleared
- **`auth_session_expired` cross-tab sync** with race-condition guard (`isLoggingOut` latch) implemented correctly
- **30-minute idle auto-logout** with cross-tab sync, wakeup detection, and server cookie heartbeat — sophisticated and correct

---

### 3. Strong State Management Strategy

Zustand with `persist` middleware is used strategically: only cached data (academic progress, courses, semester info) is persisted, with explicit `clear*` methods. The clear-on-logout contract is enforced.

```typescript
// Per-domain store slices with loading state + clear lifecycle
isFetchingAcademicProgress: boolean;
clearAcademicProgress: () => void;
```

The pattern of "check store → skip fetch if data exists → fetch once and populate" prevents redundant network calls effectively.

---

### 4. Production-Ready Docker & Deployment Setup

- Multi-stage Dockerfile: `deps` → `builder` → `runner` with non-root user
- `output: 'standalone'` for minimal production image
- Docker Compose with environment separation (`docker-compose.yml` vs `docker-compose.dev.yml`)
- Apache reverse proxy configuration included
- PM2 ecosystem config for non-Docker deployment
- Detailed deployment guides committed in the repo

---

### 5. PWA Implementation

Serwist (Workbox-based) service worker integration with offline fallback awareness (`lib/offline-storage.ts` using IndexedDB). This is a meaningful enhancement for a student portal that may be accessed on unreliable campus networks.

---

### 6. Logging Infrastructure

`lib/logger.ts` provides:
- Structured request/response logging with sanitization of passwords and tokens
- File-based log output
- TLS bypass properly scoped to the `loggedFetch` layer using a targeted `undici` Agent

---

### 7. Testing Infrastructure Present

Vitest + React Testing Library + jsdom is configured correctly. Tests exist for:
- `lib/session.ts`, `lib/logger.ts`
- `app/actions/registration.ts`, `registration.submit.test.ts`
- `contexts/user-data-context.tsx`
- Component-level: `LoginForm`, `academic-progress`, `academic-details`
- Route-level: semester results pages

---

## ❌ Weaknesses

### 1. Widespread Use of `any` Type — HIGH PRIORITY

There are 13+ occurrences of `any` in just the server actions and helpers. This completely undermines TypeScript's value for a complex domain model.

```typescript
// lib/session.ts — incorrect return type
export async function getSessionUser(): Promise<any>

// lib/logger.ts — loses all type safety
export function sanitize(obj: any): any
```

**Impact:** Runtime errors from unexpected API shape changes go undetected until production.  
**Fix:** Use `unknown` with type guards. Make `getSessionUser()` return `Promise<UMISResponse | null>`.

---

### 2. Severely Oversized Components — HIGH PRIORITY

| File | Lines | Recommended Max |
|------|-------|-----------------|
| `app/actions/registration.ts` | **898** | ≤ 300 (split by domain) |
| `gpa-what-if-simulator.tsx` | **549** | ≤ 200 |
| `student-profile-banner.tsx` | **433** | ≤ 200 |
| `components/layout/header.tsx` | **334** | ≤ 150 |

`registration.ts` is a 900-line monolith that mixes course registration, fee registration, meal plan, class group, and semester actions in a single file. This is a maintainability hazard.

---

### 3. Systematic Profile Image Logic Duplication — HIGH PRIORITY

The pattern of extracting + proxying profile pictures is copy-pasted across at least **three components**:

- `components/layout/sidebar.tsx`
- `components/layout/header.tsx`
- `components/academic-details/gpa-what-if-simulator.tsx`

Each defines its own `extractPicUrl()`, `proxyImageUrl()`, and avatar state management.  
**Fix:** Extract a reusable hook:

```typescript
// hooks/use-student-avatar.ts
export function useStudentAvatar(initialData?: UMISResponse | null) {
  // single source of truth for avatar URL, proxy, cache, and events
}
```

---

### 4. Middleware Does Not Verify Token Validity — MEDIUM PRIORITY

```typescript
// middleware.ts — presence check only, no validity check
const token = request.cookies.get('token')?.value
if (!token && !isAuthPage) { redirect('/') }
```

A user with a logically expired or malformed token will pass the guard and reach the dashboard, only failing when the first server action encounters a 401.

**Fix:** Add a JWT expiry check in middleware using a edge-compatible library (e.g., `jose`), or shorten the cookie `maxAge` to match the backend token TTL exactly.

---

### 5. Global TLS Bypass Is a Security Concern — MEDIUM PRIORITY

```typescript
// lib/logger.ts — disables TLS for ALL outbound connections, not just the backend
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
```

This is a workaround for an expired backend certificate, but it disables TLS verification globally. The scoped `undici` Agent in `image-proxy/route.ts` is the correct approach and is already in place.

**Fix:** Remove the global `NODE_TLS_REJECT_UNAUTHORIZED` line from `logger.ts`.

---

### 6. Insufficient Test Coverage — MEDIUM PRIORITY

12 test files exist, but critical paths remain untested:
- ❌ No tests for auth actions (`loginAction`, `logoutAction`, `touchSessionAction`)
- ❌ No tests for academic-details actions
- ❌ No tests for `SessionTimeoutProvider`
- ❌ No tests for `lib/auth-cleanup.ts`
- ❌ No E2E tests (Playwright is installed but no `.spec.ts` files exist)
- ❌ No tests for API route handlers

Estimated functional test coverage of critical paths: **< 20%**.

---

### 7. Environment Files Present on Disk — SECURITY NOTE

```
.env        # present at project root
.env.dev    # present at project root
```

While `.gitignore` correctly excludes these, secrets should ideally live in a secrets manager or CI/CD environment variable store — not as files on the developer's machine — to prevent accidental exposure during deployments, Docker builds, or repository operations.

---

### 8. `isLoggingOut` Flag Is Never Reset — MEDIUM PRIORITY

```typescript
// lib/auth-cleanup.ts — module-level singleton, never resets
let isLoggingOut = false;
```

The race-condition guard is correct, but the flag is never reset. In development with hot module reloading, re-imported module instances can silently swallow subsequent logout attempts.

**Fix:** Reset the flag on redirect, or scope it inside a factory function.

---

### 9. Hardcoded Mock Data in Production Simulator — LOW PRIORITY

```typescript
// gpa-what-if-simulator.tsx — COSC department hardcoded defaults
const [courses, setCourses] = useState<MockCourse[]>([
  { id: "1", code: "COSC 311", units: 3, grade: "A" },
  ...
]);
```

This makes the simulator appear tailored to a single department and feel like a prototype.  
**Fix:** Start with an empty list, or pre-populate from the student's actual registered courses fetched from `getRegisteredCoursesAction()`.

Also: `lib/mock-data.ts` (`MOCK_COURSES`) does not appear to be imported anywhere in production code. It should be deleted or moved to `test-utils/fixtures/`.

---

### 10. Inconsistent Error Handling — LOW PRIORITY

Some actions return `{ error: string }`, others return `null` on failure:

```typescript
// Pattern A — explicit error discriminant
return { error: "You are not authenticated." }

// Pattern B — null (consumer cannot distinguish auth failure from empty data)
catch (error) { console.error(...); return null; }
```

**Fix:** Define and use a `Result<T>` discriminated union:
```typescript
type Result<T> = { data: T; error: null } | { data: null; error: string }
```

---

### 11. Documentation Clutter at Root — LOW PRIORITY

The project root contains 5 large Markdown documents and a `docker-compose_old.yml` dead file:

```
dply_guide.md
umis_docker_deployment_guide.md
umis_docker_deployment_guide_old.md
umis_frontend_apache_deployment_guide.md
university_portal_v1_6_0.md
docker-compose_old.yml
```

**Fix:** Move all documentation to a `docs/` directory and delete obsolete files.

---

## Prioritized Recommendations

### 🔴 Do Before Next Feature

| # | Issue | Action |
|---|-------|--------|
| 1 | Global TLS bypass | Remove `NODE_TLS_REJECT_UNAUTHORIZED = "0"` from `logger.ts` |
| 2 | `registration.ts` 900-line monolith | Split into `registration-courses.ts`, `registration-fees.ts`, `registration-semester.ts` |
| 3 | Profile image logic duplication | Extract `useStudentAvatar()` hook |
| 4 | GPA simulator mock data | Replace hardcoded courses with live data or empty list |

### 🟡 Near-Term (Next Sprint)

| # | Issue | Action |
|---|-------|--------|
| 5 | `any` types | Enable `strict: true` in tsconfig; replace with `unknown` + type guards |
| 6 | Middleware token validation | Add JWT expiry check at the edge |
| 7 | Test coverage | Add auth action tests, session timeout tests, API route tests |
| 8 | `isLoggingOut` never resets | Refactor to a resettable closure or module factory |

### 🟢 Long-Term Backlog

| # | Issue | Action |
|---|-------|--------|
| 9 | Unified `Result<T>` error type | Standardize all server action return shapes |
| 10 | E2E test suite | Add Playwright tests for login → registration → logout journey |
| 11 | `lib/mock-data.ts` | Delete or relocate to `test-utils/fixtures/` |
| 12 | Documentation | Consolidate all `.md` files into a `docs/` directory |

---

## What to Build Next (Suggested Roadmap)

1. **Wire up live Notifications** — API route handler and provider are in place; `RecentUpdates` widget appears to use placeholder data.
2. **Transcript PDF Export** — The route and `jspdf`/`html2canvas` packages are installed; ensure output is correctly styled before release.
3. **Refactor `registration.ts`** — This is essential before adding any more fee or course registration features.
4. **Offline Registration Drafts** — `lib/offline-storage.ts` (IndexedDB) exists but is not fully wired to the registration stepper flow.
5. **E2E Test Suite** — Add Playwright coverage for the full student journey: login → dashboard → academic details → course registration → logout.

---

*This review was produced by static analysis, file inspection, and architectural assessment of the full project as of 2026-08-18.*
