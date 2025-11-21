/**
 * Focus Mode JavaScript
 * Implements Pomodoro timer and focus statistics
 */

console.log('🌟 focus.js script loaded!');
console.log('📝 Document ready state:', document.readyState);

// ===== STATE MANAGEMENT =====
let timerState = {
    isRunning: false,
    isPaused: false,
    minutes: 25,
    seconds: 0,
    totalSeconds: 1500,
    timerInterval: null,
    sessionDuration: 1500, // 25 minutes in seconds
};

let focusStats = {
    totalSessions: 0,
    todaysSessions: 0,
    totalFocusTime: 0, // in seconds
    longestStreak: 0,
    thisWeekSessions: 0,
};

let userSettings = {
    timezone: null,
    useSystemTimezone: true,
};

// Storage keys
const TIMER_STORAGE_KEY = 'focusStats';
const TIMEZONE_STORAGE_KEY = 'focusUserTimezone';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the focus application
 */
function initializeApp() {
    try {
        console.log('🚀 Starting Focus app initialization...');
        
        console.log('📊 Loading statistics...');
        loadStatistics();
        
        console.log('⚙️ Loading user settings...');
        loadUserSettings();
        
        console.log('🔌 Setting up event listeners...');
        setupEventListeners();
        
        console.log('🖼️ Updating display...');
        updateDisplay();
        
        console.log('🕐 Initializing timezone modal...');
        initializeTimezoneModal();
        
        console.log('✅ Checking if timezone modal should be shown...');
        checkAndShowTimezoneModal();
        
        console.log('✅✅✅ Focus app initialized successfully! ✅✅✅');
    } catch (error) {
        console.error('❌ Failed to initialize focus app:', error);
        console.error('Stack trace:', error.stack);
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Timer buttons
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    const resetBtn = document.getElementById('reset-timer');
    
    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    // Timer presets
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => setTimerDuration(btn));
    });

    // Settings
    const fullscreenToggle = document.getElementById('fullscreen-mode');
    if (fullscreenToggle) {
        fullscreenToggle.addEventListener('change', toggleFullscreen);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Initialize reminder modal
    initializeReminderModal();

    // Listen for storage changes (e.g., tasks updated in another tab)
    window.addEventListener('storage', (event) => {
        if (event.key === 'tasks') {
            console.log('Tasks updated from another tab, refreshing...');
            renderFocusTasks();
        }
    });
}

// ===== TIMEZONE FUNCTIONS =====

/**
 * Get user's detected timezone
 */
function getDetectedTimezone() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('✅ Timezone detected:', timezone);
        return timezone;
    } catch (error) {
        console.error('❌ Error detecting timezone:', error);
        console.log('⚠️ Falling back to UTC');
        return 'UTC';
    }
}

/**
 * Get UTC offset for timezone
 */
function getUTCOffset(timezone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const now = new Date();
        const utcString = now.toLocaleString('en-US', { timeZone: 'UTC' });
        const tzString = now.toLocaleString('en-US', { timeZone: timezone });
        
        const utcTime = new Date(utcString);
        const tzTime = new Date(tzString);
        
        const diffMs = utcTime - tzTime;
        const diffMins = Math.round(diffMs / (1000 * 60));
        const hours = Math.floor(Math.abs(diffMins) / 60);
        const minutes = Math.abs(diffMins) % 60;
        const sign = diffMins >= 0 ? '+' : '-';
        
        return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error calculating UTC offset:', error);
        return 'UTC';
    }
}

/**
 * Get all available timezones
 */
function getAllTimezones() {
    const timezones = [
        // UTC
        'UTC',
        // Americas
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
        'America/Toronto',
        'America/Mexico_City',
        'America/Belize',
        'America/Sao_Paulo',
        'America/Buenos_Aires',
        // Europe
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Madrid',
        'Europe/Rome',
        'Europe/Amsterdam',
        'Europe/Brussels',
        'Europe/Vienna',
        'Europe/Prague',
        'Europe/Warsaw',
        'Europe/Moscow',
        // Asia
        'Asia/Dubai',
        'Asia/Kolkata',
        'Asia/Bangkok',
        'Asia/Singapore',
        'Asia/Hong_Kong',
        'Asia/Shanghai',
        'Asia/Tokyo',
        'Asia/Seoul',
        'Asia/Manila',
        // Australia & Pacific
        'Australia/Sydney',
        'Australia/Melbourne',
        'Australia/Brisbane',
        'Australia/Perth',
        'Pacific/Auckland',
        'Pacific/Fiji'
    ];
    
    console.log('✅ getAllTimezones() called - returning', timezones.length, 'timezones');
    console.log('📍 Timezones array populated:', timezones);
    
    return timezones;
}

