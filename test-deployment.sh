#!/bin/bash

# Local deployment testing script
# This script helps test the deployment process locally

set -e

echo "🧪 Testing deployment configuration locally..."

# Check if required files exist
echo "📋 Checking required files..."
required_files=("deploy.sh" "generate-nginx-config.sh" "ecosystem.config.js" "next.config.mjs" "package.json")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Check if scripts are executable
echo "🔧 Checking script permissions..."
if [ -x "deploy.sh" ]; then
    echo "✅ deploy.sh is executable"
else
    echo "❌ deploy.sh is not executable. Run: chmod +x deploy.sh"
    exit 1
fi

if [ -x "generate-nginx-config.sh" ]; then
    echo "✅ generate-nginx-config.sh is executable"
else
    echo "❌ generate-nginx-config.sh is not executable. Run: chmod +x generate-nginx-config.sh"
    exit 1
fi

# Test nginx config generation
echo "🌐 Testing nginx configuration generation..."
./generate-nginx-config.sh watch-party.brahim-elhouss.me > /tmp/test-nginx.conf
if [ -f "/tmp/test-nginx.conf" ] && [ -s "/tmp/test-nginx.conf" ]; then
    echo "✅ Nginx configuration generated successfully"
    echo "📄 Config file size: $(wc -l < /tmp/test-nginx.conf) lines"
    rm /tmp/test-nginx.conf
else
    echo "❌ Failed to generate nginx configuration"
    exit 1
fi

# Test build process
echo "🔨 Testing build process..."
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm is available"
    echo "📦 Installing dependencies..."
    pnpm install --frozen-lockfile
    echo "🏗️  Building application..."
    pnpm run build
    echo "✅ Build completed successfully"
else
    echo "⚠️  pnpm not found, testing with npm..."
    if command -v npm &> /dev/null; then
        echo "📦 Installing dependencies with npm..."
        npm ci
        echo "🏗️  Building application..."
        npm run build
        echo "✅ Build completed successfully"
    else
        echo "❌ Neither pnpm nor npm found"
        exit 1
    fi
fi

# Test PM2 ecosystem file
echo "⚙️  Testing PM2 ecosystem configuration..."
if command -v node &> /dev/null; then
    node -e "
        try {
            const config = require('./ecosystem.config.js');
            if (config.apps && config.apps.length > 0) {
                console.log('✅ PM2 ecosystem config is valid');
                console.log('📊 App name:', config.apps[0].name);
                console.log('📊 Script:', config.apps[0].script);
                console.log('📊 Instances:', config.apps[0].instances);
            } else {
                console.log('❌ Invalid PM2 ecosystem config');
                process.exit(1);
            }
        } catch (error) {
            console.log('❌ PM2 ecosystem config error:', error.message);
            process.exit(1);
        }
    "
else
    echo "⚠️  Node.js not found, skipping PM2 config test"
fi

# Create test deployment archive
echo "📦 Testing deployment archive creation..."
tar -czf test-deployment.tar.gz \
    .next/ \
    public/ \
    package.json \
    next.config.mjs \
    ecosystem.config.js \
    deploy.sh \
    generate-nginx-config.sh

if [ -f "test-deployment.tar.gz" ]; then
    echo "✅ Deployment archive created successfully"
    echo "📊 Archive size: $(du -h test-deployment.tar.gz | cut -f1)"
    rm test-deployment.tar.gz
else
    echo "❌ Failed to create deployment archive"
    exit 1
fi

# Check GitHub workflow syntax
echo "🐙 Checking GitHub workflow syntax..."
if command -v yq &> /dev/null || command -v python3 &> /dev/null; then
    if python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" 2>/dev/null; then
        echo "✅ GitHub workflow YAML is valid"
    else
        echo "❌ GitHub workflow YAML has syntax errors"
        exit 1
    fi
else
    echo "⚠️  YAML parser not found, skipping workflow syntax check"
fi

echo ""
echo "🎉 All tests passed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up GitHub secrets (SERVER_HOST, SERVER_USER, SERVER_SSH_KEY)"
echo "2. Configure your domain DNS to point to your server"
echo "3. Ensure your server has SSH access enabled"
echo "4. Push to master/main branch to trigger deployment"
echo ""
echo "🔧 Manual deployment command:"
echo "sudo ./deploy.sh watch-party.brahim-elhouss.me"
