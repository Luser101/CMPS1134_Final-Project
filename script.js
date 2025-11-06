// === DOM ELEMENTS ===
const addBtn = document.getElementById('add-task');
const taskInput = document.getElementById('task-input');
const taskDate = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const allTasksList = document.getElementById('all-tasks');
const dateDisplay = document.getElementById('selected-date-display');

// === STATE ===
const STORAGE_KEY = 'todo_tasks';
let tasks = (() => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error loading tasks:', e);
        return [];
    }
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Flatpickr calendar
    const calendar = flatpickr("#task-date", {
        defaultDate: "today",
        dateFormat: "Y-m-d",
        enableTime: false,
        altInput: true,
        altFormat: "F j, Y",
        appendTo: document.getElementById('calendar-container'),
        inline: true,
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                const date = selectedDates[0];
                updateSelectedDateDisplay(date);
                renderTasks();
            }
        }
    });

    // Initialize UI elements and get references only once
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const allTasksList = document.getElementById('all-tasks');
    const dateDisplay = document.getElementById('selected-date-display');

    // Initialize tasks from localStorage with improved error handling
    let tasks = (() => {
        try {
            const stored = localStorage.getItem('tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading tasks:', e);
            return [];
        }
    })();

    // Update selected date display initially
    updateSelectedDateDisplay(calendar.selectedDates[0] || new Date());

    // Event Listeners
    addTaskBtn.addEventListener('click', () => addTask());
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Delegate click events for task interactions
    document.addEventListener('click', function(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        if (e.target.closest('.task-checkbox')) {
            toggleTask(taskItem.dataset.id);
        } else if (e.target.closest('.delete-btn')) {
            deleteTask(taskItem.dataset.id);
        } else if (e.target.closest('.priority-btn')) {
            cyclePriority(taskItem.dataset.id);
        } else if (e.target.closest('.star-btn')) {
            toggleImportant(taskItem.dataset.id);
        }
    });

    // Add view toggles
    document.getElementById('view-all').addEventListener('click', function() {
        renderTasks('all');
    });
    
    document.getElementById('view-important').addEventListener('click', function() {
        renderTasks('important');
    });

    // Function to toggle important status
    function toggleImportant(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.important = !task.important;
            saveTasks();
            renderTasks();
        }
    }

    // Task Management Functions
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            alert('Please enter a task!');
            return;
        }

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            date: calendar.selectedDates[0] || new Date(),
            priority: 'normal',
            important: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
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

    function updateSelectedDateDisplay(date) {
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

    function renderTasks(view = 'all') {
        const selectedDate = calendar.selectedDates[0] || new Date();
        
        // Sort tasks by important status, date and completion status
        let sortedTasks = [...tasks].sort((a, b) => {
            if (a.important !== b.important) {
                return b.important ? 1 : -1;
            }
            if (a.completed === b.completed) {
                return new Date(b.date) - new Date(a.date);
            }
            return a.completed ? 1 : -1;
        });

        // Filter tasks based on view
        if (view === 'important') {
            sortedTasks = sortedTasks.filter(task => task.important);
        }

        // Filter tasks for selected date
        const tasksForDate = sortedTasks.filter(task => 
            isSameDay(new Date(task.date), selectedDate)
        );

        // Clear existing tasks
        taskList.innerHTML = '';
        allTasksList.innerHTML = '';

        // Render tasks for selected date
        if (tasksForDate.length === 0) {
            taskList.innerHTML = `<li class="no-tasks">No ${view === 'important' ? 'important ' : ''}tasks for this date</li>`;
        } else {
            tasksForDate.forEach(task => {
                const li = createTaskElement(task);
                taskList.appendChild(li);
            });
        }

        // Render all tasks
        if (sortedTasks.length === 0) {
            allTasksList.innerHTML = `<li class="no-tasks">No ${view === 'important' ? 'important ' : ''}tasks added yet</li>`;
        } else {
            sortedTasks.forEach(task => {
                const li = createTaskElement(task);
                allTasksList.appendChild(li);
            });
        }
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.classList.add('task-item');
        if (task.completed) li.classList.add('completed');
        if (task.important) li.classList.add('important');

        // Format date for display
        const taskDate = new Date(task.date);
        const dateString = taskDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        li.innerHTML = `
            <button class="task-checkbox ${task.completed ? 'checked' : ''}" role="checkbox" aria-checked="${task.completed}" tabindex="0">
                ${task.completed ? '✓' : ''}
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

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    // Local Storage Functions
    function getTasksFromStorage() {
        const stored = localStorage.getItem('tasks');
        return stored ? JSON.parse(stored) : [];
    }

    function saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            // Trigger a custom event to notify other tabs
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (e) {
            console.error('Error saving tasks:', e);
            alert('Could not save tasks. Please check your browser storage settings.');
        }
    }
    
    // Listen for changes in other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'tasks') {
            tasks = JSON.parse(e.newValue || '[]');
            renderTasks();
        }
    });
    
    // Listen for tasks-updated event
    window.addEventListener('tasks-updated', () => {
        renderTasks();
    });

    // Initial render
    renderTasks();
});

// === STORAGE FUNCTIONS ===
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        // Trigger a custom event to notify other tabs
        window.dispatchEvent(new CustomEvent('tasks-updated'));
    } catch (e) {
        console.error('Error saving tasks:', e);
        alert('Could not save tasks. Please check your browser storage settings.');
    }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === HELPERS ===
function normalizeDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tzAdjusted.toISOString().slice(0, 10);
  }
  if (typeof d === 'string') {
    return d.slice(0, 10);
  }
  return '';
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// === SYNC FUNCTIONALITY ===
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        tasks = JSON.parse(e.newValue || '[]');
        renderTasks();
    }
});

// Listen for tasks-updated event
window.addEventListener('tasks-updated', () => {
    renderTasks();
});

// Initial render
renderTasks();
