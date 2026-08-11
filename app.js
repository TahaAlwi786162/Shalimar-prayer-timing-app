const STORAGE_KEY = 'shalimar-school-planner:schedule';
const HOMEWORK_KEY = 'shalimar-school-planner:homework';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PRAYER_LABELS = { fajr: 'Fajr', zhuhr: 'Zhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

let state = {
  viewDate: new Date(),
  weekAnchor: startOfWeek(new Date()),
  schedule: loadJSON(STORAGE_KEY, []),
  homework: loadJSON(HOMEWORK_KEY, []),
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveSchedule() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.schedule)); }
function saveHomework() { localStorage.setItem(HOMEWORK_KEY, JSON.stringify(state.homework)); }

function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ---------- Date navigation (Today tab) ----------
const dateLabel = document.getElementById('date-label');
document.getElementById('prev-day').addEventListener('click', () => shiftDay(-1));
document.getElementById('next-day').addEventListener('click', () => shiftDay(1));
document.getElementById('today-btn').addEventListener('click', () => { state.viewDate = new Date(); render(); });

function shiftDay(delta) {
  const d = new Date(state.viewDate);
  d.setDate(d.getDate() + delta);
  state.viewDate = d;
  render();
}

// ---------- Week navigation ----------
document.getElementById('prev-week').addEventListener('click', () => shiftWeek(-1));
document.getElementById('next-week').addEventListener('click', () => shiftWeek(1));
document.getElementById('this-week-btn').addEventListener('click', () => { state.weekAnchor = startOfWeek(new Date()); renderWeek(); });

function shiftWeek(delta) {
  const d = new Date(state.weekAnchor);
  d.setDate(d.getDate() + delta * 7);
  state.weekAnchor = d;
  renderWeek();
}

// ---------- Add class form ----------
const form = document.getElementById('class-form');
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('class-name').value.trim();
  const start = document.getElementById('class-start').value;
  const end = document.getElementById('class-end').value;
  const days = Array.from(document.querySelectorAll('.day-check:checked')).map(c => Number(c.value));
  if (!name || !start || !end || days.length === 0) return;
  if (start >= end) { alert('End time must be after start time.'); return; }
  state.schedule.push({ id: crypto.randomUUID(), name, start, end, days });
  saveSchedule();
  form.reset();
  render();
}
);

function deleteClass(id) {
  state.schedule = state.schedule.filter(c => c.id !== id);
  saveSchedule();
  render();
}

// ---------- Add homework form ----------
const hwForm = document.getElementById('homework-form');
hwForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('hw-title').value.trim();
  const subject = document.getElementById('hw-subject').value.trim();
  const due = document.getElementById('hw-due').value;
  const notes = document.getElementById('hw-notes').value.trim();
  if (!title || !due) return;
  state.homework.push({ id: crypto.randomUUID(), title, subject, due, notes, done: false });
  saveHomework();
  hwForm.reset();
  render();
});

function toggleHomeworkDone(id) {
  const item = state.homework.find(h => h.id === id);
  if (item) { item.done = !item.done; saveHomework(); render(); }
}

function deleteHomework(id) {
  state.homework = state.homework.filter(h => h.id !== id);
  saveHomework();
  render();
}