/**
 * Initialize timezone modal
 */
function initializeTimezoneModal() {
    const timezoneModal = document.getElementById('timezone-modal');
    const closeBtn = document.getElementById('close-timezone-modal');
    const confirmBtn = document.getElementById('confirm-timezone-btn');
    const useDetectedBtn = document.getElementById('use-detected-timezone-btn');
    const timezoneSelect = document.getElementById('timezone-select');

    console.log('🔍 Initializing timezone modal...');
    console.log('   - timezone-modal:', timezoneModal ? '✅ Found' : '❌ NOT FOUND');
    console.log('   - close-timezone-modal:', closeBtn ? '✅ Found' : '❌ NOT FOUND');
    console.log('   - confirm-timezone-btn:', confirmBtn ? '✅ Found' : '❌ NOT FOUND');
    console.log('   - use-detected-timezone-btn:', useDetectedBtn ? '✅ Found' : '❌ NOT FOUND');
    console.log('   - timezone-select:', timezoneSelect ? '✅ Found' : '❌ NOT FOUND');

    if (!timezoneModal || !timezoneSelect) {
        console.error('❌ Critical error: timezone-modal or timezone-select not found in DOM');
        return;
    }

    // Populate timezone options
    const timezones = getAllTimezones();
    console.log(`📝 Populating ${timezones.length} timezones into dropdown...`);
    
    timezones.forEach((tz, index) => {
        try {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = `${tz} (${getUTCOffset(tz)})`;
            timezoneSelect.appendChild(option);
        } catch (error) {
            console.error(`❌ Error adding timezone option ${tz}:`, error);
        }
    });
    
    console.log(`✅ Successfully added ${timezoneSelect.options.length} timezone options to dropdown`);

    // Set default timezone to Belize
    const defaultTz = 'America/Belize';
    timezoneSelect.value = defaultTz;
    console.log(`✅ Default timezone set to: ${defaultTz} (Belize)`);

    // Close modal
    closeBtn?.addEventListener('click', () => {
        console.log('🔘 Close button clicked');
        closeTimezoneModal();
    });

    // Confirm timezone
    confirmBtn?.addEventListener('click', () => {
        const selectedTimezone = timezoneSelect.value;
        console.log('🔘 Confirm button clicked - Selected timezone:', selectedTimezone);
        saveTimezone(selectedTimezone);
        closeTimezoneModal();
    });

    // Use detected timezone
    useDetectedBtn?.addEventListener('click', () => {
        console.log('🔘 Use Detected button clicked - Timezone:', detectedTz);
        saveTimezone(detectedTz);
        closeTimezoneModal();
    });

    // Close on background click
    timezoneModal?.addEventListener('click', (e) => {
        if (e.target === timezoneModal) {
            console.log('🔘 Modal background clicked - Closing');
            closeTimezoneModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && timezoneModal.classList.contains('open')) {
            console.log('🔘 Escape key pressed - Closing modal');
            closeTimezoneModal();
        }
    });
    
    console.log('✅ Timezone modal initialization complete');
}

/**
 * Show timezone modal if not confirmed yet
 */
function checkAndShowTimezoneModal() {
    // Check if user has already confirmed a timezone
    const hasConfirmedTimezone = userSettings.timezone !== null && userSettings.timezone !== undefined;
    
    if (!hasConfirmedTimezone) {
        showTimezoneModal();
    } else {
        console.log('Timezone already confirmed:', userSettings.timezone);
    }
}

/**
 * Show timezone modal
 */
