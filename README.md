# Prayer & School Planner

A small static web app that merges your weekly school timetable with **Shalimar
Islamic Centre** (3024 Cedarglen Gate, Mississauga, ON) Iqama timings, so you
can see at a glance which prayers fall during class and plan around them.

## Features

- **Today view** — a single merged timeline of your classes and today's
  Fajr/Zhuhr/Asr/Maghrib/Isha times, flagging any prayer that falls inside a
  class, plus a live "Next: Zhuhr in 42m" countdown and a strip of homework
  due-soon chips.
- **Week view** — all 7 days at a glance, each showing its own merged
  class/prayer agenda, with a badge on any day that has homework due.
- **School Schedule** — add/remove weekly classes (name, days, start/end
  time); saved locally in the browser (`localStorage`), no account needed.
- **Homework** — track assignments with subject, due date, and notes; overdue
  and due-soon items are color-flagged and surfaced on the Today tab.
- **Prayer Times** — a full monthly table for any month/year. Fajr/Zhuhr/Asr/
  Isha for the 1st, 10th (or the DST-changeover Sunday in March/November) and
  20th come straight from the mosque's published sheet, interpolated for
  other days; Maghrib is calculated as sunset + 5 minutes (per the sheet's
  own rule) using the mosque's coordinates.
- **Jumu'ah & Info** — Khutbah times (they change Nov–Mar vs Mar–Nov) and a
  Daylight Saving banner that appears the week clocks change.
- **Installable (PWA)** — has a manifest + service worker, so it can be added
  to a phone's home screen and works offline once loaded.

## Running it

No build step — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Serving it over HTTP(S) (rather than opening the file directly) is required
for the install/offline features to work — `file://` won't register the
service worker.

## Data source

Prayer times are transcribed from the Shalimar Islamic Centre annual
timing sheet. They're for personal planning — always defer to the mosque's
posted board/Adhan for the actual Iqama, especially around Ramadan when
timings can shift.

Link: https://tahaalwi786162.github.io/Shalimar-prayer-timing-app/

