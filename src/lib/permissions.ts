// Native permission requests — LAZY imports only, mirroring
// reminders.ts. The rule: a native permission is asked ONLY where a
// feature actually needs it, and tapping the button opens the phone's
// own system dialog (requestPermissionsAsync), never a fake in-app
// toggle. Notifications are the only permission this app asks for:
// in the wizard (Step 4) and again just-in-time when reminders are
// scheduled (reminders.ts). Contacts, calendar and photos are likewise
// asked just-in-time at their own use points (contacts.ts,
// calendarImport.ts, photos.ts) — never upfront.
// Location is deliberately NOT asked anywhere: nothing in this app
// reads, stores, or uses device location, so requesting it would ask
// the user for something no feature needs. Do not add a location
// request without a feature that actually uses it, and update the
// wizard copy if you do.
// The function returns a short status string and never throws: denial
// and unavailability are reported, never hidden, and a denial NEVER
// blocks the wizard (Step 4 is skippable by design). Note on Expo Go:
// the dialog there belongs to the Expo Go host app, so on a phone
// where Expo Go already has the permission you may see no fresh
// dialog — in the app's own dev/production build the dialog is the
// app's own and always appears on first ask.
export async function requestNotificationPermission(): Promise<string> {
  try {
    const Notifications = await import('expo-notifications');
    const perm = await Notifications.requestPermissionsAsync();
    return perm.status === 'granted'
      ? 'Notifications allowed — D-7 / D-3 / D-1 reminders can be scheduled.'
      : 'Notifications not allowed — reminders will not fire, but you can still use the app.';
  } catch {
    return 'Notifications are unavailable here (Expo Go). A dev build is needed for scheduled reminders.';
  }
}