// ---------- Helpers ----------
function timeStrToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatClock12(minutes) {
  let h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDateHeading(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Chronologically sorted prayer+class events for a given date. */
function getDayEvents(date) {
  const prayers = getPrayerTimesForDate(date);
  const classes = getClassesForDate(date);

  const events = [];
  Object.entries(prayers).forEach(([key, clock]) => {
    events.push({ type: 'prayer', key, label: PRAYER_LABELS[key], minutes: parseClockToMinutes(clock), clock });
  });
  classes.forEach(c => {
    events.push({ type: 'class', label: c.name, minutes: c.startMin, endMin: c.endMin, clockStart: formatClock12(c.startMin), clockEnd: formatClock12(c.endMin) });
  });
  events.sort((a, b) => a.minutes - b.minutes);
  return events;
}

function getClassesForDate(date) {
  const weekday = date.getDay();
  return state.schedule
    .filter(c => c.days.includes(weekday))
    .map(c => ({ ...c, startMin: timeStrToMinutes(c.start), endMin: timeStrToMinutes(c.end) }))
    .sort((a, b) => a.startMin - b.startMin);
}

// ---------- Render: Today tab ----------
function render() {
  dateLabel.textContent = formatDateHeading(state.viewDate);
  renderTimeline();
  renderScheduleList();
  renderDstBanner();
  renderJumuah();
  renderMonthTable();
  renderHomeworkList();
  renderTodayHomework();
  renderWeek();
  updateCountdown();
}

function renderDstBanner() {
  const banner = document.getElementById('dst-banner');
  const info = daysUntilDstChange(state.viewDate);
  if (!info) { banner.style.display = 'none'; return; }
  banner.style.display = 'block';
  const dateStr = info.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const msg = info.type === 'spring'
    ? `Daylight Saving begins ${info.days === 0 ? 'today' : 'on ' + dateStr} — clocks move forward 1 hour.`
    : `Daylight Saving ends ${info.days === 0 ? 'today' : 'on ' + dateStr} — clocks move back 1 hour.`;
  banner.textContent = `⏰ ${msg} Prayer times will shift accordingly.`;
}

function renderJumuah() {
  const el = document.getElementById('jumuah-info');
  const j = getJumuahTimes(state.viewDate);
  el.innerHTML = `
    <p><strong>First Khutbah:</strong> ${j.first} &nbsp;•&nbsp; <strong>Second Khutbah:</strong> ${j.second}</p>
    <p class="muted">${JUMUAH.note}</p>
    <p class="muted">${MOSQUE_INFO.maghribNote}</p>
    <p class="muted">${MOSQUE_INFO.iqamaNote}</p>
    <p class="muted">${MOSQUE_INFO.name} — ${MOSQUE_INFO.address}</p>
  `;
}

function renderTimeline() {
  const container = document.getElementById('timeline');
  container.innerHTML = '';

  const events = getDayEvents(state.viewDate);
  const classes = getClassesForDate(state.viewDate);

  if (events.length === 0) {
    container.innerHTML = '<p class="muted">No classes added yet — add your school schedule in the "School Schedule" tab to see it merged with prayer times here.</p>';
    return;
  }

  events.forEach(ev => {
    const row = document.createElement('div');
    row.className = `timeline-row ${ev.type}`;

    if (ev.type === 'prayer') {
      const conflict = classes.find(c => ev.minutes >= c.startMin && ev.minutes < c.endMin);
      row.innerHTML = `
        <div class="time">${ev.clock}</div>
        <div class="content">
          <span class="badge prayer-badge">${ev.label}</span>
          ${conflict
            ? `<span class="conflict">falls during <strong>${conflict.name}</strong> — plan ahead to step out or pray right after</span>`
            : `<span class="clear">clear — no class scheduled</span>`}
        </div>`;
    } else {
      row.innerHTML = `
        <div class="time">${ev.clockStart}&ndash;${ev.clockEnd}</div>
        <div class="content">
          <span class="badge class-badge">Class</span>
          <span>${ev.label}</span>
        </div>`;
    }
    container.appendChild(row);
  });
}

function renderScheduleList() {
  const list = document.getElementById('schedule-list');
  list.innerHTML = '';
  if (state.schedule.length === 0) {
    list.innerHTML = '<p class="muted">No classes yet. Add your weekly timetable above.</p>';
    return;
  }
  const sorted = [...state.schedule].sort((a, b) => timeStrToMinutes(a.start) - timeStrToMinutes(b.start));
  sorted.forEach(c => {
    const dayStr = c.days.slice().sort((a, b) => a - b).map(d => WEEKDAYS[d]).join(', ');
    const row = document.createElement('div');
    row.className = 'schedule-row';
    row.innerHTML = `
      <div>
        <strong>${c.name}</strong>
        <div class="muted">${dayStr} &middot; ${formatClock12(timeStrToMinutes(c.start))}&ndash;${formatClock12(timeStrToMinutes(c.end))}</div>
      </div>
      <button class="delete-btn" aria-label="Delete ${c.name}">&times;</button>
    `;
    row.querySelector('.delete-btn').addEventListener('click', () => deleteClass(c.id));
    list.appendChild(row);
  });
}

// ---------- Next-up countdown ----------
let countdownTimer = null;

function updateCountdown() {
  const el = document.getElementById('countdown-banner');
  const isToday = isSameDay(state.viewDate, new Date());
  if (!isToday) { el.style.display = 'none'; return; }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  let events = getDayEvents(now).filter(ev => ev.minutes > nowMin);
  let label, targetMinutes;
  if (events.length > 0) {
    const next = events[0];
    label = next.label;
    targetMinutes = next.minutes;
  } else {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPrayers = getPrayerTimesForDate(tomorrow);
    label = 'Fajr';
    targetMinutes = parseClockToMinutes(tomorrowPrayers.fajr) + 1440;
  }

  const diffSec = Math.max(0, Math.round((targetMinutes - nowMin) * 60));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  el.style.display = 'block';
  el.innerHTML = `Next: <strong>${label}</strong> in ${h > 0 ? h + 'h ' : ''}${m}m ${String(s).padStart(2, '0')}s`;
}

// ---------- Homework ----------
function daysUntil(dueStr) {
  const [y, m, d] = dueStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due - startToday) / 86400000);
}

