#!/bin/bash

# Multilingual News API Deployment Script for Hetzner VPS
# Run this script as root or with sudo

set -e

APP_NAME="dmwv-news-backend"
APP_DIR="/root/${APP_NAME}"
REPO_URL="https://github.com/toushik018/news-backend.git"
APP_PORT="5001"
DOMAIN_NAME="dmwv-news.susko.ai"

echo "Starting Multilingual News API deployment..."

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs build-essential git

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Install MongoDB 7.0
if ! command -v mongod >/dev/null 2>&1; then
  echo "Installing MongoDB 7.0..."
  wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update
  apt install -y mongodb-org
  systemctl enable --now mongod
fi

# Prepare application directory
echo "Preparing application directory at ${APP_DIR}..."
mkdir -p "${APP_DIR}/logs" "${APP_DIR}/uploads"

# Clone repository
if [ ! -d "${APP_DIR}/.git" ]; then
  echo "Cloning repository..."
  git clone "${REPO_URL}" "${APP_DIR}"
else
  echo "Repository exists. Pulling latest changes..."
  cd "${APP_DIR}"
  git reset --hard
  git pull
fi

# Configure environment variables
echo "Configuring environment variables..."
cd "${APP_DIR}"
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || touch .env
fi
if grep -q '^PORT=' .env; then
  sed -i "s/^PORT=.*/PORT=${APP_PORT}/" .env
else
  echo "PORT=${APP_PORT}" >> .env
fi

# Install dependencies (include dev deps for TypeScript build)
echo "Installing Node.js dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Prune dev dependencies after build
echo "Pruning dev dependencies..."
npm prune --production

# Restart PM2 process
echo "Restarting PM2 process..."
pm2 stop ${APP_NAME} || true
pm2 delete ${APP_NAME} || true
pm2 start ecosystem.config.js --name ${APP_NAME} --env production
pm2 save
pm2 startup systemd -u root --hp /root

# Configure nginx reverse proxy
echo "Configuring nginx reverse proxy..."
apt install -y nginx
cat > /etc/nginx/sites-available/news-api << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        access_log off;
        proxy_pass http://localhost:${APP_PORT}/health;
    }
}
EOF

ln -sf /etc/nginx/sites-available/news-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configure firewall
echo "Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "Deployment completed!"
echo "Application is running on port ${APP_PORT}"
echo "Check PM2 status: pm2 ls"
echo "Check logs: pm2 logs ${APP_NAME}"
echo "Health check: curl http://localhost:${APP_PORT}/health"
