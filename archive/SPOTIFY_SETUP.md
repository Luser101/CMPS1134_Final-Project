# Spotify Integration Setup Guide

## Overview
This document provides step-by-step instructions for setting up Spotify API authentication and integration with the Focus Mode page.

## Prerequisites
- Spotify account (free or premium)
- Access to Spotify Developer Dashboard

## Step 1: Create Spotify Developer Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (or create one)
3. Click **"Create an App"**
4. Accept the terms and create the app
5. You'll receive:
   - **Client ID**
   - **Client Secret** (keep this private!)

## Step 2: Configure Redirect URI

1. In your app settings on Spotify Developer Dashboard
2. Click **"Edit Settings"**
3. Add the following **Redirect URIs**:
   - `http://localhost:5500/html/focus.html` (for local development)
   - `https://yourdomain.com/html/focus.html` (for production)
   - `file:///path/to/focus.html` (for local file testing - if needed)

4. Click **Save**

## Step 3: Update Configuration in Code

### Option A: Direct Configuration (Development Only)
Edit `/js/focus.js` and replace the placeholder:

```javascript
const SPOTIFY_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID_HERE';
```

With your actual Client ID from the Spotify Developer Dashboard.

### Option B: Environment Variable (Recommended for Production)
Create a `.env` file in your project root:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_REDIRECT_URI=http://localhost:5500/html/focus.html
```

Then use a build tool to inject these variables.

## Authorization Flow

The implementation uses the **Authorization Code Flow with PKCE** for browser-based applications:

1. User clicks "Connect to Spotify" button
2. User is redirected to Spotify login page
3. User grants permissions
4. Spotify redirects back to your app with access token
5. Token is stored in browser memory
6. App uses token to access Spotify API

## Required Scopes

The following Spotify API scopes are requested:
- `user-read-private` - Read user profile
- `user-read-email` - Read user email
- `streaming` - Access streaming playback
- `user-library-read` - Read user's library
- `user-modify-playback-state` - Control playback

## Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never hardcode tokens** - Always use environment variables
2. **Never expose Client Secret** in browser code
3. **Client Secret should only be used server-side**
4. **Use HTTPS in production** - Not HTTP
5. **Rotate tokens regularly** - Implement token refresh
6. **Limit scope** - Only request necessary permissions
7. **Validate tokens** - Check expiration before API calls

## Additional Resources

- [Spotify Developer Documentation](https://developer.spotify.com/documentation/web-api/)
- [Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/)
- [Web API Reference](https://developer.spotify.com/documentation/web-api/reference/)
- [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/)

---

**ARCHIVED:** This Spotify integration has been removed from the main application as of the latest update.
