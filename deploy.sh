#!/bin/bash

# Multilingual News API Deployment Script for Hetzner VPS
# Run this script as root or with sudo

set -e

echo "🚀 Starting Multilingual News API deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js (using NodeSource repository)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install MongoDB (if not already installed)
echo "📦 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Create application user
echo "👤 Creating application user..."
useradd --create-home --shell /bin/bash newsapi
usermod -aG sudo newsapi

# Create application directories
echo "📁 Creating application directories..."
mkdir -p /home/newsapi/multilingual-news-api
mkdir -p /home/newsapi/multilingual-news-api/logs
mkdir -p /home/newsapi/multilingual-news-api/uploads

# Set ownership
chown -R newsapi:newsapi /home/newsapi/multilingual-news-api

# Copy application files (run this script from your project directory)
echo "📋 Copying application files..."
cp -r . /home/newsapi/multilingual-news-api/
chown -R newsapi:newsapi /home/newsapi/multilingual-news-api

# Install dependencies
echo "📦 Installing Node.js dependencies..."
cd /home/newsapi/multilingual-news-api
sudo -u newsapi npm install --production

# Build the application
echo "🔨 Building the application..."
sudo -u newsapi npm run build

# Setup PM2 to start on boot
echo "⚙️ Setting up PM2 startup script..."
sudo -u newsapi pm2 startup systemd -u newsapi --hp /home/newsapi

# Install and start the service
echo "🔧 Installing systemd service..."
cp deploy/news-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable news-api.service

# Start the service
echo "🚀 Starting the service..."
systemctl start news-api.service

# Wait a moment and check status
sleep 5
systemctl status news-api.service --no-pager

# Setup firewall
echo "🔒 Configuring firewall..."
ufw allow 22
ufw allow 5000
ufw --force enable

# Setup nginx reverse proxy (optional)
echo "🌐 Setting up nginx reverse proxy..."
apt install -y nginx
cat > /etc/nginx/sites-available/news-api << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/news-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ Deployment completed!"
echo "🌐 Application is running on port 5000"
echo "🔍 Check status: sudo systemctl status news-api.service"
echo "📊 Check logs: sudo journalctl -u news-api.service -f"
echo "🔄 Restart service: sudo systemctl restart news-api.service"
echo "📈 Check PM2: sudo -u newsapi pm2 list"
echo "🌐 Health check: curl http://localhost:5000/health"
