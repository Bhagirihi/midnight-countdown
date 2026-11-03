// Pure date calculations for Midnight Countdown. No UI imports, no
// AsyncStorage, no network — safe to unit-check from plain Node.
// All dates are calendar dates (YYYY-MM-DD) evaluated in local time at
// midnight, so timezones and clock time never shift a D-number by one.
//
// Conventions (documented so the UI never invents a second meaning):
// - D-label for a countdown target T vs today: D-N while N days remain,
//   "D-Day" on the day itself, D+N after it has passed.
// - Count-up: start day is Day 1. Day number = days since start + 1.
//   A "100 days" milestone is start + 100 days (elapsed == 100), and a
//   "1-year" milestone is the next yearly occurrence of the start date.
// - Feb 29 in a non-leap year is observed on Feb 28 (never Mar 1, never
//   skipped). Monthly repeats clamp to the last day of shorter months
//   (e.g. Jan 31 -> Feb 28 in a non-leap year).
// - "Months" breakdowns are calendar months, not 30-day blocks. That is
//   also the only baby-months behaviour offered: full calendar months
//   elapsed / remaining, with no invented developmental logic.

export type Repeat = 'none' | 'monthly' | 'yearly';

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  // month: 1-12
  return new Date(year, month, 0).getDate();
}

