// Profile — redesigned to be ONLY profile. All the extra things
// (Subscription, Notifications & Privacy, Discover) moved to the
// Settings footer tab, so this screen is just who you are + account
// actions. Display name is local only; there is no server account.
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import type { Settings } from '../lib/events';

export default function ProfileTab({
  settings, authLabel, onToggle, onReplayOnboarding, onSignOut, onResetFromZero,
}: {
  settings: Settings;
  authLabel: string;
  onToggle: (patch: Partial<Settings>) => void;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
  onResetFromZero: () => void;
}) {
  const [name, setName] = useState(settings.displayName);
  const initial = (settings.displayName.trim() || 'G').slice(0, 1).toUpperCase();

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{settings.displayName || 'Guest'}</Text>
        <Text style={styles.meta}>{authLabel} · local only — no server account</Text>
      </View>

      <Text style={styles.label}>Display name (local only)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Dhruv" placeholderTextColor={colors.onSurfaceVariant} />
      <Pressable style={styles.secondaryBtn} onPress={() => onToggle({ displayName: name.trim() })}>
        <Text style={styles.secondaryText}>Save display name</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={onReplayOnboarding}>
        <Text style={styles.secondaryText}>Replay onboarding</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onSignOut}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </Pressable>

      <Text style={styles.subGroup}>Start from zero</Text>
      <Text style={styles.body}>Deletes everything this app stored on this device and takes you back to onboarding, as if you just installed it. There is no cloud backup, so this cannot be undone.</Text>
      <Pressable style={styles.dangerBtn} onPress={() => Alert.alert('Start from zero?', 'This deletes all your events, stories, gift plans and settings on this device. It cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: onResetFromZero },
      ])}>
        <Text style={styles.dangerText}>Start from zero</Text>
      </Pressable>

      <Text style={styles.hint}>Everything else — Subscription, Notifications &amp; Privacy, Discover — lives in the Settings tab at the bottom.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginTop: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.grotesk, fontSize: 36, color: colors.background },
  name: { fontFamily: fonts.grotesk, fontSize: 22, color: colors.onSurface, marginTop: 12 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center', lineHeight: 18 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 20 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 8 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 21 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 16, lineHeight: 18, textAlign: 'center' },
  subGroup: { fontFamily: fonts.grotesk, fontSize: 18, color: colors.onSurface, marginTop: 24, marginBottom: 2 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  dangerBtn: { borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  dangerText: { color: '#EF4444', fontFamily: fonts.jakartaBold, fontSize: 14 },
});
