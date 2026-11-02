// Device-calendar import — the device's own calendars only (expo-calendar).
// This is NOT Google Calendar sync and NOT Facebook: there is no server,
// no account, and nothing is uploaded. Events are read with permission,
// shown one at a time, and only copied into a local countdown when the
// user confirms that specific event. Lazily imported.
export interface ImportedCalendarEvent {
  title: string;
  dateISO: string; // YYYY-MM-DD in local time
}

export type CalendarPermission = 'granted' | 'denied' | 'unavailable';

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Reads events from the next 12 months on all device calendars. */
export async function loadDeviceCalendarEvents(): Promise<{
  permission: CalendarPermission;
  events: ImportedCalendarEvent[];
  error?: string;
}> {
  try {
    const mod = await import('expo-calendar');
    const Cal = (mod as unknown as { default?: Record<string, unknown> }).default ?? (mod as Record<string, unknown>);
    const request = Cal.requestCalendarPermissions as ((writeOnly?: boolean) => Promise<{ status?: string; granted?: boolean }>) | undefined;
    const perm = await request?.(false);
    const granted = perm?.status === 'granted' || perm?.granted === true;
    if (!granted) return { permission: 'denied', events: [] };
    const getCalendars = Cal.getCalendars as ((type?: unknown) => Promise<{ id: string }[]>) | undefined;
    const listEvents = Cal.listEvents as ((ids: string[], start: Date, end: Date) => Promise<{ title?: string; startDate?: string | Date }[]>) | undefined;
    if (!getCalendars || !listEvents) {
      return { permission: 'unavailable', events: [], error: 'This device does not expose the device-calendar API.' };
    }
    const calendars = await getCalendars();
    const ids = calendars.map((c) => c.id);
    if (ids.length === 0) return { permission: 'granted', events: [] };
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    const raw = await listEvents(ids, start, end);
    const seen = new Set<string>();
    const out: ImportedCalendarEvent[] = [];
    for (const ev of raw) {
      const title = (ev.title ?? '').trim();
      if (!title) continue;
      const d = ev.startDate instanceof Date ? ev.startDate : new Date(ev.startDate ?? '');
      if (Number.isNaN(d.getTime())) continue;
      const dateISO = toLocalISO(d);
      const key = `${title.toLowerCase()}|${dateISO}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ title, dateISO });
    }
    out.sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));
    return { permission: 'granted', events: out };
  } catch (e) {
    return { permission: 'unavailable', events: [], error: e instanceof Error ? e.message : 'Could not read device calendars.' };
  }
}
