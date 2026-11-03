import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../lib/theme';

// Plain, legible legal text. It states only what is true about this
// build: everything is on-device, there is no server, no account, and
// no data leaves the device. No privacy-policy URL, company address,
// or legal entity is invented — there is none to state.
const TERMS = `Terms of Use — A Day Away

A Day Away is a local countdown tracker. You use it on your
own device, for your own events.

What the app does
• Lets you create countdowns, day-counting events, repeats, milestones,
  story entries, gift plans, and local comments on example recommended
  events.
• Stores everything on your device only, in local app storage.

What the app does not do
• There is no account, no server, and no cloud sync in this build.
  Nothing you enter is uploaded, sold, or shared by the app itself.
• Google and Apple sign-in are not connected. The buttons show an
  honest "not connected yet" message and never create a fake account.
• Recommended Events are seeded examples, not real shared events, and
  their comments never leave your device.
• Group gift planning is a local plan plus a text summary you choose
  to share yourself. It is not a live shared link and it never collects
  money.

Your responsibility
• Photos you pick stay on your device as local file references. If you
  uninstall the app, or the operating system removes those files, the
  app cannot recover them.
• If you share a gift-plan summary or a greeting, you are sharing it
  through the app or service you choose, under that service's terms.

Changes
• If a future build adds accounts, sync, or real social features, these
  terms will be updated in the app before that build asks for anything
  new.`;

const PRIVACY = `Privacy Policy — A Day Away

Short version: this app keeps your data on your device. It does not
send it anywhere, because there is no server to send it to.

What is stored, and where
• Events, story entries, gift plans, widget snapshots, settings, and
  local comments: stored on your device only, in local app storage.
• Your email, if you choose local email sign-in: stored on your device
  only. It is not verified, not synced, and not sent anywhere.
• Photos: stored as references to files on your device. The app does
  not upload, copy to a server, or back up your photos.
• App-lock PIN: if you set one, only a salted hash is stored on your
  device. The PIN itself is not stored in readable form, and there is
  no server that could reset it. If you forget it, signing out clears
  the lock.

Contacts and calendars
• Contacts are read only after you grant permission, and only when you
  open Import. Only the single contact you confirm is copied into an
  event. Contacts are never uploaded, and the app does not import from
  Facebook or from any online contacts service.
• Device calendars are read only after you grant permission, and only
  when you open Calendar Import. Only the single calendar event you
  confirm is copied into a countdown. No calendar data is uploaded.

Permissions the app may request, and why
• Photos: only to let you pick a background or story photo.
• Notifications: only to schedule the reminders you ask for.
• Contacts / calendars: only when you open an import screen.
• Biometrics: only if you turn on app-lock, to unlock the app on this
  device.

What is NOT collected
• No account, no analytics account, no advertising identifier, no
  location, and no payment information is collected by this build.
  There is no third-party tracking in the app.

Questions or deletion
• To delete everything the app holds, delete your events in the app,
  or uninstall the app — local storage is removed with it. There is no
  account to contact, because no account exists in this build.`;

export default function LegalScreen({ kind, onBack }: { kind: 'terms' | 'privacy'; onBack: () => void }) {
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Pressable onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.heading}>{kind === 'terms' ? 'Terms of Use' : 'Privacy Policy'}</Text>
      <Text style={styles.body}>{kind === 'terms' ? TERMS : PRIVACY}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  back: { color: colors.primary, fontFamily: fonts.jakartaBold, fontSize: 15, marginBottom: 12 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface, marginBottom: 12 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, lineHeight: 23 },
});
