#!/bin/bash

# Watch Party Deployment Script
# Author: GitHub Copilot
# Date: $(date)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="watch-party-frontend"
PROJECT_PATH="/var/www/$PROJECT_NAME"
FRONTEND_DOMAIN="watch-party.brahim-elhouss.me"
BACKEND_DOMAIN="be-watch-party.brahim-elhouss.me"
PM2_APP_NAME="watch-party-frontend"

# Helper functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Option 1: Initialize PM2 on the project
init_pm2() {
    print_header "Initializing PM2 for Watch Party Frontend"
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        print_info "Installing PM2 globally..."
        npm install -g pm2
        print_success "PM2 installed successfully"
    else
        print_success "PM2 is already installed"
    fi
    
    # Create project directory if it doesn't exist
    if [ ! -d "$PROJECT_PATH" ]; then
        print_info "Creating project directory: $PROJECT_PATH"
        mkdir -p "$PROJECT_PATH"
    fi
    
    # Check if we're running from the correct directory or need to copy files
    CURRENT_DIR=$(pwd)
    if [ "$CURRENT_DIR" != "$PROJECT_PATH" ]; then
        print_info "Copying project files to $PROJECT_PATH..."
        rsync -av --exclude='node_modules' --exclude='.git' --exclude='.next' "$CURRENT_DIR/" "$PROJECT_PATH/"
        print_success "Project files copied successfully"
    fi
    
    cd "$PROJECT_PATH"
    
    # Install dependencies
    print_info "Installing project dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        print_error "Neither npm nor pnpm found. Please install Node.js first."
        exit 1
    fi
    print_success "Dependencies installed successfully"
    
    # Build the project
    print_info "Building the Next.js application..."
    if command -v pnpm &> /dev/null; then
        pnpm run build
    else
        npm run build
    fi
    print_success "Application built successfully"
    
    # Create log directory
    mkdir -p /var/log/pm2
    
    # Stop existing PM2 process if running
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
    
    # Start application with PM2
    print_info "Starting application with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    
    # Enable PM2 startup script
    pm2 startup systemd -u root --hp /root
    
    print_success "PM2 initialized successfully!"
    print_info "Application is running on port 3000"
    print_info "Use 'pm2 status' to check the application status"
    print_info "Use 'pm2 logs $PM2_APP_NAME' to view logs"
}

# Option 2: Install Nginx with HTTP configuration
install_nginx_http() {
    print_header "Installing Nginx with HTTP Configuration"
    
    check_root
    
    # Install Nginx
    print_info "Installing Nginx..."
    apt update
    apt install -y nginx
    print_success "Nginx installed successfully"
    
    # Create Nginx configuration for HTTP
    print_info "Creating Nginx HTTP configuration..."
    
    cat > "/etc/nginx/sites-available/$PROJECT_NAME" << EOF
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Cloudflare real IP configuration
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;
    
    # Proxy configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
EOF

    # Enable the site
    ln -sf "/etc/nginx/sites-available/$PROJECT_NAME" "/etc/nginx/sites-enabled/"
    
    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    print_info "Testing Nginx configuration..."
    if nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx installed and configured for HTTP!"
    print_warning "Your site is now accessible at: http://$FRONTEND_DOMAIN"
    print_info "Make sure your domain DNS is pointing to this server"
    
    # Ask about SSL
    echo ""
    read -p "Do you have a valid SSL certificate ready? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Great! You can run option 3 to configure HTTPS when ready."
    else
        print_info "You can obtain SSL certificates using Let's Encrypt:"
        print_info "1. Install certbot: apt install certbot python3-certbot-nginx"
        print_info "2. Run: certbot --nginx -d $FRONTEND_DOMAIN"
        print_info "3. Then run option 3 of this script to configure HTTPS"
    fi
}

