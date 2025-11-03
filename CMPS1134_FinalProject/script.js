// === DOM ELEMENTS ===
const addBtn = document.getElementById('add-task');
const taskInput = document.getElementById('task-input');
const taskDate = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const allTasksList = document.getElementById('all-tasks');
const dateDisplay = document.getElementById('selected-date-display');

// === STATE ===
const STORAGE_KEY = 'tasks';
let tasks = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  const todoList = document.querySelector('.todo-list');
  const todoInput = document.querySelector('.todo-input');
  const addButton = document.querySelector('.add-btn');

  // Initialize tasks from localStorage
  loadTasksFromStorage();

  // Add task on button click
  addButton.addEventListener('click', () => addTask());

  // Add task on Enter key
  todoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTask();
    }
  });

  // Event delegation for task interactions
  todoList.addEventListener('click', function(e) {
    const taskItem = e.target.closest('.todo-item');
    if (!taskItem) return;

    if (e.target.classList.contains('delete-btn')) {
      e.stopPropagation();
      deleteTask(parseInt(taskItem.dataset.id));
    } else {
      toggleTask(parseInt(taskItem.dataset.id));
    }
  });
});

function addTask() {
  const input = document.querySelector('.todo-input');
  const taskText = input.value.trim();
  
  if (taskText) {
    const tasks = getTasksFromStorage();
    tasks.push({
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString()
    });
    
    saveTasksToStorage(tasks);
    renderTasks();
    input.value = '';
    input.focus();
  }
}

function toggleTask(taskId) {
  const tasks = getTasksFromStorage();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasksToStorage(tasks);
    renderTasks();
  }
}

function deleteTask(taskId) {
  const tasks = getTasksFromStorage().filter(t => t.id !== taskId);
  saveTasksToStorage(tasks);
  renderTasks();
}

function getTasksFromStorage() {
  try {
    const tasksJson = localStorage.getItem('tasks');
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (e) {
    console.error('Error loading tasks:', e);
    return [];
  }
}

function saveTasksToStorage(tasks) {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

function loadTasksFromStorage() {
  renderTasks();
}

function renderTasks() {
  const tasks = getTasksFromStorage();
  const todoList = document.querySelector('.todo-list');
  
  todoList.innerHTML = tasks.map(task => `
    <li class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="delete-btn">Delete</button>
    </li>
  `).join('');
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

// === MIGRATION (for older storage keys) ===
(function migrateOldTaskKeys() {
  const migrated = {};
  const keys = Object.keys(tasks || {});
  let changed = false;

  for (const k of keys) {
    const norm = normalizeDate(k);
    if (!norm) continue;
    if (!migrated[norm]) migrated[norm] = [];
    const arr = Array.isArray(tasks[k]) ? tasks[k] : [];
    migrated[norm].push(...arr);
    if (norm !== k) changed = true;
  }

  // Deduplicate and clean
  for (const d of Object.keys(migrated)) {
    migrated[d] = migrated[d].filter((v) => typeof v === 'string' && v.trim() !== '');
  }

  if (changed) {
    tasks = migrated;
    saveTasks();
  }
})();

// === RENDER FUNCTIONS ===
function updateAllTasks() {
  if (allTasksList) allTasksList.innerHTML = '';
  if (taskList) taskList.innerHTML = '';

  const allDates = Object.keys(tasks).sort();

  allDates.forEach(date => {
    tasks[date].forEach((task, index) => {
      // --- Build main list item ---
      if (allTasksList) {
        const mainLi = document.createElement('li');
        const span = document.createElement('span');
        span.innerHTML = `<strong>${date}</strong>: ${task}`;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit');
        editBtn.addEventListener('click', () => editTask(date, index));

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.classList.add('delete');
        delBtn.addEventListener('click', () => deleteTask(date, index));

        mainLi.append(span, editBtn, delBtn);
        allTasksList.appendChild(mainLi);
      }

      // --- Build sidebar list item ---
      if (taskList) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.innerHTML = `<strong>${date}</strong>: ${task}`;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit');
        editBtn.addEventListener('click', () => editTask(date, index));

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.classList.add('delete');
        delBtn.addEventListener('click', () => deleteTask(date, index));

        li.append(span, editBtn, delBtn);
        taskList.appendChild(li);
      }
    });
  });

  if (allDates.length === 0) {
    const msg = '<li>No tasks added yet</li>';
    if (allTasksList) allTasksList.innerHTML = msg;
    if (taskList) taskList.innerHTML = msg;
  }
}

// === CORE LOGIC ===
addBtn.addEventListener('click', () => {
  const date = normalizeDate(taskDate.value);
  const taskText = taskInput.value.trim();

  if (!date || !taskText) {
    alert('Please select a date and enter a task!');
    return;
  }

  if (!tasks[date]) tasks[date] = [];
  tasks[date].push(taskText);
  taskInput.value = '';
  saveTasks();
  updateAllTasks();
});

taskDate.addEventListener('change', () => {
  const date = normalizeDate(taskDate.value);
  if (dateDisplay) dateDisplay.textContent = `Selected date: ${date}`;
  updateAllTasks();
});

function editTask(date, index) {
  const newTask = prompt('Edit your task:', tasks[date][index]);
  if (newTask && newTask.trim() !== '') {
    tasks[date][index] = newTask.trim();
    saveTasks();
    updateAllTasks();
  }
}

function deleteTask(date, index) {
  tasks[date].splice(index, 1);
  if (tasks[date].length === 0) delete tasks[date];
  saveTasks();
  updateAllTasks();
}

// === INITIALIZATION ===
(function initDefaultDate() {
  if (taskDate) {
    const today = normalizeDate(new Date());
    if (!taskDate.value) taskDate.value = today;
    const current = normalizeDate(taskDate.value);
    if (dateDisplay) dateDisplay.textContent = `Selected date: ${current}`;
  }
  updateAllTasks();
})();

// === FLATPICKR INIT ===
if (typeof flatpickr !== 'undefined' && taskDate) {
  const defaultDate = taskDate.value || new Date();
  flatpickr(taskDate, {
    altInput: true,
    altFormat: 'l, F j, Y',
    dateFormat: 'Y-m-d',
    defaultDate,
    allowInput: true,
    onChange: function(selectedDates, dateStr) {
      const normalized = normalizeDate(dateStr || selectedDates[0] || taskDate.value);
      taskDate.value = normalized;
      const event = new Event('change', { bubbles: true });
      taskDate.dispatchEvent(event);
    }
  });
}
