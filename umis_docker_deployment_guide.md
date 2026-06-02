# UMIS Frontend — Docker Production Deployment Guide

**Audience:** Server Administrator  
**Server OS:** Debian (or Debian-based, e.g. Ubuntu 22.04 / 24.04)  
**Last Updated:** May 2026

---

## Table of Contents
1. Architecture Overview
2. Prerequisites
3. Step 1 — Install Host Dependencies (Docker, Apache, Certbot)
4. Step 2 — Clone the Repository
5. Step 3 — Configure Environment Variables
6. Step 4 — First Docker Deploy
7. Step 5 — Configure Host Apache & Obtain SSL
8. Routine Updates
9. Useful Management Commands
10. Troubleshooting

---

## 1. Architecture Overview

```text
┌───────────────────────────────────────────────────┐
│                  Debian Server                    │
│                                                   │
│  Internet ─── :80  ───► │  ┌──────────────────────────────────────────────┐ │
│  (HTTPS)  ─── :443 ───► │  │ Host Apache (apache2 service)                │ │
│                         │  │ Acts as reverse proxy & terminates TLS       │ │
│                         │  └──────────────────────┬───────────────────────┘ │
│                         │                         │ Proxies over loopback   │
│                         │                         ▼ (http://127.0.0.1:3000) │
│                         │  ┌──────────────────────────────────────────────┐ │
│                         │  │ Next.js Docker Container (umis-frontend-prod)│ │
│                         │  │ Port 3000 — loopback mapping                 │ │
│                         │  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Key security principle:** Port 3000 (Next.js) is bound strictly to `127.0.0.1` (loopback) on the host. This means external traffic cannot reach Next.js directly. The outside world can only connect through the host Apache on ports 80 and 443.

---

## 2. Prerequisites
Before starting, ensure:
*   You have root or sudo access on the Debian server.
*   The server has internet access to pull Docker images and package updates.
*   Port 80 and 443 are open in the system firewall (e.g., `ufw`) and any cloud-level security groups.
*   A domain name (e.g., `your-domain.com`) resolves to the server's public IP address.
*   Git is installed (`sudo apt-get install -y git`).

---

## 3. Step 1 — Install Host Dependencies (Docker, Apache, Certbot)
All core reverse-proxying and SSL management will happen natively on the host server. Next.js runs containerized.

### 3.1 Install Docker Engine
Run the official convenience script (recommended for Debian/Ubuntu environments):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```
Allow your standard system user to run Docker commands without prefixing sudo:
```bash
sudo usermod -aG docker $USER
```
**Important:** Log out and log back in, or run `newgrp docker` for group membership updates to apply. Verify via: `docker run hello-world`

### 3.2 Install Host Apache & Certbot
Install Apache, the Certbot client, and the Certbot Apache plugin:
```bash
sudo apt-get update
sudo apt-get install -y apache2 certbot python3-certbot-apache
```

### 3.3 Enable Required Apache Modules
Ensure Apache is configured with the proxy, rewrite, and header modules required to route traffic to Next.js and secure connections:
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl
sudo systemctl restart apache2
```

---

## 4. Step 2 — Clone the Repository
We will use `/opt/umis` as the installation directory.
```bash
# Create the directory and set ownership to your user
sudo mkdir -p /opt/umis
sudo chown $USER:$USER /opt/umis

# Clone the repository
cd /opt/umis
git clone https://github.com/Ekediee/umis-frontend.git .
```

---

## 5. Step 3 — Configure Environment Variables
Create and lock down the production `.env` file containing Next.js secrets.
```bash
cd /opt/umis
cp .env.example .env
nano .env
```

### 5.1 Fill in the required values
Set the following parameters:
```env
# ── App ───────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# ── NextAuth ───────────────────────────────────────────────
# Set to your domain. Start with https:// as we will apply TLS in Step 6.
NEXTAUTH_URL=https://your-domain.com

# REQUIRED: A strong random secret. Generate using the openssl command below.
NEXTAUTH_SECRET=replace-with-a-strong-random-secret

