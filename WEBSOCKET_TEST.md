# WebSocket Connection Test

This document explains how to test WebSocket connections before deploying to production.

## Quick Test

### Test Local Backend
```bash
npm run test:websocket http://localhost:3001
```

### Test Production Backend
```bash
npm run test:websocket https://leftover-be.ccdev.space
```

### Test with Authentication Token
```bash
# Get your JWT token from browser localStorage or API
npm run test:websocket https://leftover-be.ccdev.space YOUR_JWT_TOKEN
```

Or set environment variable:
```bash
TEST_TOKEN=your-jwt-token npm run test:websocket https://leftover-be.ccdev.space
```

## What the Test Checks

✅ **Connection**: Verifies Socket.IO can connect to the backend  
✅ **Transport**: Checks if polling/websocket transport works  
✅ **Subscription**: Tests subscribing to orders and offers events  
⚠️ **Updates**: Waits for order/offer updates (may not receive any if no activity)

## Expected Results

### ✅ Success
```
✅ Connected successfully!
   Transport: polling (or websocket)
   Socket ID: [socket-id]
✅ Subscribed to orders and offers events
✅ Overall: PASS
```

### ❌ Common Errors

**CORS Error:**
```
❌ Connection Error: CORS policy
⚠️  CORS Error Detected:
   - Check backend CORS configuration
   - Verify frontend origin is in allowed origins list
```

**502 Bad Gateway:**
```
❌ Connection Error: 502 Bad Gateway
⚠️  502 Bad Gateway Error:
   - Backend server may be down
   - Check proxy/load balancer configuration
   - Verify backend is accessible
```

**Timeout:**
```
⏱️  Connection timeout - no response from server
⚠️  Timeout Error:
   - Backend may be slow to respond
   - Check network connectivity
```

## Test Results Summary

The test script provides a summary:
- **Connection**: ✅ PASS / ❌ FAIL
- **Subscription**: ✅ PASS / ❌ FAIL  
- **Order Updates**: ✅ PASS (received) / ⚠️ No updates (normal)
- **Offer Updates**: ✅ PASS (received) / ⚠️ No updates (normal)

## Notes

- The test runs for 5 seconds to catch any real-time updates
- No updates received is normal if there's no activity on the server
- Connection and subscription are the critical tests
- The server may disconnect you if no token is provided (this is expected)

## Troubleshooting

### Connection Fails
1. Check if backend server is running
2. Verify backend URL is correct
3. Check firewall/network settings
4. Verify CORS configuration on backend

### CORS Errors
1. Check backend `websocket.gateway.ts` CORS configuration
2. Verify frontend origin is in allowed origins list
3. Check environment variables on backend

### 502 Errors
1. Check if backend server is running
2. Verify proxy/load balancer configuration
3. Check backend logs for errors
4. Verify SSL certificates are valid

## Manual Testing in Browser

You can also test WebSocket connections manually in the browser console:

```javascript
// Open browser console on your frontend app
// Check if WebSocket is connected
// Look for these console messages:
// ✅ WebSocket connected to: [url]
// 📡 Subscribed to orders and offers events
```

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] Local WebSocket test passes
- [ ] Production backend WebSocket test passes
- [ ] CORS configuration allows frontend origin
- [ ] Backend WebSocket gateway is properly configured
- [ ] Proxy/load balancer supports WebSocket connections
- [ ] SSL certificates are valid for WebSocket (WSS)

