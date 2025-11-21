# Spotify API Configuration Troubleshooting Guide (ARCHIVED)

## Overview
This guide was used for troubleshooting Spotify integration but is no longer active in the main application.

## Issues Previously Addressed

### Issue 1: Invalid Client ID
- Verification of Client ID configuration
- Checking app status in Spotify Developer Dashboard

### Issue 2: Redirect URI Mismatch
- Exact matching of redirect URIs
- Protocol, domain, port, and path verification

### Issue 3: Access Denied
- Permission handling
- User revocation process

### Issue 4: No Track Currently Playing
- Active playback device requirements
- Spotify Free vs Premium limitations

### Issue 5: Cannot Play/Control Music
- Premium account requirements
- Device management

### Issue 6: Token Expiration
- Token lifetime (1 hour)
- Token refresh requirements

### Issue 7: CORS Errors
- Cross-origin request handling
- Browser security restrictions

## Authorization Flow

```
User clicks "Connect to Spotify"
                ↓
Redirect to Spotify authorize endpoint
                ↓
User logs in to Spotify
                ↓
User grants permissions
                ↓
Spotify redirects to app with access token
                ↓
App parses token from URL hash
                ↓
App uses token to call Spotify API
                ↓
Display current track & enable controls
```

---

**ARCHIVED:** Spotify integration removed from active codebase on 2025-11-20
