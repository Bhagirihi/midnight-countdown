// Profile & Settings — a MENU of exactly 4 steps, not one long
// scroll and not 8 rows. Step 1 Account (profile + sign-out +
// replay + start-from-zero), Step 2 Subscription, Step 3
// Notifications & Privacy, Step 4 Discover (incl. the honesty list).
// Tapping a row opens only that step, with a Back button. Nothing
// was removed — every control still exists, grouped, one tap deeper.
// Display name is local only; there is no account password, so there
// is deliberately no Forgot Password flow (app-lock instead).
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../lib/theme';
import type { Settings } from '../lib/events';
import { hashPin } from '../lib/applock';
import LegalScreen from './LegalScreen';

type Section = 'account' | 'subscription' | 'notifprivacy' | 'discover';

function MenuRow({ icon, title, sub, danger, onPress }: {
  icon: string; title: string; sub: string; danger?: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as never} size={20} color={danger ? '#EF4444' : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View>
      <Pressable onPress={onBack} hitSlop={8}>
        <Text style={styles.back}>‹ Back to Profile</Text>
      </Pressable>
      <Text style={styles.heading}>{title}</Text>
    </View>
  );
}

export default function SettingsTab({
  settings, authLabel, onToggle, onReplayOnboarding, onSignOut, onResetFromZero, onOpenSocial, onOpenWidgets,
}: {
  settings: Settings;
  authLabel: string;
  onToggle: (patch: Partial<Settings>) => void;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
  onResetFromZero: () => void;
  onOpenSocial?: () => void;
  onOpenWidgets?: () => void;
}) {
  const [section, setSection] = useState<Section | null>(null);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [name, setName] = useState(settings.displayName);
  // Subscription pricing — DESIGN PREVIEW ONLY. No purchase, no
  // RevenueCat, no store product is wired up, so Upgrade/Restore
  // only show a preview alert and never charge or change the plan.
  // India ₹49/mo, ₹399/yr; Global $1.49/mo, $11.99/yr — yearly saves
  // about a third versus paying monthly in both regions.
  const [region, setRegion] = useState<'india' | 'global'>('india');
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  // Legal screens keep the section underneath, so Back from Terms /
  // Privacy returns to Privacy & Security, not to the menu.
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

  const back = () => setSection(null);
  const shell = (children: ReactNode) => (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>{children}</ScrollView>
  );

  if (section === 'account') {
    return shell(<>
      <SubHeader title="Step 1 · Account" onBack={back} />
      <Text style={styles.meta}>Signed in as: {authLabel} (local only — no server account)</Text>
      <Text style={styles.label}>Display name (local only)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Dhruv" placeholderTextColor={colors.onSurfaceVariant} />
      <Pressable style={styles.secondaryBtn} onPress={() => onToggle({ displayName: name.trim() })}>
        <Text style={styles.secondaryText}>Save display name</Text>
      </Pressable>
      <Text style={styles.subGroup}>About this app</Text>
      <Pressable style={styles.secondaryBtn} onPress={onReplayOnboarding}>
        <Text style={styles.secondaryText}>Replay onboarding</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onSignOut}>
        <Text style={styles.secondaryText}>Sign out</Text>
      </Pressable>
      <Text style={styles.subGroup}>Start from zero</Text>
      <Text style={styles.body}>Deletes everything this app stored on this device — all events, stories, gift plans, comments, settings, widget pin, display name and app-lock — and takes you back to onboarding, as if you just installed it. There is no cloud backup, so this cannot be undone.</Text>
      <Pressable style={styles.dangerBtn} onPress={() => Alert.alert('Start from zero?', 'This deletes all your events, stories, gift plans and settings on this device. It cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: onResetFromZero },
      ])}>
        <Text style={styles.dangerText}>Start from zero</Text>
      </Pressable>
    </>);
  }

  if (section === 'subscription') {
    return shell(<>
      <SubHeader title="Step 2 · Subscription" onBack={back} />
      <Text style={styles.body}>Current plan: Free — no purchase, no payment method, no expiry. Everything in this app is included right now.</Text>
      <Text style={styles.hint}>Pro pricing — design preview only. No charge is made.</Text>
      <View style={styles.regionRow}>
        <Pressable style={[styles.regionBtn, region === 'india' && styles.regionBtnOn]} onPress={() => setRegion('india')}>
          <Text style={[styles.regionText, region === 'india' && styles.regionTextOn]}>India (₹)</Text>
        </Pressable>
        <Pressable style={[styles.regionBtn, region === 'global' && styles.regionBtnOn]} onPress={() => setRegion('global')}>
          <Text style={[styles.regionText, region === 'global' && styles.regionTextOn]}>Global ($)</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.planCard, plan === 'monthly' && styles.planCardOn]} onPress={() => setPlan('monthly')}>
        <Text style={styles.planTitle}>Pro Monthly</Text>
        <Text style={styles.planPrice}>{region === 'india' ? '₹49' : '$1.49'} / month</Text>
        <Text style={styles.planMeta}>Billed monthly · cancel anytime</Text>
      </Pressable>
      <Pressable style={[styles.planCard, plan === 'yearly' && styles.planCardOn]} onPress={() => setPlan('yearly')}>
        <Text style={styles.planTitle}>Pro Yearly — Best value</Text>
        <Text style={styles.planPrice}>{region === 'india' ? '₹399' : '$11.99'} / year</Text>
        <Text style={styles.planMeta}>{region === 'india' ? '₹33 / month equivalent · saves 32% vs monthly' : '$1.00 / month equivalent · saves 33% vs monthly'}</Text>
      </Pressable>
      <Text style={styles.body}>Pro includes: unlimited events, all widgets, all themes &amp; fonts, Story, gift planning, and contact &amp; calendar import.</Text>
      <Pressable style={styles.primaryBtn} onPress={() => Alert.alert('Design preview', `Pro ${plan === 'monthly' ? 'Monthly' : 'Yearly'} purchase is not configured yet. This is only a design preview — no charge will be made and your plan stays Free.`)}>
        <Text style={styles.primaryBtnText}>Upgrade to Pro {plan === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => Alert.alert('Design preview', 'Restore purchase is not configured yet. Your plan stays Free.')}>
        <Text style={styles.secondaryText}>Restore purchase</Text>
      </Pressable>
      <Text style={styles.hint}>Prices are a design recommendation, not store prices yet. Real prices will come from the store product when purchase is wired up, and auto-renewal terms will apply then.</Text>
    </>);
  }

  if (section === 'notifprivacy') {
    return shell(<>
      <SubHeader title="Step 3 · Notifications & Privacy" onBack={back} />
      <Text style={styles.subGroup}>Notifications</Text>
      <Pressable style={styles.row} onPress={() => onToggle({ remindersEnabled: !settings.remindersEnabled })}>
        <Text style={styles.rowText}>Smart reminders (D-7 / D-3 / D-1 / day-of): {settings.remindersEnabled ? 'ON' : 'OFF'}</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => onToggle({ milestoneNotifications: !settings.milestoneNotifications })}>
        <Text style={styles.rowText}>Milestone notifications (100-day / yearly for count-ups): {settings.milestoneNotifications ? 'ON' : 'OFF'}</Text>
      </Pressable>
      <Text style={styles.hint}>Reminder delivery needs a dev build. In Expo Go, scheduling may report success but notifications may not actually fire. Permission is requested only when you tap “Schedule” on an event.</Text>
      <Text style={styles.subGroup}>Privacy & Security</Text>
      <Text style={styles.body}>There is no account password in this app, so there is no Forgot Password flow to offer — inventing one would be fake. App-lock below is a device-local screen using the OS biometric prompt (with device PIN as its fallback) and/or an app PIN whose salted hash is stored on this device only. Forgetting the app PIN has no server reset: sign out to clear the lock.</Text>
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
    </>);
  }

  if (section === 'discover') {
    return shell(<>
      <SubHeader title="Step 4 · Discover" onBack={back} />
      <Text style={styles.body}>Recommended Events and Widgets used to be bottom tabs. They now live here so the tab bar stays to Home + Profile.</Text>
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
      <Text style={styles.subGroup}>What is NOT real yet</Text>
      <Text style={styles.body}>
        • Social: no server, no real users — comments are local only.{"\n"}
        • Widgets: no working home-screen widget in Expo Go, and no Android lock-screen widget exists on stock Android — see Discover &gt; Widgets for the snapshot a dev build would use.{"\n"}
        • Photos: picked URIs live on this device only and may not survive reinstall.{"\n"}
        • Sync: none. Everything is AsyncStorage on this device; there is no cloud backup.{"\n"}
        • No server auth or Forgot Password, no Facebook/Google Contacts import, no live group-gift link or payments.
      </Text>
    </>);
  }

  // Menu — the only thing the Profile tab shows on entry.
  return shell(<>
    <Text style={styles.heading}>Profile</Text>
    <Text style={styles.meta}>{authLabel} · local only — no server account</Text>
    <View style={{ marginTop: 16 }}>
      <MenuRow icon="person-outline" title="Step 1 · Account" sub="Display name · Sign out · Start from zero" onPress={() => { setName(settings.displayName); setSection('account'); }} />
      <MenuRow icon="card-outline" title="Step 2 · Subscription" sub="Current plan: Free · Pro pricing (design preview)" onPress={() => setSection('subscription')} />
      <MenuRow icon="notifications-outline" title="Step 3 · Notifications & Privacy" sub={`Reminders ${settings.remindersEnabled ? 'ON' : 'OFF'} · App-lock ${settings.appLockEnabled ? 'ON' : 'OFF'}`} onPress={() => setSection('notifprivacy')} />
      <MenuRow icon="compass-outline" title="Step 4 · Discover" sub="Recommended · Widgets · What is NOT real yet" onPress={() => setSection('discover')} />
    </View>
  </>);
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface, marginTop: 8 },
  back: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.primary },
  subGroup: { fontFamily: fonts.grotesk, fontSize: 18, color: colors.onSurface, marginTop: 24, marginBottom: 2 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 21 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 8 },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, lineHeight: 21 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { borderColor: '#EF4444' },
  menuTitle: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface },
  menuTitleDanger: { color: '#EF4444' },
  menuSub: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 18 },
  chevron: { fontFamily: fonts.jakartaBold, fontSize: 22, color: colors.onSurfaceVariant },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  regionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  regionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, alignItems: 'center' },
  regionBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  regionText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 14 },
  regionTextOn: { color: colors.background, fontFamily: fonts.jakartaBold },
  planCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginTop: 12 },
  planCardOn: { borderColor: colors.primary, borderWidth: 2 },
  planTitle: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 15 },
  planPrice: { color: colors.onSurface, fontFamily: fonts.grotesk, fontSize: 24, marginTop: 4 },
  planMeta: { color: colors.onSurfaceVariant, fontFamily: fonts.jakartaMedium, fontSize: 13, marginTop: 4 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  dangerBtn: { borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  dangerText: { color: '#EF4444', fontFamily: fonts.jakartaBold, fontSize: 14 },
});
