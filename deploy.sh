#!/bin/bash

# Watch Party Frontend Deployment Script
# Usage: ./deploy.sh [domain]

set -e

DOMAIN=${1:-watch-party.brahim-elhouss.me}
APP_NAME="watch-party-frontend"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONFIG_FILE="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED_FILE="/etc/nginx/sites-enabled/$APP_NAME"
PM2_APP_NAME="watch-party-frontend"

echo "🚀 Starting deployment for $DOMAIN..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

# Install Node.js and PM2 if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Install certbot for SSL if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi

# Create application directory
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Stop existing PM2 process if running
echo "🛑 Stopping existing application..."
pm2 stop $PM2_APP_NAME 2>/dev/null || true
pm2 delete $PM2_APP_NAME 2>/dev/null || true

# Backup current deployment
if [ -d "$APP_DIR/.next" ]; then
    echo "💾 Backing up current deployment..."
    mv $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
    mkdir -p $APP_DIR
    cd $APP_DIR
fi

# Copy new files
echo "📋 Copying new files..."
cp -r /tmp/watch-party-deployment/.next ./
cp -r /tmp/watch-party-deployment/public ./
cp /tmp/watch-party-deployment/package.json ./
cp /tmp/watch-party-deployment/pnpm-lock.yaml ./
cp /tmp/watch-party-deployment/next.config.mjs ./
cp /tmp/watch-party-deployment/ecosystem.config.js ./

# Install production dependencies
echo "📦 Installing dependencies..."
pnpm install --prod --frozen-lockfile

# Generate Nginx configuration
echo "🔧 Generating Nginx configuration..."
/tmp/watch-party-deployment/generate-nginx-config.sh $DOMAIN > $NGINX_CONFIG_FILE

# Enable the site
ln -sf $NGINX_CONFIG_FILE $NGINX_ENABLED_FILE

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Setup SSL certificate with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@brahim-elhouss.me || echo "⚠️  SSL setup failed, continuing without SSL"

# Final status check
echo "✅ Checking application status..."
pm2 status $PM2_APP_NAME

echo "🎉 Deployment completed successfully!"
echo "🌐 Your application should be available at: https://$DOMAIN"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs $PM2_APP_NAME"

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -rf /tmp/watch-party-deployment

echo "✨ Deployment script finished!"
