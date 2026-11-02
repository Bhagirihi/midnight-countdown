// Wizard Step 4 permission requests — LAZY imports only, mirroring
// reminders.ts. Each function returns a short status string and never
// throws: denial, unavailability, and Expo Go limitations are reported,
// never hidden, and a denial NEVER blocks the wizard (Step 4 is
// skippable by design).
//
// Location honesty (load-bearing): requesting the permission does NOT
// mean location powers any feature. Nothing in this app reads, stores,
// or uses the device location for tracking, timings, or widgets. The
// wizard asks only so the preference is recorded for possible future
// use, and the UI says exactly that. Do not wire this permission into
// any feature without updating that copy first.
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

export async function requestLocationPermission(): Promise<string> {
  try {
    const Location = await import('expo-location');
    const perm = await Location.requestForegroundPermissionsAsync();
    return perm.status === 'granted'
      ? 'Location allowed. Note: location is not currently used by any feature — this only records the preference for possible future use.'
      : 'Location not allowed — fine, nothing in the app needs it right now.';
  } catch {
    return 'Location permission is unavailable here. Nothing in the app needs it right now.';
  }
}
