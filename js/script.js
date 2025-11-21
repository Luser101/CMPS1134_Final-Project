// === CONSTANTS AND CONFIGURATION ===
const STORAGE_KEY = 'tasks';
const REMINDERS_KEY = 'taskReminders';
const MAX_TASK_LENGTH = 500;
const TASK_TIMEOUT = 5000; // 5 seconds for task operations

// === STATE ===
let tasks = [];
let currentView = 'all';
let isInitialized = false;
let reminders = {}; // Map of taskId to reminder info
let currentEditingTaskId = null;
let currentTextStyles = []; // Array of style names
let reminderCheckInterval;
let cachedElements = {}; // Cache for frequently accessed DOM elements

// === UTILITY FUNCTIONS ===

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or defaultValue
 */
function safeJsonParse(jsonString, defaultValue = null) {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            return defaultValue;
        }
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn(`Failed to parse JSON: ${e.message}`);
        return defaultValue;
    }
}

/**
 * Safely stringify JSON with error handling
 * @param {*} obj - The object to stringify
 * @param {string} defaultValue - Default value if stringification fails
 * @returns {string} Stringified object or defaultValue
 */
function safeJsonStringify(obj, defaultValue = '{}') {
    try {
        return JSON.stringify(obj);
    } catch (e) {
        console.error(`Failed to stringify object: ${e.message}`);
        return defaultValue;
    }
}

/**
 * Get cached DOM element or cache it for future use
 * @param {string} selector - CSS selector for the element
 * @returns {Element|null} The DOM element or null
 */
function getCachedElement(selector) {
    if (!cachedElements[selector]) {
        cachedElements[selector] = document.querySelector(selector);
    }
    return cachedElements[selector];
}

/**
 * Validate task object structure
 * @param {*} task - Task object to validate
 * @returns {boolean} True if task is valid
 */
function isValidTask(task) {
    return (
        task &&
        typeof task === 'object' &&
        task.id &&
        typeof task.id === 'string' &&
        task.text &&
        typeof task.text === 'string' &&
        task.text.length > 0 &&
        task.text.length <= MAX_TASK_LENGTH &&
        task.date
    );
}

/**
 * Validate reminder date and time format
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM format
 * @returns {boolean} True if valid format
 */
function isValidReminderDateTime(date, time) {
    if (!date || !time) return false;
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) return false;
    
    // Validate that date is not in the past (optional check)
    const reminderDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    return reminderDate >= now;
}

/**
 * Create a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Create a throttled version of a function
 * @param {Function} func - The function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function throttled(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Cache DOM elements for frequently accessed elements
 */
function cacheElements() {
    const selectors = [
        '#add-task',
        '#task-input',
        '#view-all',
        '#view-important',
        '#task-list',
        '#all-tasks',
        '#task-editor-modal',
        '#editor-task-text',
        '#editor-reminder-date',
        '#editor-reminder-time',
        '#reminder-display'
    ];
    
    selectors.forEach(selector => {
        getCachedElement(selector);
    });
    
    console.log('DOM elements cached');
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    try {
        // Check if we're on the todo page by looking for todo-specific elements
        const todoDateInput = document.querySelector("#todo-date-input");
        if (!todoDateInput) {
            return; // Exit if not on todo page
        }

        // Prevent double initialization
        if (isInitialized) {
            return;
        }
        
        // Initialize error handling
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Error: ', msg, '\nURL: ', url, '\nLine:', lineNo, '\nColumn:', columnNo, '\nError object:', error);
            showNotification('An error occurred. Please refresh the page.', 'error');
            return false;
        };

        // Initialize tasks from localStorage with validation
        initializeTasks();

        // Cache frequently accessed DOM elements for performance
        cacheElements();

        // Setup UI event listeners and initial rendering
        setupEventListeners();

        isInitialized = true;
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showNotification('Failed to initialize the application. Please refresh the page.', 'error');
    }
}

function initializeTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        
        if (!stored) {
            tasks = [];
            console.log('No existing tasks found in localStorage');
            return;
        }
        
        const parsedTasks = safeJsonParse(stored, null);
        
        if (!Array.isArray(parsedTasks)) {
            console.error('Tasks data is not an array');
            tasks = [];
            return;
        }
        
        if (parsedTasks.length === 0) {
            tasks = [];
            console.log('Tasks array is empty');
            return;
        }
        
        // Filter and validate tasks
        const validatedTasks = [];
        const invalidTasks = [];
        
        parsedTasks.forEach((task, index) => {
            if (isValidTask(task)) {
                validatedTasks.push({
                    ...task,
                    date: new Date(task.date),
                    completed: !!task.completed,
                    important: !!task.important,
                    priority: ['low', 'normal', 'high'].includes(task.priority) ? task.priority : 'normal',
                    textStyles: Array.isArray(task.textStyles) ? task.textStyles : [],
                    createdAt: task.createdAt || new Date().toISOString(),
                    lastModified: task.lastModified || new Date().toISOString()
                });
            } else {
                invalidTasks.push(index);
            }
        });
        
        if (invalidTasks.length > 0) {
            console.warn(`Removed ${invalidTasks.length} invalid tasks at indices: ${invalidTasks.join(', ')}`);
        }
        
        tasks = validatedTasks;
        console.log(`Successfully loaded ${tasks.length} valid tasks`);
        
        // Load reminders
        loadReminders();
    } catch (e) {
        console.error('Error loading tasks from localStorage:', e);
        tasks = [];
        showNotification('Failed to load saved tasks. Starting with an empty list.', 'warning');
    }
}

