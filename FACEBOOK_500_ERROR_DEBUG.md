# Facebook Authentication 500 Error - Debug Guide

## Error Details
```
POST https://leftover-be.ccdev.space/auth/facebook 500 (Internal Server Error)
```

## Possible Causes

### 1. Facebook App Configuration Issues
- **Missing Environment Variables**: Check that `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` are set in backend `.env`
- **Invalid App Credentials**: Verify the App ID and Secret match your Facebook app
- **App Not in Production Mode**: If app is in development mode, ensure test users are added

### 2. Facebook Graph API Issues
- **Invalid Access Token**: The token from Facebook SDK might be expired or invalid
- **Missing Permissions**: Ensure `email` and `public_profile` permissions are granted
- **Token Verification Failure**: The token might not belong to your app

### 3. Backend Code Issues
Check the backend logs for the exact error. Common issues:
- Network error when calling Facebook Graph API
- Database connection issues when creating/updating user
- Missing email in Facebook response (email permission not granted)

## Debugging Steps

### Frontend
1. Check browser console for detailed error messages
2. Verify `NEXT_PUBLIC_FACEBOOK_APP_ID` is set correctly
3. Check that Facebook SDK is loaded and initialized

### Backend
1. Check backend logs for the exact error message
2. Verify environment variables:
   ```bash
   echo $FACEBOOK_APP_ID
   echo $FACEBOOK_APP_SECRET
   ```
3. Test Facebook Graph API directly:
   ```bash
   curl "https://graph.facebook.com/me?access_token=YOUR_TOKEN&fields=id,name,email"
   ```

## Common Solutions

### Solution 1: Verify Environment Variables
```bash
# In backend directory
cat .env | grep FACEBOOK
```

Should show:
```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

### Solution 2: Check Facebook App Settings
1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Go to Settings > Basic
4. Verify:
   - App ID matches `FACEBOOK_APP_ID`
   - App Secret matches `FACEBOOK_APP_SECRET`
   - "Login with JavaScript SDK" is enabled

### Solution 3: Test Token Manually
Use the Facebook Graph API Explorer:
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app
3. Generate a token with `email` and `public_profile` permissions
4. Test the token:
   ```
   GET /me?fields=id,name,email,picture
   ```

### Solution 4: Check Backend Logs
The backend should log the exact error. Common errors:
- `Facebook OAuth is not configured on the server` → Missing env vars
- `Invalid Facebook access token` → Token verification failed
- `Unable to extract user information` → Email permission not granted
- Database errors → Check database connection

## Next Steps
1. Check backend logs for the exact error message
2. Verify Facebook app configuration
3. Test with a fresh Facebook access token
4. Ensure all environment variables are set correctly

