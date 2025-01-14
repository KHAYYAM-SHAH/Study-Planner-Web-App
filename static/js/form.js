// Get the toggle button
var toggleButton = document.getElementById('toggleForm');

// Add event listener to the toggle button
toggleButton.addEventListener('click', toggleForm);

// Function for cancel button of form
function cancelForm() {
    var loginModal = document.getElementById('loginModal');
    loginModal.style.display = 'none';
}

// Function to toggle between login and signup forms
function toggleForm() {
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');
    var formTitle = document.getElementById('formTitle');
    var toggleButton = document.getElementById('toggleForm');

    if (loginForm.style.display === 'block' || loginForm.style.display === '') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        formTitle.textContent = 'Signup';
        toggleButton.textContent = 'Already have an account? Login';
    } else {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        formTitle.textContent = 'Login';
        toggleButton.textContent = 'Don\'t have an account? Signup';
    }
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Login successful!');
            location.reload(); // Reload the page or redirect as needed
        } else {
            alert(result.error || 'Login failed.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!username || !password) {
        alert('Please fill all the fields.');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Signup successful!');
            document.getElementById('toggleForm').click(); // Switch to login form
        } else {
            alert(result.error || 'Signup failed.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
});
