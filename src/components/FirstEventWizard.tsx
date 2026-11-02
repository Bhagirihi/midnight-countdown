// First-event wizard — shown after auth ONLY when the user has 0
// events, and re-offered from the Home empty state. Skippable at every
// step, and Skip creates nothing. The draft lives only in this
// component's state; Home creates the event exactly once, in its
// guarded Finish handler, so back/forward navigation can never
// duplicate it. Step 3 is the only step that fixes a date, and Step 5
// is the only step with a Finish button.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../lib/theme';
import { todayISO } from '../lib/dates';
import {
  WIZARD_PRESETS, wizardDateFromDate, wizardDateFromDays, wizardPreset,
  type WizardDraft, type WizardPreset,
} from '../lib/wizard';
import { WIDGET_VARIANTS, type WidgetVariant } from '../lib/widgets';
import { requestLocationPermission, requestNotificationPermission } from '../lib/permissions';

export default function FirstEventWizard({
  onFinish, onSkip,
}: {
  onFinish: (draft: WizardDraft) => void;
  onSkip: () => void;
}) {
  const today = todayISO();
  const [step, setStep] = useState(1);
  const [preset, setPreset] = useState<WizardPreset>(WIZARD_PRESETS[0]);
  const [title, setTitle] = useState(WIZARD_PRESETS[0].prefillTitle);
  const [mode, setMode] = useState<'date' | 'days'>('date');
  const [dateText, setDateText] = useState('');
  const [daysText, setDaysText] = useState('30');
  const [error, setError] = useState('');
  const [notifStatus, setNotifStatus] = useState('');
  const [locStatus, setLocStatus] = useState('');
  const [variant, setVariant] = useState<WidgetVariant>('medium');

  const computed = mode === 'days'
    ? wizardDateFromDays(today, daysText)
    : wizardDateFromDate(dateText);

  const pickPreset = (p: WizardPreset) => {
    setPreset(p);
    setTitle(p.prefillTitle);
    setStep(2);
  };

  const nextFromStep2 = () => {
    if (!title.trim()) { setError('Give your event a name first.'); return; }
    setError('');
    setStep(3);
  };

  const nextFromStep3 = () => {
    if (!computed.dateISO) { setError(computed.error ?? 'Check the date.'); return; }
    setError('');
    setStep(4);
  };

  const finish = () => {
    if (!title.trim() || !computed.dateISO) {
      // Defensive: Finish is only reachable after Steps 2–3 passed, so
      // this should never fire. If it does, do NOT create a partial event.
      setError('Go back and finish steps 2 and 3 first — nothing was created.');
      return;
    }
    onFinish({ preset, title: title.trim(), dateISO: computed.dateISO, widgetVariant: variant });
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>SET UP YOUR FIRST EVENT · STEP {step} OF 5</Text>
          <Pressable onPress={onSkip} hitSlop={12}>
            <Text style={styles.skip}>SKIP</Text>
          </Pressable>
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.heading}>What&apos;s your special day?</Text>
            <Text style={styles.body}>Pick one — you can change everything about it later in the full editor.</Text>
            {WIZARD_PRESETS.map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => pickPreset(p)}>
                <Text style={styles.rowText}>{p.sticker ? `${p.sticker} ` : ''}{p.label}</Text>
                <Text style={styles.rowHint}>{p.id === 'manual' ? 'Custom title, date & category' : p.repeat === 'yearly' ? 'Repeats yearly' : 'One-time'}</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.heading}>What do you want to call it?</Text>
            <Text style={styles.body}>For “{preset.label}” — edit the name to make it yours.</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={preset.id === 'manual' ? 'e.g. Trip to the Mountains' : preset.prefillTitle}
              placeholderTextColor={colors.onSurfaceVariant}
              autoFocus
            />
            <Pressable style={styles.primaryBtn} onPress={nextFromStep2}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.heading}>When is it?</Text>
            <Text style={styles.body}>For “{title.trim() || preset.label}”. Pick a date, or say how many days away it is.</Text>
            <View style={styles.chipRow}>
              <Pressable onPress={() => setMode('date')} style={[styles.chip, mode === 'date' && styles.chipOn]}>
                <Text style={[styles.chipText, mode === 'date' && styles.chipTextOn]}>Date selection</Text>
              </Pressable>
              <Pressable onPress={() => setMode('days')} style={[styles.chip, mode === 'days' && styles.chipOn]}>
                <Text style={[styles.chipText, mode === 'days' && styles.chipTextOn]}>Days selection</Text>
              </Pressable>
            </View>
            {mode === 'date' ? (
              <TextInput
                style={styles.input}
                value={dateText}
                onChangeText={setDateText}
                placeholder="2026-12-25"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
              />
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={daysText}
                  onChangeText={setDaysText}
                  placeholder="30"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="number-pad"
                />
                <Text style={styles.body}>
                  {computed.dateISO
                    ? `In ${daysText.trim()} days = ${computed.dateISO}.`
                    : 'Enter a whole number of days (0 = today).'}
                </Text>
              </>
            )}
            <Pressable style={styles.primaryBtn} onPress={nextFromStep3}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.heading}>A couple of permissions</Text>
            <Text style={styles.body}>
              Both are optional and skippable — saying no blocks nothing.
              Notifications are for D-7 / D-3 / D-1 reminders. Location is
              NOT used by any feature right now; asking only records your
              preference for possible future use.
            </Text>
            <Pressable
              style={styles.secondaryBtn}
              onPress={async () => setNotifStatus(await requestNotificationPermission())}
            >
              <Text style={styles.secondaryBtnText}>Allow notifications</Text>
            </Pressable>
            {notifStatus ? <Text style={styles.body}>{notifStatus}</Text> : null}
            <Pressable
              style={styles.secondaryBtn}
              onPress={async () => setLocStatus(await requestLocationPermission())}
            >
              <Text style={styles.secondaryBtnText}>Allow location (optional)</Text>
            </Pressable>
            {locStatus ? <Text style={styles.body}>{locStatus}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={() => setStep(5)}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Text style={styles.heading}>Add it to your home screen</Text>
            <Text style={styles.body}>
              Pick a widget size for “{title.trim()}”. On a dev build, the
              widget shows this event&apos;s real D-number from the snapshot.
              In Expo Go, widgets cannot run at all — this choice is saved
              for the dev build.
            </Text>
            {WIDGET_VARIANTS.map((v) => (
              <Pressable key={v.id} style={[styles.row, variant === v.id && styles.rowOn]} onPress={() => setVariant(v.id)}>
                <Text style={styles.rowText}>{v.title}</Text>
                <Text style={styles.rowHint}>{v.shows}</Text>
                <Text style={styles.rowHint}>{v.androidHowTo}</Text>
              </Pressable>
            ))}
            <Text style={styles.banner}>
              ANDROID LOCK SCREEN, HONESTLY: stock Android has not supported
              third-party lock-screen widgets since Android 5, so there is
              no Android lock-screen widget to add here. Lock-screen widgets
              are an iOS WidgetKit concept, not a stock-Android one.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={finish}>
              <Text style={styles.primaryBtnText}>Create event &amp; go to Home</Text>
            </Pressable>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {step > 1 ? (
          <Pressable style={styles.secondaryBtn} onPress={() => { setError(''); setStep(step - 1); }}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onSkip}>
          <Text style={styles.skipLine}>Skip setup — I&apos;ll add an event later (nothing will be created)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  kicker: { fontFamily: fonts.jakartaBold, fontSize: 11, color: colors.primary, letterSpacing: 1.2 },
  skip: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.accent },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface, marginTop: 16 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 10, lineHeight: 21 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 16, marginTop: 14 },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  rowOn: { borderColor: colors.primary },
  rowText: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface },
  rowHint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 14 },
  chipTextOn: { color: colors.background, fontFamily: fonts.jakartaBold },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  banner: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.background, backgroundColor: colors.accent, borderRadius: 12, padding: 12, marginTop: 16, lineHeight: 18 },
  error: { color: colors.error, fontFamily: fonts.jakartaMedium, fontSize: 14, marginTop: 14 },
  skipLine: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
