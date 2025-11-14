#!/bin/bash
# Deploy customized site to GitHub Pages

set -e

echo "🚀 Deploying Customized Site"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run from repository root:"
    echo "   bash customization-kit/deploy.sh"
    exit 1
fi

# Check if files exist
if [ ! -f "customization-kit/output/config.json" ]; then
    echo "❌ Error: No generated config.json found."
    echo "   Run: bash customization-kit/generate.sh first"
    exit 1
fi

# Copy files
echo "📋 Copying configuration files..."
cp customization-kit/output/config.json config/
echo "  ✓ config.json"

if [ -f "customization-kit/output/custom-nodes.json" ]; then
    cp customization-kit/output/custom-nodes.json data/
    echo "  ✓ custom-nodes.json"
fi

echo ""
echo "📝 Committing changes..."
git add config/config.json data/custom-nodes.json
git commit -m "Apply institution customization"

echo ""
echo "☁️  Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment complete!"
echo "   Your site will be live in 1-2 minutes"
echo ""

