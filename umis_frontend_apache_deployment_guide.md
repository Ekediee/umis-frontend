# Deployment Guide: UMIS Frontend on Linux (with Apache)

## 1. Introduction

This guide provides comprehensive, step-by-step instructions for deploying the UMIS Frontend application on a production Linux server. The application is built with **Next.js 16** (configured with `output: 'standalone'`).

### 1.1. Architecture Overview

This deployment focuses on the **Next.js frontend only**, running securely behind an Apache reverse proxy.

-   **Application:** Next.js 16 (standalone output mode)
-   **Process Manager:** PM2
-   **Web Server / Reverse Proxy:** Apache (httpd / apache2)

> **Note on Standalone Mode:** This app uses `output: 'standalone'` in `next.config.ts`. This produces a self-contained server bundle at `.next/standalone/server.js`. The standard `next start` command does **not** work in this mode — PM2 must launch `server.js` directly (see Step 3.5).

This guide will walk you through setting up all the necessary components to run the application securely and reliably.

---

## 2. Prerequisites

Before you begin, please ensure you have the following:

1.  **A Linux Server:** A server running a recent version of a Debian-based distribution (e.g., Ubuntu 22.04) or a Fedora-based distribution (e.g., Fedora, CentOS, RHEL).
2.  **Root or Sudo Access:** You must have administrative privileges to install packages and edit system configuration files.
3.  **Domain Name (Optional but Recommended):** If you plan to host the application on a public domain, ensure you have one ready and its DNS A/AAAA records are pointing to your server's IP address (e.g., `umis.babcock.edu.ng`). DNS propagation can take up to 24 hours — configure this before setting up HTTPS.

---

## 3. Deployment Steps

Follow these steps in order. Commands are provided for both Debian/Ubuntu and Fedora/CentOS where they differ.

### Step 3.1: Server Setup & Initial Dependencies

First, we need to prepare the server by installing essential tools like Git, a firewall, and Apache.

1.  **Update System Packages:**
    *   **Debian/Ubuntu:**
        ```bash
        sudo apt-get update && sudo apt-get upgrade -y
        ```
    *   **Fedora/CentOS:**
        ```bash
        sudo dnf update -y
        ```

2.  **Install Essential Tools (Git, Curl, Apache):**
    *   **Debian/Ubuntu:**
        ```bash
        sudo apt-get install -y git curl apache2
        ```
    *   **Fedora/CentOS:**
        ```bash
        sudo dnf install -y git curl httpd
        ```

3.  **Start and Enable Apache:**
    *   **Debian/Ubuntu:**
        ```bash
        sudo systemctl start apache2
        sudo systemctl enable apache2
        ```
    *   **Fedora/CentOS:**
        ```bash
        sudo systemctl start httpd
        sudo systemctl enable httpd
        ```

4.  **Configure Firewall:**
    *   **Debian/Ubuntu (using `ufw`):**
        ```bash
        sudo ufw allow 'Apache Full'
        sudo ufw allow 'OpenSSH'
        sudo ufw enable
        ```
    *   **Fedora/CentOS (using `firewalld`):**
        ```bash
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        ```

### Step 3.2: Install Node.js and PM2

The application requires a Node.js environment and a process manager to keep it running continuously. We recommend using Node Version Manager (`nvm`).

1.  **Install `nvm`:**
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```

2.  **Load `nvm` into your shell:**
    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    ```
    *To make this permanent, add these lines to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) and restart your shell session.*

3.  **Install Node.js (LTS version 20.x):**
    ```bash
    nvm install 20
    nvm use 20
    nvm alias default 20
    ```

4.  **Install PM2 Globally:**
    PM2 is a powerful process manager that will keep your application online.
    ```bash
    npm install pm2 -g
    ```

### Step 3.3: Get and Configure the Application

Now we will download the application code and configure it for your production environment.

1.  **Clone the Repository:**
    Clone the project code from its Git repository into a dedicated directory.
    ```bash
    sudo mkdir -p /srv/umis-frontend
    sudo chown $USER:$USER /srv/umis-frontend
    git clone https://github.com/Ekediee/umis-frontend.git /srv/umis-frontend
    cd /srv/umis-frontend
    ```

    > **Private repository?** Use a deploy key:
    > ```bash
    > ssh-keygen -t ed25519 -C "umis-server-deploy" -f ~/.ssh/deploy_key -N ""
    > cat ~/.ssh/deploy_key.pub
    > # Add the public key as a read-only deploy key in your GitHub repo settings
    > ```