function showTimezoneModal() {
    const timezoneModal = document.getElementById('timezone-modal');
    const defaultTz = 'America/Belize';
    const detectedTzEl = document.getElementById('detected-timezone');
    const detectedOffsetEl = document.getElementById('detected-utc-offset');

    console.log('📢 Showing timezone modal...');
    console.log('   - Default timezone (Belize):', defaultTz);
    console.log('   - UTC offset:', getUTCOffset(defaultTz));
    console.log('   - detected-timezone element:', detectedTzEl ? '✅ Found' : '❌ NOT FOUND');
    console.log('   - detected-utc-offset element:', detectedOffsetEl ? '✅ Found' : '❌ NOT FOUND');

    if (!timezoneModal) {
        console.error('❌ Critical error: timezone-modal not found in DOM');
        return;
    }

    if (detectedTzEl) {
        detectedTzEl.textContent = defaultTz;
        console.log('✅ Set default timezone text to:', defaultTz);
    }
    
    if (detectedOffsetEl) {
        const offset = getUTCOffset(defaultTz);
        detectedOffsetEl.textContent = offset;
        console.log('✅ Set UTC offset text to:', offset);
    }

    timezoneModal.classList.add('open');
    console.log('✅ Timezone modal opened (class "open" added)');
}

/**
 * Close timezone modal
 */
function closeTimezoneModal() {
    const timezoneModal = document.getElementById('timezone-modal');
    if (timezoneModal) {
        timezoneModal.classList.remove('open');
    }
}

/**
 * Save timezone to user settings
 */
function saveTimezone(timezone) {
    try {
        userSettings.timezone = timezone;
        userSettings.useSystemTimezone = false;
        saveUserSettings();
        showNotification(`✅ Timezone confirmed: ${timezone}`, 'success');
        console.log('Timezone saved:', timezone);
    } catch (error) {
        console.error('Error saving timezone:', error);
        showNotification('❌ Failed to save timezone', 'error');
    }
}

// ===== TIMER FUNCTIONS =====

/**
 * Start the Pomodoro timer
 */
function startTimer() {
    if (timerState.isRunning) return;

    timerState.isRunning = true;
    timerState.isPaused = false;

    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    
    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;

    timerState.timerInterval = setInterval(() => {
        if (timerState.totalSeconds > 0) {
            timerState.totalSeconds--;
            updateTimerDisplay();
        } else {
            completeSession();
        }
    }, 1000);
}

/**
 * Pause the timer
 */
