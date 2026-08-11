const STORAGE_KEY = 'shalimar-school-planner:schedule';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PRAYER_LABELS = { fajr: 'Fajr', zhuhr: 'Zhuhr', asr: 'Asr', isha: 'Isha' };

let state = {
  viewDate: new Date(),
  schedule: loadSchedule(),
};

function loadSchedule() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveSchedule() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.schedule));
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

// ---------- Date navigation ----------
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
});

function deleteClass(id) {
  state.schedule = state.schedule.filter(c => c.id !== id);
  saveSchedule();
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

// ---------- Render: Today tab ----------
function render() {
  dateLabel.textContent = formatDateHeading(state.viewDate);
  renderTimeline();
  renderScheduleList();
  renderDstBanner();
  renderJumuah();
  renderMonthTable();
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

function getTodaysClasses(date) {
  const weekday = date.getDay();
  return state.schedule
    .filter(c => c.days.includes(weekday))
    .map(c => ({ ...c, startMin: timeStrToMinutes(c.start), endMin: timeStrToMinutes(c.end) }))
    .sort((a, b) => a.startMin - b.startMin);
}

function renderTimeline() {
  const container = document.getElementById('timeline');
  container.innerHTML = '';

  const prayers = getPrayerTimesForDate(state.viewDate);
  const classes = getTodaysClasses(state.viewDate);

  const events = [];
  Object.entries(prayers).forEach(([key, clock]) => {
    events.push({ type: 'prayer', key, label: PRAYER_LABELS[key], minutes: parseClockToMinutes(clock), clock });
  });
  classes.forEach(c => {
    events.push({ type: 'class', label: c.name, minutes: c.startMin, endMin: c.endMin, clockStart: formatClock12(c.startMin), clockEnd: formatClock12(c.endMin) });
  });
  events.sort((a, b) => a.minutes - b.minutes);

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

render();
