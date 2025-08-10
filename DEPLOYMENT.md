# Deployment Setup for Watch Party Frontend

This repository contains automated deployment scripts for deploying the Watch Party frontend to your server at `watch-party.brahim-elhouss.me`.

## Files Overview

- **`.github/workflows/deploy.yml`** - GitHub Actions workflow for automated deployment
- **`deploy.sh`** - Server deployment script that handles the entire deployment process
- **`generate-nginx-config.sh`** - Generates optimized Nginx configuration for the application

## Setup Instructions

### 1. Server Preparation

Before setting up the GitHub Action, ensure your server has:
- Ubuntu/Debian-based system
- SSH access enabled
- Sudo privileges for the deployment user

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add these secrets:

```
SERVER_HOST = your-server-ip-or-hostname
SERVER_USER = your-ssh-username
SERVER_SSH_KEY = your-private-ssh-key-content
SERVER_PORT = 22 (optional, defaults to 22)
```

### 3. SSH Key Setup

Generate an SSH key pair for deployment:

```bash
# On your local machine or server
ssh-keygen -t rsa -b 4096 -C "deployment@watch-party"

# Copy the public key to your server
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server

# Copy the private key content to GitHub secrets (SERVER_SSH_KEY)
cat ~/.ssh/id_rsa
```

### 4. Domain Configuration

Update your domain's DNS settings:
- Point `watch-party.brahim-elhouss.me` to your server's IP address
- Add an A record: `watch-party` → `your-server-ip`

## Deployment Process

### Automatic Deployment

The deployment happens automatically when:
- Code is pushed to `master` or `main` branch
- A pull request is merged into `master` or `main`

### Manual Deployment

To deploy manually on your server:

```bash
# Clone the repository
git clone https://github.com/EL-HOUSS-BRAHIM/watch-party-frontend.git
cd watch-party-frontend

# Build the application
pnpm install
pnpm build

# Run deployment (requires sudo)
sudo ./deploy.sh watch-party.brahim-elhouss.me
```

## What the Deployment Does

1. **Server Setup**:
   - Installs Node.js, pnpm, PM2, Nginx, and Certbot
   - Creates application directory structure

2. **Application Deployment**:
   - Stops existing application
   - Backs up current deployment
   - Copies new build files
   - Installs production dependencies
   - Starts application with PM2

3. **Nginx Configuration**:
   - Generates optimized Nginx configuration
   - Enables HTTP/2 and SSL
   - Sets up security headers
   - Configures caching for static assets
   - Enables gzip compression
   - Sets up rate limiting

4. **SSL Certificate**:
   - Automatically obtains Let's Encrypt SSL certificate
   - Configures HTTPS redirect

## Monitoring

After deployment, you can monitor your application:

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs watch-party-frontend

# Monitor in real-time
pm2 monit

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/watch-party.brahim-elhouss.me.access.log
sudo tail -f /var/log/nginx/watch-party.brahim-elhouss.me.error.log
```

## Nginx Configuration Features

The generated Nginx configuration includes:

- **SSL/TLS**: Automatic HTTPS with Let's Encrypt
- **Security Headers**: X-Frame-Options, CSP, XSS Protection
- **Caching**: Optimized caching for static assets and images
- **Compression**: Gzip compression for better performance
- **Rate Limiting**: Protection against abuse
- **WebSocket Support**: For real-time features
- **HTTP/2**: Modern protocol support

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**:
   - Check server IP and SSH key configuration
   - Ensure SSH port (22) is open

2. **Permission Denied**:
   - Ensure the deployment user has sudo privileges
   - Check SSH key permissions

3. **Domain Not Accessible**:
   - Verify DNS settings
   - Check firewall rules (ports 80, 443)
   - Ensure Nginx is running

4. **SSL Certificate Failed**:
   - Domain must be pointing to the server
   - Ports 80 and 443 must be accessible
   - Check domain ownership

### Logs Location

- Application logs: `pm2 logs watch-party-frontend`
- Nginx access logs: `/var/log/nginx/watch-party.brahim-elhouss.me.access.log`
- Nginx error logs: `/var/log/nginx/watch-party.brahim-elhouss.me.error.log`
- Deployment logs: GitHub Actions tab in your repository

## Manual Commands

### Restart Application
```bash
pm2 restart watch-party-frontend
```

### Update Nginx Configuration
```bash
sudo ./generate-nginx-config.sh watch-party.brahim-elhouss.me > /etc/nginx/sites-available/watch-party-frontend
sudo nginx -t
sudo systemctl reload nginx
```

### Renew SSL Certificate
```bash
sudo certbot renew
```

## Security Considerations

- The deployment script runs with sudo privileges
- SSH keys should be properly secured
- Regular security updates should be applied
- Monitor access logs for suspicious activity
- Consider implementing fail2ban for additional protection

## Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure backups
3. Set up log rotation
4. Consider implementing blue-green deployments
5. Add health checks and uptime monitoring
