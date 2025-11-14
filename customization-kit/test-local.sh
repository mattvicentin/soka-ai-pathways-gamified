#!/bin/bash
# Test customized site locally

set -e

echo "🧪 Testing Customized Site Locally"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run from repository root:"
    echo "   bash customization-kit/test-local.sh"
    exit 1
fi

# Copy generated files
echo "📋 Copying generated configuration..."
if [ -f "customization-kit/output/config.json" ]; then
    cp customization-kit/output/config.json config/
    echo "  ✓ Copied config.json"
fi

if [ -f "customization-kit/output/custom-nodes.json" ]; then
    cp customization-kit/output/custom-nodes.json data/
    echo "  ✓ Copied custom-nodes.json"
fi

echo ""
echo "🌐 Starting local server..."
echo "   Visit: http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""

python3 -m http.server 8000

