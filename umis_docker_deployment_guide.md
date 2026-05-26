# UMIS Frontend — Docker Production Deployment Guide

> **Audience:** Server Administrator  
> **Server OS:** Debian (or Debian-based, e.g. Ubuntu 22.04)  
> **Last Updated:** May 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Install Docker & Docker Compose](#3-step-1--install-docker--docker-compose)
4. [Step 2 — Clone the Repository](#4-step-2--clone-the-repository)
5. [Step 3 — Configure Environment Variables](#5-step-3--configure-environment-variables)
6. [Step 4 — First Deploy](#6-step-4--first-deploy)
7. [Step 5 — Verify the Deployment](#7-step-5--verify-the-deployment)
8. [Step 6 — Secure with HTTPS (Let's Encrypt)](#8-step-6--secure-with-https-lets-encrypt)
9. [Routine Updates](#9-routine-updates)
10. [Useful Management Commands](#10-useful-management-commands)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architecture Overview

```
                         ┌──────────────────────────────────┐
                         │          Debian Server            │
                         │                                   │
  Internet ──── :80 ───► │  ┌─────────────────────────┐     │
  (HTTPS)  ──── :443 ──► │  │  Apache container        │     │
                         │  │  (umis-apache-prod)       │     │
                         │  │  image: httpd:2.4         │     │
                         │  └──────────┬────────────────┘     │
                         │             │ Docker network        │
                         │             │ umis-net (bridge)     │
                         │  ┌──────────▼────────────────┐     │
                         │  │  Next.js container        │     │
                         │  │  (umis-frontend-prod)     │     │
                         │  │  port 3000 — INTERNAL     │     │
                         │  └───────────────────────────┘     │
                         └──────────────────────────────────┘
```

**Key security principle:** Port `3000` (Next.js) is **never** mapped to the host. Only the Apache
container can reach it over the internal `umis-net` Docker bridge network. The outside world
can only connect through Apache on ports `80` and `443`.

### Service summary

| Container | Image | Role | External Port |
|---|---|---|---|
| `umis-apache-prod` | `httpd:2.4` | Reverse proxy | `:80` (`:443` after TLS setup) |
| `umis-frontend-prod` | Built from `Dockerfile` | Next.js app | None (internal only) |

---

## 2. Prerequisites

Before you start, ensure the following:

- [ ] You have **root or sudo access** on the Debian server
- [ ] The server has **internet access** (to pull Docker images and the Git repository)
- [ ] **Port 80 and 443** are open in any external firewall or cloud security group attached to the server
- [ ] A **domain name** is pointed at the server's public IP (required for HTTPS — Step 6)
- [ ] Git is installed (`git --version`); if not: `sudo apt-get install -y git`

---

## 3. Step 1 — Install Docker & Docker Compose

Docker and Docker Compose are the only system-level dependencies. Everything else runs inside containers.

### 3.1 Install Docker Engine

Run the official convenience script (recommended for Debian):

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 3.2 Allow your user to run Docker without sudo

```bash
sudo usermod -aG docker $USER
```

> **Important:** Log out and back in (or run `newgrp docker`) for this to take effect.
> Verify with: `docker run hello-world`

### 3.3 Verify Docker Compose is available

Docker Compose V2 is bundled with modern Docker Engine installations:

```bash
docker compose version
# Expected output: Docker Compose version v2.x.x
```

If the command is not found, install the plugin manually:

```bash
sudo apt-get install -y docker-compose-plugin
```

---

## 4. Step 2 — Clone the Repository

Choose a stable directory to host the application. `/opt` is the conventional location for
third-party software on Debian servers.

```bash
# Create the directory and set ownership to your user
sudo mkdir -p /opt/umis
sudo chown $USER:$USER /opt/umis

# Clone the repository
cd /opt/umis
git clone https://github.com/Ekediee/umis-frontend.git .
```

> If the repository is private, ensure your server's SSH key is added to GitHub, or use a
> Personal Access Token in the clone URL:
> `git clone https://<TOKEN>@github.com/Ekediee/umis-frontend.git .`

---

## 5. Step 3 — Configure Environment Variables

The application reads all its runtime configuration from a `.env` file in the project root.
This file is **never committed to Git** — you must create it manually on the server.

### 5.1 Create the `.env` file

```bash
cd /opt/umis
cp .env.example .env
nano .env
```

### 5.2 Fill in the required values

The file will look like this. Every field marked **REQUIRED** must be set before deploying:

```env
# ── App ───────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# ── NextAuth ───────────────────────────────────────────────
# REQUIRED: Set to the public URL users will access the app from.
# Use http:// for the initial deploy; change to https:// after Step 6 (TLS).
NEXTAUTH_URL=http://your-domain.com

# REQUIRED: A strong random secret. Generate one with the command below.
NEXTAUTH_SECRET=replace-with-a-strong-random-secret

# ── Backend API ────────────────────────────────────────────
API_URL=https://umis-sb.babcock.edu.ng
```

**Generate a strong `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
# Copy the output and paste it as the value of NEXTAUTH_SECRET in .env
```

### 5.3 Lock down the `.env` file

```bash
chmod 600 .env
```

This ensures only your user can read the file containing secrets.

---

## 6. Step 4 — First Deploy

With configuration in place, build and start all containers in one command:

```bash
cd /opt/umis
docker compose up -d --build
```

**What happens:**
1. Docker builds the Next.js image using the multi-stage `Dockerfile` (3 stages: `deps` → `builder` → `runner`). This may take 3–5 minutes on the first run.
2. Docker pulls the `httpd:2.4` Apache image.
3. Both containers start. Apache waits for Next.js to pass its health check before accepting traffic.

---

## 7. Step 5 — Verify the Deployment

### 7.1 Check container status

```bash
docker compose ps
```

You should see both containers with status **`Up`** and the `nextjs` container showing `(healthy)`:

```
NAME                   IMAGE        STATUS
umis-frontend-prod     <built>      Up X minutes (healthy)
umis-apache-prod       httpd:2.4    Up X minutes
```

> If `nextjs` shows `(health: starting)`, wait 40–60 seconds — this is the `start_period` configured in the health check. If it remains `(unhealthy)`, see [Troubleshooting](#11-troubleshooting).

### 7.2 Test the health endpoint

```bash
curl -f http://localhost/api/health
```

Expected: an HTTP `200` response.

### 7.3 Test in a browser

Navigate to `http://your-server-ip` or `http://your-domain.com`. The UMIS login page should load.

---

## 8. Step 6 — Secure with HTTPS (Let's Encrypt)

> **Prerequisite:** Your domain name must already be resolving to this server's IP address.
> You can verify with: `dig +short your-domain.com`

Because Apache runs **inside a Docker container**, TLS is terminated on the **host's Apache**
installation (not inside the container). The flow after this step will be:

```
Internet → :443 (host Apache + TLS cert) → :80 (Docker Apache container) → :3000 (Next.js)
```

### 8.1 Install host Apache and Certbot

```bash
sudo apt-get update
sudo apt-get install -y apache2 certbot python3-certbot-apache
```

### 8.2 Enable the required Apache modules on the host

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl
sudo systemctl restart apache2
```

### 8.3 Create a host-level Apache virtual host

This virtual host on the **host** (port 443) will forward decrypted traffic to the **Docker Apache container** on port 80.

```bash
sudo nano /etc/apache2/sites-available/umis-frontend.conf
```

Paste the following (replace `your-domain.com`):

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    # Certbot will convert this to a permanent redirect to HTTPS
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite umis-frontend.conf
sudo systemctl reload apache2
```

### 8.4 Obtain the SSL certificate

```bash
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

Certbot will:
1. Automatically verify domain ownership via HTTP
2. Obtain a free Let's Encrypt certificate
3. Rewrite the virtual host to add a `:443` block with the certificate paths
4. Add a permanent HTTP → HTTPS redirect for the `:80` block

### 8.5 Update the Docker container to proxy to Apache :443

Edit the host virtual host Certbot created to proxy to the Docker Apache container:

```bash
sudo nano /etc/apache2/sites-available/umis-frontend-le-ssl.conf
```

Add these lines inside the `<VirtualHost *:443>` block (before `</VirtualHost>`):

```apache
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass        / http://localhost:80/
    ProxyPassReverse / http://localhost:80/
    RequestHeader set X-Forwarded-Proto "https"
```

Reload Apache:

```bash
sudo systemctl reload apache2
```

### 8.6 Update `NEXTAUTH_URL` in `.env`

```bash
cd /opt/umis
nano .env
# Change: NEXTAUTH_URL=http://your-domain.com
# To:     NEXTAUTH_URL=https://your-domain.com
```

Restart the Next.js container to apply the change:

```bash
docker compose restart nextjs
```

### 8.7 Verify HTTPS

```bash
curl -I https://your-domain.com
# Should return HTTP/2 200 with a valid certificate
```

---

## 9. Routine Updates

When new code is pushed to the `main` branch, use the included `deploy.sh` script to redeploy with **zero manual steps**:

```bash
cd /opt/umis
bash deploy.sh
```

**What `deploy.sh` does:**
1. `git pull origin main` — fetches the latest code
2. `docker compose up -d --build` — rebuilds the Next.js image and restarts changed containers
3. `docker image prune -f` — cleans up old image layers to free disk space
4. `docker compose ps` — shows the final container status

> The `--build` flag means Docker will only rebuild layers that have changed. If `package.json`
> hasn't changed, the dependency installation step is served from cache and is very fast.

---

## 10. Useful Management Commands

### View live logs

```bash
# All services
docker compose logs -f

# Next.js only
docker compose logs -f nextjs

# Apache only
docker compose logs -f apache
```

### Stop all containers

```bash
docker compose down
```

### Stop and remove all containers + the internal network (data is preserved)

```bash
docker compose down --remove-orphans
```

### Restart a single service

```bash
docker compose restart nextjs
docker compose restart apache
```

### Open a shell inside a running container (for debugging)

```bash
# Next.js container
docker exec -it umis-frontend-prod sh

# Apache container
docker exec -it umis-apache-prod sh
```

### Check disk usage

```bash
docker system df
```

### Remove all unused images, containers, and networks

```bash
docker system prune -f
```

---

## 11. Troubleshooting

### `nextjs` container is `(unhealthy)`

The health check pings `http://localhost:3000/api/health` every 30 seconds. If it fails 3 times, Docker marks the container unhealthy.

```bash
# 1. Check Next.js logs for startup errors
docker compose logs nextjs

# 2. Common causes:
#    - Missing or wrong value in .env (e.g. NEXTAUTH_SECRET not set)
#    - Build failed silently — check for TypeScript/ESLint errors in the logs
#    - Port 3000 already in use on the host (unlikely — it's not exposed)
```

### Apache returns 502 Bad Gateway

Apache is running but cannot reach the Next.js container.

```bash
# 1. Confirm nextjs container is running and healthy
docker compose ps

# 2. Test connectivity from inside the Apache container
docker exec -it umis-apache-prod wget -qO- http://nextjs:3000/api/health

# 3. Confirm both containers are on the same network
docker network inspect umis-frontend_umis-net
```

### Permission denied when running `docker compose`

Your user is not in the `docker` group yet.

```bash
sudo usermod -aG docker $USER
newgrp docker   # apply without logging out
```

### Port 80 already in use on the host

The host system has another process (e.g. a bare-metal Apache) bound to port 80.

```bash
sudo ss -tlnp | grep ':80'
# Identify the process and stop it, e.g.:
sudo systemctl stop apache2
```

### Containers start but the site is blank or returns 404

Check that the `.env` file exists and `NEXTAUTH_URL` matches the URL you're accessing:

```bash
cat /opt/umis/.env | grep NEXTAUTH_URL
```

### `git pull` fails with "Your local changes would be overwritten"

Someone may have edited a tracked file on the server. Stash or reset:

```bash
git stash        # save local changes (recoverable)
git pull origin main
# or, if you don't need local changes:
git reset --hard origin/main
```

---

*End of deployment guide. Contact the development team for application-level issues.*