2.  **Create the Environment Configuration File:**
    Create a file named `.env` based on the provided template.
    ```bash
    cp .env.example .env
    nano .env
    ```

    Fill in **all** of the required values below. Every variable listed is required — missing any will cause login or API failures.

    ```env
    # ── App ──────────────────────────────────────────────────────────────────────
    NODE_ENV=production
    PORT=3000
    HOSTNAME=0.0.0.0

    # ── Session Cookies ───────────────────────────────────────────────────────────
    # Set to "true" if this server is HTTP-only (no HTTPS/TLS).
    # The app sets Secure cookies in production by default; without HTTPS the
    # browser will silently drop them and users will be unable to log in.
    # Remove this line (or set to "false") once HTTPS is configured.
    DISABLE_SECURE_COOKIES=true

    # ── NextAuth ──────────────────────────────────────────────────────────────────
    # Must match the public URL users access the app from (update to https:// after
    # enabling SSL in Step 4.2).
    NEXTAUTH_URL=http://<your_domain_or_server_ip>

    # Generate a strong secret with: openssl rand -base64 32
    NEXTAUTH_SECRET=<generate_a_secure_random_string_here>

    # ── Backend API ───────────────────────────────────────────────────────────────
    # Required — all login and data fetch actions read this variable.
    # Without it every API call will fail with "API_URL is not defined".
    API_URL=https://umis-sb.babcock.edu.ng
    ```

    *(You can generate a secure `NEXTAUTH_SECRET` using `openssl rand -base64 32`)*

    > **Never commit `.env` to Git.** It is already listed in `.gitignore`. Keep it only on the server.

    Save and close the file (in `nano`: `Ctrl+X`, then `Y`, then `Enter`).

### Step 3.4: Build the Application

We will now install the project's dependencies and create a production-ready build.

1.  **Install Dependencies:**
    Use `npm ci` (instead of `npm install`) for a deterministic, lock-file-exact install suited to production environments.
    ```bash
    npm ci
    ```

2.  **Build for Production:**
    This command compiles the code and optimizes it for performance. Because `output: 'standalone'` is set, the build produces a self-contained bundle at `.next/standalone/`.
    ```bash
    npm run build
    ```

3.  **Copy Static Assets (Handled Automatically):**
    Static assets are now copied automatically by the `postbuild` script when `npm run build` completes.
    You should see the following output at the end of the build:
    ```
    Copying .next/static to standalone...
    Copying public to standalone...
    Postbuild copy completed successfully.
    ```
    If for any reason the copy did not run, you can run it manually:
    ```bash
    node scripts/postbuild.js
    ```

### Step 3.5: Run the Application with PM2

With the application built, we will use PM2 to start it and ensure it runs continuously.

> **Important:** Because this app uses `output: 'standalone'`, PM2 must launch `.next/standalone/server.js` directly with Node.js. Using `npm start` (i.e. `next start`) will not work with standalone output and will cause the process to crash immediately.

1.  **Start the Application:**
    ```bash
    pm2 start node \
      --name "umis-frontend" \
      --env production \
      -- /srv/umis-frontend/.next/standalone/server.js
    ```

2.  **Verify the Application is Running:**
    Check the status and confirm the process shows `online`:
    ```bash
    pm2 list
    pm2 logs umis-frontend --lines 30
    ```
    You should see `umis-frontend` with an `online` status and no crash errors in the logs.

3.  **Quick Smoke Test:**
    Confirm the app responds on its local port before wiring up Apache:
    ```bash
    curl -I http://localhost:3000
    ```
    You should receive an `HTTP/1.1 200 OK` response.

4.  **Save the PM2 Process List:**
    This ensures that if the server reboots, PM2 will automatically restart your application.
    ```bash
    pm2 save
    ```

5.  **Configure PM2 to Start on Boot:**
    PM2 will generate a `sudo` command for you to run. Copy and paste the exact command it outputs into your terminal.
    ```bash
    pm2 startup
    ```

### Step 3.6: Configure Apache as a Reverse Proxy