function renderHomeworkList() {
  const list = document.getElementById('homework-list');
  list.innerHTML = '';
  if (state.homework.length === 0) {
    list.innerHTML = '<p class="muted">No homework tracked yet. Add an assignment above.</p>';
    return;
  }
  const sorted = [...state.homework].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.due.localeCompare(b.due);
  });
  sorted.forEach(hw => {
    const days = daysUntil(hw.due);
    let urgency = 'muted';
    let dueText = `Due ${hw.due}`;
    if (!hw.done) {
      if (days < 0) { urgency = 'overdue'; dueText = `Overdue — was due ${hw.due}`; }
      else if (days === 0) { urgency = 'due-today'; dueText = 'Due today'; }
      else if (days <= 3) { urgency = 'due-soon'; dueText = `Due in ${days} day${days === 1 ? '' : 's'} (${hw.due})`; }
    }
    const row = document.createElement('div');
    row.className = `schedule-row homework-row ${hw.done ? 'done' : urgency}`;
    row.innerHTML = `
      <label class="hw-check">
        <input type="checkbox" ${hw.done ? 'checked' : ''}>
        <div>
          <strong>${hw.title}</strong>${hw.subject ? ` <span class="muted">(${hw.subject})</span>` : ''}
          <div class="muted">${dueText}${hw.notes ? ' &middot; ' + hw.notes : ''}</div>
        </div>
      </label>
      <button class="delete-btn" aria-label="Delete ${hw.title}">&times;</button>
    `;
    row.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleHomeworkDone(hw.id));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteHomework(hw.id));
    list.appendChild(row);
  });
}

function renderTodayHomework() {
  const el = document.getElementById('today-homework');
  const dueSoon = state.homework
    .filter(hw => !hw.done && daysUntil(hw.due) <= 3)
    .sort((a, b) => a.due.localeCompare(b.due));
  if (dueSoon.length === 0) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = dueSoon.map(hw => {
    const days = daysUntil(hw.due);
    const text = days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `Due in ${days}d`;
    return `<span class="hw-chip">${text}: ${hw.title}</span>`;
  }).join('');
}

// ---------- Week view ----------
function renderWeek() {
  const label = document.getElementById('week-label');
  const start = state.weekAnchor;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  label.textContent = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const events = getDayEvents(d);
    const classes = getClassesForDate(d);
    const hwCount = state.homework.filter(hw => !hw.done && hw.due === dateKey(d)).length;

    const col = document.createElement('div');
    col.className = 'week-day' + (isSameDay(d, today) ? ' is-today' : '');
    col.innerHTML = `
      <div class="week-day-header">
        <span>${WEEKDAYS_LONG[d.getDay()]}</span>
        <span class="muted">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        ${hwCount > 0 ? `<span class="hw-dot" title="${hwCount} assignment(s) due">${hwCount}</span>` : ''}
      </div>
      <div class="week-day-events"></div>
    `;
    const eventsEl = col.querySelector('.week-day-events');
    events.forEach(ev => {
      const row = document.createElement('div');
      row.className = `week-event ${ev.type}`;
      if (ev.type === 'prayer') {
        const conflict = classes.find(c => ev.minutes >= c.startMin && ev.minutes < c.endMin);
        row.innerHTML = `<span class="time">${ev.clock}</span><span>${ev.label}${conflict ? ' ⚠' : ''}</span>`;
      } else {
        row.innerHTML = `<span class="time">${ev.clockStart}</span><span>${ev.label}</span>`;
      }
      eventsEl.appendChild(row);
    });
    grid.appendChild(col);
  }
}

// ---------- Month table (Prayer Times tab) ----------
const monthSelect = document.getElementById('month-select');
const yearInput = document.getElementById('year-input');
['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].forEach((m, i) => {
  const opt = document.createElement('option');
  opt.value = i; opt.textContent = m;
  monthSelect.appendChild(opt);
});
monthSelect.value = state.viewDate.getMonth();
yearInput.value = state.viewDate.getFullYear();
monthSelect.addEventListener('change', renderMonthTable);
yearInput.addEventListener('change', renderMonthTable);

function renderMonthTable() {
  const monthIndex = Number(monthSelect.value);
  const year = Number(yearInput.value);
  if (!year) return;
  const tbody = document.getElementById('month-table-body');
  tbody.innerHTML = '';
  const total = daysInMonth(year, monthIndex);
  const today = new Date();
  for (let d = 1; d <= total; d++) {
    const date = new Date(year, monthIndex, d);
    const times = getPrayerTimesForDate(date);
    const isToday = date.toDateString() === today.toDateString();
    const tr = document.createElement('tr');
    if (isToday) tr.classList.add('today-row');
    tr.innerHTML = `
      <td>${d} <span class="muted">${WEEKDAYS[date.getDay()]}</span></td>
      <td>${times.fajr}</td>
      <td>${times.zhuhr}</td>
      <td>${times.asr}</td>
      <td>${times.maghrib}</td>
      <td>${times.isha}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ---------- Theme toggle ----------
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('shalimar-school-planner:theme', next);
});
const savedTheme = localStorage.getItem('shalimar-school-planner:theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

// ---------- PWA install ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'inline-block';
});

const installBtn = document.getElementById('install-btn');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.style.display = 'none';
  });
}

render();
countdownTimer = setInterval(updateCountdown, 1000);
