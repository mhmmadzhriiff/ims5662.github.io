
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

const SESSION_KEY = 'admin_session_demo';

function setSession(username, role) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, role, ts: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getSession() {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

/* ---------- Login handling (index.html) ---------- */
document.addEventListener('DOMContentLoaded', function () {
 
  const loginForm = qs('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const username = qs('#username').value.trim();
      const password = qs('#password').value.trim();
      const role = qs('#role').value;

      const fallback = (role === 'admin' && username === 'admin' && password === 'admin888') ||
                       (role === 'user' && username === 'staff' && password === 'staff888');
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const found = registeredUsers.find(u => u.username === username && u.password === password);

      if (fallback || found) {
        setSession(username, role);
    
        window.location.href = 'dashboard.html';
      } else {
        const fb = qs('#loginFeedback');
        fb.style.display = 'block';
        fb.textContent = 'Invalid username or password.';
      }
    });
  }

  // REGISTRATION
  const regForm = qs('#registerForm');
  if (regForm) {
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = qs('#regName').value.trim();
      const username = qs('#regUsername').value.trim();
      const email = qs('#regEmail').value.trim();
      const password = qs('#regPassword').value.trim();

      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
      if (users.some(u => u.username === username)) {
        const out = qs('#registerFeedback');
        out.style.display = 'block';
        out.textContent = 'Username already exists.';
        out.className = 'small text-danger';
        return;
      }

      users.push({ name, username, email, password });
      localStorage.setItem('registered_users', JSON.stringify(users));
      const out = qs('#registerFeedback');
      out.style.display = 'block';
      out.textContent = 'Registration successful. You can login now.';
      out.className = 'small text-success';
      qs('#regName').value = qs('#regUsername').value = qs('#regEmail').value = qs('#regPassword').value = '';
    });
  }

  if (['dashboard.html', 'performance.html', 'task.html', 'logistics.html'].some(p => window.location.pathname.endsWith(p))) {
    const s = getSession();
    if (!s) {
      window.location.href = 'index.html';
      return;
    } else {
      const label = qs('#navUsername');
      if (label) label.textContent = s.username;
    }
  }

  /* Logout buttons (multiple pages) */
  qsa('#logoutBtn, #logoutBtn2, #logoutBtn3, #logoutBtn4').forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  });

  /* ---------- Dashboard: charts, announcements, recent tasks ---------- */
  if (qs('#attendanceChart')) {

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const presentCounts = [28, 30, 26, 32, 29, 20, 18]; 

    const ctx = qs('#attendanceChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Present',
          data: presentCounts,
          tension: 0.3,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, max: 40 }
        }
      }
    });

    function renderAnnouncements() {
      const list = qs('#announcementsList');
      const ann = JSON.parse(localStorage.getItem('announcements') || '[]').slice().reverse();
      list.innerHTML = ann.length ? ann.map(a => `<div class="announcement"><div class="small text-muted">${new Date(a.ts).toLocaleString()}</div><div>${a.text}</div></div>`).join('') : '<div class="text-muted small">No announcements yet.</div>';
    }
    renderAnnouncements();

    qs('#announcementForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const text = qs('#announcementText').value.trim();
      if (!text) return;
      const arr = JSON.parse(localStorage.getItem('announcements') || '[]');
      arr.push({ text, ts: Date.now() });
      localStorage.setItem('announcements', JSON.stringify(arr));
      qs('#announcementText').value = '';
      renderAnnouncements();
    });


    function renderRecentTasks() {
      const list = qs('#recentTasksList');
      const tasks = JSON.parse(localStorage.getItem('tasks_demo') || '[]').slice().reverse().slice(0,5);
      if (!tasks.length) {
        list.innerHTML = `<li class="list-group-item text-muted">No recent tasks.</li>`;
      } else {
        list.innerHTML = tasks.map(t => `<li class="list-group-item d-flex justify-content-between align-items-start"><div><div><strong>${t.title}</strong></div><div class="small text-muted">Due: ${t.due} — ${t.assignee}</div></div><span class="badge bg-${t.status === 'Done' ? 'success' : (t.status === 'Planned' ? 'warning text-dark' : 'secondary')}">${t.status}</span></li>`).join('');
      }
    }
    renderRecentTasks();
  }

  /* ---------- Performance page chart ---------- */
  if (qs('#performanceChart')) {
    const ctx = qs('#performanceChart').getContext('2d');
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const completed = [12, 18, 15, 20, 22, 19]; 
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Completed tasks',
          data: completed,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  /* ---------- Task form handling (task.html) ---------- */
  const taskForm = qs('#taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = qs('#taskTitle').value.trim();
      const due = qs('#taskDue').value;
      const assignee = qs('#taskAssignee').value.trim();
      if (!title || !due || !assignee) return;

      const arr = JSON.parse(localStorage.getItem('tasks_demo') || '[]');
      arr.push({ title, due, assignee, status: 'Planned', ts: Date.now() });
      localStorage.setItem('tasks_demo', JSON.stringify(arr));
      qs('#taskTitle').value = qs('#taskDue').value = qs('#taskAssignee').value = '';

      populateTasks();
      if (qs('#recentTasksList')) {
        const ev = new Event('DOMContentLoaded');
        document.dispatchEvent(ev);
      }
    });
  }

  function populateTasks() {
    const arr = JSON.parse(localStorage.getItem('tasks_demo') || '[]');
    const upcoming = arr.filter(t => t.status !== 'Done').slice().reverse();
    const past = arr.filter(t => t.status === 'Done').slice().reverse();

    const upEl = qs('#upcomingTasks');
    const pastEl = qs('#pastTasks');
    if (upEl) {
      upEl.innerHTML = upcoming.length ? upcoming.map((t, i) => `<li class="list-group-item d-flex justify-content-between align-items-start"><div><div><strong>${t.title}</strong></div><div class="small text">Due: ${t.due} — Assigned to: ${t.assignee}</div></div><div><button class="btn btn-sm btn-success mark-done" data-index="${i}">Mark done</button></div></li>`).join('') : '<li class="list-group-item">No upcoming tasks.</li>';
    }
    if (pastEl) {
      pastEl.innerHTML = past.length ? past.map(t => `<li class="list-group-item d-flex justify-content-between align-items-start"><div><div><strong>${t.title}</strong></div><div class="small textSS">Completed: ${t.completedOn || t.due} — By: ${t.assignee}</div></div><span class="badge bg-success">Done</span></li>`).join('') : '<li class="list-group-item text">No completed tasks.</li>';
    }

   
    qsa('.mark-done').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'), 10);
        const arrAll = JSON.parse(localStorage.getItem('tasks_demo') || '[]');
        const notDone = arrAll.filter(t => t.status !== 'Done');
        const globalItem = notDone[notDone.length - 1 - idx]; 
        if (globalItem) {
          globalItem.status = 'Done';
          globalItem.completedOn = new Date().toISOString().slice(0,10);
          localStorage.setItem('tasks_demo', JSON.stringify(arrAll));
          populateTasks();
          if (qs('#recentTasksList')) {
            const ev = new Event('DOMContentLoaded');
            document.dispatchEvent(ev);
          }
        }
      });
    });
  }
  populateTasks();
});
