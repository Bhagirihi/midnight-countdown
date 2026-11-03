// Pushes the current widget snapshot into the expo-widgets definitions
// (src/widgets/*.tsx) via updateSnapshot. The widget files call
// createWidget at load time, and that looks up the ExpoWidgets native
// module immediately. Expo Go does not ship that module, so importing
// the files there prints "Cannot find native module 'ExpoWidgets'".
// Check first and skip the imports entirely. A dev build has the
// module, so the snapshots are pushed.
//
// NOTE: the imports below are literal paths on purpose — Metro
// cannot resolve a variable import path, so a loop over path strings
// would silently fail to bundle the widget modules.
import { requireOptionalNativeModule } from 'expo';
import type { WidgetSnapshot } from './events';
import { widgetVariantProps } from './widgets';

const unavailable = 'Widgets need a dev build: expo-widgets is not available in Expo Go, so nothing was pushed.';

export async function syncWidgets(
  snapshot: WidgetSnapshot | null,
): Promise<{ updated: boolean; note: string }> {
  if (!requireOptionalNativeModule('ExpoWidgets')) {
    return { updated: false, note: unavailable };
  }
  try {
    // Widget updateSnapshot is typed per widget's exact props; the
    // props built by widgetVariantProps match each widget, so the cast
    // below only bridges the generic Record type, it does not hide a
    // shape mismatch (the check script asserts each variant's props).
    type Pusher = { updateSnapshot: (p: Record<string, unknown>) => void };
    const small = (await import('../widgets/MidnightSmall')).default as unknown as Pusher;
    small.updateSnapshot(widgetVariantProps(snapshot, 'small'));
    const medium = (await import('../widgets/MidnightMedium')).default as unknown as Pusher;
    medium.updateSnapshot(widgetVariantProps(snapshot, 'medium'));
    const large = (await import('../widgets/MidnightLarge')).default as unknown as Pusher;
    large.updateSnapshot(widgetVariantProps(snapshot, 'large'));
    const list = (await import('../widgets/MidnightNextUp')).default as unknown as Pusher;
    list.updateSnapshot(widgetVariantProps(snapshot, 'list'));
    // Year widgets need no event snapshot — their props are the
    // current date's year progress — but they are pushed here so
    // they refresh whenever the app syncs widgets.
    const yearDots = (await import('../widgets/MidnightYearDots')).default as unknown as Pusher;
    yearDots.updateSnapshot(widgetVariantProps(snapshot, 'yearDots'));
    const yearLock = (await import('../widgets/MidnightYearLock')).default as unknown as Pusher;
    yearLock.updateSnapshot(widgetVariantProps(snapshot, 'yearLock'));
    return { updated: true, note: 'Widget snapshots pushed.' };
  } catch {
    return { updated: false, note: unavailable };
  }
}
