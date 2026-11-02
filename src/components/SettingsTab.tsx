import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import type { Settings } from '../lib/events';
import { hashPin } from '../lib/applock';
import LegalScreen from './LegalScreen';

// Profile & Settings, grouped — not a flat toggle list. Display name is
// local only; the email shown here is read-only because local-email
// sign-in stores an address on this device, with no server account to
// change it on. There is no account password in this app, so there is
// deliberately no Forgot Password flow — the Privacy & Security group
// offers the device app-lock instead (see LockScreen for its limits).
export default function SettingsTab({
  settings, authLabel, onToggle, onReplayOnboarding, onSignOut, onOpenSocial, onOpenWidgets,
}: {
  settings: Settings;
  authLabel: string;
  onToggle: (patch: Partial<Settings>) => void;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
  /** Discover sections live here now that the bottom tab bar is only
   *  Home + Profile — Social and Widgets were relocated, not removed. */
  onOpenSocial?: () => void;
  onOpenWidgets?: () => void;
}) {
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [name, setName] = useState(settings.displayName);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  if (legal) {
    return <LegalScreen kind={legal} onBack={() => setLegal(null)} />;
  }

  const savePin = () => {
    if (!/^\d{4,6}$/.test(pin)) { setPinMsg('PIN must be 4–6 digits.'); return; }
    if (pin !== pinConfirm) { setPinMsg('PINs do not match.'); return; }
    onToggle({ appLockPinHash: hashPin(pin), appLockEnabled: true });
    setPin(''); setPinConfirm('');
    setPinMsg('App-lock is on. Unlock with biometrics (if enrolled) or this PIN next time the app opens.');
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.heading}>Profile &amp; Settings</Text>

      <Text style={styles.group}>Profile</Text>
      <Text style={styles.meta}>Signed in as: {authLabel} (local only — no server account)</Text>
      <Text style={styles.label}>Display name (local only)</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Dhruv"
        placeholderTextColor={colors.onSurfaceVariant}
      />
      <Pressable style={styles.secondaryBtn} onPress={() => onToggle({ displayName: name.trim() })}>
        <Text style={styles.secondaryText}>Save display name</Text>
      </Pressable>

      <Text style={styles.group}>Discover</Text>
      <Text style={styles.body}>
        Recommended Events and Widgets used to be bottom tabs. They now
        live here so the tab bar stays to Home + Profile.
      </Text>
      {onOpenSocial ? (
        <Pressable style={styles.row} onPress={onOpenSocial}>
          <Text style={styles.rowText}>Recommended Events → (local demo, no server)</Text>
        </Pressable>
      ) : null}
      {onOpenWidgets ? (
        <Pressable style={styles.row} onPress={onOpenWidgets}>
          <Text style={styles.rowText}>Widgets → (Android home-screen, dev build required)</Text>
        </Pressable>
      ) : null}

      <Text style={styles.group}>Notifications</Text>
      <Pressable style={styles.row} onPress={() => onToggle({ remindersEnabled: !settings.remindersEnabled })}>
        <Text style={styles.rowText}>Smart reminders (D-7 / D-3 / D-1 / day-of): {settings.remindersEnabled ? 'ON' : 'OFF'}</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => onToggle({ milestoneNotifications: !settings.milestoneNotifications })}>
        <Text style={styles.rowText}>Milestone notifications (100-day / yearly for count-ups): {settings.milestoneNotifications ? 'ON' : 'OFF'}</Text>
      </Pressable>
      <Text style={styles.hint}>
        Reminder delivery needs a dev build. In Expo Go, scheduling may
        report success but notifications may not actually fire. Permission
        is requested only when you tap “Schedule” on an event.
      </Text>

      <Text style={styles.group}>Privacy &amp; Security</Text>
      <Text style={styles.body}>
        There is no account password in this app, so there is no Forgot
        Password flow to offer — inventing one would be fake. App-lock
        below is a device-local screen using the OS biometric prompt
        (with device PIN as its fallback) and/or an app PIN whose salted
        hash is stored on this device only. Forgetting the app PIN has
        no server reset: sign out to clear the lock.
      </Text>
      <Pressable style={styles.row} onPress={() => onToggle({ appLockEnabled: !settings.appLockEnabled })}>
        <Text style={styles.rowText}>App-lock on app open: {settings.appLockEnabled ? 'ON' : 'OFF'}{settings.appLockPinHash ? ' · PIN set' : ' · no PIN set (biometrics only)'}</Text>
      </Pressable>
      <Text style={styles.label}>Set / change app PIN (4–6 digits)</Text>
      <TextInput style={styles.input} value={pin} onChangeText={setPin} placeholder="New PIN" placeholderTextColor={colors.onSurfaceVariant} keyboardType="number-pad" secureTextEntry />
      <TextInput style={styles.input} value={pinConfirm} onChangeText={setPinConfirm} placeholder="Confirm PIN" placeholderTextColor={colors.onSurfaceVariant} keyboardType="number-pad" secureTextEntry />
      <Pressable style={styles.secondaryBtn} onPress={savePin}>
        <Text style={styles.secondaryText}>Save PIN &amp; turn app-lock on</Text>
      </Pressable>
      {settings.appLockPinHash || settings.appLockEnabled ? (
        <Pressable style={styles.secondaryBtn} onPress={() => { onToggle({ appLockEnabled: false, appLockPinHash: null }); setPinMsg('App-lock and PIN cleared.'); }}>
          <Text style={styles.secondaryText}>Clear app-lock &amp; PIN</Text>
        </Pressable>
      ) : null}
      {pinMsg ? <Text style={styles.hint}>{pinMsg}</Text> : null}
      <Pressable style={styles.row} onPress={() => setLegal('terms')}>
        <Text style={styles.rowText}>Terms of Use →</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => setLegal('privacy')}>
        <Text style={styles.rowText}>Privacy Policy →</Text>
      </Pressable>

      <Text style={styles.group}>About</Text>
      <Pressable style={styles.secondaryBtn} onPress={onReplayOnboarding}>
        <Text style={styles.secondaryText}>Replay onboarding</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onSignOut}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </Pressable>

      <Text style={styles.group}>What is NOT real yet</Text>
      <Text style={styles.body}>
        • Social: no server, no real users — comments are local only.{"\n"}
        • Widgets: no working home-screen widget in Expo Go, and no Android lock-screen widget exists on stock Android — see Profile &gt; Discover &gt; Widgets for the snapshot a dev build would use.{"\n"}
        • Photos: picked URIs live on this device only and may not survive reinstall.{"\n"}
        • Sync: none. Everything is AsyncStorage on this device; there is no cloud backup.{"\n"}
        • No server auth or Forgot Password, no Facebook/Google Contacts import, no live group-gift link or payments.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  group: { fontFamily: fonts.grotesk, fontSize: 20, color: colors.onSurface, marginTop: 24, marginBottom: 4 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 21 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 8 },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, lineHeight: 21 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
});
