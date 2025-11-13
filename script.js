// === STATE ===
const STORAGE_KEY = 'tasks';
let tasks = [];
let calendar;
let currentView = 'all';
let isInitialized = false;
let calendarResizeHandler;
let isCalendarVisible = false;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    try {
        // Check if we're on the todo page
        const taskDateElement = document.querySelector("#task-date");
        if (!taskDateElement) {
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

        // Initialize calendar
        initializeCalendar();

        // Initialize tasks from localStorage with validation
        initializeTasks();

    // Setup UI event listeners and initial rendering
    setupEventListeners();

        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showNotification('Failed to initialize the application. Please refresh the page.', 'error');
    }
}

function initializeTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsedTasks = JSON.parse(stored);
            // Validate and clean up tasks
            tasks = parsedTasks.filter(task => {
                return task && 
                       typeof task === 'object' &&
                       task.id &&
                       task.text &&
                       task.date;
            }).map(task => ({
                ...task,
                date: new Date(task.date), // Ensure date is a Date object
                completed: !!task.completed, // Ensure boolean
                important: !!task.important, // Ensure boolean
                priority: ['low', 'normal', 'high'].includes(task.priority) ? task.priority : 'normal'
            }));
        }
        // Always ensure tasks is an array
        if (!Array.isArray(tasks)) {
            tasks = [];
        }
    } catch (e) {
        console.error('Error loading tasks:', e);
        tasks = [];
        showNotification('Failed to load saved tasks. Starting fresh.', 'error');
    }
}
    
function initializeCalendar() {
    try {
        const calendarElement = document.querySelector("#task-date");
        if (!calendarElement) {
            throw new Error('Calendar element not found');
        }

        // Clear any existing calendar
        if (calendar) {
            calendar.destroy();
        }

        // Initialize Flatpickr calendar with modern styling
        calendar = flatpickr("#task-date", {
            defaultDate: new Date(),
            inline: true,
            dateFormat: "Y-m-d",
            enableTime: false,
            disableMobile: true,
            // Responsive months count (may be 1 or 2 depending on container/viewport)
            showMonths: getShowMonthsCount(),
            monthSelectorType: "static",
            animate: true,
            prevArrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
            nextArrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
            onChange: handleDateChange,
            onMonthChange: handleMonthChange,
            onYearChange: handleYearChange,
            onReady: handleCalendarReady
        });

        // Immediately ensure the calendar shows the correct number of months and extra DOM polish
        try {
            if (calendar) {
                calendar.set('showMonths', getShowMonthsCount());
                ensureCalendarDivider();
            }
        } catch (e) {
            console.warn('Could not apply responsive month count or divider:', e);
        }

        // Add window resize handler for responsive calendar (remove previous to avoid duplicates)
        if (calendarResizeHandler) {
            window.removeEventListener('resize', calendarResizeHandler);
        }
        calendarResizeHandler = debounce(handleCalendarResize, 250);
        window.addEventListener('resize', calendarResizeHandler);

        // Update calendar display
        updateCalendarDisplay();
    } catch (error) {
        console.error('Error initializing calendar:', error);
        showNotification('Failed to initialize calendar. Please refresh the page.', 'error');
    }
}

function getShowMonthsCount() {
    // Always show a single month — user requested a single-month display.
    return 1;
}

function handleCalendarResize() {
    try {
        if (calendar) {
            calendar.set('showMonths', getShowMonthsCount());
            updateCalendarDisplay();
        }
    } catch (error) {
        console.error('Error handling calendar resize:', error);
    }
}

function handleDateChange(selectedDates) {
    try {
        if (selectedDates && selectedDates.length > 0) {
            const date = selectedDates[0];
            if (!(date instanceof Date) || isNaN(date)) {
                throw new Error('Invalid date selected');
            }
            updateSelectedDateDisplay(date);
            updateCurrentMonthDisplay(date);
            renderTasks(currentView);
        }
    } catch (error) {
        console.error('Error in calendar onChange:', error);
        showNotification('Error updating selected date', 'error');
    }
}

function handleMonthChange(selectedDates, dateStr, instance) {
    try {
        if (instance && typeof instance.currentYear === 'number' && typeof instance.currentMonth === 'number') {
            updateCurrentMonthDisplay(instance.currentYear, instance.currentMonth);
        }
    } catch (error) {
        console.error('Error in calendar onMonthChange:', error);
    }
}

function handleYearChange(selectedDates, dateStr, instance) {
    try {
        if (instance && typeof instance.currentYear === 'number' && typeof instance.currentMonth === 'number') {
            updateCurrentMonthDisplay(instance.currentYear, instance.currentMonth);
        }
    } catch (error) {
        console.error('Error in calendar onYearChange:', error);
    }
}

function handleCalendarReady(selectedDates, dateStr, instance) {
    try {
        const today = new Date();
        updateSelectedDateDisplay(today);
        updateCurrentMonthDisplay(today);
        renderTasks(currentView);
        updateCalendarDisplay();
        // Ensure visual divider is present and responsive months are applied
        try { ensureCalendarDivider(); } catch (e) { /* non-fatal */ }
    } catch (error) {
        console.error('Error in calendar onReady:', error);
    }
}

function updateCalendarDisplay() {
    try {
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer) {
            // Update container height based on calendar content
            const calendarElement = calendarContainer.querySelector('.flatpickr-calendar');
            if (calendarElement) {
                const height = calendarElement.offsetHeight;
                calendarContainer.style.minHeight = `${height}px`;
            }
        }
    } catch (error) {
        console.error('Error updating calendar display:', error);
    }
}

