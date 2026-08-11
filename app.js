const STORAGE_KEY = 'shalimar-school-planner:schedule';
const HOMEWORK_KEY = 'shalimar-school-planner:homework';
const FOLDER_KEY = 'shalimar-school-planner:folders';
const ALARM_ENABLED_KEY = 'shalimar-school-planner:alarmsEnabled';
const ALARM_FIRED_KEY = 'shalimar-school-planner:alarmFired';
// Alarm fires at each of these minutes-before-Iqama marks, then stops once
// the prayer time itself (0) has been reached for the day.
const ALARM_THRESHOLDS = [15, 10, 5, 0];
const ALARM_STALE_MINUTES = 60;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PRAYER_LABELS = { fajr: 'Fajr', zhuhr: 'Zhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const FOLDER_COLORS = ['#e15b5b', '#e0854a', '#d9a63e', '#8fae3d', '#3f9e5c', '#2fa39a', '#3f8fd9', '#5b6fe0', '#8a5be0', '#c05bd0', '#e05b9e', '#7a7a7a'];
const DEFAULT_HW_COLOR = '#8a5be0';

let state = {
  viewDate: new Date(),
  weekAnchor: startOfWeek(new Date()),
  schedule: loadJSON(STORAGE_KEY, []),
  homework: loadJSON(HOMEWORK_KEY, []),
  folders: loadJSON(FOLDER_KEY, []),
  selectedFolderColor: FOLDER_COLORS[0],
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
function saveFolders() { localStorage.setItem(FOLDER_KEY, JSON.stringify(state.folders)); }

function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getFolder(folderId) {
  return state.folders.find(f => f.id === folderId) || null;
}

// ---------- Tabs ----------
const mainEl = document.querySelector('main');

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
  mainEl.classList.toggle('wide', tabId === 'week-tab');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('[data-tab]:not(.tab-btn)').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
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

// ---------- Folders (subjects) ----------
const swatchContainer = document.getElementById('folder-color-swatches');
FOLDER_COLORS.forEach((color, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'color-swatch' + (i === 0 ? ' selected' : '');
  btn.style.background = color;
  btn.setAttribute('aria-label', `Choose color ${color}`);
  btn.addEventListener('click', () => {
    state.selectedFolderColor = color;
    swatchContainer.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
  });
  swatchContainer.appendChild(btn);
});

const folderForm = document.getElementById('folder-form');
folderForm.addEventListener('submit', e => {
  e.preventDefault();
  const nameInput = document.getElementById('folder-name');
  const name = nameInput.value.trim();
  if (!name) return;
  state.folders.push({ id: crypto.randomUUID(), name, color: state.selectedFolderColor });
  saveFolders();
  nameInput.value = '';
  render();
});

function deleteFolder(id) {
  state.folders = state.folders.filter(f => f.id !== id);
  state.schedule.forEach(c => { if (c.folderId === id) c.folderId = ''; });
  state.homework.forEach(h => { if (h.folderId === id) h.folderId = ''; });
  saveFolders();
  saveSchedule();
  saveHomework();
  render();
}

function renderFolderList() {
  const list = document.getElementById('folder-list');
  list.innerHTML = '';
  state.folders.forEach(f => {
    const pill = document.createElement('span');
    pill.className = 'folder-pill';
    pill.style.background = f.color + '26';
    pill.style.color = f.color;
    pill.innerHTML = `<span class="folder-dot" style="background:${f.color}"></span>${f.name}<button class="folder-delete" aria-label="Delete ${f.name}">&times;</button>`;
    pill.querySelector('.folder-delete').addEventListener('click', () => deleteFolder(f.id));
    list.appendChild(pill);
  });

  [document.getElementById('class-folder'), document.getElementById('hw-folder')].forEach(select => {
    const current = select.value;
    select.innerHTML = '<option value="">No subject</option>' +
      state.folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    select.value = state.folders.some(f => f.id === current) ? current : '';
  });
}

// ---------- Add class form ----------
const form = document.getElementById('class-form');
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('class-name').value.trim();
  const start = document.getElementById('class-start').value;
  const end = document.getElementById('class-end').value;
  const folderId = document.getElementById('class-folder').value;
  const days = Array.from(document.querySelectorAll('.day-check:checked')).map(c => Number(c.value));
  if (!name || !start || !end || days.length === 0) return;
  if (start >= end) { alert('End time must be after start time.'); return; }
  state.schedule.push({ id: crypto.randomUUID(), name, start, end, days, folderId });
  saveSchedule();
  form.reset();
  render();
});

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
  const folderId = document.getElementById('hw-folder').value;
  const due = document.getElementById('hw-due').value;
  const notes = document.getElementById('hw-notes').value.trim();
  if (!title || !due) return;
  state.homework.push({ id: crypto.randomUUID(), title, folderId, due, notes, done: false });
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

