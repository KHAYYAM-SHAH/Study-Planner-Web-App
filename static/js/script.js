document.addEventListener("DOMContentLoaded", function () {
  // Fetch tasks on page load
  function loadTasks() {
    fetch("/get_tasks")
      .then((response) => response.json())
      .then((tasks) => {
        const taskList = document.getElementById("taskList");
        taskList.innerHTML = ""; // Clear existing tasks
        tasks.forEach((task) => {
          const li = document.createElement("li");
          li.textContent = `${task.task} - ${task.date} ${task.time}`;
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.onclick = () => deleteTask(task.id, li);
          li.appendChild(deleteBtn);
          taskList.appendChild(li);
        });
      })
      .catch((err) => console.error("Error loading tasks:", err));
  }
  

  // Add a new task
  window.addTask = function () {
    const taskInput = document.getElementById("taskInput").value;
    const taskDate = document.getElementById("taskDate").value;
    const taskTime = document.getElementById("taskTime").value;

    if (taskInput && taskDate && taskTime) {
        fetch("/add_task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: taskInput, date: taskDate, time: taskTime }),
        })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message || data.error);
            if (data.message) {
                loadTasks();  // Reload tasks after adding
            }
        })
        .catch((err) => console.error(err));
    } else {
        alert("Please fill all fields for the task.");
    }
};



// Helper function to append new task to the task list
function addTaskToFront(task) {
  const taskList = document.getElementById("taskList");
  const li = document.createElement("li");
  li.textContent = `${task.task} - ${task.date} ${task.time}`;
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = () => deleteTask(task.id, li);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}


  // Delete a task
  function deleteTask(taskId, taskElement) {
    fetch("/delete_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message || data.error);
        if (data.message) {
          taskElement.remove(); // Remove the task from the UI
        }
      })
      .catch((err) => console.error(err));
  }

  // Show tasks for selected date
  window.showTasksForDate = function () {
    const selectedDate = document.getElementById("calendarDate").value;
    const calendarTaskList = document.getElementById("calendarTaskList");
    calendarTaskList.innerHTML = "";
    fetch("/get_tasks")
      .then((response) => response.json())
      .then((tasks) => {
        tasks.forEach((task) => {
          if (task.date === selectedDate) {
            const li = document.createElement("li");
            li.textContent = `${task.task} - ${task.time}`;
            calendarTaskList.appendChild(li);
          }
        });
      });
  };

  // Chatbot and general chat functionality
  window.sendMessage = function () {
    const messages = document.getElementById("messages");
    const chatInput = document.getElementById("chatInput").value;

    if (chatInput.trim() !== "") {
      const userMessage = document.createElement("div");
      userMessage.textContent = "You: " + chatInput;
      messages.appendChild(userMessage);

      // Simulated bot reply
      const botReply = document.createElement("div");
      botReply.textContent = "Bot: Hello! How can I help you?";
      setTimeout(() => messages.appendChild(botReply), 1000);

      document.getElementById("chatInput").value = "";
    }
  };

  // Timer functionality
  let timerInterval;
  let seconds = 0;

  window.startTimer = function () {
    timerInterval = setInterval(() => {
      seconds++;
      document.getElementById("timerDisplay").textContent = new Date(seconds * 1000).toISOString().substr(11, 8);
    }, 1000);
  };

  window.stopTimer = function () {
    clearInterval(timerInterval);
  };

  window.resetTimer = function () {
    clearInterval(timerInterval);
    seconds = 0;
    document.getElementById("timerDisplay").textContent = "00:00:00";
  };

  // Get the login modal
  const loginModal = document.getElementById("loginModal");

  // Get the login button
  const loginButton = document.getElementById("loginButton");

  // Get the login form
  const loginForm = document.getElementById("loginForm");

  // Get the signup form
  const signupForm = document.getElementById("signupForm");

  // Add event listener to the login button
  loginButton.addEventListener("click", function () {
    loginModal.style.display = "block";
  });

  // Add event listener to the login form
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.message) {
          alert(result.message);
          location.reload(); // Reload the page or redirect as needed
        } else {
          alert(result.error || "Login failed.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
      });
});

  // Add event listener to the signup form
  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("signupUsername").value;
    const password = document.getElementById("signupPassword").value;

    fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => alert(data.message || data.error))
      .catch((err) => console.error(err));
  });

  // Add a new note
  

window.addNote = function () {
  const noteTitle = document.getElementById("noteTitle").value;
  const noteContent = document.getElementById("noteContent").value;
  const userId = 1;  // Replace with the actual logged-in user's ID

  if (noteTitle && noteContent) {
      fetch("/add_note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              user_id: userId,  // Pass user_id
              title: noteTitle,
              content: noteContent
          }),
      })
          .then((response) => response.json())
          .then((data) => {
              alert(data.message || data.error);
              if (data.message) {
                  loadNotes();  // Reload notes after adding
              }
          })
          .catch((err) => console.error("Error adding note:", err));
  } else {
      alert("Please enter both title and content.");
  }
};

function loadNotes() {
  const userId = 1;  // Replace with the actual logged-in user's ID

  fetch("/get_notes")
      .then(response => response.json())
      .then(notes => {
          const noteList = document.getElementById("noteList");
          noteList.innerHTML = "";  // Clear current notes

          notes.forEach(note => {
              const li = document.createElement("li");
              li.textContent = `${note.title}: ${note.content}`;
              const deleteBtn = document.createElement("button");
              deleteBtn.textContent = "Delete";
              deleteBtn.onclick = () => deleteNote(note.id, li);
              li.appendChild(deleteBtn);
              noteList.appendChild(li);
          });
      })
      .catch(err => console.error("Error loading notes:", err));
}



function deleteNote(noteId, noteElement) {
  fetch("/delete_note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note_id: noteId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        noteElement.remove(); // Remove the note from the UI
      }
    })
    .catch((err) => console.error("Error deleting note:", err));
}
document.addEventListener("DOMContentLoaded", loadNotes);

});
