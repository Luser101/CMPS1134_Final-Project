/**
 * Utility Functions Tests
 * Tests for safeJsonParse, safeJsonStringify, and validation functions
 */

// Mock functions to test (these would be imported from script.js in a real setup)

/**
 * Test data validation function
 */
describe('Data Validation Functions', () => {
  
  describe('isValidTask', () => {
    const isValidTask = (task) => {
      return (
        task &&
        typeof task === 'object' &&
        task.id &&
        typeof task.id === 'string' &&
        task.text &&
        typeof task.text === 'string' &&
        task.text.length > 0 &&
        task.text.length <= 500 &&
        task.date
      );
    };

    test('should return true for valid task object', () => {
      const task = {
        id: '123',
        text: 'Test task',
        date: new Date(),
      };
      expect(isValidTask(task)).toBe(true);
    });

    test('should return false for task with missing id', () => {
      const task = {
        text: 'Test task',
        date: new Date(),
      };
      expect(isValidTask(task)).toBe(false);
    });

    test('should return false for task with empty text', () => {
      const task = {
        id: '123',
        text: '',
        date: new Date(),
      };
      expect(isValidTask(task)).toBe(false);
    });

    test('should return false for task with text exceeding max length', () => {
      const task = {
        id: '123',
        text: 'a'.repeat(501),
        date: new Date(),
      };
      expect(isValidTask(task)).toBe(false);
    });

    test('should return false for task with missing date', () => {
      const task = {
        id: '123',
        text: 'Test task',
      };
      expect(isValidTask(task)).toBe(false);
    });

    test('should return false for null or undefined', () => {
      expect(isValidTask(null)).toBe(false);
      expect(isValidTask(undefined)).toBe(false);
    });
  });

  describe('isValidReminderDateTime', () => {
    const isValidReminderDateTime = (date, time) => {
      if (!date || !time) return false;
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) return false;
      
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) return false;
      
      const reminderDate = new Date(`${date}T${time}`);
      const now = new Date();
      
      return reminderDate >= now;
    };

    test('should validate correct date and time format', () => {
      // Note: This test depends on current time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      expect(isValidReminderDateTime(dateStr, '14:30')).toBe(true);
    });

    test('should reject invalid date format', () => {
      expect(isValidReminderDateTime('2024/12/25', '14:30')).toBe(false);
    });

    test('should reject invalid time format', () => {
      expect(isValidReminderDateTime('2024-12-25', '25:00')).toBe(false);
    });

    test('should reject empty values', () => {
      expect(isValidReminderDateTime('', '14:30')).toBe(false);
      expect(isValidReminderDateTime('2024-12-25', '')).toBe(false);
    });
  });
});

/**
 * JSON parsing and stringification tests
 */
describe('JSON Utility Functions', () => {
  
  describe('safeJsonParse', () => {
    const safeJsonParse = (jsonString, defaultValue = null) => {
      try {
        if (!jsonString || typeof jsonString !== 'string') {
          return defaultValue;
        }
        return JSON.parse(jsonString);
      } catch (e) {
        return defaultValue;
      }
    };

    test('should parse valid JSON string', () => {
      const json = '{"name":"test","value":123}';
      expect(safeJsonParse(json)).toEqual({ name: 'test', value: 123 });
    });

    test('should return default value for invalid JSON', () => {
      const json = '{invalid json}';
      expect(safeJsonParse(json, null)).toBeNull();
    });

    test('should return default value for empty string', () => {
      expect(safeJsonParse('', 'default')).toBe('default');
    });

    test('should return default value for non-string input', () => {
      expect(safeJsonParse(123, 'default')).toBe('default');
      expect(safeJsonParse(null, 'default')).toBe('default');
    });
  });

  describe('safeJsonStringify', () => {
    const safeJsonStringify = (obj, defaultValue = '{}') => {
      try {
        return JSON.stringify(obj);
      } catch (e) {
        return defaultValue;
      }
    };

    test('should stringify valid objects', () => {
      const obj = { name: 'test', value: 123 };
      expect(safeJsonStringify(obj)).toBe('{"name":"test","value":123}');
    });

    test('should handle circular references gracefully', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference
      const result = safeJsonStringify(obj, '{}');
      expect(result).toBe('{}'); // Should return default
    });

    test('should stringify arrays', () => {
      const arr = [1, 2, 3, { name: 'test' }];
      expect(safeJsonStringify(arr)).toBe('[1,2,3,{"name":"test"}]');
    });
  });
});

/**
 * Debounce and Throttle functions tests
 */
describe('Performance Utility Functions', () => {
  
  describe('debounce', () => {
    jest.useFakeTimers();

    const debounce = (func, delay = 300) => {
      let timeoutId;
      return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    };

    test('should call function after delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);
      
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should cancel previous calls when called again', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);
      
      debouncedFn();
      jest.advanceTimersByTime(150);
      debouncedFn();
      jest.advanceTimersByTime(300);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    const throttle = (func, limit = 300) => {
      let inThrottle;
      return function throttled(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    test('should call function immediately on first call', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);
      
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should ignore subsequent calls within limit', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
