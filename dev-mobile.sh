#!/bin/bash

# Find local IP address
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "Unable to find IP")

if [ "$IP" = "Unable to find IP" ]; then
    echo "❌ Could not find your local IP address"
    echo "Please run: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    exit 1
fi

echo "🚀 Starting Next.js dev server for mobile testing..."
echo ""
echo "📱 Access from your iPhone at:"
echo "   http://$IP:3000"
echo ""
echo "⚠️  Make sure:"
echo "   1. Your iPhone is on the same Wi-Fi network"
echo "   2. Your backend is accessible (update NEXT_PUBLIC_BACKEND_URL if needed)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Next.js with network access
next dev -H 0.0.0.0