function pauseTimer() {
    if (!timerState.isRunning) return;

    timerState.isRunning = false;
    timerState.isPaused = true;
    
    clearInterval(timerState.timerInterval);

    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

/**
 * Reset the timer to the selected duration
 */
function resetTimer() {
    timerState.isRunning = false;
    timerState.isPaused = false;
    
    clearInterval(timerState.timerInterval);
    
    timerState.totalSeconds = timerState.sessionDuration;
    updateTimerDisplay();

    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

/**
 * Set timer duration from preset button
 */
function setTimerDuration(btn) {
    const minutes = parseInt(btn.dataset.minutes);
    
    // Update active state
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Reset timer with new duration
    timerState.sessionDuration = minutes * 60;
    resetTimer();
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timerState.totalSeconds / 60);
    const seconds = timerState.totalSeconds % 60;
    
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');
    
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

    // Update page title
    document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - Focus Mode`;
}

/**
 * Complete a focus session
 */
function completeSession() {
    clearInterval(timerState.timerInterval);
    timerState.isRunning = false;

    // Update statistics
    focusStats.totalSessions++;
    focusStats.todaysSessions++;
    focusStats.totalFocusTime += timerState.sessionDuration;
    focusStats.thisWeekSessions++;

    saveStatistics();
    updateStatisticsDisplay();

    // Play notification sound
    playNotificationSound();

    // Show notification
    showNotification('Great focus session! 🎉 Take a break or start another session.');

    // Reset timer
    resetTimer();
}

/**
 * Play notification sound
 */
function playNotificationSound() {
    const shouldPlaySound = document.getElementById('sound-notification')?.checked !== false;
    
    if (!shouldPlaySound) return;

    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.error('Could not play notification sound:', error);
    }
}

// ===== STATISTICS FUNCTIONS =====

/**
 * Load statistics from localStorage
 */
function loadStatistics() {
    const scope = 'user-read-private user-read-email streaming user-library-read user-modify-playback-state';
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.append('scope', scope);

    console.log('🎵 Connecting to Spotify...');
    console.log('Client ID:', SPOTIFY_CLIENT_ID);
    console.log('Redirect URI:', SPOTIFY_REDIRECT_URI);
    
    window.location.href = authUrl.toString();
}

/**
 * Check for Spotify connection token in URL hash and handle errors
 */
function checkSpotifyConnection() {
    console.log("🔍 Checking Spotify connection...");
    console.log("📍 Current URL:", window.location.href);
    console.log("🔗 Hash fragment:", window.location.hash);
    
    const hash = window.location.hash.substring(1);
    
    if (!hash) {
        console.log("ℹ️ No hash in URL - normal state, not redirected from OAuth");
        return;
    }
    
    console.log("✅ URL hash found:", hash.substring(0, 50) + '...');
    
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const expiresIn = params.get('expires_in');
    
    console.log("📋 OAuth response:", { 
        hasToken: !!accessToken, 
        tokenLength: accessToken?.length || 0,
        error: error || 'none',
        expiresIn: expiresIn || 'not provided'
    });

    // Handle authorization errors
    if (error) {
        console.error('Spotify authorization error:', error);
        let errorMessage = '❌ Spotify authorization failed';
        
        if (error === 'invalid_client') {
            errorMessage = '❌ Invalid Client ID. Check SPOTIFY_SETUP.md';
        } else if (error === 'invalid_scope') {
            errorMessage = '❌ Invalid permissions requested';
        } else if (error === 'redirect_uri_mismatch') {
            errorMessage = '❌ Redirect URI mismatch. Check Spotify Developer Dashboard';
        }
        
        showNotification(errorMessage, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (accessToken) {
        console.log("✅ Valid access token found, storing...");
        spotifyState.accessToken = accessToken;
        spotifyState.isConnected = true;
        
        // Set token expiry (use expiresIn from response, default to 1 hour)
        const expirySeconds = parseInt(expiresIn) || 3600;
        spotifyState.tokenExpiry = new Date().getTime() + (expirySeconds * 1000);
        console.log(`⏰ Token expiry set to: ${expirySeconds} seconds (${new Date(spotifyState.tokenExpiry).toLocaleTimeString()})`);
        
        updateSpotifyStatus();
        
        // Initialize Spotify Web Playback SDK if loaded
        if (window.Spotify && window.Spotify.Player) {
            console.log('🎵 Spotify SDK already loaded, initializing with token...');
            window.onSpotifyWebPlaybackSDKReady();
        } else {
            console.log('⏳ Waiting for Spotify Web Playback SDK to load...');
            console.log('📦 SDK should load from: https://sdk.scdn.co/spotify-player.js');
            // SDK will call onSpotifyWebPlaybackSDKReady when loaded
        }
        
        fetchCurrentTrack();
        showNotification('✅ Successfully connected to Spotify!', 'success');
        
        // Remove token from URL for security
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('🔐 Token removed from URL for security');
    }
}

/**
 * Update Spotify connection status display
 */
function updateSpotifyStatus() {
    const statusEl = document.getElementById('spotify-status');
    const connectBtn = document.getElementById('spotify-connect-btn');

    if (spotifyState.isConnected) {
        if (statusEl) {
            statusEl.textContent = '✓ Connected to Spotify';
            statusEl.classList.add('connected');
        }
        if (connectBtn) {
            connectBtn.textContent = '🔄 Reconnect to Spotify';
        }
    } else {
        if (statusEl) {
            statusEl.textContent = 'Not connected';
            statusEl.classList.remove('connected');
        }
        if (connectBtn) {
            connectBtn.textContent = '🎧 Connect to Spotify';
        }
    }
}

/**
 * Fetch current track from Spotify with error handling
 */
async function fetchCurrentTrack() {
    if (!spotifyState.accessToken) {
        console.warn('No Spotify access token available');
        return;
    }

    // Check if token has expired
    if (spotifyState.tokenExpiry && new Date().getTime() > spotifyState.tokenExpiry) {
        console.warn('Spotify token expired. User needs to reconnect.');
        spotifyState.isConnected = false;
        spotifyState.accessToken = null;
        updateSpotifyStatus();
        return;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${spotifyState.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Handle different response statuses
        if (response.status === 204) {
            // No track currently playing
            console.log('No track currently playing');
            return;
        }

        if (response.status === 401) {
            // Unauthorized - token invalid or expired
            console.error('Spotify token invalid or expired');
            spotifyState.isConnected = false;
            spotifyState.accessToken = null;
            updateSpotifyStatus();
            showNotification('🔄 Spotify session expired. Please reconnect.', 'info');
            return;
        }

        if (!response.ok) {
            console.error(`Spotify API error: ${response.status} ${response.statusText}`);
            if (response.status === 429) {
                console.warn('Rate limited by Spotify API');
            }
            return;
        }

        const data = await response.json();
        
        if (data.item) {
            spotifyState.currentTrack = {
                name: data.item.name,
                artist: data.item.artists?.[0]?.name || 'Unknown Artist',
                imageUrl: data.item.album?.images?.[0]?.url,
                isPlaying: data.is_playing
            };

            updateTrackDisplay();
        }
    } catch (error) {
        console.error('Error fetching Spotify track:', error);
        if (error instanceof TypeError) {
            console.error('Network error - ensure Spotify API is accessible');
        }
    }
}

/**
 * Update track display
 */
function updateTrackDisplay() {
    if (!spotifyState.currentTrack) {
        document.getElementById('track-name').textContent = 'No track playing';
        document.getElementById('artist-name').textContent = 'Connect to Spotify to see tracks';
        return;
    }

    const trackNameEl = document.getElementById('track-name');
    const artistNameEl = document.getElementById('artist-name');
    const albumArtEl = document.getElementById('album-art');
    const playPauseBtn = document.getElementById('play-pause-btn');

    if (trackNameEl) trackNameEl.textContent = spotifyState.currentTrack.name;
    if (artistNameEl) artistNameEl.textContent = spotifyState.currentTrack.artist;
    if (albumArtEl && spotifyState.currentTrack.imageUrl) {
        albumArtEl.src = spotifyState.currentTrack.imageUrl;
    }
    
    if (playPauseBtn) {
        playPauseBtn.innerHTML = spotifyState.currentTrack.isPlaying ? '<span>⏸</span>' : '<span>▶</span>';
    }
}

/**
 * Toggle play/pause on Spotify using Web Playback SDK
 */
async function togglePlayPause() {
    if (!spotifyState.accessToken || !spotifyDeviceId) {
        showNotification('🎧 Please connect to Spotify first', 'warning');
        console.warn('Cannot toggle playback: token or device not ready');
        return;
    }

    try {
        if (spotifyState.isPlaying) {
            await spotifyPlayer.pause();
            console.log('⏸ Paused');
        } else {
            await spotifyPlayer.resume();
            console.log('▶ Playing');
        }

        spotifyState.isPlaying = !spotifyState.isPlaying;
        updatePlaybackButton();
    } catch (error) {
        console.error('❌ Error toggling play/pause:', error);
        showNotification(`❌ Playback error: ${error.message}`, 'error');
    }
}

/**
 * Skip to next track
 */
async function skipNext() {
    if (!spotifyState.accessToken) {
        showNotification('Please connect to Spotify first', 'warning');
        return;
    }

    try {
        await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${spotifyState.accessToken}`
            }
        });

        fetchCurrentTrack();
    } catch (error) {
        console.error('Error skipping to next track:', error);
    }
}

