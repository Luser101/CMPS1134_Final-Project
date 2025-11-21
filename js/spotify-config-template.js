/**
 * Spotify Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this entire file content
 * 2. Replace the values with your actual Spotify credentials
 * 3. Add this file as a <script> tag BEFORE focus.js in focus.html:
 *    <script src="../js/spotify-config.js"></script>
 * 
 * OR manually update the values directly in focus.js
 */

// Get your Client ID from https://developer.spotify.com/dashboard
// Steps:
// 1. Log in to Spotify Developer Dashboard
// 2. Go to "My Apps"
// 3. Select or create an app
// 4. Copy the Client ID (don't share this!)
const SPOTIFY_CLIENT_ID = '5dde6fb03d064621b83f2a8817b24add';

// This is where your app will redirect after Spotify authorization
// MUST match the Redirect URI configured in Spotify Developer Dashboard
const SPOTIFY_REDIRECT_URI = `${window.location.origin}/html/focus.html`;

// Available scopes (permissions to request from user):
// - 'user-read-private' - Read profile information
// - 'user-read-email' - Read email address
// - 'streaming' - Play music
// - 'user-library-read' - Read saved tracks
// - 'user-modify-playback-state' - Control playback (play, pause, skip)
// - 'user-read-playback-state' - Read current playback state
const SPOTIFY_SCOPES = [
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-library-read',
    'user-modify-playback-state'
].join(' ');

/**
 * Authorization Flow Details:
 * 
 * Type: Authorization Code Flow (recommended for browser apps)
 * Documentation: https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
 * 
 * Flow:
 * 1. User clicks "Connect to Spotify" button
 * 2. Redirected to Spotify login page
 * 3. User grants permissions
 * 4. Redirected back with authorization code
 * 5. Exchange code for access token (on backend, not in browser)
 * 6. Use token to access Spotify API
 * 
 * Current Implementation:
 * Using Implicit Flow (simpler for browser, but less secure)
 * - Token returned directly in URL hash
 * - No backend server required
 * - Token lifetime: 1 hour
 * - Cannot refresh token (must re-authenticate)
 */

// Token expiry time (Spotify tokens last 1 hour = 3600 seconds)
const SPOTIFY_TOKEN_EXPIRY_MS = 3600 * 1000; // milliseconds

// API endpoints
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';
const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';

/**
 * Example API calls:
 * 
 * Get currently playing track:
 *   GET /me/player/currently-playing
 * 
 * Play/pause music:
 *   PUT /me/player/play
 *   PUT /me/player/pause
 * 
 * Skip track:
 *   POST /me/player/next
 *   POST /me/player/previous
 * 
 * Set volume:
 *   PUT /me/player/volume?volume_percent=50
 * 
 * Start playing playlist:
 *   PUT /me/player/play
 *   Body: { "context_uri": "spotify:playlist:PLAYLIST_ID" }
 * 
 * All requests require header:
 *   Authorization: Bearer {access_token}
 */

console.log('Spotify configuration loaded');
console.log('Client ID:', SPOTIFY_CLIENT_ID === 'YOUR_CLIENT_ID_HERE' ? '⚠️ NOT CONFIGURED' : '✓ Configured');
console.log('Redirect URI:', SPOTIFY_REDIRECT_URI);