/**
 * Load reminders from localStorage with error handling
 */
function loadReminders() {
    try {
        const storedReminders = localStorage.getItem(REMINDERS_KEY);
        
        if (!storedReminders) {
            reminders = {};
            console.log('No existing reminders found');
            return;
        }
        
        const parsedReminders = safeJsonParse(storedReminders, null);
        
        if (typeof parsedReminders !== 'object' || parsedReminders === null) {
            console.error('Reminders data is not a valid object');
            reminders = {};
            return;
        }
        
        // Validate each reminder
        const validatedReminders = {};
        Object.entries(parsedReminders).forEach(([taskId, reminder]) => {
            if (isValidReminderDateTime(reminder.date, reminder.time)) {
                validatedReminders[taskId] = reminder;
            } else {
                console.warn(`Removing invalid reminder for task ${taskId}`);
            }
        });
        
        reminders = validatedReminders;
        console.log(`Successfully loaded ${Object.keys(reminders).length} valid reminders`);
    } catch (e) {
        console.error('Error loading reminders from localStorage:', e);
        reminders = {};
        showNotification('Failed to load reminders. They will be cleared.', 'warning');
    }
}
    
function setupEventListeners() {
    // Tasks are already initialized by initializeTasks()
    try {
        const addTaskBtn = document.getElementById('add-task');
        const taskInput = document.getElementById('task-input');
        const viewAllBtn = document.getElementById('view-all');
        const viewImportantBtn = document.getElementById('view-important');
        
        if (!addTaskBtn || !taskInput) {
            throw new Error('Required UI elements not found');
        }
        
        // Task input handling
        let isProcessingInput = false;
        
        addTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isProcessingInput) {
                isProcessingInput = true;
                // addTask returns nothing async, but keep .finally for future-proofing
                Promise.resolve(addTask()).finally(() => {
                    isProcessingInput = false;
                });
            }
        });
        
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isProcessingInput) {
                e.preventDefault();
                isProcessingInput = true;
                Promise.resolve(addTask()).finally(() => {
                    isProcessingInput = false;
                });
            }
        });

        // View toggles
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                currentView = 'all';
                renderTasks('all');
                updateViewButtons();
            });
        }
        
        if (viewImportantBtn) {
            viewImportantBtn.addEventListener('click', () => {
                currentView = 'important';
                renderTasks('important');
                updateViewButtons();
            });
        }

        // Search, sort, and filter controls
        const searchInput = document.getElementById('task-search-input');
        const sortSelect = document.getElementById('sort-tasks');
        const filterSelect = document.getElementById('filter-tasks');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleTaskSearch, 300));
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', handleTaskSortOrFilterChange);
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', handleTaskSortOrFilterChange);
        }

        // Initialize displays with current date
        const initialDate = new Date();
        updateSelectedDateDisplay(initialDate);

        // Initial render
        renderTasks(currentView);
        updateViewButtons();
        // Initialize nav dropdown keyboard behavior and JS toggles
        initNavDropdowns();
        
        // Initialize modal and reminder system
        initializeModalSystem();
        startReminderChecker();
    } catch (error) {
        console.error('Error setting up event listeners:', error);
        // Only show notification if we're on a page that uses task controls
        const taskInput = document.getElementById('task-input');
        if (taskInput) {
            showNotification('Failed to initialize task controls', 'error');
        }
    }

    // Setup sync events (attach once)
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            try {
                tasks = JSON.parse(e.newValue || '[]');
            } catch (err) {
                tasks = [];
            }
            renderTasks();
        }
    });

    window.addEventListener('tasks-updated', () => {
        renderTasks();
    });
}

