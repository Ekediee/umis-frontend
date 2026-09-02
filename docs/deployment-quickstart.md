# UMIS Frontend — Production Deployment Guide

> **Stack:** Next.js 16 · Docker · Nginx · Debian Server  
> **Last Updated:** April 2026

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Initial Setup](#2-server-initial-setup)
3. [Install Required Software](#3-install-required-software)
4. [Configure the Firewall](#4-configure-the-firewall)
5. [Clone the Repository](#5-clone-the-repository)
6. [Configure Environment Variables](#6-configure-environment-variables)
7. [Run the Production Build](#7-run-the-production-build)
8. [Set Up HTTPS with Certbot](#8-set-up-https-with-certbot)
9. [Enable Auto-start on Reboot](#9-enable-auto-start-on-reboot)
10. [Verify the Deployment](#10-verify-the-deployment)
11. [Updating Production After Code Changes](#11-updating-production-after-code-changes)
12. [Useful Management Commands](#12-useful-management-commands)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have the following ready:

| Requirement | Details |
|-------------|---------|
| Debian server | Debian 11 (Bullseye) or Debian 12 (Bookworm) — 64-bit |
| Server access | SSH access with a sudo-capable user (not root) |
| Domain name | A domain or subdomain pointed to the server's public IP (A record set) |
| Git remote | Code pushed to GitHub / GitLab / Bitbucket |
| Local machine | Git installed and `deploy.sh` committed to the repo |

> [!IMPORTANT]
> Your domain's **A record must already be pointing to the server's IP** before you set up HTTPS in Step 8. DNS propagation can take up to 24 hours — do this first.

---

## 2. Server Initial Setup

SSH into your Debian server:

```bash
ssh your-user@your-server-ip
```

Update the system packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Create a dedicated deployment user (optional but recommended):

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
# Switch to deploy user for all remaining steps
su - deploy
```

---

## 3. Install Required Software

### 3.1 Install Docker

```bash
# Check if Docker is already installed
if command -v docker &> /dev/null; then
  echo "✅ Docker already installed: $(docker --version)"
else
  echo "📦 Installing Docker..."

  # Install dependencies
  sudo apt install -y ca-certificates curl gnupg

  # Add Docker's official GPG key
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  # Add Docker repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  # Install Docker Engine and Compose plugin
  sudo apt update
  sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

  echo "✅ Docker installed: $(docker --version)"
fi
```

**Check that Docker Compose is also available:**

```bash
if docker compose version &> /dev/null; then
  echo "✅ Docker Compose already available: $(docker compose version)"
else
  echo "📦 Installing Docker Compose plugin..."
  sudo apt install -y docker-compose-plugin
fi
```

### 3.2 Allow your user to run Docker without sudo

```bash
# Check if the current user is already in the docker group
if groups $USER | grep -q '\bdocker\b'; then
  echo "✅ User '$USER' is already in the docker group"
else
  echo "🔧 Adding user '$USER' to the docker group..."
  sudo usermod -aG docker $USER
  echo "⚠️  Group change applied — log out and back in, or run: newgrp docker"
fi

# Apply the group change without logging out (current session only)
newgrp docker

# Verify Docker works without sudo
docker --version
docker compose version
```

### 3.3 Install Git

```bash
# Check if Git is already installed
if command -v git &> /dev/null; then
  echo "✅ Git already installed: $(git --version)"
else
  echo "📦 Installing Git..."
  sudo apt install -y git
  echo "✅ Git installed: $(git --version)"
fi
```

### 3.4 Install Nginx (for Certbot integration)

```bash
# Check if Nginx is already installed
if command -v nginx &> /dev/null; then
  echo "✅ Nginx already installed: $(nginx -v 2>&1)"
  echo "   Skipping installation — existing Nginx will be used for Certbot integration."
else
  echo "📦 Installing Nginx..."
  sudo apt install -y nginx
  echo "✅ Nginx installed: $(nginx -v 2>&1)"
fi

# Ensure Nginx is running and enabled
sudo systemctl enable nginx
sudo systemctl start nginx
systemctl status nginx --no-pager
```

> [!NOTE]
> Nginx is installed on the **host** (not just inside Docker) so that Certbot can manage SSL certificates directly. The host Nginx will proxy to our Docker Nginx on port 80.  
> If Nginx was **already installed** on the server for other applications, this step is safely skipped — the existing Nginx installation will be used.

---

## 4. Configure the Firewall

```bash
# Check if UFW is already installed
if command -v ufw &> /dev/null; then
  echo "✅ UFW already installed: $(ufw --version | head -1)"
else
  echo "📦 Installing UFW..."
  sudo apt install -y ufw
fi

# Allow SSH — ALWAYS run this before enabling UFW to avoid locking yourself out.
# If SSH is already allowed, this command is safe to run again (idempotent).
sudo ufw allow OpenSSH

# Allow HTTP — skip if already present (ufw is idempotent for duplicate rules)
if sudo ufw status | grep -q '80/tcp'; then
  echo "✅ Port 80 (HTTP) already allowed in UFW"
else
  sudo ufw allow 80/tcp
  echo "✅ Port 80 (HTTP) allowed"
fi

# Allow HTTPS
if sudo ufw status | grep -q '443/tcp'; then
  echo "✅ Port 443 (HTTPS) already allowed in UFW"
else
  sudo ufw allow 443/tcp
  echo "✅ Port 443 (HTTPS) allowed"
fi

# Enable UFW (safe to run even if already active)
sudo ufw --force enable

# Verify the rules
sudo ufw status
```

Expected output:
```
Status: active
To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 5. Clone the Repository

Choose a deployment directory (e.g. `/srv/umis-frontend`):

```bash
sudo mkdir -p /srv/umis-frontend
sudo chown $USER:$USER /srv/umis-frontend

# Clone your repository
git clone https://github.com/YOUR_ORG/umis-frontend.git /srv/umis-frontend

cd /srv/umis-frontend
```

> [!NOTE]
> If your repository is **private**, you will need to authenticate. The recommended approach is to use a **deploy key** (an SSH key added to the repo with read-only access):
> ```bash
> # Generate a deploy key on the server
> ssh-keygen -t ed25519 -C "umis-server-deploy" -f ~/.ssh/deploy_key -N ""
> cat ~/.ssh/deploy_key.pub
> # Add the public key as a deploy key in your GitHub/GitLab repo settings
> ```

---

## 6. Configure Environment Variables

```bash
cd /srv/umis-frontend

# Create the production env file from the template
cp .env.example .env

# Open and edit the env file
nano .env
```

Fill in **every required value**:

```env
# ── App ──────────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# ── NextAuth ──────────────────────────────────────────────────────────────────
NEXTAUTH_URL=https://your-domain.com          # ← your actual domain
NEXTAUTH_SECRET=<generated-secret>             # ← see below

# ── Backend API (when ready) ──────────────────────────────────────────────────
# NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

**Generate a secure `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

> [!CAUTION]
> **Never commit `.env` to Git.** It is already listed in `.gitignore`. Keep it only on the server. If it is ever exposed, regenerate `NEXTAUTH_SECRET` immediately and redeploy.

---

## 7. Run the Production Build

```bash
cd /srv/umis-frontend

# Build the Docker image and start both services (Next.js + Nginx)
docker compose up -d --build
```

This command:
1. Builds a fresh Next.js production image using the multi-stage `Dockerfile`
2. Starts the `nextjs` container (internal port 3000 only)
3. Starts the `nginx` container (port 80, public-facing)

**Check that both containers are running:**

```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS          PORTS
umis-frontend-prod      Up (healthy)    3000/tcp
umis-nginx-prod         Up              0.0.0.0:80->80/tcp
```

**Quick smoke test:**

```bash
curl -I http://localhost
```

You should see `HTTP/1.1 200 OK`. The app is now live on port 80.

---

## 8. Set Up HTTPS with Certbot

Install Certbot (checks for existing installation first):

```bash
# Check if Certbot is already installed
if command -v certbot &> /dev/null; then
  echo "✅ Certbot already installed: $(certbot --version)"
else
  echo "📦 Installing Certbot and the Nginx plugin..."
  sudo apt install -y certbot python3-certbot-nginx
  echo "✅ Certbot installed: $(certbot --version)"
fi
```

Stop the host Nginx temporarily (Certbot needs port 80 free, and our Docker Nginx is already using it):

```bash
# First, stop Docker Nginx temporarily
docker compose stop nginx

# Obtain the certificate using standalone mode
sudo certbot certonly --standalone -d your-domain.com

# Restart Docker Nginx
docker compose start nginx
```

> [!NOTE]
> After obtaining the certificate, you have two options for serving HTTPS:
>
> **Option A (Recommended for simplicity):** Configure the **host Nginx** as a TLS terminator that proxies to Docker's Nginx on port 80. Certbot manages this automatically.
>
> **Option B:** Mount the Certbot certificates into the Docker Nginx container and configure TLS inside `nginx/nginx.conf`.
>
> **Option A** is simpler because Certbot's auto-renewal hooks work without any Docker interaction.

### Option A: Host Nginx as TLS Terminator

Create a host Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/umis-frontend
```

Paste the following (replace `your-domain.com`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and reload:

```bash
sudo ln -s /etc/nginx/sites-available/umis-frontend /etc/nginx/sites-enabled/
sudo nginx -t        # verify config is valid
sudo systemctl reload nginx
```

**Test auto-renewal:**

```bash
sudo certbot renew --dry-run
```

Your site is now live at `https://your-domain.com` 🎉  
Certbot will automatically renew the certificate before it expires (every 90 days).

---

## 9. Enable Auto-start on Reboot

Ensure Docker starts on boot and the containers restart automatically:

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# The containers are already configured with `restart: unless-stopped`
# so they will restart automatically when Docker starts.
# Verify this setting:
docker compose ps
```

**Test the reboot behaviour:**

```bash
sudo reboot
# After reboot, SSH back in and check:
docker compose -f /srv/umis-frontend/docker-compose.yml ps
```

Both containers should show `Up` automatically.

---

## 10. Verify the Deployment

Run these checks after deployment to confirm everything is working correctly:

```bash
# ✅ Both containers running
docker compose ps

# ✅ App responds on port 80
curl -I http://localhost

# ✅ App responds on HTTPS (after Certbot setup)
curl -I https://your-domain.com

# ✅ No errors in the Next.js container logs
docker compose logs --tail=50 nextjs

# ✅ No errors in the Nginx container logs
docker compose logs --tail=50 nginx

# ✅ Check image size (should be well under 500 MB)
docker images umis-frontend-umis-frontend-prod

# ✅ Confirm no secrets are baked into the image
docker history umis-frontend-umis-frontend-prod
```

---

## 11. Updating Production After Code Changes

Every time you push new code and want to update production, follow these steps:

### From your local machine

```bash
git add .
git commit -m "your commit message"
git push origin main
```

### On the Debian server

```bash
cd /srv/umis-frontend
bash deploy.sh
```

The `deploy.sh` script will:
1. Pull the latest code from `main`
2. Rebuild the Docker image with the new code
3. Replace the running container (brief ~5 second downtime)
4. Prune unused old images to free disk space
5. Print the container status

> [!IMPORTANT]
> If you added a **new environment variable** in your code, you must also add it to `.env` on the server **before** running `deploy.sh`, otherwise the container will start without it.

### Rolling back to a previous version

```bash
# Find the commit you want to roll back to
git log --oneline -10

# Check out that commit
git checkout <commit-hash>

# Rebuild and deploy the old version
docker compose up -d --build

# When ready to move forward again
git checkout main
```

---

## 12. Useful Management Commands

```bash
# View live logs from Next.js
docker compose logs -f nextjs

# View live logs from Nginx
docker compose logs -f nginx

# Restart only the Next.js container (without rebuild)
docker compose restart nextjs

# Stop all containers
docker compose down

# Stop and remove all containers + network (keeps .env and volumes)
docker compose down --remove-orphans

# Free up disk space (removes unused images, stopped containers, dangling volumes)
docker system prune -f

# Check disk usage by Docker
docker system df

# Open a shell inside the running Next.js container (for debugging)
docker exec -it umis-frontend-prod sh

# Check environment variables loaded inside the container
docker exec umis-frontend-prod env | grep -v SECRET
```

---

## 13. Troubleshooting

### Container exits immediately after starting

```bash
docker compose logs nextjs
```

Common causes:
- Missing or invalid environment variable in `.env`
- `NEXTAUTH_SECRET` not set or too short
- Port 3000 already in use by another process

---

### `502 Bad Gateway` from Nginx

The Nginx container is running but cannot reach the Next.js container.

```bash
# Check if nextjs container is healthy
docker compose ps

# Check Next.js logs for startup errors
docker compose logs nextjs

# Restart both services
docker compose restart
```

---

### HTTPS certificate errors

```bash
# Check certificate validity
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check host Nginx config
sudo nginx -t
sudo systemctl status nginx
```

---

### Container running but page shows old version

The old Docker image may have been cached. Force a full rebuild:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

### Out of disk space

```bash
# Check disk usage
df -h

# Clean up all unused Docker resources
docker system prune -af --volumes

# Check what's using the most space
docker system df -v
```

---

*For development setup and hot-reload instructions, see `docker-compose.dev.yml` and `.env.dev.example`.*
