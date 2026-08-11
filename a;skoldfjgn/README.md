# Prayer & School Planner

A small static web app that merges your weekly school timetable with **Shalimar
Islamic Centre** (3024 Cedarglen Gate, Mississauga, ON) Iqama timings, so you
can see at a glance which prayers fall during class and plan around them.

## Features

- **Today view** — a single merged timeline of your classes and today's
  Fajr/Zhuhr/Asr/Isha times, flagging any prayer that falls inside a class.
- **School Schedule** — add/remove weekly classes (name, days, start/end
  time); saved locally in the browser (`localStorage`), no account needed.
- **Prayer Times** — a full monthly table for any month/year. Times for the
  1st, 10th (or the DST-changeover Sunday in March/November) and 20th come
  straight from the mosque's published sheet; other days are linearly
  interpolated between those anchors as a close estimate.
- **Jumu'ah & Info** — Khutbah times (they change Nov–Mar vs Mar–Nov),
  Maghrib note, and a Daylight Saving banner that appears the week clocks
  change.

## Running it

No build step — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Data source

Prayer times are transcribed from the Shalimar Islamic Centre annual
timing sheet. They're for personal planning — always defer to the mosque's
posted board/Adhan for the actual Iqama, especially around Ramadan when
timings can shift.
