#!/bin/bash

# SaveThePlate Frontend Local Setup Script
# Sets up the Next.js frontend for local development

set -e  # Exit on any error

echo "⚡ SaveThePlate Frontend Setup"
echo "==============================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "💡 Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo ""

# Setup environment
echo "📝 Setting up environment..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    echo "💡 This file should be committed to the repo"
    exit 1
fi
echo "✅ .env.local exists"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Success
echo "==============================="
echo "✅ Frontend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Make sure backend is running (http://localhost:3001)"
echo "   2. Start frontend: npm run dev"
echo ""
echo "🌐 Access:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:3001/api"
echo ""
echo "💡 Tips:"
echo "   • Hot reload is enabled"
echo "   • Check console for errors"
echo "   • Backend must be running first"
echo "==============================="
