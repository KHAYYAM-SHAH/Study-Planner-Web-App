from flask import Flask, request, jsonify, render_template, session, redirect
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Database Configuration
app.config.from_pyfile('config.py')
mysql = MySQL(app)

# Home Route
@app.route('/')
def index():
    if 'user_id' in session:
        return render_template('index.html')  # Show dashboard for logged-in users
    return redirect('/login')  # Redirect to login page

# User Registration
@app.route('/signup', methods=['POST'])
def signup():
    username = request.json['username']
    password = request.json['password']
    hashed_password = generate_password_hash(password)
    try:
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
        mysql.connection.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# User Login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')

            if username is None or password is None:
                return jsonify({"error": "Missing username or password"}), 400

            # Check if username exists in the database
            cur = mysql.connection.cursor()
            cur.execute("SELECT id, password FROM users WHERE username = %s", (username,))
            user = cur.fetchone()

            if user:
                user_id, hashed_password = user

                # Verify the password
                if check_password_hash(hashed_password, password):
                    # Login successful
                    session['user_id'] = user_id
                    return jsonify({"message": "Login successful!"}), 200
                else:
                    return jsonify({"error": "Invalid username or password"}), 401
            else:
                return jsonify({"error": "User not found"}), 404
        return jsonify({"error": "Request must be JSON"}), 400
    return render_template('index.html')



# Save Task
@app.route('/tasks', methods=['POST'])
def save_task():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 403
    task = request.json['task']
    date = request.json['date']
    time = request.json['time']
    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO tasks (user_id, task, date, time) VALUES (%s, %s, %s, %s)",
                (session['user_id'], task, date, time))
    mysql.connection.commit()
    return jsonify({"message": "Task saved!"}), 201

# Get Tasks
@app.route('/get_tasks', methods=['GET'])
def get_tasks():
    user_id = session.get('user_id')
    if user_id:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, task, date, time FROM tasks WHERE user_id = %s", (user_id,))
        tasks = cursor.fetchall()
        tasks_json = []
        for task in tasks:
            task_dict = {
                "id": task[0],
                "task": task[1],
                "date": str(task[2]),  # Convert date to string
                "time": str(task[3])  # Convert time to string
            }
            tasks_json.append(task_dict)
        return jsonify(tasks_json)
    return jsonify({"error": "User not logged in."}), 401
# Add Task
@app.route('/add_task', methods=['POST'])
def add_task():
    data = request.json
    user_id = session.get('user_id')  # Assuming user is logged in
    task = data.get('task')
    date = data.get('date')
    time = data.get('time')

    if user_id and task and date and time:
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO tasks (user_id, task, date, time) VALUES (%s, %s, %s, %s)", (user_id, task, date, time))
        mysql.connection.commit()
        return jsonify({"message": "Task added successfully!"})
    return jsonify({"error": "Invalid input or user not logged in."}), 400

# Delete Task
@app.route('/delete_task', methods=['POST'])
def delete_task():
    data = request.json
    task_id = data.get('task_id')
    user_id = session.get('user_id')

    if task_id and user_id:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
        mysql.connection.commit()
        return jsonify({"message": "Task deleted successfully!"})
    return jsonify({"error": "Invalid input or user not logged in."}), 400



# Logout
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully!"}), 200

# Task Reminder Notifications
@app.route('/reminders', methods=['GET'])
def reminders():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 403
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, task, date, time FROM tasks WHERE user_id=%s", [session['user_id']])
    tasks = cur.fetchall()
    reminders = []
    now = datetime.now()
    for task in tasks:
        task_date = datetime.strptime(f"{task[2]} {task[3]}", '%Y-%m-%d %H:%M:%S')
        if now + timedelta(hours=1) >= task_date > now:
            reminders.append({"id": task[0], "task": task[1]})
    return jsonify(reminders), 200

# Task Deadline Notification Background Job
@app.route('/send_notifications', methods=['POST'])
def send_deadline_notifications():
    cursor = mysql.connection.cursor()
    query = '''
        SELECT id, user_id, task, date, time 
        FROM tasks
        WHERE CONCAT(date, ' ', time) <= NOW() + INTERVAL 1 HOUR
          AND CONCAT(date, ' ', time) > NOW()
          AND notification_sent = FALSE
    '''
    cursor.execute(query)
    tasks = cursor.fetchall()

    for task in tasks:
        user_id = task[1]
        task_name = task[2]

        # Example: send email or app notification to user
        send_notification(user_id, f"Upcoming Deadline: {task_name}")

        # Update the notification_sent flag
        update_query = 'UPDATE tasks SET notification_sent = TRUE WHERE id = %s'
        cursor.execute(update_query, (task[0],))

    mysql.connection.commit()
    cursor.close()
    return jsonify({"message": "Notifications sent successfully!"}), 200

# Utility to Send Notifications
def send_notification(user_id, message):
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT username FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    email = user[0]  # Assuming username is an email

    # Example: Log the notification instead of sending email
    print(f"Notification to {email}: {message}")
    cursor.close()


    
# Add Note
@app.route('/add_note', methods=['POST'])
def add_note():
    note_data = request.json
    title = note_data.get('title')
    content = note_data.get('content')
    user_id = session.get('user_id')

    if not all([title, content, user_id]):
        return jsonify({"error": "Missing required fields"}), 400

    # Validate input
    if user_id and title and content:
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO notes (user_id, title, content, created_at) VALUES (%s, %s, %s, NOW())", (user_id, title, content))
        mysql.connection.commit()
        return jsonify({"message": "Note added successfully!"})
    return jsonify({"error": "Invalid input or user not logged in."}), 400

# Get Notes
@app.route('/get_notes', methods=['GET'])
def get_notes():
    user_id = session.get('user_id')  # Get user_id from session
    if user_id:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, title, content, created_at FROM notes WHERE user_id = %s", (user_id,))
        notes = cursor.fetchall()
        return jsonify([{
            "id": note[0],
            "title": note[1],
            "content": note[2],
            "created_at": note[3].strftime('%Y-%m-%d %H:%M:%S')  # Formatting datetime for better readability
        } for note in notes])
    return jsonify({"error": "User not logged in."}), 401

# Delete Note
@app.route('/delete_note', methods=['POST'])
def delete_note():
    data = request.json
    note_id = data.get('note_id')  # Get note_id from request
    user_id = session.get('user_id')  # Get user_id from session

    if note_id and user_id:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id))
        mysql.connection.commit()
        return jsonify({"message": "Note deleted successfully!"})
    return jsonify({"error": "Invalid input or user not logged in."}), 400

if __name__ == '__main__':
    app.run(debug=True)