/** Chronologically sorted prayer+class+homework events for a given date (homework sorts first). */
function getDayEvents(date) {
  const prayers = getPrayerTimesForDate(date);
  const classes = getClassesForDate(date);
  const homeworkToday = state.homework.filter(hw => !hw.done && hw.due === dateKey(date));

  const events = [];
  Object.entries(prayers).forEach(([key, clock]) => {
    events.push({ type: 'prayer', key, label: PRAYER_LABELS[key], minutes: parseClockToMinutes(clock), clock });
  });
  classes.forEach(c => {
    events.push({ type: 'class', label: c.name, minutes: c.startMin, endMin: c.endMin, clockStart: formatClock12(c.startMin), clockEnd: formatClock12(c.endMin), folderId: c.folderId });
  });
  homeworkToday.forEach(hw => {
    events.push({ type: 'homework', label: hw.title, minutes: -1, hw });
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
  renderFolderList();
  renderTimeline();
  renderScheduleList();
  renderDstBanner();
  renderJumuah();
  renderMonthTable();
  renderHomeworkList();
  renderTodayHomework();
  renderWeek();
  renderHome();
  updateCountdown();
}

// ---------- Home dashboard ----------
function greetingForHour(hour) {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function renderHome() {
  const now = new Date();
  document.getElementById('home-greeting').textContent =
    `${greetingForHour(now.getHours())} — ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`;

  const events = getDayEvents(now).filter(ev => ev.type !== 'homework');
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const next = events.find(ev => ev.minutes > nowMin);
  const card = document.getElementById('home-next-card');
  if (next) {
    const minutesUntil = Math.round(next.minutes - nowMin);
    const h = Math.floor(minutesUntil / 60);
    const m = minutesUntil % 60;
    const inText = h > 0 ? `${h}h ${m}m` : `${m}m`;
    card.innerHTML = `
      <p class="home-next-label">Up next</p>
      <p class="home-next-value">${next.label}</p>
      <p class="home-next-sub">${next.type === 'prayer' ? next.clock : next.clockStart} &middot; in ${inText}</p>
    `;
  } else {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fajr = getPrayerTimesForDate(tomorrow).fajr;
    card.innerHTML = `
      <p class="home-next-label">Up next</p>
      <p class="home-next-value">Fajr</p>
      <p class="home-next-sub">Tomorrow &middot; ${fajr}</p>
    `;
  }

  const classesToday = getClassesForDate(now);
  const prayersLeft = events.filter(ev => ev.type === 'prayer' && ev.minutes > nowMin).length;
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const dueThisWeek = state.homework.filter(hw => !hw.done && daysUntil(hw.due) >= 0 && daysUntil(hw.due) <= 7).length;
  const overdueCount = state.homework.filter(hw => !hw.done && daysUntil(hw.due) < 0).length;

  document.getElementById('home-stats').innerHTML = `
    <div class="stat-card"><div class="stat-value">${classesToday.length}</div><div class="stat-label">Classes today</div></div>
    <div class="stat-card"><div class="stat-value">${prayersLeft}</div><div class="stat-label">Prayers left today</div></div>
    <div class="stat-card"><div class="stat-value">${dueThisWeek}</div><div class="stat-label">Due this week</div></div>
    <div class="stat-card"><div class="stat-value" style="${overdueCount > 0 ? 'color:var(--danger)' : ''}">${overdueCount}</div><div class="stat-label">Overdue</div></div>
  `;

  const todayPreview = document.getElementById('home-today-preview');
  const upcomingToday = getDayEvents(now).filter(ev => ev.type !== 'homework' && ev.minutes > nowMin).slice(0, 4);
  todayPreview.innerHTML = upcomingToday.length === 0
    ? '<p class="mini-list-empty">Nothing left today.</p>'
    : upcomingToday.map(ev => `
        <div class="mini-list-item" style="border-left-color:${ev.type === 'class' ? (getFolder(ev.folderId)?.color || 'var(--gold)') : 'var(--accent)'}">
          <span class="time">${ev.type === 'prayer' ? ev.clock : ev.clockStart}</span><span>${ev.label}</span>
        </div>`).join('');

  const hwPreview = document.getElementById('home-homework-preview');
  const dueSoon = state.homework
    .filter(hw => !hw.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4);
  hwPreview.innerHTML = dueSoon.length === 0
    ? '<p class="mini-list-empty">No homework tracked.</p>'
    : dueSoon.map(hw => {
        const folder = getFolder(hw.folderId);
        return `<div class="mini-list-item" style="border-left-color:${folder ? folder.color : DEFAULT_HW_COLOR}">
          <span class="time">${homeworkDueText(hw)}</span><span>${hw.title}</span>
        </div>`;
      }).join('');
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

function homeworkDueText(hw) {
  const days = daysUntil(hw.due);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  return `Due in ${days}d`;
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
    } else if (ev.type === 'class') {
      const folder = getFolder(ev.folderId);
      if (folder) row.style.borderLeftColor = folder.color;
      row.innerHTML = `
        <div class="time">${ev.clockStart}&ndash;${ev.clockEnd}</div>
        <div class="content">
          <span class="badge class-badge"${folder ? ` style="background:${folder.color}26;color:${folder.color}"` : ''}>${folder ? folder.name : 'Class'}</span>
          <span>${ev.label}</span>
        </div>`;
    } else {
      const folder = getFolder(ev.hw.folderId);
      const color = folder ? folder.color : DEFAULT_HW_COLOR;
      row.style.borderLeftColor = color;
      row.innerHTML = `
        <div class="time">&mdash;</div>
        <div class="content">
          <label class="hw-timeline-check">
            <input type="checkbox">
            <span class="badge" style="background:${color}26;color:${color}">${folder ? folder.name : 'Homework'}</span>
            <span>${ev.label} &mdash; ${homeworkDueText(ev.hw)}</span>
          </label>
        </div>`;
      row.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleHomeworkDone(ev.hw.id));
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
    const folder = getFolder(c.folderId);
    const row = document.createElement('div');
    row.className = 'schedule-row';
    if (folder) row.style.borderLeft = `4px solid ${folder.color}`;
    row.innerHTML = `
      <div>
        <strong>${c.name}</strong>${folder ? ` <span class="folder-tag" style="background:${folder.color}26;color:${folder.color}">${folder.name}</span>` : ''}
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

  let events = getDayEvents(now).filter(ev => ev.type !== 'homework' && ev.minutes > nowMin);
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
    const folder = getFolder(hw.folderId);
    let urgency = 'muted';
    let dueText = `Due ${hw.due}`;
    if (!hw.done) {
      if (days < 0) { urgency = 'overdue'; dueText = `Overdue — was due ${hw.due}`; }
      else if (days === 0) { urgency = 'due-today'; dueText = 'Due today'; }
      else if (days <= 3) { urgency = 'due-soon'; dueText = `Due in ${days} day${days === 1 ? '' : 's'} (${hw.due})`; }
    }
    const row = document.createElement('div');
    row.className = `schedule-row homework-row ${hw.done ? 'done' : urgency}`;
    if (folder && !hw.done) row.style.borderLeftColor = folder.color;
    row.innerHTML = `
      <label class="hw-check">
        <input type="checkbox" ${hw.done ? 'checked' : ''}>
        <div>
          <strong>${hw.title}</strong>${folder ? ` <span class="folder-tag" style="background:${folder.color}26;color:${folder.color}">${folder.name}</span>` : ''}
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
  el.style.display = 'flex';
  el.innerHTML = dueSoon.map(hw => {
    const folder = getFolder(hw.folderId);
    const color = folder ? folder.color : DEFAULT_HW_COLOR;
    return `<span class="hw-chip" style="background:${color}26;color:${color}">${homeworkDueText(hw)}: ${hw.title}</span>`;
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

    const col = document.createElement('div');
    col.className = 'week-day' + (isSameDay(d, today) ? ' is-today' : '');
    col.innerHTML = `
      <div class="week-day-header">
        <span>${WEEKDAYS_LONG[d.getDay()]}</span>
        <span class="muted">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
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
      } else if (ev.type === 'class') {
        const folder = getFolder(ev.folderId);
        if (folder) row.style.borderLeftColor = folder.color;
        row.innerHTML = `<span class="time">${ev.clockStart}</span><span>${ev.label}</span>`;
      } else {
        const folder = getFolder(ev.hw.folderId);
        row.style.borderLeftColor = folder ? folder.color : DEFAULT_HW_COLOR;
        row.innerHTML = `<span class="time">HW</span><span>${ev.label}</span>`;
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
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let todayRow = null;

  const dayBefore = new Date(year, monthIndex, 0);
  let prevTimes = getPrayerTimesForDate(dayBefore);

  for (let d = 1; d <= total; d++) {
    const date = new Date(year, monthIndex, d);
    const times = getPrayerTimesForDate(date);
    const isToday = date.getTime() === startOfToday.getTime();
    const changed = times.fajr !== prevTimes.fajr || times.zhuhr !== prevTimes.zhuhr
      || times.asr !== prevTimes.asr || times.isha !== prevTimes.isha;
    const tr = document.createElement('tr');
    if (changed) tr.classList.add('changed-row');
    if (isToday) { tr.classList.add('today-row'); todayRow = tr; }
    else if (date < startOfToday) tr.classList.add('past-row');
    tr.innerHTML = `
      <td>${d} <span class="muted">${WEEKDAYS[date.getDay()]}</span></td>
      <td>${times.fajr}</td>
      <td>${times.zhuhr}</td>
      <td>${times.asr}</td>
      <td>${times.maghrib}</td>
      <td>${times.isha}</td>
    `;
    tbody.appendChild(tr);
    prevTimes = times;
  }
  if (todayRow) todayRow.scrollIntoView({ block: 'center' });
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
  const homeBtn = document.getElementById('home-install-btn');
  if (btn) btn.style.display = 'inline-flex';
  if (homeBtn) homeBtn.style.display = 'flex';
});

async function runInstallPrompt() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('install-btn').style.display = 'none';
  document.getElementById('home-install-btn').style.display = 'none';
}

document.getElementById('install-btn').addEventListener('click', runInstallPrompt);
document.getElementById('home-install-btn').addEventListener('click', runInstallPrompt);

// ---------- Iqama alarm ----------
let audioCtx = null;
let alarmBeepInterval = null;
let alarmsEnabled = localStorage.getItem(ALARM_ENABLED_KEY) === 'true';

const alarmToggleBtn = document.getElementById('alarm-toggle-btn');
const homeAlarmBtn = document.getElementById('home-alarm-btn');
const alarmModal = document.getElementById('alarm-modal');

function updateAlarmBtnLabel() {
  alarmToggleBtn.textContent = alarmsEnabled ? '🔔' : '🔕';
  alarmToggleBtn.title = alarmsEnabled ? 'Iqama alarm on' : 'Enable 15-minute Iqama alarm';
  alarmToggleBtn.classList.toggle('active', alarmsEnabled);
  homeAlarmBtn.innerHTML = alarmsEnabled ? '<span>🔔</span>Alarms on' : '<span>🔔</span>Enable alarms';
}
updateAlarmBtnLabel();
homeAlarmBtn.addEventListener('click', () => alarmToggleBtn.click());

function ensureAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playBeep() {
  const ctx = ensureAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

function startAlarmSound() {
  playBeep();
  alarmBeepInterval = setInterval(playBeep, 700);
}

function stopAlarmSound() {
  if (alarmBeepInterval) { clearInterval(alarmBeepInterval); alarmBeepInterval = null; }
}

alarmToggleBtn.addEventListener('click', () => {
  alarmsEnabled = !alarmsEnabled;
  localStorage.setItem(ALARM_ENABLED_KEY, String(alarmsEnabled));
  if (alarmsEnabled) {
    ensureAudioContext();
    playBeep();
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }
  updateAlarmBtnLabel();
});

document.getElementById('alarm-dismiss-btn').addEventListener('click', () => {
  alarmModal.style.display = 'none';
  stopAlarmSound();
});

function showAlarmModal(label, minutesUntil) {
  const isNow = minutesUntil <= 0;
  document.getElementById('alarm-title').textContent = isNow ? `${label} Iqama is now` : `${label} Iqama in ${minutesUntil} min`;
  document.getElementById('alarm-subtitle').textContent = 'Tap "Stop Alarm" to dismiss.';
  alarmModal.style.display = 'flex';
  startAlarmSound();
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(isNow ? `${label} Iqama` : `${label} Iqama soon`, {
      body: isNow ? `${label} Iqama is now.` : `${label} is in about ${minutesUntil} minutes.`,
    });
  }
}

function checkAlarms() {
  if (!alarmsEnabled || alarmModal.style.display === 'flex') return;

  const now = new Date();
  const todayKey = dateKey(now);
  const firedState = loadJSON(ALARM_FIRED_KEY, { date: '', fired: [] });
  if (firedState.date !== todayKey) { firedState.date = todayKey; firedState.fired = []; }

  const prayers = getPrayerTimesForDate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let dirty = false;

  outer:
  for (const [key, clock] of Object.entries(prayers)) {
    const minutesUntil = parseClockToMinutes(clock) - nowMin;
    for (const threshold of ALARM_THRESHOLDS) {
      const fireKey = `${key}:${threshold}`;
      if (minutesUntil <= threshold && !firedState.fired.includes(fireKey)) {
        firedState.fired.push(fireKey);
        dirty = true;
        // Missed marks from long before the app was opened ring silently —
        // only the mark closest to "now" should actually alarm.
        if (minutesUntil >= -ALARM_STALE_MINUTES) {
          localStorage.setItem(ALARM_FIRED_KEY, JSON.stringify(firedState));
          showAlarmModal(PRAYER_LABELS[key], Math.round(minutesUntil));
          break outer;
        }
      }
    }
  }
  if (dirty) localStorage.setItem(ALARM_FIRED_KEY, JSON.stringify(firedState));
}

render();
countdownTimer = setInterval(() => { updateCountdown(); checkAlarms(); }, 1000);

// Support PWA shortcut links (manifest "shortcuts") that open directly into a tab.
const HASH_TAB_MAP = { today: 'today-tab', week: 'week-tab', homework: 'homework-tab', schedule: 'schedule-tab', times: 'times-tab' };
if (location.hash && HASH_TAB_MAP[location.hash.slice(1)]) {
  switchTab(HASH_TAB_MAP[location.hash.slice(1)]);
}
