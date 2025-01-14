// Selectors
const calendarContainer = document.querySelector('.calendar-container');
const calendarHeader = document.querySelector('.calendar-header');
const calendarBody = document.querySelector('.calendar-body');
const calendarTable = document.querySelector('#calendar-table');
const calendarTbody = document.querySelector('#calendar-tbody');
const prevMonthButton = document.querySelector('#prev-month');
const nextMonthButton = document.querySelector('#next-month');

// State
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Render the calendar
function renderCalendar() {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    calendarTbody.innerHTML = ''; // Clear existing days

    // Render day cells
    for (let i = 0; i < daysInMonth; i++) {
        const day = i + 1;
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.getDay();

        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = day;

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            cell.style.color = '#ccc'; // Weekend highlight
        }

        cell.addEventListener('click', () => showTasksForDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`));

        row.appendChild(cell);
        calendarTbody.appendChild(row);
    }
}

// Update the calendar header
function updateCalendarHeader() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[currentMonth];
    const year = currentYear;

    calendarHeader.querySelector('h2').textContent = `${monthName} ${year}`;
}

// Handle navigation
prevMonthButton.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
    updateCalendarHeader();
});

nextMonthButton.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
    updateCalendarHeader();
});

// Show tasks for a selected date
function showTasksForDate(selectedDate) {
    const calendarTaskList = document.getElementById('calendarTaskList');
    calendarTaskList.innerHTML = '';

    fetch('/get_tasks')
        .then((response) => response.json())
        .then((tasks) => {
            tasks.forEach((task) => {
                if (task.date === selectedDate) {
                    const li = document.createElement('li');
                    li.textContent = `${task.task} - ${task.time}`;
                    calendarTaskList.appendChild(li);
                }
            });

            if (calendarTaskList.innerHTML === '') {
                const noTasks = document.createElement('li');
                noTasks.textContent = 'No tasks for this date.';
                calendarTaskList.appendChild(noTasks);
            }
        })
        .catch((err) => console.error('Error fetching tasks:', err));
}

// Initialize the calendar
renderCalendar();
updateCalendarHeader();
