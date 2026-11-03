// Small date/format helpers. All "days" are local dates (YYYY-MM-DD) in the user's chosen timezone.

export const GLASS_ML = 250;

export function validTz(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const deviceTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function todayIn(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function hourIn(tz) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
}

export function timeIn(iso, tz) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

const utcFmt = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
const noon = (d) => new Date(d + 'T12:00:00Z');
export const longDate = (d) => utcFmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(noon(d));
export const shortDate = (d) => utcFmt({ day: 'numeric', month: 'long' }).format(noon(d));
export const weekdayShort = (d) => utcFmt({ weekday: 'short' }).format(noon(d));
export const dayOfMonth = (d) => Number(d.slice(8, 10));
export const mondayIndex = (d) => (noon(d).getUTCDay() + 6) % 7; // Mon=0 ... Sun=6

export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const pctOf = (total, goal) => (goal > 0 ? Math.round((total / goal) * 100) : 0);
export const glassesLabel = (ml) => String(Number((ml / GLASS_ML).toFixed(1)));
export const litres = (ml) => String(Number((ml / 1000).toFixed(1)));

export function moodFor(pct) {
  if (pct >= 100) return 'celebrating';
  if (pct >= 75) return 'excited';
  if (pct >= 50) return 'happy';
  if (pct >= 25) return 'waking';
  return 'sleepy';
}

export const sumMl = (logs) => logs.reduce((s, l) => s + l.amount_ml, 0);
