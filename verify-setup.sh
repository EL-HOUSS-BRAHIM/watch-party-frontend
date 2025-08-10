#!/bin/bash

# Setup Verification Script
# Run this script to verify your deployment setup is complete

set -e

echo "🔍 Verifying Watch Party Frontend Deployment Setup"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success_count=0
total_checks=0

check_file() {
    local file=$1
    local description=$2
    total_checks=$((total_checks + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}✗${NC} $description (Missing: $file)"
    fi
}

check_executable() {
    local file=$1
    local description=$2
    total_checks=$((total_checks + 1))
    
    if [ -x "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}✗${NC} $description (Not executable: $file)"
    fi
}

echo "📁 Checking deployment files..."
check_file ".github/workflows/deploy.yml" "GitHub Actions workflow"
check_file "deploy.sh" "Deployment script"
check_file "generate-nginx-config.sh" "Nginx config generator"
check_file "ecosystem.config.js" "PM2 ecosystem config"
check_file "next.config.mjs" "Next.js configuration"

echo ""
echo "🔧 Checking script permissions..."
check_executable "deploy.sh" "Deployment script executable"
check_executable "generate-nginx-config.sh" "Nginx generator executable"
check_executable "test-deployment.sh" "Test script executable"

echo ""
echo "📋 Checking Next.js configuration..."
total_checks=$((total_checks + 1))
if grep -q "output.*standalone" next.config.mjs 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Next.js standalone output configured"
    success_count=$((success_count + 1))
else
    echo -e "${YELLOW}⚠${NC} Next.js standalone output not found (recommended for deployment)"
fi

echo ""
echo "🔍 Checking package.json scripts..."
total_checks=$((total_checks + 1))
if grep -q "\"build\"" package.json 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Build script found in package.json"
    success_count=$((success_count + 1))
else
    echo -e "${RED}✗${NC} Build script missing in package.json"
fi

echo ""
echo "📊 Setup Summary"
echo "================"
echo "Checks passed: $success_count/$total_checks"

if [ $success_count -eq $total_checks ]; then
    echo -e "${GREEN}🎉 Setup verification complete! All checks passed.${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure GitHub repository secrets:"
    echo "   - SERVER_HOST: Your server IP or hostname"
    echo "   - SERVER_USER: SSH username for deployment"
    echo "   - SERVER_SSH_KEY: Private SSH key content"
    echo ""
    echo "2. Test deployment locally:"
    echo "   ./test-deployment.sh"
    echo ""
    echo "3. Push to master branch to trigger automated deployment"
    echo ""
    echo "🌐 Your app will be available at: https://watch-party.brahim-elhouss.me"
    exit 0
else
    echo -e "${RED}❌ Setup incomplete. Please fix the issues above.${NC}"
    exit 1
fi
