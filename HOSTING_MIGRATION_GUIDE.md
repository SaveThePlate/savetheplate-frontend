# Hosting Migration Guide

This guide explains the current hosting configuration and how to change it for both frontend and backend.

## Current Hosting Configuration

### Frontend (Next.js)
- **Current Backend URL**: `https://leftover-be.ccdev.space` (default fallback)
- **Environment Variable**: `NEXT_PUBLIC_BACKEND_URL`
- **Port**: 3000 (default, configurable via `PORT` env var)

### Backend (NestJS)
- **Current Allowed Origins**:
  - `https://leftover.ccdev.space`
  - `https://savetheplate.ccdev.space`
  - `http://localhost:3000`
  - `http://localhost:3001`
  - All `.ccdev.space` domains (wildcard)
- **Port**: 3001 (default, configurable via `PORT` env var)
- **Environment Variables**: `FRONTEND_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `FRONT_URL`

---

## Files That Need to Be Updated

### Frontend Files

1. **`lib/OpenApiFetch.ts`** (Line 17)
   - Default backend URL: `https://leftover-be.ccdev.space`

2. **`next.config.mjs`** (Lines 50-54, 107)
   - Image remote patterns for `leftover-be.ccdev.space`
   - CSP headers with backend URL

3. **`hooks/useWebSocket.ts`** (Line 55)
   - WebSocket connection URL (defaults to `http://localhost:3001`)

4. **`utils/imageUtils.ts`** (Line 159)
   - Image URL resolution using backend URL

5. **Multiple component files** use `process.env.NEXT_PUBLIC_BACKEND_URL`:
   - `components/AddOffer.tsx`
   - `app/client/home/page.tsx`
   - `app/client/orders/[id]/page.tsx`
   - `app/signIn/page.tsx`
   - `app/onboarding/page.tsx`
   - `context/UserContext.tsx`
   - `app/provider/home/page.tsx`

### Backend Files

1. **`src/main.ts`** (Lines 121-131, 154)
   - CORS allowed origins list
   - `.ccdev.space` domain wildcard check

---

## How to Change Hosting

### Option 1: Using Environment Variables (Recommended)

This is the cleanest approach as it doesn't require code changes.

#### Frontend Environment Variables

Create or update `.env.local`, `.env.production`, or `.env.staging`:

```bash
# Frontend environment variable
NEXT_PUBLIC_BACKEND_URL=https://your-new-backend-domain.com
```

#### Backend Environment Variables

Create or update `.env` or `.env.production`:

```bash
# Backend environment variables
PORT=3001
FRONTEND_URL=https://your-new-frontend-domain.com
NEXT_PUBLIC_FRONTEND_URL=https://your-new-frontend-domain.com
FRONT_URL=https://your-new-frontend-domain.com
NODE_ENV=production
```

**Note**: The backend CORS configuration in `main.ts` will automatically allow:
- Any origin from environment variables (`FRONTEND_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `FRONT_URL`)
- Localhost for development
- Any domain containing `.ccdev.space` (you may want to remove this for production)

### Option 2: Update Code Directly

If you want to hardcode new domains or remove the `.ccdev.space` wildcard:

#### Frontend Changes

1. **Update default backend URL in `lib/OpenApiFetch.ts`**:
   ```typescript
   return process.env.NEXT_PUBLIC_BACKEND_URL || "https://your-new-backend-domain.com";
   ```

2. **Update `next.config.mjs`**:
   - Replace `leftover-be.ccdev.space` with your new backend domain in:
     - Image remote patterns (lines 50-54)
     - CSP headers default (line 107)

3. **Update `hooks/useWebSocket.ts`**:
   - Change default WebSocket URL if needed (line 55)

#### Backend Changes

1. **Update `src/main.ts`**:
   - Add your new frontend domain to the `allowedOrigins` array (lines 121-131)
   - Optionally remove or modify the `.ccdev.space` wildcard check (line 154) for production

---

## Step-by-Step Migration Process

### 1. Prepare New Server

- Set up your new hosting server
- Configure DNS records
- Set up SSL certificates (HTTPS)

### 2. Update Backend

1. Deploy backend to new server
2. Set environment variables:
   ```bash
   FRONTEND_URL=https://your-new-frontend-domain.com
   PORT=3001
   NODE_ENV=production
   ```
3. Update CORS in `src/main.ts` if needed (add new frontend domain)
4. Restart backend service

### 3. Update Frontend

1. Set environment variable:
   ```bash
   NEXT_PUBLIC_BACKEND_URL=https://your-new-backend-domain.com
   ```
2. Rebuild frontend:
   ```bash
   npm run build
   ```
3. Deploy to new server
4. Restart frontend service

### 4. Test

- Verify frontend can connect to backend API
- Test WebSocket connections
- Verify image loading from backend storage
- Test CORS headers are working
- Check authentication flow

### 5. Update DNS

- Point your domain to the new server IP
- Wait for DNS propagation
- Verify SSL certificates are working

---

## Important Notes

1. **CORS Configuration**: The backend currently allows all `.ccdev.space` domains. For production, you may want to restrict this to specific domains.

2. **Environment Variables**: 
   - Frontend: `NEXT_PUBLIC_BACKEND_URL` must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
   - Backend: Multiple variables are checked (`FRONTEND_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `FRONT_URL`)

3. **WebSocket**: The WebSocket connection automatically converts HTTP to WS and HTTPS to WSS based on the backend URL protocol.

4. **Image URLs**: The frontend handles image URLs from different backends, so images from the old backend will still work if the URL is preserved.

5. **Docker**: Both Dockerfiles reference environment files (`.env.staging`, `.env.production`). Make sure to update these for containerized deployments.

---

## Quick Reference: Environment Variables

### Frontend
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
PORT=3000  # Optional, defaults to 3000
```

### Backend
```bash
PORT=3001  # Optional, defaults to 3001
FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.com
FRONT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

---

## Troubleshooting

### CORS Errors
- Check that the frontend URL is in the backend's allowed origins
- Verify environment variables are set correctly
- Check that the backend is reading environment variables

### WebSocket Connection Issues
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check that the backend WebSocket server is running
- Verify firewall/network allows WebSocket connections

### Image Loading Issues
- Check that the backend storage path is accessible
- Verify image remote patterns in `next.config.mjs`
- Check CSP headers allow image sources

