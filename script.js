// 1. Global variables for the Pomodoro timer
let timer;
let timeLeft = 25 * 60; 
let isRunning = false;

// Helper function for sending Notifications
const sendNotification = (title, message) => {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: message,
            icon: "https://cdn-icons-png.flaticon.com/512/2523/2523040.png"
        });
        // Optional: Play a short beep
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play();
    }
};

// 2. Global setTimer for HTML button access
window.setTimer = (minutes) => {
    clearInterval(timer);
    isRunning = false;
    timeLeft = minutes * 60;

    const timerDisplay = document.getElementById("timer");
    const startBtn = document.getElementById("startBtn");

    if (timerDisplay) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    if (startBtn) {
        startBtn.textContent = "Start";
    }
};

document.addEventListener("DOMContentLoaded", () => {

    // Request notification permission on load
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    // --- GREETING & WEATHER LOGIC ---
    const updateGreetingAndWeather = async () => {
        const greetingEl = document.getElementById("userGreeting");
        const weatherEl = document.getElementById("weatherInfo");
        const hour = new Date().getHours();

        if (greetingEl) {
            if (hour < 12) greetingEl.textContent = "Good Morning, Achiever! ☕";
            else if (hour < 18) greetingEl.textContent = "Good Afternoon, Pro! ⚡";
            else greetingEl.textContent = "Good Evening, Legend! 🌙";
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                const data = await response.json();
                const temp = Math.round(data.current_weather.temperature);
                if (weatherEl) weatherEl.textContent = `📍 Your location: ${temp}°C and feeling productive!`;
            } catch (error) {
                if (weatherEl) weatherEl.textContent = "Focus on your goals today!";
            }
        }, () => {
            if (weatherEl) weatherEl.textContent = "Have a great day of work!";
        });
    };

    updateGreetingAndWeather();

    // --- DASHBOARD STATS LOGIC ---
    const updateStats = () => {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        const left = total - done;

        const totalEl = document.getElementById("totalStat");
        const doneEl = document.getElementById("doneStat");
        const leftEl = document.getElementById("leftStat");

        if (totalEl) totalEl.textContent = total;
        if (doneEl) doneEl.textContent = done;
        if (leftEl) leftEl.textContent = left;
    };

    // --- PROGRESS BAR LOGIC ---
    const updateProgressBar = () => {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const goalInput = document.getElementById("goalInput");
        const progressBar = document.getElementById("progressBar");
        const goalStats = document.getElementById("goalStats");

        if (!goalInput || !progressBar || !goalStats) return;

        const totalGoal = parseInt(goalInput.value) || 1;
        const completedCount = tasks.filter(task => task.completed).length;
        const percentage = Math.min((completedCount / totalGoal) * 100, 100);

        progressBar.style.width = percentage + "%";
        goalStats.textContent = `${completedCount} of ${totalGoal} tasks completed`;

        if (percentage === 100 && completedCount >= totalGoal) {
            progressBar.style.backgroundColor = "#27ae60"; 
        } else {
            progressBar.style.backgroundColor = "var(--header-bg)";
        }
    };

    const goalInput = document.getElementById("goalInput");
    if (goalInput) {
        goalInput.addEventListener("input", updateProgressBar);
    }

    // --- SIDEBAR NAVIGATION ---
    const menuItems = document.querySelectorAll(".menu-item");
    const cards = document.querySelectorAll(".card");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");
            cards.forEach(card => {
                if (target === "all") {
                    card.style.display = "flex";
                } else {
                    card.style.display = card.classList.contains(target) ? "flex" : "none";
                }
            });
            menuItems.forEach(i => i.style.background = "transparent");
            item.style.background = "rgba(184, 222, 135, 0.2)";
        });
    });

    // --- NOTES LOGIC ---
    const notesArea = document.getElementById("notesArea");
    if (notesArea) {
        const savedNotes = localStorage.getItem("notes");
        if (savedNotes !== null) notesArea.value = savedNotes;
        notesArea.addEventListener("input", () => {
            localStorage.setItem("notes", notesArea.value);
        });
    }

    // --- POMODORO LOGIC ---
    const timerDisplay = document.getElementById("timer");
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            if (isRunning) {
                clearInterval(timer);
                startBtn.textContent = "Start";
                isRunning = false;
            } else {
                isRunning = true;
                startBtn.textContent = "Pause";
                timer = setInterval(() => {
                    timeLeft--;
                    updateTimerDisplay();
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        isRunning = false;
                        startBtn.textContent = "Start";
                        
                        // Send Notification!
                        sendNotification("Time's Up!", "Session complete. Time to take a break!");
                        
                        alert("Time is up! Take a break.");
                        window.setTimer(25);
                    }
                }, 1000);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => window.setTimer(25));
    }

    // --- DATE & TIME ---
    const dateTimeDisplay = document.getElementById("dateTime");
    const updateTime = () => {
        if (dateTimeDisplay) {
            const now = new Date();
            dateTimeDisplay.textContent = now.toLocaleString();
        }
    };
    setInterval(updateTime, 1000);
    updateTime();

    // --- TO-DO LIST LOGIC ---
    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const taskList = document.getElementById("taskList");

    const renderTasks = () => {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        taskList.innerHTML = "";

        if (tasks.length === 0) {
            taskList.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No tasks yet. Add one above! 🚀</p>`;
            updateProgressBar();
            updateStats();
            return;
        }

        const priorityWeight = { high: 3, medium: 2, low: 1 };
        
        tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return priorityWeight[b.priority || 'medium'] - priorityWeight[a.priority || 'medium'];
        });

        localStorage.setItem("tasks", JSON.stringify(tasks));

        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            const priorityClass = `priority-${task.priority || 'medium'}`;

            li.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1;">
                    <input type="checkbox" class="todo-checkbox" 
                        ${task.completed ? 'checked' : ''} 
                        onclick="toggleTask(${index})">
                    <span class="priority-pill ${priorityClass}">${task.priority || 'medium'}</span>
                    <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                </div>
                <button onclick="removeTask(${index})" style="cursor:pointer; margin-left: 10px;">❌</button>
            `;
            taskList.appendChild(li);
        });
        updateProgressBar();
        updateStats();
    };

    window.toggleTask = (index) => {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks[index].completed = !tasks[index].completed;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
    };

    window.removeTask = (index) => {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.splice(index, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
    };

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
            const priorityInput = document.getElementById("priorityInput"); 
            if (taskInput.value.trim() !== "") {
                const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
                tasks.push({ 
                    text: taskInput.value.trim(), 
                    completed: false,
                    priority: priorityInput ? priorityInput.value : 'medium'
                });
                localStorage.setItem("tasks", JSON.stringify(tasks));
                taskInput.value = "";
                renderTasks();
            }
        });
    }

    // SEARCH FILTER
    const searchInput = document.querySelector(".sarch");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const tasks = document.querySelectorAll("#taskList li");
            tasks.forEach(task => {
                const taskText = task.textContent.toLowerCase();
                task.style.display = taskText.includes(term) ? "flex" : "none";
            });
        });
    }

    // THEME TOGGLE
    const themeBtn = document.getElementById("themeButton");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("changeTheme");
        });
    }

    // ENTER KEY
    if (taskInput) {
        taskInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") addTaskBtn.click();
        });
    }

    renderTasks();
});