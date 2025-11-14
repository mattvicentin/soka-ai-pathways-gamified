#!/bin/bash
# AI Pathways Explorer - One-Command Generator
# Run from repository root: bash customization-kit/generate.sh

set -e

echo "🚀 AI Pathways Customization Generator"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the repository root:"
    echo "   bash customization-kit/generate.sh"
    exit 1
fi

# Check if workbook exists
if [ ! -f "customization-kit/AI-Explorer-Customization.xlsx" ]; then
    echo "❌ Error: Workbook not found at customization-kit/AI-Explorer-Customization.xlsx"
    echo "   Please create your workbook from the CSV templates first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --silent

echo ""
echo "🔧 Generating configuration files..."
npm run generate

echo ""
echo "📋 Validating configuration..."
npm run validate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Generation successful!"
    echo ""
    echo "Generated files are in customization-kit/output/"
    echo ""
    echo "Next steps:"
    echo "1. Review customization-kit/output/validation-report.txt"
    echo "2. Test locally: bash customization-kit/test-local.sh"
    echo "3. Deploy: bash customization-kit/deploy.sh"
    echo ""
fi

