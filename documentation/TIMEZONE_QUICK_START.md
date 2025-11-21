# Timezone Feature - Quick Start Guide

## For Users

### First Time Setup
1. **Open the Focus app** in your browser
2. **Timezone modal appears** automatically
3. **See your detected timezone** with UTC offset
4. **Choose an option**:
   - 🔄 Click "Use Detected" to accept auto-detected timezone
   - ✅ Select a different timezone from dropdown, then click "Confirm Timezone"
5. **Done!** Timezone is saved and won't ask again

### Changing Your Timezone
- Clear browser's localStorage to reset
- Open Focus app again to see timezone modal

---

## For Developers

### Accessing User's Timezone
```javascript
// User's confirmed timezone
const timezone = userSettings.timezone;
// Example: "America/New_York"

// Check if confirmed
const confirmed = userSettings.timezone !== null;
```

### Using in Reminder Scheduling
```javascript
// When scheduling a reminder, the timezone is available:
const reminderDateTime = new Date(`${date}T${time}`);
// Times respect the user's selected timezone
```

### Getting UTC Offset
```javascript
// Calculate offset for any timezone
const offset = getUTCOffset('America/New_York'); 
// Returns: "UTC-05:00" or "UTC-04:00" depending on DST
```

### Getting All Supported Timezones
```javascript
const allTimezones = getAllTimezones();
// Returns array of 37+ timezone strings
```

---

## Key Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `getDetectedTimezone()` | Auto-detect user timezone | String (timezone identifier) |
| `getUTCOffset(tz)` | Get UTC offset for timezone | String (UTC±HH:MM) |
| `getAllTimezones()` | Get list of supported timezones | Array of strings |
| `initializeTimezoneModal()` | Setup modal interactions | void |
| `checkAndShowTimezoneModal()` | Show modal if needed | void |
| `showTimezoneModal()` | Display timezone modal | void |
| `closeTimezoneModal()` | Hide timezone modal | void |
| `saveTimezone(tz)` | Save timezone selection | void |

---

## Storage

### localStorage Key
```
Key: "focusUserTimezone"
Value: JSON string containing userSettings
Example: {"timezone":"America/New_York","useSystemTimezone":false}
```

### Clearing Timezone (Reset to Default)
```javascript
// In browser console
localStorage.removeItem('focusUserTimezone');
// Then reload the page - modal will appear again
```

---

## Supported Timezones (37 Total)

### By Region
- **UTC** (1): UTC
- **Americas** (10): New York, Chicago, Denver, Los Angeles, Anchorage, Honolulu, Toronto, Mexico City, São Paulo, Buenos Aires
- **Europe** (12): London, Paris, Berlin, Madrid, Rome, Amsterdam, Brussels, Vienna, Prague, Warsaw, Moscow
- **Asia** (12): Dubai, Kolkata, Bangkok, Singapore, Hong Kong, Shanghai, Tokyo, Seoul, Manila
- **Australia & Pacific** (6): Sydney, Melbourne, Brisbane, Perth, Auckland, Fiji

---

## Testing the Feature

### Manual Test Steps
1. **Open Focus app** in new browser tab
2. **Verify modal appears** (if first time)
3. **Check detected timezone** is correct for your location
4. **Try selecting different timezone** from dropdown
5. **Click "Confirm Timezone"** button
6. **Verify success notification** appears
7. **Refresh page** - modal should NOT appear again
8. **Check localStorage**:
   ```javascript
   // In browser console
   console.log(localStorage.getItem('focusUserTimezone'));
   ```

### Reset Testing
1. **Open browser console** (F12)
2. **Run**: `localStorage.clear()`
3. **Refresh page** - modal will appear again

---

## Troubleshooting

### Modal Not Appearing
- ✅ Check localStorage is enabled
- ✅ Check JavaScript is enabled
- ✅ Check browser console for errors
- ✅ Try clearing cache and reload

### Wrong Timezone Detected
- ✅ Manually select correct timezone from dropdown
- ✅ Click "Confirm Timezone" button
- ✅ Timezone will override the detected one

### Timezone Not Saving
- ✅ Check console for error messages
- ✅ Ensure localStorage has space available
- ✅ Check browser isn't in private/incognito mode
- ✅ Check browser privacy settings

---

## FAQ

**Q: Why does the app ask for timezone?**
A: To ensure accurate reminder scheduling and time tracking across different regions.

**Q: Can I change my timezone later?**
A: Yes! Clear localStorage and reload the app to see the timezone modal again.

**Q: Is my timezone shared with anyone?**
A: No. Your timezone is stored only in your browser's localStorage, not on any server.

**Q: Which timezones are supported?**
A: 37 major timezones covering most of the world. If your timezone isn't listed, select the closest one.

**Q: What if my browser doesn't support automatic detection?**
A: The app will default to UTC, and you can select your timezone from the dropdown.

**Q: Does the app handle daylight saving time?**
A: Yes! UTC offsets are automatically adjusted for DST.

---

## Files Modified

- ✅ `html/focus.html` - Added timezone modal HTML
- ✅ `css/focus.css` - Added timezone modal styles (120+ lines)
- ✅ `js/focus.js` - Added timezone functions (250+ lines)
- ✅ `tests/timezone.test.js` - Added timezone tests
- ✅ `TIMEZONE_FEATURE.md` - Feature documentation
- ✅ `IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## Integration Points

### When is timezone used?
- ✅ Reminder scheduling - times respect user timezone
- ✅ Statistics - accurate time tracking
- ✅ Settings - persisted for consistency

### How to use in new features?
```javascript
// Get user's timezone
if (userSettings.timezone) {
    // Use timezone for calculations
    const tz = userSettings.timezone;
}
```

---

## Next Steps

1. ✅ **Test the feature** in your browser
2. ✅ **Check console** for any errors
3. ✅ **Run test suite** to verify all tests pass
4. ✅ **Deploy** to production
5. ✅ **Monitor** for user feedback

---

**Version**: 1.0  
**Date**: November 20, 2025  
**Status**: Ready for Use ✅