# ── Backend API ────────────────────────────────────────────
API_URL=https://umis-sb.babcock.edu.ng
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```
Copy the output and save it in your `.env` file. Secure the file permissions:
```bash
chmod 600 /opt/umis/.env
```

---

## 6. Step 4 — First Docker Deploy
With configuration files in place, trigger the initial Docker build and start the service:
```bash
cd /opt/umis
docker compose up -d --build
```

### Verify Container Health
Verify that the Next.js container built successfully and is running:
```bash
docker compose ps
```
You should see:
```text
NAME                   IMAGE        STATUS
umis-frontend-prod     <built>      Up X minutes (healthy)
```
*(Note: It may take up to 40 seconds to transition from starting to healthy due to the start_period setting).*

---

## 7. Step 5 — Configure Host Apache & Obtain SSL
We will now point the host's Apache server to our container and obtain a Let's Encrypt TLS certificate.

### 7.1 Create the Host VirtualHost Configuration
Create a new configuration file for your domain:
```bash
sudo nano /etc/apache2/sites-available/umis-frontend.conf
```
Paste the following configuration. Replace `your-domain.com` and `www.your-domain.com` with your real domain:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    ProxyPreserveHost On
    ProxyRequests Off

    # ── Real-client headers ───────────────────────────────────────────────────
    # Forwards client IP information and dynamically sets the protocol 
    # (HTTP vs HTTPS) based on the incoming connection.
    RequestHeader set X-Real-IP         "%{REMOTE_ADDR}s"
    RequestHeader set X-Forwarded-For   "%{X-Forwarded-For}i"
    RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}

    # ── WebSocket support ─────────────────────────────────────────────────────
    # Proxies WebSockets (such as Next.js HMR or Server-Sent Events) correctly.
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^/(.*)$        ws://127.0.0.1:3000/$1 [P,L]

    # ── Static asset caching ──────────────────────────────────────────────────
    # Caches Next.js content-hashed assets
    <LocationMatch "^/_next/static/">
        ProxyPass        http://127.0.0.1:3000/_next/static/
        ProxyPassReverse http://127.0.0.1:3000/_next/static/
        Header set Cache-Control "public, max-age=31536000, immutable"
    </LocationMatch>

    # Caches public directory assets
    <LocationMatch "^/public/">
        ProxyPass        http://127.0.0.1:3000/public/
        ProxyPassReverse http://127.0.0.1:3000/public/
        Header set Cache-Control "public, max-age=86400"
    </LocationMatch>

    # ── All other requests → Next.js ──────────────────────────────────────────
    ProxyPass        / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # Disable buffering for streaming responses (React Server Components, SSE)
    SetEnv proxy-sendcl         1
    SetEnv force-proxy-request  1
    SetEnv proxy-nokeepalive    0

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/umis-error.log
    CustomLog ${APACHE_LOG_DIR}/umis-access.log combined
</VirtualHost>
```

### 7.2 Enable the Site
Disable the default Apache configuration and enable the newly created site:
```bash
sudo a2dissite 000-default.conf
sudo a2ensite umis-frontend.conf
sudo systemctl reload apache2
```
At this point, visiting `http://your-domain.com` in a browser should open the application.

### 7.3 Obtain and Apply the Let's Encrypt SSL Certificate
Run Certbot to acquire certificates and secure the site. Certbot will automatically:
1. Complete the domain challenge via HTTP.
2. Obtain the certificates.
3. Generate a new `<VirtualHost *:443>` configuration block and apply SSL certificates.
4. Copy the proxy rules from your `:80` block to the `:443` block.
5. Set up an automatic HTTP-to-HTTPS redirect.
```bash
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

### 7.4 Reload Apache to Finalize
```bash
sudo systemctl reload apache2
```
Your app is now securely served over HTTPS.

---

## 8. Routine Updates
Use the internal deployment script (`deploy.sh`) to perform updates with minimal downtime:
```bash
cd /opt/umis
bash deploy.sh
```
Ensure your `deploy.sh` script is set up as follows:
```bash
#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding and deploying containers..."
docker compose up -d --build

echo "Pruning unused Docker assets..."
docker image prune -f

echo "Deployment status:"
docker compose ps
```
Make the script executable:
```bash
chmod +x /opt/umis/deploy.sh
```

---

## 9. Useful Management Commands

### View Application Logs
```bash
# View live Next.js logs
docker compose logs -f nextjs

# View live Apache access & error logs on the host
sudo tail -f /var/log/apache2/umis-access.log
sudo tail -f /var/log/apache2/umis-error.log
```

### Stop / Restart Services
```bash
# Stop Next.js container
docker compose down

# Restart Next.js container
docker compose restart nextjs

# Restart Host Apache
sudo systemctl restart apache2
```

---

## 10. Troubleshooting

**Next.js container is (unhealthy) or restarting**
*   The Docker health check calls `http://localhost:3000/api/health` every 30 seconds.
*   Check logs: `docker compose logs nextjs`
*   Common cause: Incorrect or missing variables inside `/opt/umis/.env`.

**502 Bad Gateway (Apache cannot reach Next.js)**
*   Check if the container is running: `docker compose ps`
*   Verify port 3000 binding: `sudo ss -tlnp | grep :3000` (Expected: `LISTEN 127.0.0.1:3000`)
*   Test Next.js directly from host: `curl -i http://127.0.0.1:3000/api/health`

**503 Service Unavailable / Certbot failing to run**
*   Confirm ports 80 and 443 are open: `sudo ufw status`
*   Check DNS resolution: `dig +short your-domain.com`