// === TASK MANAGEMENT ===
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            z-index: 9999;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set notification styles
    const iconMap = {
        'success': '✓',
        'error': '✕',
        'info': 'ℹ',
        'warning': '⚠'
    };
    
    const icon = iconMap[type] || 'ℹ';
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <span style="font-size: 1.25rem; flex-shrink: 0; margin-top: 0.125rem;">${icon}</span>
            <span style="flex-grow: 1; padding-top: 0.0625rem;">${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        background-color: var(--gray-900, #111111);
        border: 1px solid;
        border-radius: 0.5rem;
        padding: 1rem;
        color: white;
        font-size: 0.875rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        animation: slideInRight 0.3s ease-out;
        pointer-events: auto;
        min-width: 300px;
    `;
    
    // Apply type-specific colors
    const colorMap = {
        'success': { border: 'var(--green-600, #16a34a)', bg: 'rgba(34, 197, 94, 0.1)' },
        'error': { border: 'var(--red-600, #dc2626)', bg: 'rgba(220, 38, 38, 0.1)' },
        'warning': { border: 'var(--yellow-600, #ca8a04)', bg: 'rgba(202, 138, 4, 0.1)' },
        'info': { border: 'var(--blue-600, #2563eb)', bg: 'rgba(37, 99, 235, 0.1)' },
        'reminder': { border: '#88dd00', bg: 'rgba(136, 221, 0, 0.1)' }
    };
    
    const colors = colorMap[type] || colorMap['info'];
    notification.style.borderColor = colors.border;
    notification.style.backgroundColor = colors.bg;
    
    // Add animation keyframes if not already present
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(400px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(400px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Add a new task with validation
 */
function addTask() {
    try {
        const taskInput = getCachedElement('#task-input');
        if (!taskInput) {
            throw new Error('Task input element not found');
        }
        
        const text = taskInput.value.trim();
        
        // Validate task text
        if (!text) {
            showNotification('Please enter a task!', 'error');
            return;
        }
        
        if (text.length > MAX_TASK_LENGTH) {
            showNotification(`Task text is too long. Maximum ${MAX_TASK_LENGTH} characters allowed.`, 'error');
            return;
        }

        // Get and validate selected date
        const todoDateInput = getCachedElement('#todo-date-input');
        const todoYearInput = getCachedElement('#todo-year-input');
        
        let selectedDate;
        if (todoDateInput && todoYearInput && todoDateInput.value) {
            try {
                const dateStr = todoDateInput.value;
                const year = parseInt(todoYearInput.value, 10);
                
                if (isNaN(year) || year < 1900 || year > 2100) {
                    throw new Error('Invalid year');
                }
                
                const [yearFromInput, month, day] = dateStr.split('-');
                selectedDate = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
            } catch (e) {
                selectedDate = new Date();
            }
        } else {
            selectedDate = new Date();
        }
        
        if (!selectedDate || isNaN(selectedDate.getTime())) {
            showNotification('Invalid date selected. Using today\'s date.', 'warning');
            selectedDate = new Date();
        }

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            date: selectedDate,
            priority: 'normal',
            important: false,
            textStyles: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Validate task before adding
        if (!isValidTask(task)) {
            throw new Error('Created task failed validation');
        }

        tasks.push(task);
        saveTasks();
        renderTasks(currentView);
        showNotification('Task added successfully!', 'success');
        taskInput.value = '';
        taskInput.focus();
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Failed to add task. Please try again.', 'error');
    }
}

/**
 * Toggle completion status of a task
 * @param {string} id - The task ID
 * @throws {Error} If task is not found
 */
function toggleTask(id) {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid task ID');
        }
        
        const task = tasks.find(t => t.id === id);
        if (!task) {
            throw new Error(`Task not found: ${id}`);
        }
        
        task.completed = !task.completed;
        task.lastModified = new Date().toISOString();
        
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.toggle('completed');
            const checkbox = taskElement.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.classList.toggle('checked');
                checkbox.setAttribute('aria-checked', task.completed);
            }
        }
        
        saveTasks();
        showNotification(
            task.completed ? 'Task completed! 🎉' : 'Task marked as incomplete',
            task.completed ? 'success' : 'info'
        );
        console.log(`Task ${id} toggled to ${task.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
        console.error('Error toggling task:', error);
        showNotification('Failed to update task status', 'error');
    }
}

/**
 * Delete a task with animation
 * @param {string} id - The task ID to delete
 */
function deleteTask(id) {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid task ID');
        }
        
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${id}`);
        }
        
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            // Add fade out animation
            taskElement.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                // Clean up reminder if exists
                if (reminders[id]) {
                    delete reminders[id];
                    localStorage.setItem(REMINDERS_KEY, safeJsonStringify(reminders));
                }
                saveTasks();
                renderTasks(currentView);
                showNotification('Task deleted successfully', 'info');
                console.log(`Task ${id} deleted`);
            }, 300);
        } else {
            tasks = tasks.filter(t => t.id !== id);
            // Clean up reminder
            if (reminders[id]) {
                delete reminders[id];
                localStorage.setItem(REMINDERS_KEY, safeJsonStringify(reminders));
            }
            saveTasks();
            renderTasks(currentView);
            showNotification('Task deleted successfully', 'info');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task', 'error');
    }
}

function toggleImportant(id) {
    try {
        const task = tasks.find(t => t.id === id);
        if (!task) {
            throw new Error('Task not found');
        }
        
        task.important = !task.important;
        task.lastModified = new Date().toISOString();
        
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.toggle('important');
            const starBtn = taskElement.querySelector('.star-btn');
            if (starBtn) {
                starBtn.classList.toggle('active');
                starBtn.textContent = task.important ? '★' : '☆';
                starBtn.title = task.important ? 'Remove from Important' : 'Mark as Important';
            }
        }
        
        saveTasks();
        showNotification(
            task.important ? 'Added to important tasks! ⭐' : 'Removed from important tasks',
            'info'
        );
    } catch (error) {
        console.error('Error toggling important status:', error);
        showNotification('Failed to update task importance', 'error');
    }
}

function cyclePriority(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const priorities = ['low', 'normal', 'high'];
        const currentIndex = priorities.indexOf(task.priority);
        task.priority = priorities[(currentIndex + 1) % 3];
        saveTasks();
        renderTasks();
    }
}

// === DISPLAY MANAGEMENT ===
function updateSelectedDateDisplay(date) {
    const dateDisplay = document.getElementById('selected-date-display');
    if (!dateDisplay) {
        return; // Element doesn't exist, skip update
    }
    
    const today = new Date();
    const selected = new Date(date);
    
    if (isSameDay(today, selected)) {
        dateDisplay.textContent = 'Today';
    } else {
        dateDisplay.textContent = selected.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

function updateViewButtons() {
    // Update active state of view buttons to match currentView
    document.querySelectorAll('.view-link').forEach(btn => {
        btn.classList.toggle('active', btn.id === `view-${currentView}`);
    });
}

/**
 * Apply search, sort, and filter to tasks array
 * @param {Array} tasksToFilter - Tasks to filter and sort
 * @returns {Array} Filtered and sorted tasks
 */
function applyFiltersAndSort(tasksToFilter) {
    let filteredTasks = [...tasksToFilter];
    
    // Get search term
    const searchInput = document.getElementById('task-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Apply search filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
            task.text.toLowerCase().includes(searchTerm)
        );
    }
    
    // Get filter type
    const filterSelect = document.getElementById('filter-tasks');
    const filterType = filterSelect ? filterSelect.value : 'all';
    
    // Apply filter
    switch (filterType) {
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
        case 'incomplete':
            filteredTasks = filteredTasks.filter(task => !task.completed);
            break;
        case 'important':
            filteredTasks = filteredTasks.filter(task => task.important);
            break;
        case 'all':
        default:
            // No additional filtering
            break;
    }
    
    // Get sort type
    const sortSelect = document.getElementById('sort-tasks');
    const sortType = sortSelect ? sortSelect.value : 'date-asc';
    
    // Apply sort
    switch (sortType) {
        case 'date-asc':
            filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'priority-high':
            filteredTasks.sort((a, b) => {
                // High priority first
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const aPriority = priorityOrder[a.priority] || 2;
                const bPriority = priorityOrder[b.priority] || 2;
                if (aPriority !== bPriority) return aPriority - bPriority;
                // Then by date
                return new Date(a.date) - new Date(b.date);
            });
            break;
        case 'alpha':
            filteredTasks.sort((a, b) =>
                a.text.toLowerCase().localeCompare(b.text.toLowerCase())
            );
            break;
        default:
            break;
    }
    
    return filteredTasks;
}

/**
 * Update task count displays
 * @param {number} dateTaskCount - Number of tasks for selected date
 * @param {number} allTaskCount - Total number of tasks
 */
function updateTaskCounts(dateTaskCount, allTaskCount) {
    const dateCountSpan = document.getElementById('date-task-count');
    const allCountSpan = document.getElementById('all-tasks-count');
    
    if (dateCountSpan) {
        dateCountSpan.textContent = `(${dateTaskCount})`;
    }
    
    if (allCountSpan) {
        allCountSpan.textContent = `(${allTaskCount})`;
    }
}

/**
 * Handle search input and trigger re-render
 */
function handleTaskSearch() {
    renderTasks(currentView);
}

/**
 * Handle sort/filter changes and trigger re-render
 */
function handleTaskSortOrFilterChange() {
    renderTasks(currentView);
}

function renderTasks(view = 'all') {
    try {
        const taskList = document.getElementById('task-list');
        const allTasksList = document.getElementById('all-tasks');
        const noTasksMessage = document.getElementById('no-tasks-message');
        
        if (!taskList || !allTasksList) {
            throw new Error('Required task list elements not found');
        }

        // Get the selected date from the date picker inputs
        const todoDateInput = document.getElementById('todo-date-input');
        const todoYearInput = document.getElementById('todo-year-input');
        
        let selectedDate = new Date();
        if (todoDateInput && todoYearInput) {
            const dateStr = todoDateInput.value;
            const year = parseInt(todoYearInput.value);
            if (dateStr && !isNaN(year)) {
                // dateStr format is YYYY-MM-DD
                const [dateYear, month, day] = dateStr.split('-');
                selectedDate = new Date(year, parseInt(month) - 1, parseInt(day));
            }
        }

        // Update currentView
        currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-link').forEach(btn => {
            btn.classList.toggle('active', btn.id === `view-${view}`);
        });
        
        // Clean and validate tasks array
        tasks = tasks.filter(task => {
            if (!task || !task.id || !task.text || !task.date) {
                console.warn('Removing invalid task:', task);
                return false;
            }
            return true;
        });

        // Sort tasks (default sort before filters are applied)
        let sortedTasks = [...tasks].sort((a, b) => {
            // First by importance
            if (a.important !== b.important) return b.important ? 1 : -1;
            // Then by completion status
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            // Then by date
            return new Date(b.date) - new Date(a.date);
        });

        // Apply view filter
        if (view === 'important') {
            sortedTasks = sortedTasks.filter(task => task.important);
        }

        // Apply search, sort, and filter controls to all tasks
        const filteredAndSortedTasks = applyFiltersAndSort(sortedTasks);

        // Filter tasks for selected date (also apply search/filter/sort)
        const tasksForDate = filteredAndSortedTasks.filter(task => 
            isSameDay(new Date(task.date), selectedDate)
        );

        // Render both lists
        renderTaskList(taskList, tasksForDate, 'Selected Date');
        renderTaskList(allTasksList, filteredAndSortedTasks, 'All Tasks');

        // Show/hide no tasks message
        if (noTasksMessage) {
            noTasksMessage.style.display = 
                (filteredAndSortedTasks.length === 0 && document.getElementById('task-search-input').value) 
                ? 'block' 
                : 'none';
        }

        // Update task counts
        updateTaskCounts(tasksForDate.length, filteredAndSortedTasks.length);
    } catch (error) {
        console.error('Error rendering tasks:', error);
    showNotification('Error displaying tasks. Please refresh the page.', 'error');
    }
}

function renderTaskList(container, tasks, listType) {
    if (!container) {
        console.error('Container not found for task list');
        return;
    }

    try {
        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        if (!Array.isArray(tasks) || tasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'no-tasks';
            emptyMessage.textContent = `No ${currentView === 'important' ? 'important ' : ''}tasks ${listType === 'Selected Date' ? 'for this date' : ''}`;
            container.appendChild(emptyMessage);
            return;
        }

        // Create and append each task element
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            if (task && task.id) {
                const taskElement = createTaskElement(task);
                if (taskElement) {
                    fragment.appendChild(taskElement);
                }
            }
        });
        
        container.appendChild(fragment);

        // Add event listeners for new elements
        addTaskEventListeners(container);
    } catch (error) {
        console.error('Error rendering task list:', error);
        showNotification('Failed to display tasks properly', 'error');
    }
}

function addTaskEventListeners(container) {
    // Avoid attaching multiple identical listeners to the same container
    if (container.dataset.eventsAttached === 'true') return;

    container.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.id;
        if (!taskId) return;

        if (e.target.closest('.task-checkbox')) {
            toggleTask(taskId);
        } else if (e.target.closest('.delete-btn')) {
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(taskId);
            }
        } else if (e.target.closest('.star-btn')) {
            toggleImportant(taskId);
        } else if (e.target.closest('.edit-btn')) {
            openTaskEditor(taskId);
        }
    });

    container.dataset.eventsAttached = 'true';
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.classList.add('task-item');
    if (task.completed) li.classList.add('completed');
    if (task.important) li.classList.add('important');

    const taskDate = new Date(task.date);
    const dateString = taskDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    // Apply text style classes
    const textStyles = task.textStyles || [];
    const textClasses = textStyles.map(style => `text-${style}`).join(' ');

    li.innerHTML = `
        <button class="task-checkbox ${task.completed ? 'checked' : ''}" role="checkbox" aria-checked="${task.completed}" tabindex="0">
            <svg class="circle-icon" width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" fill="currentColor" fill-opacity="${task.completed ? '1' : '0'}" stroke="currentColor" stroke-width="1"/>
            </svg>
        </button>
        <span class="task-text ${textClasses}">${escapeHtml(task.text)}</span>
        <span class="task-date">${dateString}</span>
        <div class="task-actions">
            <button class="edit-btn" title="Edit Task" tabindex="0">✎</button>
            <button class="star-btn ${task.important ? 'active' : ''}" title="${task.important ? 'Remove from Important' : 'Mark as Important'}" tabindex="0">
                ${task.important ? '★' : '☆'}
            </button>
            ${task.priority === 'high' ? '<button class="priority-high" title="High Priority">⚡</button>' : ''}
            <button class="delete-btn" title="Delete Task">×</button>
        </div>
    `;

    return li;
}

// === HELPER FUNCTIONS ===
/**
 * Save tasks to localStorage with error handling
 */
function saveTasks() {
    try {
        if (!Array.isArray(tasks)) {
            console.error('Tasks is not an array, cannot save');
            showNotification('Error: Invalid tasks data structure', 'error');
            return;
        }
        
        const serialized = safeJsonStringify(tasks);
        localStorage.setItem(STORAGE_KEY, serialized);
        window.dispatchEvent(new CustomEvent('tasks-updated'));
        console.log(`Successfully saved ${tasks.length} tasks`);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded:', e);
            showNotification('Storage is full. Please delete some tasks.', 'error');
        } else {
            console.error('Error saving tasks:', e);
            showNotification('Could not save tasks. Please check your storage settings.', 'error');
        }
    }
}

function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isSameDay(d1, d2) {
    if (!(d1 instanceof Date) || !(d2 instanceof Date)) {
        return false;
    }
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function normalizeDate(d) {
    if (!d) return '';
    try {
        if (d instanceof Date) {
            const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
            return tzAdjusted.toISOString().slice(0, 10);
        }
        if (typeof d === 'string') {
            return d.slice(0, 10);
        }
    } catch (error) {
        console.error('Error normalizing date:', error);
    }
    return '';
}

function updateTaskCounts(selectedDateCount, totalCount) {
    try {
        const selectedDateHeader = document.querySelector('.task-section h3');
        const allTasksHeader = document.querySelector('.task-section:last-child h3');
        
        if (selectedDateHeader) {
            selectedDateHeader.textContent = `Tasks on Selected Date (${selectedDateCount})`;
        }
        
        if (allTasksHeader) {
            const importantCount = tasks.filter(t => t.important).length;
            const completedCount = tasks.filter(t => t.completed).length;
            
            allTasksHeader.textContent = currentView === 'important'
                ? `Important Tasks (${importantCount})`
                : `All Tasks (${totalCount}) · ${completedCount} Completed`;
        }
    } catch (error) {
        console.error('Error updating task counts:', error);
    }
}

function formatDate(date) {
    try {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

// Initialize keyboard and JS-supported nav dropdown toggles
function initNavDropdowns() {
    try {
        const nav = document.querySelector('nav');
        if (!nav) return;

        const dropdowns = Array.from(nav.querySelectorAll('.dropdown'));
        if (!dropdowns.length) return;

        // Toggle open via keyboard (Enter/Space) and ArrowDown
        dropdowns.forEach((dd) => {
            const toggle = dd.querySelector('a');
            const menu = dd.querySelector('.dropdown-content');
            if (!toggle || !menu) return;

            // Mark as button for assistive tech
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-haspopup', 'true');
            toggle.setAttribute('aria-expanded', 'false');

            // Handle key interactions
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dd.classList.add('open');
                    toggle.setAttribute('aria-expanded', 'true');
                    const first = menu.querySelector('a');
                    if (first) first.focus();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    dd.classList.add('open');
                    toggle.setAttribute('aria-expanded', 'true');
                    const first = menu.querySelector('a');
                    if (first) first.focus();
                }
            });

            // Also open on click for pointer users but keep it a link navigation
            toggle.addEventListener('click', (e) => {
                // If the link has an href that points to the same page (anchor), allow navigation.
                // Otherwise, toggle the menu (common for a JS-driven menu link).
                const href = toggle.getAttribute('href');
                if (!href || href === '#' || href.startsWith('javascript:')) {
                    e.preventDefault();
                    const isOpen = dd.classList.toggle('open');
                    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                    if (isOpen) {
                        const first = menu.querySelector('a');
                        if (first) first.focus();
                    }
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target)) {
                dropdowns.forEach((dd) => {
                    dd.classList.remove('open');
                    const t = dd.querySelector('a');
                    if (t) t.setAttribute('aria-expanded', 'false');
                });
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdowns.forEach((dd) => {
                    dd.classList.remove('open');
                    const t = dd.querySelector('a');
                    if (t) t.setAttribute('aria-expanded', 'false');
                });
            }
        });
    } catch (err) {
        // Non-fatal
        console.warn('initNavDropdowns error:', err);
    }
}

// Centralized small DOM helpers
document.addEventListener('DOMContentLoaded', function() {
    try {
        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (e) {
        // non-fatal
        console.warn('Could not set year element:', e);
    }
});

// === MODAL AND REMINDER SYSTEM ===
function initializeModalSystem() {
    const modal = document.getElementById('task-editor-modal');
    const closeBtn = document.querySelector('.modal-close');
    const saveBtn = document.getElementById('editor-save-btn');
    const cancelBtn = document.getElementById('editor-cancel-btn');
    const setReminderBtn = document.getElementById('set-reminder-btn');
    const clearReminderBtn = document.getElementById('clear-reminder-btn');

    if (!modal) return; // Modal doesn't exist on this page

    // Close modal
    closeBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click', () => closeModal());

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Save changes
    saveBtn.addEventListener('click', () => saveTaskChanges());

    // Set reminder
    setReminderBtn.addEventListener('click', () => saveReminder());

    // Clear reminder
    if (clearReminderBtn) {
        clearReminderBtn.addEventListener('click', () => {
            if (currentEditingTaskId) {
                clearReminder(currentEditingTaskId);
            }
        });
    }

    // Style buttons
    const styleButtons = document.querySelectorAll('.style-btn');
    styleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const style = btn.dataset.style;
            toggleTextStyle(style);
            // Update active state
            btn.classList.toggle('active');
        });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

/**
 * Open the task editor modal
 * @param {string} taskId - The task ID to edit
 */
function openTaskEditor(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.warn(`Task not found: ${taskId}`);
            return;
        }

        currentEditingTaskId = taskId;
        const modal = document.getElementById('task-editor-modal');
        
        if (!modal) {
            console.error('Task editor modal not found');
            return;
        }
        
        // Populate form
        const taskInput = document.getElementById('editor-task-text');
        if (taskInput) {
            taskInput.value = task.text;
        }
        
        // Set active style buttons and display indicator
        currentTextStyles = [...(task.textStyles || [])];
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.remove('active');
            if (currentTextStyles.includes(btn.dataset.style)) {
                btn.classList.add('active');
            }
        });
        
        // Display selected styles indicator
        displaySelectedStyles();

        // Show reminder info if exists
        updateReminderDisplay(taskId);

        modal.classList.add('open');
        console.log(`Task editor opened for task ${taskId}`);
    } catch (error) {
        console.error('Error opening task editor:', error);
        showNotification('Failed to open task editor', 'error');
    }
}

/**
 * Display currently selected text styles as visual indicators
 */
function displaySelectedStyles() {
    try {
        let indicator = document.getElementById('style-indicator');
        
        if (!indicator) {
            // Create indicator if it doesn't exist
            const styleToolbar = document.querySelector('.text-style-toolbar');
            if (!styleToolbar) return;
            
            indicator = document.createElement('div');
            indicator.id = 'style-indicator';
            indicator.className = 'style-indicator';
            styleToolbar.parentNode.insertBefore(indicator, styleToolbar.nextSibling);
        }
        
        // Clear existing tags
        indicator.innerHTML = '';
        
        if (currentTextStyles.length === 0) {
            indicator.innerHTML = '<span style="color: #999;">No styles selected</span>';
            return;
        }
        
        // Create tags for each selected style
        currentTextStyles.forEach(style => {
            const tag = document.createElement('span');
            tag.className = 'style-tag';
            tag.textContent = style.charAt(0).toUpperCase() + style.slice(1);
            indicator.appendChild(tag);
        });
    } catch (error) {
        console.error('Error displaying selected styles:', error);
    }
}

/**
 * Toggle a text style on/off
 * @param {string} style - The style name to toggle
 */
function toggleTextStyle(style) {
    try {
        // If style is 'normal', clear all styles
        if (style === 'normal') {
            currentTextStyles = [];
        } else {
            // Toggle the style in the array
            const index = currentTextStyles.indexOf(style);
            if (index > -1) {
                currentTextStyles.splice(index, 1);
            } else {
                // Remove 'normal' if it was selected and add new style
                currentTextStyles = currentTextStyles.filter(s => s !== 'normal');
                currentTextStyles.push(style);
            }
        }
        
        // Update visual indicator
        displaySelectedStyles();
        console.log(`Styles toggled: ${currentTextStyles.join(', ') || 'none'}`);
    } catch (error) {
        console.error('Error toggling text style:', error);
    }
}

function closeModal() {
    const modal = document.getElementById('task-editor-modal');
    modal.classList.remove('open');
    currentEditingTaskId = null;
    
    // Clear form
    document.getElementById('editor-task-text').value = '';
    document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('editor-reminder-date').value = '';
    document.getElementById('editor-reminder-time').value = '';
    document.getElementById('reminder-display').innerHTML = '';
    currentTextStyles = [];
}

function saveTaskChanges() {
    if (!currentEditingTaskId) return;

    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;

    task.text = document.getElementById('editor-task-text').value.trim();
    task.textStyles = currentTextStyles;
    task.lastModified = new Date().toISOString();

    saveTasks();
    renderTasks(currentView);
    closeModal();
    showNotification('Task updated successfully!', 'success');
}

/**
 * Save a reminder with validation
 */
function saveReminder() {
    try {
        if (!currentEditingTaskId) {
            console.warn('No task selected for reminder');
            showNotification('No task selected. Please try again.', 'error');
            return;
        }

        const task = tasks.find(t => t.id === currentEditingTaskId);
        if (!task) {
            console.error('Task not found for reminder:', currentEditingTaskId);
            showNotification('Task not found. Please try again.', 'error');
            return;
        }

        const reminderDate = document.getElementById('editor-reminder-date').value;
        const reminderTime = document.getElementById('editor-reminder-time').value;
        const frequency = document.getElementById('reminder-frequency')?.value || 'once';
        const notification = document.getElementById('reminder-notification')?.value || 'browser';

        if (!reminderDate || !reminderTime) {
            showNotification('📅 Please set both date and time for the reminder', 'error');
            return;
        }

        // Validate reminder date and time
        if (!isValidReminderDateTime(reminderDate, reminderTime)) {
            showNotification('⚠️ Invalid reminder date/time. Please ensure the time is in the future.', 'error');
            return;
        }

        reminders[currentEditingTaskId] = {
            date: reminderDate,
            time: reminderTime,
            taskText: task.text,
            frequency: frequency,
            notification: notification,
            createdAt: new Date().toISOString()
        };

        const serialized = safeJsonStringify(reminders);
        localStorage.setItem(REMINDERS_KEY, serialized);
        updateReminderDisplay(currentEditingTaskId);
        showNotification('✅ Reminder set successfully!', 'success');
        console.log(`Reminder saved for task ${currentEditingTaskId}:`, reminders[currentEditingTaskId]);
    } catch (e) {
        console.error('Error saving reminder:', e);
        showNotification('❌ Failed to save reminder. Please try again.', 'error');
    }
}

function updateReminderDisplay(taskId) {
    const reminder = reminders[taskId];
    const display = document.getElementById('reminder-display');
    const clearBtn = document.getElementById('clear-reminder-btn');

    if (reminder) {
        const frequencyLabel = {
            once: 'Once Only',
            daily: 'Daily ↻',
            weekly: 'Weekly ↻',
            monthly: 'Monthly ↻'
        };

        const notificationLabel = {
            browser: '🌐 Browser Notification',
            sound: '🔊 Sound Alert',
            both: '🌐🔊 Browser + Sound'
        };

        const reminderTime = `${reminder.date} at ${reminder.time}`;
        const freq = frequencyLabel[reminder.frequency] || 'Once Only';
        const notif = notificationLabel[reminder.notification] || 'Browser Notification';

        display.innerHTML = `
            <div class="reminder-set">
                <div class="reminder-info">
                    <strong>⏰ Reminder Set:</strong> ${reminderTime}
                    <div class="reminder-frequency">🔁 ${freq}</div>
                    <div class="reminder-notification">${notif}</div>
                </div>
                <button onclick="clearReminder('${taskId}')" class="btn-clear">🗑️ Clear</button>
            </div>
        `;
        
        if (clearBtn) clearBtn.style.display = 'block';
    } else {
        display.innerHTML = '';
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

function clearReminder(taskId) {
    try {
        if (reminders[taskId]) {
            const taskText = reminders[taskId].taskText;
            delete reminders[taskId];
            localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
            updateReminderDisplay(taskId);
            showNotification(`🗑️ Reminder cleared for "${taskText}"`, 'info');
            console.log(`Reminder cleared for task ${taskId}`);
        }
    } catch (error) {
        console.error('Error clearing reminder:', error);
        showNotification('❌ Failed to clear reminder. Please try again.', 'error');
    }
}

function startReminderChecker() {
    // Check reminders every minute
    reminderCheckInterval = setInterval(() => {
        checkReminders();
    }, 60000); // 60 seconds

    // Also check immediately
    checkReminders();
}

function checkReminders() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    Object.keys(reminders).forEach(taskId => {
        const reminder = reminders[taskId];
        
        let shouldTrigger = false;

        if (reminder.frequency === 'once' && reminder.date === currentDate && reminder.time === currentTime) {
            shouldTrigger = true;
        } else if (reminder.frequency === 'daily' && reminder.time === currentTime) {
            shouldTrigger = true;
        } else if (reminder.frequency === 'weekly') {
            // Check if it's the same day of week and time
            const reminderDate = new Date(reminder.date);
            if (reminderDate.getDay() === now.getDay() && reminder.time === currentTime) {
                shouldTrigger = true;
            }
        } else if (reminder.frequency === 'monthly') {
            // Check if it's the same day of month and time
            const reminderDate = new Date(reminder.date);
            if (reminderDate.getDate() === now.getDate() && reminder.time === currentTime) {
                shouldTrigger = true;
            }
        }

        if (shouldTrigger) {
            triggerReminder(taskId, reminder.taskText, reminder.notification);
        }
    });
}

function triggerReminder(taskId, taskText, notificationType = 'browser') {
    // Show in-app notification
    showNotification(`⏰ Reminder: ${taskText}`, 'reminder');

    // Handle different notification types
    if (notificationType === 'browser' || notificationType === 'both') {
        // Show browser notification
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('⏰ Task Reminder', {
                    body: taskText,
                    icon: '/image/download.jpeg',
                    tag: `reminder-${taskId}`,
                    requireInteraction: true
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('⏰ Task Reminder', {
                            body: taskText,
                            icon: '/image/download.jpeg',
                            tag: `reminder-${taskId}`,
                            requireInteraction: true
                        });
                    }
                });
            }
        }
    }

    if (notificationType === 'sound' || notificationType === 'both') {
        // Play sound notification
        playNotificationSound();
    }

    console.log(`Reminder triggered for task ${taskId} with notification type: ${notificationType}`);
}

function stopReminderChecker() {
    if (reminderCheckInterval) {
        clearInterval(reminderCheckInterval);
    }
}

/**
 * Play a notification sound using Web Audio API
 */
function playNotificationSound() {
    try {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator for beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set frequency (higher pitch for notification)
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        // Set duration
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        
        console.log('Notification sound played');
    } catch (error) {
        console.warn('Unable to play notification sound:', error);
    }
}