/**
 * Skip to previous track
 */
async function skipPrevious() {
    if (!spotifyState.accessToken) {
        showNotification('Please connect to Spotify first', 'warning');
        return;
    }

    try {
        await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${spotifyState.accessToken}`
            }
        });

        fetchCurrentTrack();
    } catch (error) {
        console.error('Error skipping to previous track:', error);
    }
}

/**
 * Play a specific playlist using Web Playback SDK
 */
async function playPlaylist(type) {
    if (!spotifyState.accessToken || !spotifyDeviceId) {
        showNotification('🎧 Connect to Spotify first', 'warning');
        console.warn('Cannot play playlist: token or device not ready');
        return;
    }

    const playlistMap = {
        focus: '37i9dQZF1DWXLeA4mPR6hQ',    // Spotify's official Focus playlist
        lofi: '37i9dQZF1DX4sWSpwq3LiO',    // Lofi Chill
        ambient: '37i9dQZF1DX1HUddxKi6Yh', // Ambient
        classical: '37i9dQZF1DX6VDO8tZvYKe' // Classical
    };

    const playlistId = playlistMap[type] || playlistMap.focus;
    const playlistName = type.charAt(0).toUpperCase() + type.slice(1);

    try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${spotifyState.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context_uri: `spotify:playlist:${playlistId}`
            })
        });

        showNotification(`🎵 Now playing ${playlistName} playlist`, 'success');
        spotifyState.isPlaying = true;
        updatePlaybackButton();
        console.log(`Playing playlist: ${playlistName}`);
    } catch (error) {
        console.error('❌ Error playing playlist:', error);
        showNotification(`❌ Failed to play playlist: ${error.message}`, 'error');
    }
}

/**
 * Update volume display and apply to Spotify player
 */
function updateVolumeDisplay(value) {
    const volumeValueEl = document.getElementById('volume-value');
    if (volumeValueEl) {
        volumeValueEl.textContent = `${value}%`;
    }

    // Apply volume to Spotify Web Playback SDK player
    if (spotifyPlayer && spotifyDeviceId) {
        try {
            spotifyPlayer.setVolume(value / 100);
            console.log(`🔊 Volume set to ${value}%`);
        } catch (error) {
            console.error('Error setting Spotify volume:', error);
        }
    }
}

// ===== STATISTICS FUNCTIONS =====

/**
 * Load statistics from localStorage
 */
function loadStatistics() {
    try {
        const stored = localStorage.getItem(TIMER_STORAGE_KEY);
        if (stored) {
            focusStats = { ...focusStats, ...JSON.parse(stored) };
        }
        updateStatisticsDisplay();
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

/**
 * Save statistics to localStorage
 */
function saveStatistics() {
    try {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(focusStats));
    } catch (error) {
        console.error('Error saving statistics:', error);
    }
}

/**
 * Load user settings from localStorage
 */
function loadUserSettings() {
    try {
        const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
        if (stored) {
            userSettings = { ...userSettings, ...JSON.parse(stored) };
        }
        console.log('User timezone settings loaded:', userSettings);
    } catch (error) {
        console.error('Error loading user settings:', error);
    }
}

/**
 * Save user settings to localStorage
 */
function saveUserSettings() {
    try {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, JSON.stringify(userSettings));
        console.log('User timezone settings saved:', userSettings);
    } catch (error) {
        console.error('Error saving user settings:', error);
    }
}

/**
 * Update statistics display
 */
function updateStatisticsDisplay() {
    const sessionsCountEl = document.getElementById('sessions-count');
    const totalTimeEl = document.getElementById('total-time');
    const totalSessionsEl = document.getElementById('total-sessions');
    const thisWeekEl = document.getElementById('this-week');
    const longestStreakEl = document.getElementById('longest-streak');
    const avgFocusEl = document.getElementById('avg-focus');

    if (sessionsCountEl) sessionsCountEl.textContent = focusStats.todaysSessions;
    
    if (totalTimeEl) {
        const hours = Math.floor(focusStats.totalFocusTime / 3600);
        const minutes = Math.floor((focusStats.totalFocusTime % 3600) / 60);
        totalTimeEl.textContent = `${hours}h ${minutes}m`;
    }

    if (totalSessionsEl) totalSessionsEl.textContent = focusStats.totalSessions;
    if (thisWeekEl) thisWeekEl.textContent = focusStats.thisWeekSessions;
    if (longestStreakEl) longestStreakEl.textContent = focusStats.longestStreak;
    
    if (avgFocusEl) {
        const avg = focusStats.totalSessions > 0 
            ? Math.round(focusStats.totalFocusTime / focusStats.totalSessions / 60)
            : 0;
        avgFocusEl.textContent = avg;
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get all available timezones
 */
function getAllTimezones() {
    const timezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Moscow',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Asia/Bangkok',
        'Asia/Shanghai',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Australia/Melbourne',
        'Pacific/Auckland',
    ];
    return timezones;
}

/**
 * Populate timezone selector with available timezones
 */
function populateTimezoneSelector(selectElement) {
    if (!selectElement) return;
    
    const timezones = getAllTimezones();
    
    // Clear existing options except the first one
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    // Add timezone options
    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz;
        selectElement.appendChild(option);
    });
    
    console.log(`Populated ${timezones.length} timezones in selector`);
}

/**
 * Get current time in a specific timezone
 */
function getTimeInTimezone(timezone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        return formatter.format(new Date());
    } catch (error) {
        console.error(`Error formatting time for timezone ${timezone}:`, error);
        return new Date().toLocaleTimeString();
    }
}

/**
 * Update timezone display with current time
 */
function updateTimezoneDisplay(timezone) {
    const display = document.getElementById('current-timezone-display');
    if (!display) return;
    
    try {
        const currentTime = getTimeInTimezone(timezone);
        display.textContent = `Current time in ${timezone}: ${currentTime}`;
    } catch (error) {
        console.error('Error updating timezone display:', error);
        display.textContent = `Timezone: ${timezone}`;
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('focus-notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'focus-notifications';
        container.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        animation: slideIn 0.3s ease-out;
    `;

    container.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
        elem.requestFullscreen?.().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen?.();
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    if (e.key === ' ') {
        e.preventDefault();
        if (!timerState.isRunning && !timerState.isPaused) {
            startTimer();
        } else if (timerState.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    } else if (e.key === 'r' || e.key === 'R') {
        resetTimer();
    } else if (e.key === 'f' || e.key === 'F') {
        document.getElementById('fullscreen-mode').click();
    } else if (e.key === 'm' || e.key === 'M') {
        // Toggle mute
        document.getElementById('sound-notification').checked = !document.getElementById('sound-notification').checked;
    }
}

/**
 * Update display on page load
 */
function updateDisplay() {
    updateTimerDisplay();
    updateStatisticsDisplay();
    renderFocusTasks();
}

/**
 * Render focus tasks from todo list
 */
function renderFocusTasks() {
    try {
        const tasksContainer = document.getElementById('focus-tasks-list');
        if (!tasksContainer) return;

        // Get tasks from localStorage (same key as script.js)
        const stored = localStorage.getItem('tasks');
        const tasks = stored ? JSON.parse(stored) : [];

        if (!Array.isArray(tasks) || tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks-message">No tasks for today. Create some in the Todo List to see them here!</p>';
            return;
        }

        // Filter tasks by completion status (show only incomplete tasks)
        const incompleteTasks = tasks.filter(task => !task.completed);

        if (incompleteTasks.length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks-message">All tasks completed! 🎉 Great focus session!</p>';
            return;
        }

        // Render task items
        tasksContainer.innerHTML = '';
        incompleteTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'focus-task-item';
            
            const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : '';
            const priorityLabel = task.priority ? `[${task.priority}]` : '';
            
            taskElement.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" class="focus-task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-details">
                    <div class="task-text ${priorityClass}">
                        ${priorityLabel} ${escapeHtml(task.text)}
                    </div>
                    ${task.dueDate ? `<div class="task-due-date">📅 ${task.dueDate}</div>` : ''}
                </div>
            `;
            
            tasksContainer.appendChild(taskElement);
        });

        // Add event listeners to checkboxes
        document.querySelectorAll('.focus-task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                updateTaskInTodoList(taskId, e.target.checked);
            });
        });

        console.log(`Rendered ${incompleteTasks.length} focus tasks`);
    } catch (error) {
        console.error('Error rendering focus tasks:', error);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Update task completion status in todo list
 */
function updateTaskInTodoList(taskId, isCompleted) {
    try {
        const stored = localStorage.getItem('tasks');
        const tasks = stored ? JSON.parse(stored) : [];
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = isCompleted;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Refresh the task list display
            renderFocusTasks();
            
            // Show feedback
            showNotification(`Task ${isCompleted ? 'completed' : 'uncompleted'}! ✓`, 'success');
            console.log(`Task ${taskId} updated to ${isCompleted ? 'completed' : 'incomplete'}`);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Failed to update task', 'error');
    }
}

/**
 * Initialize reminder modal functionality
 */
function initializeReminderModal() {
    const reminderBtn = document.getElementById('set-reminder-btn');
    const reminderModal = document.getElementById('reminder-modal');
    const closeBtn = document.getElementById('close-reminder-modal');
    const cancelBtn = document.getElementById('cancel-reminder-btn');
    const saveBtn = document.getElementById('save-reminder-btn');
    const reminderForm = document.getElementById('reminder-form');
    const timezoneSelect = document.getElementById('reminder-timezone');

    if (!reminderBtn) return;

    // Populate timezone dropdown on initialization
    populateTimezoneSelector(timezoneSelect);

    // Open modal
    reminderBtn.addEventListener('click', () => {
        // Set default date and time to now
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        document.getElementById('reminder-date').value = dateStr;
        document.getElementById('reminder-time').value = timeStr;
        document.getElementById('reminder-notification').value = 'browser';
        document.getElementById('reminder-message').value = '';
        
        // Set timezone to user's selected timezone or system default
        if (userSettings.timezone) {
            timezoneSelect.value = userSettings.timezone;
        } else {
            const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            timezoneSelect.value = systemTz;
            updateTimezoneDisplay(systemTz);
        }
        
        reminderModal.classList.add('open');
    });

    // Update timezone display when selection changes
    timezoneSelect?.addEventListener('change', (e) => {
        updateTimezoneDisplay(e.target.value);
    });

    // Close modal
    closeBtn?.addEventListener('click', () => reminderModal.classList.remove('open'));
    cancelBtn?.addEventListener('click', () => reminderModal.classList.remove('open'));

    // Close on background click
    reminderModal?.addEventListener('click', (e) => {
        if (e.target === reminderModal) {
            reminderModal.classList.remove('open');
        }
    });

    // Save reminder
    saveBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        saveSessionReminder();
    });

    reminderForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSessionReminder();
    });
}

/**
 * Save session reminder
 */
function saveSessionReminder() {
    try {
        const date = document.getElementById('reminder-date').value;
        const time = document.getElementById('reminder-time').value;
        const notificationType = document.getElementById('reminder-notification').value;
        const message = document.getElementById('reminder-message').value || 'Your focus session is ready!';
        const timezone = document.getElementById('reminder-timezone').value;

        if (!date || !time) {
            showNotification('❌ Please select both date and time', 'error');
            return;
        }

        if (!timezone) {
            showNotification('❌ Please select a timezone', 'error');
            return;
        }

        // Validate reminder is in the future
        const reminderDateTime = new Date(`${date}T${time}`);
        if (reminderDateTime <= new Date()) {
            showNotification('⚠️ Reminder time must be in the future', 'error');
            return;
        }

        // Save timezone preference
        userSettings.timezone = timezone;
        userSettings.useSystemTimezone = false;
        saveUserSettings();

        // Store reminder with timezone
        const reminder = {
            date,
            time,
            timezone,
            notificationType,
            message,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('focusReminder', JSON.stringify(reminder));
        
        // Close modal
        document.getElementById('reminder-modal').classList.remove('open');
        
        // Show success message
        showNotification(`✅ Reminder set for ${date} at ${time} (${timezone})`, 'success');
        
        // Schedule the reminder check
        scheduleReminderCheck(reminderDateTime, message, notificationType);
        
        console.log('Session reminder saved:', reminder);
    } catch (error) {
        console.error('Error saving reminder:', error);
        showNotification('❌ Failed to save reminder', 'error');
    }
}

/**
 * Schedule reminder check
 */
function scheduleReminderCheck(reminderDateTime, message, notificationType) {
    const now = new Date();
    const timeUntilReminder = reminderDateTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
        setTimeout(() => {
            triggerSessionReminder(message, notificationType);
        }, timeUntilReminder);
    }
}

/**
 * Trigger session reminder
 */
function triggerSessionReminder(message, notificationType) {
    // Show in-app notification
    showNotification(`⏰ ${message}`, 'reminder');

    if (notificationType === 'browser' || notificationType === 'both') {
        sendBrowserNotification('Focus Session Reminder', message);
    }

    if (notificationType === 'sound' || notificationType === 'both') {
        playReminderSound();
    }
}

/**
 * Send browser notification
 */
function sendBrowserNotification(title, message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/image/download.jpeg',
                tag: 'focus-reminder',
                requireInteraction: true
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: message,
                        icon: '/image/download.jpeg',
                        tag: 'focus-reminder',
                        requireInteraction: true
                    });
                }
            });
        }
    }
}

/**
 * Play reminder sound using Web Audio API
 */
function playReminderSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Create a pleasant reminder beep
        const now = audioContext.currentTime;
        
        // First beep
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);

        // Second beep
        const secondBeepTime = now + 0.4;
        oscillator.frequency.setValueAtTime(1000, secondBeepTime);
        gainNode.gain.setValueAtTime(0.3, secondBeepTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, secondBeepTime + 0.3);
        
        oscillator.start(secondBeepTime);
        oscillator.stop(secondBeepTime + 0.3);

        console.log('Reminder sound played');
    } catch (error) {
        console.warn('Unable to play reminder sound:', error);
    }
}

/**
 * Show notification function
 */
