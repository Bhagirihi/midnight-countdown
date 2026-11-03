// Multiple Android home-screen widget variants — PURE data, no native
// imports, so this file is safe to import from the app and from tests.
//
// Honesty, stated wherever these variants are shown:
// - These are Android HOME-screen widgets, built with expo-widgets
//   (SDK 58, opt-in `enableAndroid` + `android.package` in app.json).
//   They do NOT run in Expo Go at all — a dev build (prebuild +
//   rebuild) is required before any of them can be added to a home
//   screen, and they cannot be verified from this VM (no device /
//   emulator here).
// - Stock Android has NOT supported third-party LOCK-screen widgets
//   since Android 5. There is deliberately NO Android lock-screen
//   variant here. iOS lock-screen widgets are a WidgetKit concept
//   (accessory families) and are not offered by this Android-first
//   setup; offering one as an "Android lock-screen widget" would be
//   false, so the UI says so plainly instead.
// - Widget code itself lives in src/widgets/*.tsx under the 'widget'
//   directive (isolated runtime: no hooks, no async, no app state).
//   All data a widget shows arrives through its props, which the app
//   pushes with updateSnapshot (see widgetSync.ts). The props below
//   are derived ONLY from the existing widget snapshot
//   (midnight:widgetSnapshot) — no new data is invented for widgets.
//   Exception: the two year variants, whose props are today's date
//   (yearProgress), not event data.

import type { WidgetSnapshot } from './events';

export type WidgetVariant = 'small' | 'medium' | 'large' | 'list' | 'yearDots' | 'yearLock';

/** Days left in the current year, matching the "92 days left" widgets
 *  in the reference screenshots: today still counts as a day left
 *  (daysLeft = total - dayOfYear + 1), days already fully passed are
 *  elapsed = dayOfYear - 1, and percent = round(elapsed / total * 100).
 *  E.g. 1 Oct 2026: dayOfYear 274, total 365, daysLeft 92, 75%. */
export function yearProgress(now = new Date()): {
  year: number; totalDays: number; elapsed: number; daysLeft: number; percent: number;
} {
  const year = now.getFullYear();
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = leap ? 366 : 365;
  const jan1 = new Date(year, 0, 1).getTime();
  const today = new Date(year, now.getMonth(), now.getDate()).getTime();
  const dayOfYear = Math.round((today - jan1) / 86400000) + 1;
  const elapsed = dayOfYear - 1;
  return {
    year,
    totalDays,
    elapsed,
    daysLeft: totalDays - dayOfYear + 1,
    percent: Math.round((elapsed / totalDays) * 100),
  };
}

export interface WidgetVariantMeta {
  id: WidgetVariant;
  /** Name passed to createWidget — must match app.json widgets[].name. */
  widgetName: string;
  title: string;
  /** Android grid cells (targetCellWidth x targetCellHeight). */
  cells: string;
  shows: string;
  androidHowTo: string;
}

export const WIDGET_VARIANTS: WidgetVariantMeta[] = [
  {
    id: 'small',
    widgetName: 'MidnightSmall',
    title: 'Small — 1×1',
    cells: '1×1',
    shows: 'D-number and title.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Small.',
  },
  {
    id: 'medium',
    widgetName: 'MidnightMedium',
    title: 'Medium — 2×1',
    cells: '2×1',
    shows: 'D-number, title, and date.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Medium.',
  },
  {
    id: 'large',
    widgetName: 'MidnightLarge',
    title: 'Large — 2×2',
    cells: '2×2',
    shows: 'Pinned countdown, next milestone, and the next event.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Large.',
  },
  {
    id: 'list',
    widgetName: 'MidnightNextUp',
    title: 'Next up list — 4×2',
    cells: '4×2',
    shows: 'Your next three events.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Next up.',
  },
  {
    id: 'yearDots',
    widgetName: 'MidnightYearDots',
    title: 'Year dots — 2×2',
    cells: '2×2',
    shows: 'Days left in the year, one dot per day.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Year dots.',
  },
  {
    id: 'yearLock',
    widgetName: 'MidnightYearLock',
    title: 'Year left (lock style) — 2×1',
    cells: '2×1',
    shows: 'Days left in the year, with percent done.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Year left.',
  },
];

export function widgetVariantMeta(id: WidgetVariant): WidgetVariantMeta {
  return WIDGET_VARIANTS.find((v) => v.id === id) ?? WIDGET_VARIANTS[1];
}

/** Props pushed to each widget definition: from the snapshot for event widgets, from today's date for the year widgets. */
export function widgetVariantProps(snapshot: WidgetSnapshot | null, variant: WidgetVariant): Record<string, unknown> {
  const pinned = snapshot?.pinned ?? null;
  const upcoming = snapshot?.upcoming ?? [];
  const title = pinned?.title ?? 'No event yet';
  const label = pinned?.label ?? 'Add an event';
  const dateISO = pinned?.dateISO ?? '';
  switch (variant) {
    case 'small':
      return { title, label };
    case 'medium':
      return { title, label, dateISO };
    case 'large': {
      const next = upcoming.find((u) => u.id !== pinned?.id) ?? upcoming[0] ?? null;
      return {
        title,
        label,
        dateISO,
        nextTitle: next ? next.title : '',
        nextLabel: next ? next.label : '',
        // Real snapshot data only: next milestone label and next story
        // date for the pinned event, or '' when there is none.
        milestoneLabel: pinned?.milestoneLabel ?? '',
        storyDateISO: pinned?.storyDateISO ?? '',
      };
    }
    case 'list':
      return {
        items: upcoming.slice(0, 3).map((u) => ({ title: u.title, label: u.label, dateISO: u.dateISO })),
      };
    case 'yearDots':
    case 'yearLock':
      // Date-derived, not snapshot-derived: the year count is correct
      // even with no events at all. It refreshes whenever the app
      // pushes a snapshot (opening the app / pinning an event) —
      // widgets do not re-compute on their own at midnight.
      return { ...yearProgress() };
  }
}
