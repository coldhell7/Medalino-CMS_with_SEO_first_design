#!/usr/bin/env bash
set -euo pipefail

# deploy-admin.sh
# Intended to be run on the target Ubuntu/Debian server as root or via sudo.
# It does not clone your repo — run this from your project root on the server.

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root or with sudo"
  exit 1
fi

PROJECT_DIR=${1:-/var/www/medalino}
ADMIN_DOMAIN=${2:-admin.medalino.ir}
ADMIN_PORT=${3:-3002}

echo "Using PROJECT_DIR=${PROJECT_DIR}, ADMIN_DOMAIN=${ADMIN_DOMAIN}, ADMIN_PORT=${ADMIN_PORT}"

apt update
apt install -y nginx certbot python3-certbot-nginx curl build-essential

# Install Node.js (LTS) and pnpm if not present
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt install -y nodejs
fi
if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm
fi

mkdir -p "$PROJECT_DIR"
chown -R www-data:www-data "$PROJECT_DIR"

echo "Create /etc/medalino and env file"
mkdir -p /etc/medalino
ENV_FILE=/etc/medalino/admin.env
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<'EOF'
# Place production environment variables here
# Example:
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=medalino
# ADMIN_AUTH_SECRET=change-me-to-a-long-random-value
EOF
  chmod 600 "$ENV_FILE"
fi

echo "Copying nginx config and enabling site"
NGINX_CONF=/etc/nginx/sites-available/${ADMIN_DOMAIN}
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name ${ADMIN_DOMAIN};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${ADMIN_DOMAIN};
    ssl_certificate /etc/letsencrypt/live/${ADMIN_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${ADMIN_DOMAIN}/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:${ADMIN_PORT};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx || true

echo "Obtaining TLS certificate with certbot"
certbot --nginx -d "$ADMIN_DOMAIN" --non-interactive --agree-tos -m admin@${ADMIN_DOMAIN} || true

echo "Build and start admin app via systemd"
if [[ -d "$PROJECT_DIR" ]]; then
  cd "$PROJECT_DIR"
  # assume monorepo with pnpm workspace
  pnpm install
  pnpm --filter admin build
fi

SYSTEMD_UNIT=/etc/systemd/system/medalino-admin.service
cat > "$SYSTEMD_UNIT" <<'EOF'
[Unit]
Description=Medalino Admin (Next.js)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/medalino/apps/admin
Environment=NODE_ENV=production
EnvironmentFile=/etc/medalino/admin.env
ExecStart=/usr/bin/env pnpm --filter admin start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now medalino-admin.service

echo "Deployment script finished. Check: systemctl status medalino-admin.service and journalctl -u medalino-admin.service -f"