// Ensure a subtle divider is present inside the Flatpickr calendar card
function ensureCalendarDivider() {
    try {
        if (!calendar || !calendar.calendarContainer) return;
        const container = calendar.calendarContainer;
        if (container.querySelector('.calendar-divider')) return; // already present

        const divider = document.createElement('div');
        divider.className = 'calendar-divider';

        // Place divider just after the months header if possible, otherwise prepend
        const monthsHeader = container.querySelector('.flatpickr-months');
        if (monthsHeader && monthsHeader.parentNode) {
            monthsHeader.parentNode.insertBefore(divider, monthsHeader.nextSibling);
        } else {
            container.insertBefore(divider, container.firstChild);
        }
    } catch (e) {
        console.warn('ensureCalendarDivider failed:', e);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupEventListeners() {
    // Tasks are already initialized by initializeTasks()
    try {
        const addTaskBtn = document.getElementById('add-task');
        const taskInput = document.getElementById('task-input');
        const viewAllBtn = document.getElementById('view-all');
        const viewImportantBtn = document.getElementById('view-important');
        const calendarToggle = document.getElementById('calendar-toggle');
        
        if (!addTaskBtn || !taskInput || !calendarToggle) {
            throw new Error('Required UI elements not found');
        }
        
        // Calendar toggle handling
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer && calendarToggle) {
            calendarToggle.addEventListener('click', () => {
                isCalendarVisible = !isCalendarVisible;
                calendarContainer.classList.toggle('calendar-hidden');
                calendarToggle.querySelector('span').textContent = isCalendarVisible ? 'Hide Calendar' : 'Show Calendar';
            });
            // Initially hide calendar
            calendarContainer.classList.add('calendar-hidden');
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

        // Initialize displays
        const initialDate = calendar?.selectedDates?.[0] || new Date();
        updateSelectedDateDisplay(initialDate);
        updateCurrentMonthDisplay(initialDate);

        // Initial render
        renderTasks(currentView);
        updateViewButtons();
        // Initialize nav dropdown keyboard behavior and JS toggles
        initNavDropdowns();
    } catch (error) {
        console.error('Error setting up event listeners:', error);
        showNotification('Failed to initialize task controls', 'error');
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
        'info': { border: 'var(--blue-600, #2563eb)', bg: 'rgba(37, 99, 235, 0.1)' }
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

function addTask() {
    try {
        const taskInput = document.getElementById('task-input');
        if (!taskInput) {
            throw new Error('Task input element not found');
        }
        
        const text = taskInput.value.trim();
        if (!text) {
            showNotification('Please enter a task!', 'error');
            return;
        }
        
        if (text.length > 500) {
            showNotification('Task text is too long. Please keep it under 500 characters.', 'error');
            return;
        }

        const selectedDate = calendar.selectedDates[0];
        if (!selectedDate) {
            showNotification('Please select a date for the task', 'error');
            return;
        }

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            date: selectedDate,
            priority: 'normal',
            important: false,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

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

function toggleTask(id) {
    try {
        const task = tasks.find(t => t.id === id);
        if (!task) {
            throw new Error('Task not found');
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
    } catch (error) {
        console.error('Error toggling task:', error);
        showNotification('Failed to update task status', 'error');
    }
}

function deleteTask(id) {
    try {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }
        
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            // Add fade out animation
            taskElement.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks(currentView);
                showNotification('Task deleted successfully', 'info');
            }, 300);
        } else {
            tasks = tasks.filter(t => t.id !== id);
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

function updateCurrentMonthDisplay(year, month) {
    if (month === undefined) {
        const date = new Date(year);
        month = date.getMonth();
        year = date.getFullYear();
    }
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    document.getElementById('current-month-display').textContent = `${monthName} ${year}`;
}

function updateViewButtons() {
    // Update active state of view buttons to match currentView
    document.querySelectorAll('.view-link').forEach(btn => {
        btn.classList.toggle('active', btn.id === `view-${currentView}`);
    });
}

function renderTasks(view = 'all') {
    try {
        const taskList = document.getElementById('task-list');
        const allTasksList = document.getElementById('all-tasks');
        
        if (!taskList || !allTasksList) {
            throw new Error('Required task list elements not found');
        }

        const selectedDate = (calendar && Array.isArray(calendar.selectedDates) && calendar.selectedDates[0])
            ? calendar.selectedDates[0]
            : new Date();

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

        // Sort tasks
        let sortedTasks = [...tasks].sort((a, b) => {
            // First by importance
            if (a.important !== b.important) return b.important ? 1 : -1;
            // Then by completion status
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            // Then by date
            return new Date(b.date) - new Date(a.date);
        });

        // Apply filters
        if (view === 'important') {
            sortedTasks = sortedTasks.filter(task => task.important);
        }

        // Filter tasks for selected date
        const tasksForDate = sortedTasks.filter(task => 
            isSameDay(new Date(task.date), selectedDate)
        );

        // Render both lists
        renderTaskList(taskList, tasksForDate, 'Selected Date');
        renderTaskList(allTasksList, sortedTasks, 'All Tasks');

        // Update task counts
        updateTaskCounts(tasksForDate.length, sortedTasks.length);
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

    li.innerHTML = `
        <button class="task-checkbox ${task.completed ? 'checked' : ''}" role="checkbox" aria-checked="${task.completed}" tabindex="0">
            <svg class="circle-icon" width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" fill="currentColor" fill-opacity="${task.completed ? '1' : '0'}" stroke="currentColor" stroke-width="1"/>
            </svg>
        </button>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <span class="task-date">${dateString}</span>
        <div class="task-actions">
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
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        window.dispatchEvent(new CustomEvent('tasks-updated'));
    } catch (e) {
        console.error('Error saving tasks:', e);
        showNotification('Could not save tasks. Please check your storage settings.', 'error');
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