export function parseDate(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidDateISO(iso: string): boolean {
  return parseDate(iso) !== null;
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function fromISO(iso: string): Date {
  const p = parseDate(iso);
  if (!p) throw new Error(`Invalid date: ${iso}`);
  return new Date(p.year, p.month - 1, p.day);
}

/** Today in local time, as YYYY-MM-DD. Injectable for tests. */
export function todayISO(now = new Date()): string {
  return toISO(now);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Person-facing date: "Fri 25 Dec", plus the year when it is not this year. */
export function formatHumanDate(iso: string, today = todayISO()): string {
  const p = parseDate(iso);
  if (!p) return iso;
  const weekday = WEEKDAYS[new Date(p.year, p.month - 1, p.day).getDay()];
  const base = `${weekday} ${p.day} ${MONTHS[p.month - 1]}`;
  return p.year === Number(today.slice(0, 4)) ? base : `${base} ${p.year}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Signed whole days from `from` to `to` (to - from). */
export function daysBetween(from: string, to: string): number {
  const a = startOfDay(fromISO(from)).getTime();
  const b = startOfDay(fromISO(to)).getTime();
  return Math.round((b - a) / 86400000);
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Feb 29 -> Feb 28 in a non-leap year. */
export function occurrenceInYear(month: number, day: number, year: number): string {
  if (month === 2 && day === 29 && !isLeapYear(year)) return `${year}-02-28`;
  return toISO(new Date(year, month - 1, day));
}

/** Monthly occurrence, clamped to the last day of shorter months. */
export function occurrenceInMonth(year: number, month: number, day: number): string {
  const clamped = Math.min(day, daysInMonth(year, month));
  return toISO(new Date(year, month - 1, clamped));
}

/**
 * Next occurrence of an event date, on or after `today`.
 * - none: the date itself, even if past (callers decide past display).
 * - yearly: same month/day this year (Feb 29 -> Feb 28), else next year.
 * - monthly: same day-of-month this month (clamped), else next month.
 */
export function nextOccurrence(dateISO: string, repeat: Repeat, today: string): string {
  const p = parseDate(dateISO);
  if (!p) throw new Error(`Invalid date: ${dateISO}`);
  if (repeat === 'none') return dateISO;
  if (repeat === 'yearly') {
    const thisYear = occurrenceInYear(p.month, p.day, fromISO(today).getFullYear());
    if (daysBetween(today, thisYear) >= 0) return thisYear;
    return occurrenceInYear(p.month, p.day, fromISO(today).getFullYear() + 1);
  }
  // monthly
  const t = fromISO(today);
  const thisMonth = occurrenceInMonth(t.getFullYear(), t.getMonth() + 1, p.day);
  if (daysBetween(today, thisMonth) >= 0) return thisMonth;
  const next = new Date(t.getFullYear(), t.getMonth() + 1, 1);
  return occurrenceInMonth(next.getFullYear(), next.getMonth() + 1, p.day);
}

/** D-label for a countdown target. */
export function dLabel(targetISO: string, today: string): string {
  const diff = daysBetween(today, targetISO);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return `D+${Math.abs(diff)}`;
}

/** Day number for a count-up (start day is Day 1). Negative if not started. */
export function countUpDayNumber(startISO: string, today: string): number {
  return daysBetween(startISO, today) + 1;
}

export interface Breakdown {
  /** Signed total days (to - from). */
  days: number;
  /** Whole weeks in |days|, plus leftover days. */
  weeks: number;
  daysAfterWeeks: number;
  /** Full calendar months between from and to (signed), plus leftover days. */
  months: number;
  daysAfterMonths: number;
}

function addMonthsISO(iso: string, n: number): string {
  const p = parseDate(iso)!;
  const total = (p.year * 12 + (p.month - 1)) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return occurrenceInMonth(year, month, p.day);
}

/** Calendar breakdown between two dates (from -> to). */
export function breakdownBetween(from: string, to: string): Breakdown {
  const days = daysBetween(from, to);
  const abs = Math.abs(days);
  const weeks = Math.floor(abs / 7);
  const daysAfterWeeks = abs % 7;
  // Full calendar months: step month-by-month in the direction of travel.
  let months = 0;
  if (days !== 0) {
    const step = days > 0 ? 1 : -1;
    let cursor = from;
    for (;;) {
      const next = addMonthsISO(cursor, step);
      const reached = daysBetween(from, next);
      if ((step > 0 && reached > days) || (step < 0 && reached < days)) break;
      months += step;
      cursor = next;
      if (months > 1200 || months < -1200) break; // safety, ~100 years
    }
    const cursorDate = addMonthsISO(from, months);
    const daysAfterMonths = Math.abs(daysBetween(cursorDate, to));
    return { days, weeks, daysAfterWeeks, months, daysAfterMonths };
  }
  return { days: 0, weeks: 0, daysAfterWeeks: 0, months: 0, daysAfterMonths: 0 };
}

export interface Milestone {
  label: string;
  dateISO: string;
  /** True when the milestone date is today or past. */
  reached: boolean;
  /** Signed days from today to the milestone (negative = past). */
  daysAway: number;
}

/**
 * Milestone markers for an event.
 * - Count-up: every-100-days markers (100, 200, 300, ...) from the start
 *   date, plus yearly anniversaries. Past markers are marked reached and
 *   the next upcoming marker is always included.
 * - Yearly repeat: the next yearly anniversary (1-year, 2-year, ...) is
 *   labelled from the original date.
 * - Single countdown / monthly repeat: no anniversary milestones apply;
 *   returns [] (the countdown itself is the marker).
 */
export function milestones(
  dateISO: string,
  type: 'countdown' | 'countup',
  repeat: Repeat,
  today: string,
): Milestone[] {
  const out: Milestone[] = [];
  const push = (label: string, d: string) => {
    out.push({ label, dateISO: d, reached: daysBetween(today, d) <= 0, daysAway: daysBetween(today, d) });
  };
  if (type === 'countup') {
    // Every-100-days: include all reached ones plus the next one.
    const elapsed = daysBetween(dateISO, today);
    const maxK = Math.max(1, Math.floor(elapsed / 100) + 1);
    for (let k = 1; k <= maxK; k++) {
      push(`${k * 100}-day`, addDays(dateISO, k * 100));
    }
    // Yearly anniversaries: past ones plus the next one.
    const p = parseDate(dateISO)!;
    const thisYear = fromISO(today).getFullYear();
    for (let y = p.year + 1; y <= thisYear + 1; y++) {
      const d = occurrenceInYear(p.month, p.day, y);
      if (daysBetween(today, d) <= 0 || y === thisYear + 1) {
        // Only include the next future anniversary once, plus past ones.
        if (daysBetween(today, d) <= 0) push(`${y - p.year}-year`, d);
        else if (y === thisYear + 1) push(`${y - p.year}-year`, d);
      }
    }
    out.sort((a, b) => daysBetween(a.dateISO, b.dateISO));
    return out;
  }
  if (repeat === 'yearly') {
    const p = parseDate(dateISO)!;
    const next = nextOccurrence(dateISO, 'yearly', today);
    const years = fromISO(next).getFullYear() - p.year;
    if (years > 0) push(`${years}-year`, next);
    return out;
  }
  return out;
}

export interface CountdownInfo {
  /** Date the D-number is measured against (next occurrence for repeats). */
  targetISO: string;
  label: string;
  /** For countdowns: days remaining (negative after passing). For count-ups: days elapsed. */
  daysDiff: number;
  isToday: boolean;
  isPast: boolean;
  breakdown: Breakdown;
  /** Count-up only: Day N (start day = Day 1). */
  dayNumber: number | null;
}

export function countdownInfo(
  dateISO: string,
  type: 'countdown' | 'countup',
  repeat: Repeat,
  today: string,
): CountdownInfo {
  if (type === 'countup') {
    const elapsed = daysBetween(dateISO, today);
    return {
      targetISO: dateISO,
      label: elapsed < 0 ? `Starts in ${Math.abs(elapsed)} days` : `Day ${elapsed + 1}`,
      daysDiff: elapsed,
      isToday: elapsed === 0,
      isPast: false,
      breakdown: breakdownBetween(dateISO, today),
      dayNumber: elapsed >= 0 ? elapsed + 1 : null,
    };
  }
  const target = nextOccurrence(dateISO, repeat, today);
  // For a non-repeating countdown, nextOccurrence is the date itself, so
  // a past event correctly shows D+N rather than rolling forward.
  const diff = daysBetween(today, target);
  return {
    targetISO: target,
    label: dLabel(target, today),
    daysDiff: diff,
    isToday: diff === 0,
    isPast: repeat === 'none' && diff < 0,
    breakdown: breakdownBetween(today, target),
    dayNumber: null,
  };
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/**
 * Milestone banner for yearly events: "Turning 50" for birthdays,
 * "10th Anniversary" for anniversaries, "N-year" otherwise. Returns
 * null for non-yearly events and for a yearly event in its first year
 * (no age/anniversary number exists yet). The number is measured at
 * the NEXT occurrence, so an upcoming birthday shows the age being
 * turned, not the current age.
 */
export function turningInfo(
  dateISO: string,
  category: string,
  repeat: Repeat,
  today: string,
): { label: string; number: number; nextISO: string } | null {
  if (repeat !== 'yearly') return null;
  const p = parseDate(dateISO);
  if (!p) return null;
  const next = nextOccurrence(dateISO, 'yearly', today);
  const number = fromISO(next).getFullYear() - p.year;
  if (number <= 0) return null;
  const cat = category.toLowerCase();
  if (cat === 'birthday') return { label: `Turning ${number}`, number, nextISO: next };
  if (cat === 'anniversary') return { label: `${ordinal(number)} Anniversary`, number, nextISO: next };
  return { label: `${number}-year`, number, nextISO: next };
}

/** Zodiac sign + its date range, from month/day only. Fun, not a claim. */
export function zodiacSign(month: number, day: number): { sign: string; range: string } {
  const table: { sign: string; range: string; sm: number; sd: number; em: number; ed: number }[] = [
    { sign: 'Capricorn', range: 'Dec 22 – Jan 19', sm: 12, sd: 22, em: 1, ed: 19 },
    { sign: 'Aquarius', range: 'Jan 20 – Feb 18', sm: 1, sd: 20, em: 2, ed: 18 },
    { sign: 'Pisces', range: 'Feb 19 – Mar 20', sm: 2, sd: 19, em: 3, ed: 20 },
    { sign: 'Aries', range: 'Mar 21 – Apr 19', sm: 3, sd: 21, em: 4, ed: 19 },
    { sign: 'Taurus', range: 'Apr 20 – May 20', sm: 4, sd: 20, em: 5, ed: 20 },
    { sign: 'Gemini', range: 'May 21 – Jun 20', sm: 5, sd: 21, em: 6, ed: 20 },
    { sign: 'Cancer', range: 'Jun 21 – Jul 22', sm: 6, sd: 21, em: 7, ed: 22 },
    { sign: 'Leo', range: 'Jul 23 – Aug 22', sm: 7, sd: 23, em: 8, ed: 22 },
    { sign: 'Virgo', range: 'Aug 23 – Sep 22', sm: 8, sd: 23, em: 9, ed: 22 },
    { sign: 'Libra', range: 'Sep 23 – Oct 22', sm: 9, sd: 23, em: 10, ed: 22 },
    { sign: 'Scorpio', range: 'Oct 23 – Nov 21', sm: 10, sd: 23, em: 11, ed: 21 },
    { sign: 'Sagittarius', range: 'Nov 22 – Dec 21', sm: 11, sd: 22, em: 12, ed: 21 },
  ];
  for (const t of table) {
    if (t.sm === 12 && t.em === 1) {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: t.sign, range: t.range };
    } else if (
      (month === t.sm && day >= t.sd) ||
      (month === t.em && day <= t.ed)
    ) {
      return { sign: t.sign, range: t.range };
    }
  }
  return { sign: 'Capricorn', range: 'Dec 22 – Jan 19' };
}

/**
 * Wizard Step 3 "Days" mode: "in N days" from today. Returns the computed
 * date, or an error string for non-integer / negative input. Days = 0
 * means today. Month/year rollovers go through addDays, the same code
 * as the rest of the app. Lives here (not in wizard.ts) so the plain
 * Node logic check can import it — wizard.ts only re-exports it.
 */
export function wizardDateFromDays(today: string, daysText: string): { dateISO: string | null; error: string | null } {
  const trimmed = daysText.trim();
  if (!/^\d+$/.test(trimmed)) return { dateISO: null, error: 'Enter a whole number of days (0 or more).' };
  const n = Number(trimmed);
  if (!Number.isSafeInteger(n) || n < 0) return { dateISO: null, error: 'Enter a whole number of days (0 or more).' };
  return { dateISO: addDays(today, n), error: null };
}

/** Wizard Step 3 "Date" mode: same validation as the full editor. */
export function wizardDateFromDate(dateISO: string): { dateISO: string | null; error: string | null } {
  if (!isValidDateISO(dateISO.trim())) return { dateISO: null, error: 'Date must be a real date as YYYY-MM-DD, e.g. 2026-12-25.' };
  return { dateISO: dateISO.trim(), error: null };
}

const BIRTHSTONES = [
  'Garnet', 'Amethyst', 'Aquamarine', 'Diamond', 'Emerald', 'Pearl',
  'Ruby', 'Peridot', 'Sapphire', 'Opal', 'Topaz', 'Turquoise',
] as const;

export function birthstone(month: number): string {
  if (month < 1 || month > 12) return 'Garnet';
  return BIRTHSTONES[month - 1];
}
