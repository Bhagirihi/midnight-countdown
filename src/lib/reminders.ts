// Smart reminders via expo-notifications, LAZY import ONLY.
// EventCount lesson: a top-level `import * as Notifications from
// 'expo-notifications'` crashes Expo Go at import time. Nothing in this
// file is imported statically by any screen; screens call these
// functions, which dynamic-import the module inside try/catch.
// In Expo Go, scheduled notifications may not fire at all — the UI says
// so and a dev build is required for real delivery. Nothing here claims
// a notification was delivered; it only reports what was scheduled.
import type { CountdownEvent } from './events';
import { addDays, nextOccurrence } from './dates';

export interface ScheduleResult {
  scheduled: number;
  note: string;
}

const DEFAULT_OFFSETS = [7, 3, 1, 0]; // D-7, D-3, D-1, day-of

/** Schedules D-7 / D-3 / D-1 / day-of at 09:00 local for the event's
 *  next occurrence (repeats use their next occurrence; count-ups use
 *  their next 100-day / yearly milestone when milestone mode is on,
 *  otherwise their start date is not a reminder target and 0 is returned). */
export async function scheduleReminders(
  event: CountdownEvent,
  today: string,
  milestoneMode: boolean,
): Promise<ScheduleResult> {
  if (event.type === 'countup' && !milestoneMode) {
    return { scheduled: 0, note: 'Count-up events only get reminders when milestone notifications are on (Settings).' };
  }
  let target = event.dateISO;
  if (event.type === 'countdown') {
    target = nextOccurrence(event.dateISO, event.repeat, today);
  } else {
    // Next milestone: next 100-day step, or the next yearly occurrence,
    // whichever comes first.
    const { milestones } = await import('./dates');
    const upcoming = milestones(event.dateISO, 'countup', event.repeat, today).find((m) => m.daysAway >= 0);
    if (!upcoming) return { scheduled: 0, note: 'No upcoming milestone found.' };
    target = upcoming.dateISO;
  }
  try {
    const Notifications = await import('expo-notifications');
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch { /* handler already set */ }
    const perm = await Notifications.requestPermissionsAsync();
    if (perm.status !== 'granted') {
      return { scheduled: 0, note: 'Notification permission not granted — nothing was scheduled.' };
    }
    let scheduled = 0;
    for (const offset of DEFAULT_OFFSETS) {
      const fireDate = addDays(target, -offset);
      // Only schedule future firings (today at 09:00 counts if still future
      // is unknowable without clock time, so same-day is scheduled and the
      // OS delivers it if the time has not passed).
      const d = new Date(fireDate + 'T09:00:00');
      if (d.getTime() < Date.now() - 86400000) continue;
      const label = offset === 0 ? 'today!' : `in ${offset} day${offset === 1 ? '' : 's'} (D-${offset})`;
      const id = `midnight-${event.id}-${offset}`;
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: { title: event.title, body: `${event.title} is ${label}` },
          trigger: { type: 'date', date: d } as never,
        });
        scheduled++;
      } catch { /* one failed offset must not kill the rest */ }
    }
    if (scheduled === 0) {
      return { scheduled: 0, note: 'No future reminder dates — the event date has already passed.' };
    }
    return { scheduled, note: `Reminders set for ${target}: a week before, 3 days before, the day before, and on the day.` };
  } catch {
    return { scheduled: 0, note: 'Reminders could not be scheduled on this device.' };
  }
}

/** Fires ONE immediate local notification the moment an event is added
 *  (confirmation + a reminder that D-7/D-3/D-1/day-of are scheduled).
 *  Best-effort only: if permission is denied or notifications are
 *  unavailable (Expo Go), it silently does nothing and never blocks
 *  saving the event. The caller still schedules the future reminders
 *  separately via scheduleReminders(). */
export async function sendImmediateNotification(
  title: string,
  body: string,
): Promise<boolean> {
  try {
    const Notifications = await import('expo-notifications');
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch { /* handler already set */ }
    const perm = await Notifications.requestPermissionsAsync();
    if (perm.status !== 'granted') return false;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    } as never);
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminders(eventId: string): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    for (const offset of DEFAULT_OFFSETS) {
      try {
        await Notifications.cancelScheduledNotificationAsync(`midnight-${eventId}-${offset}`);
      } catch { /* already gone */ }
    }
  } catch { /* notifications unavailable — nothing to cancel */ }
}