# Option 3: Configure HTTPS with SSL
install_nginx_https() {
    print_header "Configuring Nginx with HTTPS"
    
    check_root
    
    # Check if SSL certificates exist
    if [ ! -f "/etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem" ]; then
        print_warning "SSL certificate not found at /etc/letsencrypt/live/$FRONTEND_DOMAIN/"
        read -p "Do you have SSL certificates in a different location? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter the path to your SSL certificate file: " SSL_CERT
            read -p "Enter the path to your SSL private key file: " SSL_KEY
            
            if [ ! -f "$SSL_CERT" ] || [ ! -f "$SSL_KEY" ]; then
                print_error "SSL certificate files not found"
                exit 1
            fi
        else
            print_info "Installing Let's Encrypt certbot..."
            apt install -y certbot python3-certbot-nginx
            
            print_info "Obtaining SSL certificate..."
            certbot --nginx -d "$FRONTEND_DOMAIN" --non-interactive --agree-tos --email admin@"$FRONTEND_DOMAIN"
            
            SSL_CERT="/etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem"
            SSL_KEY="/etc/letsencrypt/live/$FRONTEND_DOMAIN/privkey.pem"
        fi
    else
        SSL_CERT="/etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem"
        SSL_KEY="/etc/letsencrypt/live/$FRONTEND_DOMAIN/privkey.pem"
        print_success "Found existing SSL certificates"
    fi
    
    # Create HTTPS Nginx configuration
    print_info "Creating Nginx HTTPS configuration..."
    
    cat > "/etc/nginx/sites-available/$PROJECT_NAME" << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    server_name $FRONTEND_DOMAIN;
    
    # SSL Configuration
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Cloudflare real IP configuration
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    real_ip_header CF-Connecting-IP;
    
    # Proxy configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support for Next.js
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static files caching with long expiry
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 302 1y;
        proxy_cache_valid 404 1m;
        add_header Cache-Control "public, immutable, max-age=31536000";
        
        # Add CORS headers if needed
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # API-specific timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # Security: deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
}
EOF
    
    # Test Nginx configuration
    print_info "Testing Nginx HTTPS configuration..."
    if nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Reload Nginx
    systemctl reload nginx
    
    # Set up automatic certificate renewal if using Let's Encrypt
    if [[ $SSL_CERT == *"letsencrypt"* ]]; then
        print_info "Setting up automatic SSL certificate renewal..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        print_success "SSL certificate auto-renewal configured"
    fi
    
    print_success "HTTPS configured successfully!"
    print_success "Your site is now accessible at: https://$FRONTEND_DOMAIN"
    print_info "SSL certificate will be automatically renewed (if using Let's Encrypt)"
}

# Option 4: Stop all services
stop_services() {
    print_header "Stopping All Services"
    
    check_root
    
    # Stop PM2 processes
    print_info "Stopping PM2 processes..."
    if command -v pm2 &> /dev/null; then
        pm2 stop all
        pm2 delete all
        print_success "PM2 processes stopped"
    else
        print_warning "PM2 not found"
    fi
    
    # Stop Nginx
    print_info "Stopping Nginx..."
    if systemctl is-active --quiet nginx; then
        systemctl stop nginx
        systemctl disable nginx
        print_success "Nginx stopped and disabled"
    else
        print_warning "Nginx is not running"
    fi
    
    # Show status
    print_info "Service status:"
    echo "PM2 processes:"
    pm2 list 2>/dev/null || echo "No PM2 processes running"
    echo ""
    echo "Nginx status:"
    systemctl status nginx --no-pager -l || echo "Nginx is not running"
    
    print_success "All services stopped successfully!"
}

# Main menu
show_menu() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "         Watch Party Deployment Script"
    echo "================================================"
    echo -e "${NC}"
    echo "Frontend Domain: $FRONTEND_DOMAIN"
    echo "Backend Domain: $BACKEND_DOMAIN"
    echo "Project Path: $PROJECT_PATH"
    echo ""
    echo "Select an option:"
    echo "1) Initialize PM2 on the project"
    echo "2) Install Nginx with HTTP configuration"
    echo "3) Configure Nginx with HTTPS (requires SSL certificate)"
    echo "4) Stop all services"
    echo "5) Exit"
    echo ""
}

# Main execution
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-5): " choice
        echo ""
        
        case $choice in
            1)
                init_pm2
                echo ""
                read -p "Press Enter to continue..."
                ;;
            2)
                install_nginx_http
                echo ""
                read -p "Press Enter to continue..."
                ;;
            3)
                install_nginx_https
                echo ""
                read -p "Press Enter to continue..."
                ;;
            4)
                stop_services
                echo ""
                read -p "Press Enter to continue..."
                ;;
            5)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-5."
                echo ""
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi