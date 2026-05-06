# Deployment Guide: UMIS Frontend on Linux (with Apache)

## 1. Introduction

This guide provides comprehensive, step-by-step instructions for deploying the UMIS Frontend application on a production Linux server. The application is built with Next.js 16.

### 1.1. Architecture Overview

This deployment focuses on the **Next.js frontend only**, running securely behind an Apache reverse proxy.

-   **Application:** Next.js 16
-   **Process Manager:** PM2
-   **Web Server / Reverse Proxy:** Apache (httpd / apache2)

This guide will walk you through setting up all the necessary components to run the application securely and reliably.

---

## 2. Prerequisites

Before you begin, please ensure you have the following:

1.  **A Linux Server:** A server running a recent version of a Debian-based distribution (e.g., Ubuntu 22.04) or a Fedora-based distribution (e.g., Fedora, CentOS, RHEL).
2.  **Root or Sudo Access:** You must have administrative privileges to install packages and edit system configuration files.
3.  **Domain Name (Optional but Recommended):** If you plan to host the application on a public domain, ensure you have one ready and its DNS A/AAAA records are pointing to your server's IP address (e.g., `umis.babcock.edu.ng`).

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
    *To make this permanent, you may need to add these lines to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).*

3.  **Install Node.js (LTS version 20.x):**
    ```bash
    nvm install 20
    nvm use 20
    ```

4.  **Install PM2 Globally:**
    PM2 is a powerful process manager that will keep your application online.
    ```bash
    npm install pm2 -g
    ```

### Step 3.3: Get and Configure the Application

Now we will download the application code and configure it for your production environment.

1.  **Clone the Repository:**
    Clone the project code from its Git repository into your home directory (or another appropriate location).
    ```bash
    git clone https://github.com/Ekediee/umis-frontend.git
    ```

2.  **Navigate to the Project Directory:**
    ```bash
    cd umis-frontend
    ```

3.  **Create the Environment Configuration File:**
    Create a file named `.env` based on the provided template.
    ```bash
    cp .env.example .env
    nano .env
    ```
    Ensure you set the required environment variables, specifically for NextAuth. Add a strong random secret and configure your live URL:
    ```env
    NODE_ENV=production
    PORT=3000
    
    NEXTAUTH_URL=http://<your_domain_or_server_ip>
    NEXTAUTH_SECRET=<generate_a_secure_random_string_here>
    ```
    *(You can generate a secure string using `openssl rand -base64 32`)*
    Save and close the file (in `nano`, press `Ctrl+X`, then `Y`, then `Enter`).

### Step 3.4: Build the Application

We will now install the project's dependencies and create a production-ready build.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Build for Production:**
    This command compiles the code and optimizes it for performance.
    ```bash
    npm run build
    ```

### Step 3.5: Run the Application with PM2

With the application built, we will use PM2 to start it and ensure it runs continuously.

1.  **Start the Application:**
    This command starts the Next.js app, gives it a name for easy management, and passes the `start` command to the `npm` script.
    ```bash
    pm2 start npm --name "umis-frontend" -- start
    ```

2.  **Verify the Application is Running:**
    Check the status of your application with:
    ```bash
    pm2 list
    ```
    You should see `umis-frontend` with an `online` status.

3.  **Save the PM2 Process List:**
    This ensures that if the server reboots, PM2 will automatically restart your application.
    ```bash
    pm2 save
    ```

4.  **Configure PM2 to Start on Boot:**
    PM2 will generate a command for you to run. Copy and paste the command it gives you to your terminal.
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

        # Pass the original host header to Next.js
        ProxyPreserveHost On
        ProxyRequests Off

        # Pass real client IP and protocol headers
        RequestHeader set X-Real-IP "%{REMOTE_ADDR}s"
        RequestHeader set X-Forwarded-Proto "http"

        # Enable WebSocket Support (required by Next.js for some features)
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} =websocket [NC]
        RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]

        # Proxy all other requests to Next.js
        ProxyPass / http://localhost:3000/
        ProxyPassReverse / http://localhost:3000/

        # Error Logging
        ErrorLog ${APACHE_LOG_DIR}/umis-frontend-error.log
        CustomLog ${APACHE_LOG_DIR}/umis-frontend-access.log combined
    </VirtualHost>
    ```
    *(Note: Replace `${APACHE_LOG_DIR}` with `/var/log/httpd` if you are on Fedora/CentOS)*
    Save and close the file.

4.  **Enable the Configuration and Restart Apache:**
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

## 4. Deployment Complete!

Your UMIS Frontend application should now be accessible via your server's IP address or your domain name.

### 4.1. Future Updates

To update the application in the future, follow these steps:
1.  Navigate to the project directory: `cd ~/umis-frontend`
2.  Pull the latest changes: `git pull origin main`
3.  Install any new dependencies: `npm install`
4.  Rebuild the application: `npm run build`
5.  Restart the application via PM2: `pm2 restart umis-frontend`

### 4.2. Securing with SSL (HTTPS)

For a production environment, it is highly recommended to secure your site with an SSL certificate. You can get a free certificate from Let's Encrypt using the `certbot` tool.

1.  **Install Certbot and the Apache Plugin:**
    *   **Debian/Ubuntu:** `sudo apt-get install -y certbot python3-certbot-apache`
    *   **Fedora/CentOS:** `sudo dnf install -y certbot python3-certbot-apache`

2.  **Obtain and Install the Certificate:**
    Run the following command and follow the on-screen instructions. Certbot will automatically detect your domain from your Apache configuration, obtain a certificate, and configure Apache to use it safely.
    ```bash
    sudo certbot --apache -d your_domain.com -d www.your_domain.com
    ```

3.  **Update NextAuth Environment Variable:**
    After setting up HTTPS, update your `.env` file so that `NEXTAUTH_URL` reflects the secure protocol:
    ```env
    NEXTAUTH_URL=https://your_domain.com
    ```
    Then restart PM2 to apply the change:
    ```bash
    pm2 restart umis-frontend
    ```

This concludes the Apache deployment guide for the UMIS Frontend.
