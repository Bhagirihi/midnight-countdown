// Settings — card views on the Settings tab itself, no sub-screens
// to tap through. Each card holds one thing, fully visible:
// Subscription, Notifications, App Lock & PIN, Discover.
// Removed at the user's ask: the "What is NOT real yet" list (was in
// Discover) and all Privacy & Policy text / Terms / Privacy rows —
// App Lock & PIN now lives in one single card, not a Privacy section.
// Subscription pricing is still DESIGN PREVIEW ONLY: no purchase, no
// RevenueCat, no store product — Upgrade/Restore only show a preview
// alert and never charge or change the plan.
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
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
  const [region, setRegion] = useState<'india' | 'global'>('india');
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const savePin = () => {
    if (!/^\d{4,6}$/.test(pin)) { setPinMsg('PIN must be 4–6 digits.'); return; }
    if (pin !== pinConfirm) { setPinMsg('PINs do not match.'); return; }
    onToggle({ appLockPinHash: hashPin(pin), appLockEnabled: true });
    setPin(''); setPinConfirm('');
    setPinMsg('App-lock is on. Unlock with biometrics (if enrolled) or this PIN next time the app opens.');
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.meta}>{authLabel}</Text>

      {/* Subscription card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscription</Text>
        <Text style={styles.body}>Current plan: Free — no purchase, no payment method, no expiry.</Text>
        <View style={styles.regionRow}>
          <Pressable style={[styles.regionBtn, region === 'india' && styles.regionBtnOn]} onPress={() => setRegion('india')}>
            <Text style={[styles.regionText, region === 'india' && styles.regionTextOn]}>India (₹)</Text>
          </Pressable>
          <Pressable style={[styles.regionBtn, region === 'global' && styles.regionBtnOn]} onPress={() => setRegion('global')}>
            <Text style={[styles.regionText, region === 'global' && styles.regionTextOn]}>Global ($)</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.planRow, plan === 'monthly' && styles.planRowOn]} onPress={() => setPlan('monthly')}>
          <Text style={styles.planTitle}>Pro Monthly</Text>
          <Text style={styles.planPrice}>{region === 'india' ? '₹49' : '$1.49'} / month</Text>
        </Pressable>
        <Pressable style={[styles.planRow, plan === 'yearly' && styles.planRowOn]} onPress={() => setPlan('yearly')}>
          <Text style={styles.planTitle}>Pro Yearly — Best value</Text>
          <Text style={styles.planPrice}>{region === 'india' ? '₹399' : '$11.99'} / year</Text>
        </Pressable>
        <Text style={styles.hint}>
          {region === 'india' ? 'Yearly = ₹33 / month, saves 32% vs monthly. ' : 'Yearly = $1.00 / month, saves 33% vs monthly. '}
          Pro includes unlimited events, all widgets, all themes &amp; fonts, Story, gift planning, and contact &amp; calendar import.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => Alert.alert('Design preview', `Pro ${plan === 'monthly' ? 'Monthly' : 'Yearly'} purchase is not configured yet. This is only a design preview — no charge will be made and your plan stays Free.`)}>
          <Text style={styles.primaryBtnText}>Upgrade to Pro {plan === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => Alert.alert('Design preview', 'Restore purchase is not configured yet. Your plan stays Free.')}>
          <Text style={styles.secondaryText}>Restore purchase</Text>
        </Pressable>
        <Text style={styles.hint}>Design preview only — prices are a recommendation, not store prices yet.</Text>
      </View>

      {/* Notifications card — just the two names + toggle switches */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Smart reminder</Text>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={(v) => onToggle({ remindersEnabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.onSurface}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Milestone notification</Text>
          <Switch
            value={settings.milestoneNotifications}
            onValueChange={(v) => onToggle({ milestoneNotifications: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.onSurface}
          />
        </View>
      </View>

      {/* App Lock & PIN — one single card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App Lock &amp; PIN</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>App Lock</Text>
          <Switch
            value={settings.appLockEnabled}
            onValueChange={(v) => onToggle({ appLockEnabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.onSurface}
          />
        </View>
        <Text style={styles.hint}>{settings.appLockPinHash ? 'PIN set.' : 'No PIN set.'} Forgotten PIN? Sign out to clear the lock.</Text>
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
      </View>

      {/* Discover card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Discover</Text>
        {onOpenSocial ? (
          <Pressable style={styles.secondaryBtn} onPress={onOpenSocial}>
            <Text style={styles.secondaryText}>Recommended Events →</Text>
          </Pressable>
        ) : null}
        {onOpenWidgets ? (
          <Pressable style={styles.secondaryBtn} onPress={onOpenWidgets}>
            <Text style={styles.secondaryText}>Widgets →</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginTop: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontFamily: fonts.grotesk, fontSize: 20, color: colors.onSurface },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 21 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 14 },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  toggleLabel: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface },
  regionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  regionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, alignItems: 'center' },
  regionBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  regionText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 14 },
  regionTextOn: { color: colors.background, fontFamily: fonts.jakartaBold },
  planRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, marginTop: 10 },
  planRowOn: { borderColor: colors.primary, borderWidth: 2 },
  planTitle: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 15 },
  planPrice: { color: colors.onSurface, fontFamily: fonts.grotesk, fontSize: 20, marginTop: 2 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
});
