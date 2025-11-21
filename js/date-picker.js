// Simple date picker logic
(function() {
  const dateInput = document.getElementById('date-input');
  const yearInput = document.getElementById('year-input');
  const outputDiv = document.getElementById('selected-date-output');

  // Set today's date in the date picker
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  dateInput.value = `${year}-${month}-${day}`;
  yearInput.value = year;

  // Update output when date or year changes
  function updateOutput() {
    const selectedDate = dateInput.value;
    const selectedYear = yearInput.value;
    
    if (selectedDate && selectedYear) {
      outputDiv.textContent = `Selected: ${selectedDate} | Year: ${selectedYear}`;
    }
  }

  dateInput.addEventListener('change', updateOutput);
  yearInput.addEventListener('change', updateOutput);
  dateInput.addEventListener('input', updateOutput);
  yearInput.addEventListener('input', updateOutput);

  // Initial output
  updateOutput();
})();
