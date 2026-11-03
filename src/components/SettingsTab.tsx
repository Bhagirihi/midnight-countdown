import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, fonts, labelStyle } from '../lib/theme';
import type { Settings } from '../lib/events';
import { hashPin } from '../lib/applock';

export default function SettingsTab({
  settings, authLabel, onToggle, onOpenSocial, onOpenWidgets,
}: {
  settings: Settings;
  authLabel: string;
  onToggle: (patch: Partial<Settings>) => void;
  onOpenSocial?: () => void;
  onOpenWidgets?: () => void;
}) {
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const who = !authLabel || authLabel.toUpperCase() === 'GUEST' ? 'Guest' : authLabel.toLowerCase();

  const savePin = () => {
    if (!/^\d{4,6}$/.test(pin)) { setPinMsg('Use 4 to 6 digits.'); return; }
    if (pin !== pinConfirm) { setPinMsg('Those PINs do not match.'); return; }
    onToggle({ appLockPinHash: hashPin(pin), appLockEnabled: true });
    setPin(''); setPinConfirm('');
    setPinMsg('Lock is on. It asks again the next time you open the app.');
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>SETTINGS</Text>
      <Text style={styles.heading}>Preferences</Text>
      <Text style={styles.meta}>{who}</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Reminders</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleLabel}>The week before</Text>
            <Text style={styles.toggleHint}>Seven days, three days, the day before, and the day.</Text>
          </View>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={(v) => onToggle({ remindersEnabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.onSurface}
          />
        </View>
        <View style={styles.hairline} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleLabel}>Milestones</Text>
            <Text style={styles.toggleHint}>A note when a hundred days or a year arrives.</Text>
          </View>
          <Switch
            value={settings.milestoneNotifications}
            onValueChange={(v) => onToggle({ milestoneNotifications: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.onSurface}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Lock</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleLabel}>Ask to unlock</Text>
            <Text style={styles.toggleHint}>{settings.appLockPinHash ? 'A PIN is set.' : 'No PIN yet.'}</Text>
          </View>
          <Switch
            value={settings.appLockEnabled}
            onValueChange={(v) => onToggle({ appLockEnabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.onSurface}
          />
        </View>
        <View style={styles.hairline} />
        <TextInput style={styles.input} value={pin} onChangeText={setPin} placeholder="New PIN" placeholderTextColor={colors.onSurfaceVariant} keyboardType="number-pad" secureTextEntry />
        <View style={styles.hairline} />
        <TextInput style={styles.input} value={pinConfirm} onChangeText={setPinConfirm} placeholder="Confirm PIN" placeholderTextColor={colors.onSurfaceVariant} keyboardType="number-pad" secureTextEntry />
        <Pressable style={styles.save} onPress={savePin}>
          <Text style={styles.saveText}>Save PIN</Text>
        </Pressable>
        {settings.appLockPinHash || settings.appLockEnabled ? (
          <>
            <View style={styles.hairline} />
            <Pressable style={styles.row} onPress={() => { onToggle({ appLockEnabled: false, appLockPinHash: null }); setPinMsg('Lock cleared.'); }}>
              <Text style={styles.rowText}>Clear lock</Text>
            </Pressable>
          </>
        ) : null}
        <Text style={styles.note}>{pinMsg || 'A forgotten PIN is cleared by signing out.'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Library</Text>
        {onOpenSocial ? (
          <Pressable style={styles.row} onPress={onOpenSocial}>
            <Text style={styles.rowText}>Templates</Text>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        ) : null}
        {onOpenSocial && onOpenWidgets ? <View style={styles.hairline} /> : null}
        {onOpenWidgets ? (
          <Pressable style={styles.row} onPress={onOpenWidgets}>
            <Text style={styles.rowText}>Widgets</Text>
            <Text style={styles.chevron}>→</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 120 },
  kicker: { ...labelStyle, fontSize: 11, letterSpacing: 2.4, color: colors.onSurfaceVariant },
  heading: { fontFamily: fonts.grotesk, fontSize: 34, color: colors.onSurface, marginTop: 8 },
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  toggleCopy: { flex: 1 },
  toggleLabel: { fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface },
  toggleHint: { fontFamily: fonts.jakartaMedium, fontSize: 13, lineHeight: 18, color: colors.onSurfaceVariant, marginTop: 3 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  input: {
    fontFamily: fonts.mono, fontSize: 16, letterSpacing: 4, color: colors.onSurface,
    paddingVertical: 14,
  },
  save: { paddingVertical: 14 },
  saveText: { ...labelStyle, fontSize: 12, letterSpacing: 1.6, color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface },
  chevron: { fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurfaceVariant },
  note: { fontFamily: fonts.jakartaMedium, fontSize: 13, lineHeight: 18, color: colors.onSurfaceVariant, marginTop: 10 },
});
