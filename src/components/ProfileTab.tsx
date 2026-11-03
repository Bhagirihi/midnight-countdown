import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, labelStyle } from '../lib/theme';
import type { Settings } from '../lib/events';
import { Monogram } from './BrandMark';

function identityLabel(authLabel: string) {
  if (!authLabel || authLabel.toUpperCase() === 'GUEST') return 'Guest';
  return authLabel.toLowerCase();
}

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
  const shown = settings.displayName.trim() || 'Guest';
  const who = identityLabel(authLabel);
  const initial = shown.slice(0, 1).toUpperCase();

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>PROFILE</Text>
      <View style={styles.hero}>
        <Monogram letter={initial} size={84} />
        <Text style={styles.name}>{shown}</Text>
        {who.toLowerCase() !== shown.toLowerCase() ? <Text style={styles.meta}>{who}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Your name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="What should we call you?"
          placeholderTextColor={colors.onSurfaceVariant}
        />
        <Pressable style={styles.save} onPress={() => onToggle({ displayName: name.trim() })}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Account</Text>
        <Pressable style={styles.row} onPress={onReplayOnboarding}>
          <Text style={styles.rowText}>Replay the introduction</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
        <View style={styles.hairline} />
        <Pressable style={styles.row} onPress={onSignOut}>
          <Text style={styles.rowText}>Sign out</Text>
          <Text style={styles.chevron}>→</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>This phone</Text>
        <Text style={styles.note}>Erases events, stories, and settings stored here.</Text>
        <Pressable
          onPress={() => Alert.alert('Erase everything?', 'This deletes your events, stories, gift plans, and settings on this phone. It cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Erase', style: 'destructive', onPress: onResetFromZero },
          ])}
          hitSlop={8}
        >
          <Text style={styles.danger}>Erase everything</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 120 },
  kicker: { ...labelStyle, fontSize: 11, letterSpacing: 2.4, color: colors.onSurfaceVariant },
  hero: { alignItems: 'center', marginTop: 28 },
  name: { fontFamily: fonts.grotesk, fontSize: 32, color: colors.onSurface, marginTop: 18 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: 16,
  },
  section: { ...labelStyle, fontSize: 11, letterSpacing: 1.8, color: colors.accent },
  input: {
    fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface,
    paddingVertical: 14,
  },
  save: { alignSelf: 'flex-start', paddingBottom: 14 },
  saveText: { ...labelStyle, fontSize: 12, letterSpacing: 1.6, color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface },
  chevron: { fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurfaceVariant },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  note: { fontFamily: fonts.jakartaMedium, fontSize: 13, lineHeight: 19, color: colors.onSurfaceVariant, marginTop: 10 },
  danger: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.error, marginTop: 14, marginBottom: 4 },
});
