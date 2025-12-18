# Troubleshooting: "L'option JSSDK n'est pas activée" Error

## 🔴 Error Message

```
L'option JSSDK n'est pas activée
Veuillez configurer l'option « Se connecter avec le SDK JavaScript » sur Oui 
sur le site developers.facebook.com afin d'utiliser l'option JSSDK pour vous connecter.
```

## ✅ Quick Fix Steps

### Step 1: Verify Your App ID

1. Check your production environment variables:
   - Look for `NEXT_PUBLIC_FACEBOOK_APP_ID` in your hosting platform
   - Note the App ID value

2. Open browser console on your hosted app:
   - Go to your sign-in page
   - Open Developer Tools (F12)
   - Look for: "Attempting Facebook login with App ID: [YOUR_APP_ID]"
   - **Verify this matches the App ID in Facebook Developers**

### Step 2: Enable JavaScript SDK in Facebook Developers

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. **Select the correct app** (the one matching your App ID from Step 1)
3. Go to **Settings** → **Basic Settings**
4. Scroll down to **"Facebook Login"** section
5. Find **"Login with JavaScript SDK"** or **"Use JavaScript SDK"**
6. **Toggle it to "Yes"** or **"On"**
7. **Click "Save Changes"**
8. **Wait 2-5 minutes** for changes to propagate

### Step 3: Verify Configuration

In the same **Settings** → **Basic Settings** page, verify:

- ✅ **App Domains** includes your production domain:
  ```
  leftover.ccdev.space
  savetheplate.ccdev.space
  ```
  (or your actual domain)

- ✅ **Site URL** is set to:
  ```
  https://leftover.ccdev.space
  ```
  (or your actual production URL)

### Step 4: Check Facebook Login Product Settings

1. In Facebook Developers, go to **Products** → **Facebook Login** → **Settings**
2. Verify:
   - ✅ **Client OAuth Login**: Enabled
   - ✅ **Web OAuth Login**: Enabled
   - ✅ **Valid OAuth Redirect URIs** includes:
     ```
     https://leftover.ccdev.space/auth/callback
     https://savetheplate.ccdev.space/auth/callback
     ```
     (or your actual callback URLs)

### Step 5: Clear Cache and Test

1. **Clear browser cache** or use Incognito/Private mode
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Try Facebook login again

## 🔍 Common Issues

### Issue 1: Wrong App ID

**Symptom**: You enabled JSSDK on one app, but your production uses a different App ID.

**Solution**:
1. Check your production environment variables
2. Verify the App ID in browser console (see Step 1)
3. Enable JSSDK on the **correct** app

### Issue 2: Changes Not Propagated

**Symptom**: You enabled JSSDK but still get the error.

**Solution**:
1. Wait 5-10 minutes after saving changes
2. Clear browser cache
3. Try in Incognito mode
4. Check if you saved changes (go back and verify the setting is still "Yes")

### Issue 3: App in Development Mode

**Symptom**: Error persists even after enabling JSSDK.

**Solution**:
1. Go to **Settings** → **Basic Settings**
2. Check **App Mode**:
   - If **Development**: Add yourself as a **Tester** in **Roles**
   - Or switch to **Live** mode (requires App Review)

### Issue 4: Domain Mismatch

**Symptom**: Works locally but not in production.

**Solution**:
1. Verify **App Domains** includes your production domain
2. Verify **Site URL** matches your production URL
3. Ensure you're using **HTTPS** in production

## 🧪 Testing Checklist

- [ ] App ID in production matches Facebook Developers
- [ ] "Login with JavaScript SDK" is set to **Yes** in Facebook Developers
- [ ] App Domains includes production domain
- [ ] Site URL is set correctly
- [ ] OAuth Redirect URIs include production callback URL
- [ ] Changes saved and waited 5+ minutes
- [ ] Browser cache cleared
- [ ] Tested in Incognito mode
- [ ] Checked browser console for errors

## 📝 Debug Information

When you click "Sign in with Facebook", check the browser console for:

```
Attempting Facebook login with App ID: [YOUR_APP_ID]
```

Compare this with the App ID in:
- Your production environment variables
- Facebook Developers → Settings → Basic Settings → App ID

**They must match!**

## 🆘 Still Not Working?

1. **Double-check the App ID**:
   - Production env var vs Facebook Developers
   - They must be identical

2. **Verify you're editing the right app**:
   - Facebook Developers might have multiple apps
   - Make sure you're editing the one with the matching App ID

3. **Check Facebook Login product**:
   - Go to Products → Facebook Login
   - Ensure it's added and configured

4. **Review error in console**:
   - Open Developer Tools → Console
   - Look for detailed error messages
   - Share these with support if needed

5. **Test with a different browser**:
   - Sometimes browser extensions interfere
   - Try Chrome, Firefox, or Safari

## 🔗 Useful Links

- [Facebook Developers Console](https://developers.facebook.com/apps/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Full Setup Guide](./GUIDE_ACTIVER_FACEBOOK_JSSDK.md)

