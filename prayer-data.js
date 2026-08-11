// Shalimar Islamic Centre — 3024 Cedarglen Gate, Mississauga, ON L5C 4S3
// Annual Iqama timings (Option 1), Fajr / Zhuhr / Asr / Isha.
// Source: mosque-published annual prayer timing sheet.
// Each month lists three "anchor" rows (early / mid / late month); times for
// any other date are linearly interpolated between the two nearest anchors.
// The March and November mid-month anchors sit on the DST changeover Sunday
// itself (the sheet swaps day-10 for that date), which we reproduce by
// computing that Sunday for the requested year instead of hardcoding a date.

const PRAYER_ANCHORS = [
  { month: 0, rows: [ // January
    { day: 1, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
    { day: 10, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
    { day: 20, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
  ]},
  { month: 1, rows: [ // February
    { day: 1, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:45 PM', isha: '7:30 PM' },
    { day: 10, fajr: '6:30 AM', zhuhr: '1:00 PM', asr: '4:00 PM', isha: '7:30 PM' },
    { day: 20, fajr: '6:15 AM', zhuhr: '1:00 PM', asr: '4:00 PM', isha: '7:45 PM' },
  ]},
  { month: 2, rows: [ // March (mid anchor = 2nd Sunday, DST begins)
    { day: 1, fajr: '6:00 AM', zhuhr: '1:00 PM', asr: '4:15 PM', isha: '7:45 PM' },
    { day: 'dst-spring', fajr: '6:30 AM', zhuhr: '1:40 PM', asr: '5:15 PM', isha: '9:00 PM' },
    { day: 20, fajr: '6:15 AM', zhuhr: '1:40 PM', asr: '5:30 PM', isha: '9:15 PM' },
  ]},
  { month: 3, rows: [ // April
    { day: 1, fajr: '6:00 AM', zhuhr: '1:40 PM', asr: '5:45 PM', isha: '9:30 PM' },
    { day: 10, fajr: '5:45 AM', zhuhr: '1:40 PM', asr: '5:45 PM', isha: '9:45 PM' },
    { day: 20, fajr: '5:30 AM', zhuhr: '1:40 PM', asr: '5:45 PM', isha: '10:00 PM' },
  ]},
  { month: 4, rows: [ // May
    { day: 1, fajr: '5:15 AM', zhuhr: '1:40 PM', asr: '6:00 PM', isha: '10:15 PM' },
    { day: 10, fajr: '5:00 AM', zhuhr: '1:40 PM', asr: '6:00 PM', isha: '10:30 PM' },
    { day: 20, fajr: '4:45 AM', zhuhr: '1:40 PM', asr: '6:00 PM', isha: '10:30 PM' },
  ]},
  { month: 5, rows: [ // June
    { day: 1, fajr: '4:45 AM', zhuhr: '1:40 PM', asr: '6:15 PM', isha: '10:30 PM' },
    { day: 10, fajr: '4:45 AM', zhuhr: '1:40 PM', asr: '6:15 PM', isha: '10:30 PM' },
    { day: 20, fajr: '4:45 AM', zhuhr: '1:40 PM', asr: '6:15 PM', isha: '10:30 PM' },
  ]},
  { month: 6, rows: [ // July
    { day: 1, fajr: '4:45 AM', zhuhr: '1:40 PM', asr: '6:15 PM', isha: '10:30 PM' },
    { day: 10, fajr: '5:00 AM', zhuhr: '1:40 PM', asr: '6:15 PM', isha: '10:30 PM' },
    { day: 20, fajr: '5:00 AM', zhuhr: '1:40 PM', asr: '6:15 PM', isha: '10:30 PM' },
  ]},
  { month: 7, rows: [ // August
    { day: 1, fajr: '5:15 AM', zhuhr: '1:40 PM', asr: '6:00 PM', isha: '10:15 PM' },
    { day: 10, fajr: '5:30 AM', zhuhr: '1:40 PM', asr: '6:00 PM', isha: '10:00 PM' },
    { day: 20, fajr: '5:45 AM', zhuhr: '1:40 PM', asr: '5:45 PM', isha: '9:45 PM' },
  ]},
  { month: 8, rows: [ // September
    { day: 1, fajr: '6:00 AM', zhuhr: '1:40 PM', asr: '5:30 PM', isha: '9:30 PM' },
    { day: 10, fajr: '6:00 AM', zhuhr: '1:40 PM', asr: '5:30 PM', isha: '9:15 PM' },
    { day: 20, fajr: '6:15 AM', zhuhr: '1:40 PM', asr: '5:15 PM', isha: '9:00 PM' },
  ]},
  { month: 9, rows: [ // October
    { day: 1, fajr: '6:30 AM', zhuhr: '1:40 PM', asr: '5:00 PM', isha: '8:45 PM' },
    { day: 10, fajr: '6:45 AM', zhuhr: '1:40 PM', asr: '4:45 PM', isha: '8:30 PM' },
    { day: 20, fajr: '6:45 AM', zhuhr: '1:40 PM', asr: '4:30 PM', isha: '8:15 PM' },
  ]},
  { month: 10, rows: [ // November (mid anchor = 1st Sunday, DST ends)
    { day: 1, fajr: '7:00 AM', zhuhr: '1:40 PM', asr: '4:30 PM', isha: '8:00 PM' },
    { day: 'dst-fall', fajr: '6:15 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
    { day: 20, fajr: '6:30 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
  ]},
  { month: 11, rows: [ // December
    { day: 1, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
    { day: 10, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
    { day: 20, fajr: '6:45 AM', zhuhr: '1:00 PM', asr: '3:30 PM', isha: '7:30 PM' },
  ]},
];

const JUMUAH = {
  novToMarch: { first: '12:35 PM', second: '1:35 PM' },
  marchToNov: { first: '1:35 PM', second: '2:35 PM' },
  note: "Salat-ul-Jumu'ah starts 25-30 minutes after Khutbah.",
};

const MOSQUE_INFO = {
  name: 'Shalimar Islamic Centre',
  address: '3024 Cedarglen Gate, Mississauga, ON L5C 4S3',
  maghribNote: 'Maghrib is 5 minutes after sunset (not tabulated — check a sunset time for your date).',
  iqamaNote: 'Iqama timings may shift slightly (e.g. during Ramadan). Adhan sounds roughly 10 minutes before Iqama; changes are announced by the Imam.',
};

/** nth Sunday (1-based) of a given month/year. monthIndex is 0-based. */
function nthSundayOfMonth(year, monthIndex, n) {
  const first = new Date(year, monthIndex, 1);
  const firstSunday = 1 + ((7 - first.getDay()) % 7);
  return new Date(year, monthIndex, firstSunday + (n - 1) * 7);
}

function dstSpringDate(year) { return nthSundayOfMonth(year, 2, 2); }  // 2nd Sunday of March
function dstFallDate(year) { return nthSundayOfMonth(year, 10, 1); }   // 1st Sunday of November

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function parseClockToMinutes(str) {
  const m = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const isPM = /PM/i.test(m[3]);
  if (h === 12) h = 0;
  if (isPM) h += 12;
  return h * 60 + min;
}

function minutesToClock(mins) {
  mins = Math.round(mins);
  let h = Math.floor(mins / 60) % 24;
  const min = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}

/** Resolve an anchor row's real day-of-month for a given year. */
function resolveAnchorDay(row, year, monthIndex) {
  if (row.day === 'dst-spring') return dstSpringDate(year).getDate();
  if (row.day === 'dst-fall') return dstFallDate(year).getDate();
  return row.day;
}

/** Build [{day, fajr, zhuhr, asr, isha}] anchors (minutes-of-day) for a month/year. */
function resolvedAnchorsForMonth(year, monthIndex) {
  const monthData = PRAYER_ANCHORS[monthIndex];
  return monthData.rows.map(row => ({
    day: resolveAnchorDay(row, year, monthIndex),
    fajr: parseClockToMinutes(row.fajr),
    zhuhr: parseClockToMinutes(row.zhuhr),
    asr: parseClockToMinutes(row.asr),
    isha: parseClockToMinutes(row.isha),
  }));
}

/** Get interpolated prayer times for an arbitrary Date. Returns clock strings. */
function getPrayerTimesForDate(date) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const day = date.getDate();

  const anchors = resolvedAnchorsForMonth(year, monthIndex);
  anchors.sort((a, b) => a.day - b.day);

  let lo, hi;
  if (day <= anchors[0].day) {
    // before first anchor: interpolate from previous month's last anchor
    const prevMonthIndex = (monthIndex + 11) % 12;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const prevAnchors = resolvedAnchorsForMonth(prevYear, prevMonthIndex);
    prevAnchors.sort((a, b) => a.day - b.day);
    const prevLast = prevAnchors[prevAnchors.length - 1];
    lo = prevLast; hi = anchors[0];
    const totalSpan = (daysInMonth(prevYear, prevMonthIndex) - prevLast.day) + anchors[0].day;
    const progressed = (daysInMonth(prevYear, prevMonthIndex) - prevLast.day) + day;
    return interpolate(lo, hi, totalSpan === 0 ? 0 : progressed / totalSpan);
  }

  for (let i = 0; i < anchors.length - 1; i++) {
    if (day >= anchors[i].day && day <= anchors[i + 1].day) {
      lo = anchors[i]; hi = anchors[i + 1];
      const span = hi.day - lo.day;
      const frac = span === 0 ? 0 : (day - lo.day) / span;
      return interpolate(lo, hi, frac);
    }
  }

  // after last anchor: interpolate toward next month's first anchor
  const last = anchors[anchors.length - 1];
  const nextMonthIndex = (monthIndex + 1) % 12;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextAnchors = resolvedAnchorsForMonth(nextYear, nextMonthIndex);
  nextAnchors.sort((a, b) => a.day - b.day);
  const next = nextAnchors[0];
  const span = (daysInMonth(year, monthIndex) - last.day) + next.day;
  const progressed = day - last.day;
  const frac = span === 0 ? 0 : progressed / span;
  return interpolate(last, next, frac);
}

function interpolate(lo, hi, frac) {
  const lerp = (a, b) => a + (b - a) * frac;
  return {
    fajr: minutesToClock(lerp(lo.fajr, hi.fajr)),
    zhuhr: minutesToClock(lerp(lo.zhuhr, hi.zhuhr)),
    asr: minutesToClock(lerp(lo.asr, hi.asr)),
    isha: minutesToClock(lerp(lo.isha, hi.isha)),
  };
}

function getJumuahTimes(date) {
  const monthIndex = date.getMonth();
  // "November - March" per sheet: Nov(10), Dec(11), Jan(0), Feb(1), Mar(2)
  const isNovToMarch = monthIndex >= 10 || monthIndex <= 2;
  return isNovToMarch ? JUMUAH.novToMarch : JUMUAH.marchToNov;
}

function daysUntilDstChange(date) {
  const year = date.getFullYear();
  const spring = dstSpringDate(year);
  const fall = dstFallDate(year);
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dSpring = Math.round((spring - startOfToday) / oneDay);
  const dFall = Math.round((fall - startOfToday) / oneDay);
  if (dSpring >= 0 && dSpring <= 7) return { days: dSpring, type: 'spring', date: spring };
  if (dFall >= 0 && dFall <= 7) return { days: dFall, type: 'fall', date: fall };
  return null;
}
