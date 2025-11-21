# Timezone Feature Documentation

## Overview
The Focus app now includes a timezone confirmation feature that allows users to explicitly confirm their timezone. This ensures accurate scheduling of reminders and proper time tracking across different regions.

## Features

### 1. Automatic Timezone Detection
- The app automatically detects the user's timezone using the browser's `Intl.DateTimeFormat` API
- Supports all valid IANA timezone identifiers
- Falls back to UTC if detection fails

### 2. Timezone Modal
- **First-time users**: A modal automatically opens on first visit asking users to confirm their timezone
- **Detected timezone display**: Shows the automatically detected timezone with UTC offset
- **Timezone selection**: Users can choose from a comprehensive list of 37+ timezones
- **Quick confirm**: Users can confirm with a single click or use the detected timezone

### 3. User Settings Integration
- Timezone preference is stored in `localStorage` with key `focusUserTimezone`
- Once confirmed, the modal won't show again unless the user clears their local storage
- User settings include:
  - `timezone`: The confirmed timezone (e.g., "America/New_York")
  - `useSystemTimezone`: Boolean flag (set to false when user confirms)

### 4. UTC Offset Display
- Each timezone displays its current UTC offset
- Format: `UTC±HH:MM`
- Example: `UTC-05:00` for Eastern Time, `UTC+05:30` for India Standard Time

## Implementation Details

### State Management
```javascript
let userSettings = {
    timezone: null,           // Null until user confirms
    useSystemTimezone: true,  // True by default, false after confirmation
};
```

### Storage Keys
- `TIMEZONE_STORAGE_KEY = 'focusUserTimezone'`
- Stores user timezone preferences in localStorage

### Key Functions

#### `getDetectedTimezone()`
- Returns the user's detected timezone string
- Uses `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Falls back to 'UTC' on error

#### `getUTCOffset(timezone)`
- Calculates the UTC offset for any given timezone
- Returns formatted string (e.g., "UTC+05:30")
- Handles daylight saving time differences

#### `getAllTimezones()`
- Returns array of 37+ supported timezones
- Organized by region (UTC, Americas, Europe, Asia, Australia & Pacific)
- Covers major cities and regions

#### `initializeTimezoneModal()`
- Sets up event listeners for timezone modal
- Populates timezone dropdown with all options
- Handles confirmation and detection buttons
- Supports close button and escape key

#### `checkAndShowTimezoneModal()`
- Checks if user has already confirmed a timezone
- Shows modal only if no timezone is confirmed
- Called during app initialization

#### `showTimezoneModal()`
- Opens the timezone modal dialog
- Displays detected timezone and UTC offset
- Sets modal as visible with `open` class

#### `closeTimezoneModal()`
- Closes the timezone modal
- Removes `open` class from modal element

#### `saveTimezone(timezone)`
- Persists timezone selection to user settings
- Updates localStorage
- Shows success notification
- Logs confirmation

### HTML Structure
```html
<!-- Timezone Modal -->
<div id="timezone-modal" class="timezone-modal">
    <div class="timezone-modal-content">
        <div class="timezone-modal-header">
            <h2>🌍 Confirm Your Timezone</h2>
            <button class="timezone-modal-close" id="close-timezone-modal">&times;</button>
        </div>
        <div class="timezone-modal-body">
            <p class="timezone-info">We detected your timezone as:</p>
            <div class="timezone-display">
                <span id="detected-timezone" class="timezone-name"></span>
                <span id="detected-utc-offset" class="timezone-offset"></span>
            </div>
            <div class="timezone-options">
                <div class="timezone-form-group">
                    <label for="timezone-select">Select your timezone:</label>
                    <select id="timezone-select" class="timezone-input"></select>
                </div>
            </div>
        </div>
        <div class="timezone-modal-footer">
            <button id="confirm-timezone-btn" class="btn btn-primary">✅ Confirm Timezone</button>
            <button id="use-detected-timezone-btn" class="btn btn-secondary">🔄 Use Detected</button>
        </div>
    </div>
</div>
```

### CSS Classes
- `.timezone-modal`: Main modal container (hidden by default)
- `.timezone-modal.open`: Shows modal when class is present
- `.timezone-modal-content`: Modal dialog box
- `.timezone-display`: Displays detected timezone info
- `.timezone-input`: Timezone dropdown selector
- `.timezone-modal-footer`: Button container

## User Flow

1. **First Visit**: App loads and initializes
2. **Timezone Detection**: Browser detects user's timezone
3. **Modal Display**: Modal opens showing detected timezone
4. **User Choice**:
   - Option A: Click "✅ Confirm Timezone" to use selected timezone
   - Option B: Click "🔄 Use Detected" to accept auto-detected timezone
5. **Confirmation**: Timezone is saved to localStorage
6. **Success**: Notification appears confirming the action
7. **Persistence**: Modal doesn't show again on subsequent visits

## Supported Timezones

The app supports 37 timezones across 6 regions:

### UTC
- UTC

### Americas (8)
- America/New_York
- America/Chicago
- America/Denver
- America/Los_Angeles
- America/Anchorage
- Pacific/Honolulu
- America/Toronto
- America/Mexico_City
- America/Sao_Paulo
- America/Buenos_Aires

### Europe (12)
- Europe/London
- Europe/Paris
- Europe/Berlin
- Europe/Madrid
- Europe/Rome
- Europe/Amsterdam
- Europe/Brussels
- Europe/Vienna
- Europe/Prague
- Europe/Warsaw
- Europe/Moscow

### Asia (12)
- Asia/Dubai
- Asia/Kolkata
- Asia/Bangkok
- Asia/Singapore
- Asia/Hong_Kong
- Asia/Shanghai
- Asia/Tokyo
- Asia/Seoul
- Asia/Manila

### Australia & Pacific (6)
- Australia/Sydney
- Australia/Melbourne
- Australia/Brisbane
- Australia/Perth
- Pacific/Auckland
- Pacific/Fiji

## Testing

### Unit Tests
See `tests/timezone.test.js` for comprehensive test coverage including:
- Timezone detection
- UTC offset calculation
- Modal UI interactions
- Storage persistence
- User settings integration

### Manual Testing
1. Open Focus page in a new browser
2. Modal should automatically appear
3. Verify detected timezone is correct
4. Test timezone selection dropdown
5. Test both confirmation buttons
6. Verify timezone is saved after confirmation
7. Refresh page - modal should not appear again
8. Clear localStorage to test modal again

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **IE 11**: Limited support (requires polyfills)

## Integration with Reminders

The confirmed timezone is used when:
- Setting session reminders (used in reminder date/time)
- Calculating reminder triggers
- Displaying reminder times

## Future Enhancements

- Allow users to change timezone after confirmation
- Settings page to update timezone
- Timezone indicator in header/footer
- Localized timezone names
- Automatic daylight saving time handling

## Troubleshooting

### Modal not appearing
- Check browser's localStorage is enabled
- Check browser console for errors
- Ensure JavaScript is not blocked
- Try clearing browser cache

### Wrong timezone detected
- Manual selection is available in dropdown
- Select correct timezone from list
- Settings will be saved to override detection

### Timezone not persisting
- Ensure localStorage is enabled
- Check browser privacy settings
- Private/incognito mode may not persist
- Check console for storage errors