Finally, we will configure Apache to securely expose your application to the internet. Apache will listen for public traffic (on port 80) and forward it to your Next.js application running locally on port 3000.

1.  **Enable Required Apache Modules (Debian/Ubuntu):**
    Enable the proxy, proxy_http, rewrite, and headers modules needed to act as a reverse proxy and handle WebSockets.
    ```bash
    sudo a2enmod proxy
    sudo a2enmod proxy_http
    sudo a2enmod proxy_wstunnel
    sudo a2enmod rewrite
    sudo a2enmod headers
    sudo systemctl restart apache2
    ```
    *(Note: On Fedora/CentOS, these modules are typically enabled by default in `/etc/httpd/conf.modules.d/`)*

2.  **Create an Apache Virtual Host Configuration:**
    *   **Debian/Ubuntu:**
        ```bash
        sudo nano /etc/apache2/sites-available/umis-frontend.conf
        ```
    *   **Fedora/CentOS:**
        ```bash
        sudo nano /etc/httpd/conf.d/umis-frontend.conf
        ```

3.  **Paste the Following Configuration:**
    Copy and paste the entire block below into the file. Replace `your_domain.com` with your actual domain name or server IP address.

    ```apache
    <VirtualHost *:80>
        ServerName your_domain.com
        ServerAlias www.your_domain.com

        # Pass the original host header to Next.js (required for NextAuth URL matching)
        ProxyPreserveHost On
        ProxyRequests Off

        # Pass real client IP and protocol headers
        RequestHeader set X-Real-IP "%{REMOTE_ADDR}s"
        RequestHeader set X-Forwarded-For "%{X-Forwarded-For}i"

        # Dynamically reflect the actual protocol (http or https).
        # Do NOT hardcode "http" here — it will break NextAuth after enabling HTTPS.
        RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}

        # Limit request body size (20 MB — adjust if file uploads are needed)
        LimitRequestBody 20971520

        # Enable WebSocket Support (required by Next.js for some features)
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteRule ^/(.*)$ ws://localhost:3000/$1 [P,L]

        # Cache Next.js static assets aggressively — filenames are content-hashed
        # so they are safe to cache forever.
        <LocationMatch "^/_next/static/">
            ProxyPass        http://localhost:3000/_next/static/
            ProxyPassReverse http://localhost:3000/_next/static/
            Header set Cache-Control "public, max-age=31536000, immutable"
        </LocationMatch>

        # Proxy all other requests to Next.js
        ProxyPass / http://localhost:3000/
        ProxyPassReverse / http://localhost:3000/

        # Disable proxy-side response buffering so streaming responses
        # (React Server Components, SSE) are flushed to the client immediately.
        SetEnv proxy-sendcl 1

        # Error Logging
        ErrorLog ${APACHE_LOG_DIR}/umis-frontend-error.log
        CustomLog ${APACHE_LOG_DIR}/umis-frontend-access.log combined
    </VirtualHost>
    ```
    *(Note: On Fedora/CentOS replace `${APACHE_LOG_DIR}` with `/var/log/httpd`)*

    Save and close the file.

4.  **Validate the Configuration Before Restarting Apache:**
    Always test the config for syntax errors before restarting to avoid taking the server offline.
    *   **Debian/Ubuntu:**
        ```bash
        sudo apache2ctl configtest
        ```
    *   **Fedora/CentOS:**
        ```bash
        sudo httpd -t
        ```
    You should see `Syntax OK`. If there are errors, correct them before proceeding.

5.  **Enable the Configuration and Restart Apache:**
    *   **Debian/Ubuntu:**
        ```bash
        sudo a2ensite umis-frontend.conf
        sudo systemctl restart apache2
        ```
    *   **Fedora/CentOS:**
        ```bash
        sudo systemctl restart httpd
        ```

---

## 4. Verify the Deployment

Run these checks to confirm everything is working before going live.

```bash
# ✅ PM2 process is online
pm2 list

# ✅ App responds directly on port 3000
curl -I http://localhost:3000

# ✅ Apache is proxying correctly on port 80
curl -I http://localhost

# ✅ App is accessible via your domain
curl -I http://your_domain.com

# ✅ Check PM2 logs for startup errors
pm2 logs umis-frontend --lines 50

# ✅ Check Apache error log
sudo tail -n 50 /var/log/apache2/umis-frontend-error.log   # Debian/Ubuntu
sudo tail -n 50 /var/log/httpd/umis-frontend-error.log     # Fedora/CentOS
```

