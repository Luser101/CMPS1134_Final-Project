// Date picker logic for todo app sidebar
(function() {
  const todoDateInput = document.getElementById('todo-date-input');
  const todoYearInput = document.getElementById('todo-year-input');
  const datePickerSection = document.querySelector('.date-picker-section-sidebar');
  const heading = datePickerSection.querySelector('h3');

  // Set today's date in the date picker
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  todoDateInput.value = `${year}-${month}-${day}`;
  todoYearInput.value = year;

  // Function to update heading with selected date
  function updateHeading() {
    const selectedDate = new Date(todoDateInput.value);
    const monthName = selectedDate.toLocaleDateString(undefined, { month: 'short' });
    const dayNum = selectedDate.getDate();
    const yearNum = todoYearInput.value;
    heading.textContent = `${monthName} ${dayNum}, ${yearNum}`;
  }

  // Update year when date changes
  todoDateInput.addEventListener('change', function() {
    const selectedDate = new Date(this.value);
    todoYearInput.value = selectedDate.getFullYear();
    updateHeading();
  });

  todoDateInput.addEventListener('input', updateHeading);

  // Sync year input changes back to date
  todoYearInput.addEventListener('change', function() {
    if (this.value && todoDateInput.value) {
      const dateParts = todoDateInput.value.split('-');
      const newDate = `${this.value}-${dateParts[1]}-${dateParts[2]}`;
      todoDateInput.value = newDate;
      updateHeading();
    }
  });

  todoYearInput.addEventListener('input', function() {
    if (this.value && todoDateInput.value) {
      const dateParts = todoDateInput.value.split('-');
      const newDate = `${this.value}-${dateParts[1]}-${dateParts[2]}`;
      todoDateInput.value = newDate;
      updateHeading();
    }
  });

  // Initial heading update
  updateHeading();
})();
