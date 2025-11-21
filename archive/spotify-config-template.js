/**
 * ARCHIVED Spotify Configuration Template
 * 
 * This file was used for Spotify API integration setup.
 * The Spotify integration has been removed from the main application.
 * 
 * ORIGINAL INSTRUCTIONS:
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
 * ARCHIVED: Spotify integration removed on 2025-11-20
 */

console.log('⚠️ Archived Spotify configuration template - integration no longer active');
