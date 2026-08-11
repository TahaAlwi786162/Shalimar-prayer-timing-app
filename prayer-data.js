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
  maghribNote: 'Maghrib is calculated as 5 minutes after sunset for the mosque\'s coordinates — it isn\'t on the printed sheet, so treat it as a close estimate (within a minute or two) rather than the official Iqama.',
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

  let times;
  if (day <= anchors[0].day) {
    // before first anchor: interpolate from previous month's last anchor
    const prevMonthIndex = (monthIndex + 11) % 12;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const prevAnchors = resolvedAnchorsForMonth(prevYear, prevMonthIndex);
    prevAnchors.sort((a, b) => a.day - b.day);
    const prevLast = prevAnchors[prevAnchors.length - 1];
    const totalSpan = (daysInMonth(prevYear, prevMonthIndex) - prevLast.day) + anchors[0].day;
    const progressed = (daysInMonth(prevYear, prevMonthIndex) - prevLast.day) + day;
    times = interpolate(prevLast, anchors[0], totalSpan === 0 ? 0 : progressed / totalSpan);
  } else {
    times = null;
    for (let i = 0; i < anchors.length - 1; i++) {
      if (day >= anchors[i].day && day <= anchors[i + 1].day) {
        const span = anchors[i + 1].day - anchors[i].day;
        const frac = span === 0 ? 0 : (day - anchors[i].day) / span;
        times = interpolate(anchors[i], anchors[i + 1], frac);
        break;
      }
    }
    if (!times) {
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
      times = interpolate(last, next, frac);
    }
  }

  times.maghrib = getMaghribTime(date);
  return times;
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

// Approximate coordinates for 3024 Cedarglen Gate, Mississauga, ON L5C 4S3.
const MOSQUE_COORDS = { lat: 43.60, lng: -79.64 };

/**
 * Sunset time (as a JS Date) for a given calendar date and lat/lng, using the
 * standard sunrise/sunset equation (see e.g. https://en.wikipedia.org/wiki/Sunrise_equation).
 * Accurate to roughly a minute — good enough for planning, not for Fiqh rulings.
 */
function calculateSunset(date, lat, lng) {
  const rad = Math.PI / 180;
  const dayMs = 86400000;
  const J1970 = 2440588, J2000 = 2451545;
  const toJulian = d => d.valueOf() / dayMs - 0.5 + J1970;
  const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
  const toDays = d => toJulian(d) - J2000;

  const e = rad * 23.4397; // obliquity of the ecliptic
  const solarMeanAnomaly = d => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = M => {
    const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const P = rad * 102.9372;
    return M + C + P + Math.PI;
  };
  const declination = L => Math.asin(Math.sin(L) * Math.sin(e));
  const julianCycle = (d, lw) => Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => 0.0009 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const h0 = -0.833 * rad; // standard atmospheric refraction at the horizon
  const w0 = hourAngle(h0, phi, dec);
  const Jset = solarTransitJ(approxTransit(w0, lw, n), M, L);
  return fromJulian(Jset);
}

/** Maghrib = sunset + 5 minutes (per the mosque sheet), in America/Toronto minutes-of-day. */
function getMaghribMinutes(date) {
  const noonLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const sunset = calculateSunset(noonLocal, MOSQUE_COORDS.lat, MOSQUE_COORDS.lng);
  // Read the sunset instant back out in Toronto's timezone specifically, since the
  // device running this app may be set to any timezone (Maghrib must reflect the
  // mosque's local clock regardless of where the app happens to be opened).
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(sunset);
  const hour = Number(parts.find(p => p.type === 'hour').value) % 24;
  const minute = Number(parts.find(p => p.type === 'minute').value);
  return hour * 60 + minute + 5;
}

function getMaghribTime(date) {
  return minutesToClock(getMaghribMinutes(date));
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
