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

import type { WidgetSnapshot } from './events';

export type WidgetVariant = 'small' | 'medium' | 'large' | 'list';

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
    shows: 'Big D-number + event title for the pinned event.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Small.',
  },
  {
    id: 'medium',
    widgetName: 'MidnightMedium',
    title: 'Medium — 2×1',
    cells: '2×1',
    shows: 'D-number + title + next date for the pinned event.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Medium.',
  },
  {
    id: 'large',
    widgetName: 'MidnightLarge',
    title: 'Large — 2×2',
    cells: '2×2',
    shows: 'Pinned event (D-number + title + date), its next milestone and next story date when they exist, plus the next upcoming event.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Large.',
  },
  {
    id: 'list',
    widgetName: 'MidnightNextUp',
    title: 'Next up list — 4×2',
    cells: '4×2',
    shows: 'The next 3 upcoming events, each with its D-number.',
    androidHowTo: 'Long-press your home screen → Widgets → A Day Away → Next up.',
  },
];

export function widgetVariantMeta(id: WidgetVariant): WidgetVariantMeta {
  return WIDGET_VARIANTS.find((v) => v.id === id) ?? WIDGET_VARIANTS[1];
}

/** Props pushed to each widget definition, from the snapshot only. */
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
  }
}