---

## 5. Future Updates

To update the application after code changes, follow these steps:

1.  Navigate to the project directory: `cd /srv/umis-frontend`
2.  Pull the latest changes: `git pull origin main`
3.  Install any new dependencies: `npm ci`
4.  Rebuild the application: `npm run build`
    *(The postbuild script automatically copies static assets and the public folder — no extra steps needed.)*
5.  Restart the application via PM2: `pm2 restart umis-frontend`

> **New environment variable?** If the update introduces a new env variable, add it to `.env` on the server **before** running `pm2 restart`, otherwise the app will start without it.

> **Static assets:** The `postbuild` script now copies `.next/static` and `public` to the standalone folder automatically on every `npm run build`. No manual `cp` commands are required.

---

## 6. Securing with SSL (HTTPS)

For a production environment, it is highly recommended to secure your site with an SSL certificate. You can get a free certificate from Let's Encrypt using the `certbot` tool.

1.  **Install Certbot and the Apache Plugin:**
    *   **Debian/Ubuntu:** `sudo apt-get install -y certbot python3-certbot-apache`
    *   **Fedora/CentOS:** `sudo dnf install -y certbot python3-certbot-apache`

2.  **Obtain and Install the Certificate:**
    Run the following command and follow the on-screen instructions. Certbot will automatically detect your domain from your Apache configuration, obtain a certificate, and configure Apache to use HTTPS.
    ```bash
    sudo certbot --apache -d your_domain.com -d www.your_domain.com
    ```

3.  **Update Environment Variables for HTTPS:**
    After enabling HTTPS, update your `.env` file:
    ```env
    # Switch NEXTAUTH_URL to https://
    NEXTAUTH_URL=https://your_domain.com

    # Remove or comment out DISABLE_SECURE_COOKIES now that HTTPS is active.
    # Secure cookies will now work correctly.
    # DISABLE_SECURE_COOKIES=true
    ```
    Then restart PM2 to apply the changes:
    ```bash
    pm2 restart umis-frontend
    ```

4.  **Test Certificate Auto-Renewal:**
    Certbot installs a cron/systemd timer that renews certificates automatically before they expire. Test it with:
    ```bash
    sudo certbot renew --dry-run
    ```

5.  **Verify HTTPS is Working:**
    ```bash
    curl -I https://your_domain.com
    ```
    You should see `HTTP/2 200` (or `HTTP/1.1 200 OK`).

---

## 7. Troubleshooting

### PM2 process crashes immediately after starting

```bash
pm2 logs umis-frontend --lines 50
```

Common causes:
- **Wrong start command used** — ensure you are launching `node .next/standalone/server.js`, not `npm start`.
- `PORT` already in use by another process (`sudo lsof -i :3000`).
- Missing environment variable (`API_URL`, `NEXTAUTH_SECRET`, etc.).
- Static assets not copied — run the `cp -r` commands from Step 3.4.3 again.

### `502 Bad Gateway` from Apache

Apache is running but cannot reach the Next.js app on port 3000.

```bash
# Is the PM2 process actually online?
pm2 list

# Is port 3000 listening?
ss -tlnp | grep 3000

# Check PM2 logs for crash errors
pm2 logs umis-frontend --lines 50

# Restart the app
pm2 restart umis-frontend
```

### Users cannot log in (session/cookie issue)

If the server is HTTP-only and users cannot log in after entering correct credentials, check that `DISABLE_SECURE_COOKIES=true` is set in `.env` and restart PM2:
```bash
pm2 restart umis-frontend
```
Once HTTPS is enabled, remove this variable.

### HTTPS certificate errors

```bash
# Check certificate validity
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check Apache config
sudo apache2ctl configtest   # Debian/Ubuntu
sudo httpd -t                # Fedora/CentOS
```

### Old version shown after update

The standalone bundle may be stale. Force a clean rebuild:
```bash
rm -rf .next
npm run build
pm2 restart umis-frontend
```

---

*This concludes the Apache deployment guide for the UMIS Frontend.*
