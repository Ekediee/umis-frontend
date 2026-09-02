# UMIS Pulse — Student Information System Frontend

> Modern, responsive student portal for course registration, academic results tracking, financial clearance, and student profile management.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, **Tailwind CSS 4**, **Zustand 5**, and **Serwist PWA**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later

### 2. Installation & Development

```bash
# Clone the repository and install dependencies
git clone <repo-url>
cd umis-frontend
npm install

# Setup environment variables
cp .env.example .env # or copy .env.dev for local backend connection

# Start development server
npm run dev
```

The portal will be running at [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Architecture & Project Structure

```
├── app/
│   ├── (student-page)/             # Protected student shell
│   │   ├── dashboard/              # Student dashboard & quick metrics
│   │   ├── academic-details/       # CGPA tracker, results, transcript export
│   │   ├── registration/           # Course, meal plan, and worship center flow
│   │   ├── profile/                # Student profile & password settings
│   │   └── notifications/          # In-app notifications
│   ├── actions/                    # Next.js Server Actions (Auth, Academics, Registration)
│   └── api/                        # Route handlers (image-proxy, notifications, chat)
├── components/
│   ├── layout/                     # Sidebar, Header, Mobile navigation
│   ├── academic-details/           # GPA progression, what-if simulator
│   ├── registration/               # Multi-step course selection stepper
│   ├── fees/                       # Financial clearance & payment steps
│   └── providers/                  # Session timeout, registration, notification providers
├── hooks/                          # Zustand stores & custom hooks (useStudentAvatar, etc.)
├── lib/                            # Session management, logger, offline storage, auth cleanup
├── docs/                           # Deployment & architectural guides
└── test-utils/                     # Test fixtures and testing helpers
```

---

## 🧪 Testing & Verification

The project includes unit and integration tests powered by **Vitest** and **React Testing Library**:

```bash
# Run all unit and action tests
npm test

# Run tests in watch mode
npm run test:watch

# TypeScript type check
npx tsc --noEmit
```

---

## 🔒 Key Security Features

- **HTTP-Only Cookies**: JWT tokens and student data are stored securely in HTTP-only cookies — inaccessible to client JavaScript.
- **Edge Route Protection**: Middleware decodes token expiration and redirects expired sessions at the edge.
- **Idle Session Auto-Logout**: 30-minute idle tracking with warning countdown, server heartbeat, and multi-tab synchronization.
- **Scoped Image Proxy**: `/api/image-proxy` strictly validates hostnames against an allowlist to prevent open-proxy vulnerabilities.
- **Credential Sanitization**: Central logging automatically masks passwords, tokens, and authorization headers in both logs and terminal output.

---

## 📖 Deployment Documentation

Detailed deployment guides are located in the [`docs/`](file:///home/ague/projects/office/umis-frontend/docs) directory:

- [Docker Deployment Guide](file:///home/ague/projects/office/umis-frontend/docs/deployment-docker.md)
- [Apache Reverse Proxy Deployment Guide](file:///home/ague/projects/office/umis-frontend/docs/deployment-apache.md)
- [Quickstart & PM2 Guide](file:///home/ague/projects/office/umis-frontend/docs/deployment-quickstart.md)
- [Version 1.6 Release Notes](file:///home/ague/projects/office/umis-frontend/docs/changelog-v1.6.md)
