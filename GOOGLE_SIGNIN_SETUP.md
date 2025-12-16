# Google Sign-In Setup Guide

This guide will help you set up Google Sign-In functionality for your application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to the Google Cloud Console

## Step 1: Create a Google OAuth 2.0 Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: "Save The Plate" (or your app name)
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes (at minimum, you'll need `email` and `profile`)
   - Add test users if your app is in testing mode
   - Save and continue

6. Create the OAuth client:
   - Application type: **Web application**
   - Name: "Save The Plate Web Client" (or any name you prefer)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://leftover.ccdev.space` (your production domain)
     - `https://savetheplate.ccdev.space` (if applicable)
     - Add any other domains where your app will be hosted
   - Authorized redirect URIs:
     - `http://localhost:3000` (for local development)
     - `https://leftover.ccdev.space` (your production domain)
     - `https://savetheplate.ccdev.space` (if applicable)
     - Add any other domains where your app will be hosted
   - Click **Create**

7. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

## Step 2: Configure Environment Variables

### For Local Development

Create a `.env.local` file in the root of your project (if it doesn't exist):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### For Production/Staging

Add the environment variable to your hosting platform:

**For Vercel:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with your Client ID value

**For Docker/Other platforms:**
Add to your `.env.production` or `.env.staging` file:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Important:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

## Step 3: Verify Backend Configuration

Ensure your backend has the Google OAuth endpoint configured at `/auth/google`. The endpoint should:

1. Accept a POST request with the credential in the body:
   ```json
   {
     "credential": "google-jwt-token-here"
   }
   ```

2. Verify the Google JWT token
3. Create or authenticate the user
4. Return tokens in the response:
   ```json
   {
     "accessToken": "jwt-access-token",
     "refreshToken": "jwt-refresh-token",
     "role": "CLIENT" | "PROVIDER" | "PENDING_PROVIDER",
     "user": { ... }
   }
   ```

## Step 4: Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/signIn`
3. You should see a "Sign in with Google" button
4. Click it and complete the Google sign-in flow
5. Verify that:
   - You're redirected to the appropriate page based on your role
   - Your tokens are stored in localStorage
   - You can access protected routes

## Troubleshooting

### Google Sign-In Button Not Appearing

- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in your environment variables
- Restart your development server after adding environment variables
- Check the browser console for any errors

### "Error 400: redirect_uri_mismatch"

- Verify that your current domain is added to **Authorized JavaScript origins** in Google Cloud Console
- Make sure the redirect URI matches exactly (including `http://` vs `https://`)

### "Error 403: access_denied"

- Check your OAuth consent screen configuration
- If your app is in testing mode, ensure the user's email is added to test users
- Verify that required scopes are configured

### Backend Authentication Fails

- Verify your backend `/auth/google` endpoint is working
- Check backend logs for errors
- Ensure the backend can verify Google JWT tokens
- Verify CORS is configured correctly on the backend

## Security Best Practices

1. **Never commit your Client ID to version control** - Always use environment variables
2. **Restrict Authorized JavaScript origins** - Only add domains you actually use
3. **Use HTTPS in production** - Google OAuth requires HTTPS for production domains
4. **Keep your OAuth consent screen updated** - Ensure users know what data you're accessing
5. **Monitor usage** - Check Google Cloud Console for any suspicious activity

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Current Implementation

The Google Sign-In functionality is already implemented in:
- `app/signIn/page.tsx` - Sign-in page with Google button
- `app/layout.tsx` - GoogleOAuthProvider wrapper
- Backend endpoint: `/auth/google` (should be implemented in your backend)

The implementation includes:
- ✅ Google OAuth button with proper styling
- ✅ Error handling for failed sign-ins
- ✅ Loading states during authentication
- ✅ Automatic redirect based on user role
- ✅ Token storage and management
- ✅ Support for new users and existing users

