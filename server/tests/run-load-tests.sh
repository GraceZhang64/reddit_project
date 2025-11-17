#!/bin/bash

# Load Testing Script for BlueIt
# This script runs the critical workflow test with 100 trials

set -e

echo "=========================================="
echo "BlueIt Load Testing Suite"
echo "=========================================="
echo ""

# Check if K6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ K6 is not installed. Please install it first:"
    echo "   macOS: brew install k6"
    echo "   Windows: choco install k6"
    echo "   Linux: See https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check for required environment variables
if [ -z "$BASE_URL" ]; then
    echo "⚠️  BASE_URL not set, using default: http://localhost:3001"
    export BASE_URL="http://localhost:3001"
fi

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ AUTH_TOKEN is required!"
    echo "   Get your token from browser DevTools > Application > Local Storage > access_token"
    echo "   Then run: export AUTH_TOKEN='your_token_here'"
    exit 1
fi

echo "✅ Configuration:"
echo "   BASE_URL: $BASE_URL"
echo "   AUTH_TOKEN: ${AUTH_TOKEN:0:20}..."
echo ""

echo "🚀 Starting Critical Workflow Test (100 trials)..."
echo ""

# Run the critical workflow test
k6 run --iterations 100 tests/load-test-critical-workflow.js

echo ""
echo "✅ Load testing completed!"

