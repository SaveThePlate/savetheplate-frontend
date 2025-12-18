# Backend Facebook Authentication Fix

## Overview

The frontend supports **two Facebook authentication flows**:

1. **JavaScript SDK Flow (Current)**: Client-side authentication using `FB.login()`
2. **OAuth Redirect Flow (New)**: Server-side OAuth flow with redirect callback

## Flow 1: JavaScript SDK (Current Implementation)

### Frontend Request Details
The frontend sends the following request to the backend:

```javascript
POST https://leftover-be.ccdev.space/auth/facebook
Content-Type: application/json

{
  "accessToken": "<facebook_access_token>"
}
```

### Expected Backend Response
```json
{
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "role": "CLIENT" | "PROVIDER" | "PENDING_PROVIDER",
  "user": {
    "id": <user_id>,
    "email": "<user_email>",
    "role": "<user_role>"
  },
  "redirectTo": "/client/home" // Optional
}
```

## Flow 2: OAuth Redirect (New Implementation)

### Frontend Callback Endpoint
The frontend now has an endpoint at `/auth/callback` that handles Facebook OAuth redirects.

### Backend Endpoint Required
The backend needs to implement a new endpoint:

```javascript
POST https://leftover-be.ccdev.space/auth/facebook/callback
Content-Type: application/json

{
  "code": "<oauth_authorization_code>",
  "state": "<csrf_state_token>" // Optional, for CSRF protection
}
```

### Backend Processing Steps
1. Exchange the `code` for a Facebook access token using Facebook's OAuth API:
   ```
   GET https://graph.facebook.com/v24.0/oauth/access_token?
     client_id={FACEBOOK_APP_ID}&
     client_secret={FACEBOOK_APP_SECRET}&
     redirect_uri={REDIRECT_URI}&
     code={code}
   ```

2. Use the Facebook access token to fetch user info:
   ```
   GET https://graph.facebook.com/v24.0/me?
     fields=id,name,email&
     access_token={facebook_access_token}
   ```

3. Create or update user in database
4. Generate JWT tokens
5. Return the same response format as Flow 1

### Expected Backend Response (Same as Flow 1)
```json
{
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "role": "CLIENT" | "PROVIDER" | "PENDING_PROVIDER",
  "user": {
    "id": <user_id>,
    "email": "<user_email>",
    "role": "<user_role>"
  },
  "redirectTo": "/client/home" // Optional
}
```

## Error: POST /auth/facebook 500 (Internal Server Error)

### Common Backend Issues to Check

1. **Facebook App Configuration**
   - Verify `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` are set correctly
   - Check that the Facebook app is not in development mode (or add test users)
   - Ensure the app domain is whitelisted in Facebook settings
   - For OAuth flow: Verify `Valid OAuth Redirect URIs` includes:
     ```
     https://leftover.ccdev.space/auth/callback
     ```

2. **Token Validation**
   - Verify the Facebook access token is being validated correctly
   - Check if the token is expired or invalid
   - Ensure the token has the required permissions (email, public_profile)

3. **Database Issues**
   - Check if user creation/update is failing
   - Verify database connection
   - Check for unique constraint violations (email, etc.)

4. **Error Logging**
   - Check backend logs for the actual error message
   - The frontend now logs error details in the console for debugging

5. **OAuth Code Exchange (For Flow 2)**
   - Verify the redirect URI matches exactly what's configured in Facebook
   - Check that the code hasn't expired (codes expire quickly)
   - Ensure the code is only used once

### Testing

**Flow 1 (JavaScript SDK):**
```bash
node test-facebook-auth.js [backend-url] [facebook-access-token]
```

**Flow 2 (OAuth Redirect):**
1. Navigate to sign-in page
2. Click "Login with Facebook"
3. Complete Facebook OAuth flow
4. Should redirect to `/auth/callback` with `code` parameter
5. Frontend will automatically call `/auth/facebook/callback` endpoint

## Configuration Checklist

- [ ] `FACEBOOK_APP_ID` is set in backend environment
- [ ] `FACEBOOK_APP_SECRET` is set in backend environment
- [ ] Facebook app has "Login with JavaScript SDK" enabled
- [ ] Valid OAuth Redirect URI: `https://leftover.ccdev.space/auth/callback`
- [ ] Backend endpoint `/auth/facebook` is working (Flow 1)
- [ ] Backend endpoint `/auth/facebook/callback` is implemented (Flow 2)
- [ ] App Domain is configured in Facebook settings
- [ ] Site URL is configured in Facebook settings

