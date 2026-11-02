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
import { daysInMonth, parseDate, todayISO } from '../lib/dates';
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
  // In-app calendar picker for Date mode — pure JS, no native
  // date-picker dependency, so it works in Expo Go too. Opening it
  // jumps to the already-chosen date's month, otherwise this month.
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => Number(today.slice(0, 4)));
  const [calMonth, setCalMonth] = useState(() => Number(today.slice(5, 7)));

  const computed = mode === 'days'
    ? wizardDateFromDays(today, daysText)
    : wizardDateFromDate(dateText);

  // Switching mode or editing the input clears a stale error from
  // the other mode — previously a date-mode error stayed on screen
  // after switching to a perfectly valid days value (screenshot bug).
  const switchMode = (m: 'date' | 'days') => { setMode(m); setError(''); };
  const openCalendar = () => {
    const parsed = parseDate(dateText);
    if (parsed) { setCalYear(parsed.year); setCalMonth(parsed.month); }
    else { setCalYear(Number(today.slice(0, 4))); setCalMonth(Number(today.slice(5, 7))); }
    setShowCalendar(true);
  };
  const shiftCalendarMonth = (delta: number) => {
    let y = calYear; let m = calMonth + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setCalYear(y); setCalMonth(m);
  };
  const pickCalendarDay = (day: number) => {
    const iso = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDateText(iso);
    setError('');
    setShowCalendar(false);
  };

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
            {/* 2-column grid instead of the old full-width list: the
                8 presets fill the screen width in 4 rows, so Step 1
                fits on one screen instead of scrolling past 9 rows.
                The manual escape hatch stays a full-width row below. */}
            <View style={styles.grid}>
              {WIZARD_PRESETS.filter((p) => p.id !== 'manual').map((p) => (
                <Pressable key={p.id} style={styles.tile} onPress={() => pickPreset(p)}>
                  <Text style={styles.tileSticker}>{p.sticker}</Text>
                  <Text style={styles.tileText}>{p.label}</Text>
                  <Text style={styles.tileHint}>{p.repeat === 'yearly' ? 'Repeats yearly' : 'One-time'}</Text>
                </Pressable>
              ))}
            </View>
            {WIZARD_PRESETS.filter((p) => p.id === 'manual').map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => pickPreset(p)}>
                <Text style={styles.rowText}>{p.label}</Text>
                <Text style={styles.rowHint}>Custom title, date &amp; category</Text>
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
              <Pressable onPress={() => switchMode('date')} style={[styles.chip, mode === 'date' && styles.chipOn]}>
                <Text style={[styles.chipText, mode === 'date' && styles.chipTextOn]}>Date selection</Text>
              </Pressable>
              <Pressable onPress={() => switchMode('days')} style={[styles.chip, mode === 'days' && styles.chipOn]}>
                <Text style={[styles.chipText, mode === 'days' && styles.chipTextOn]}>Days selection</Text>
              </Pressable>
            </View>
            {mode === 'date' ? (
              <>
                <Pressable style={styles.input} onPress={openCalendar}>
                  <Text style={[styles.inputText, !dateText && styles.inputPlaceholder]}>
                    {dateText || 'Pick a date — tap to open calendar'}
                  </Text>
                </Pressable>
                {showCalendar ? (
                  <View style={styles.calCard}>
                    <View style={styles.calHeader}>
                      <Pressable onPress={() => shiftCalendarMonth(-1)} hitSlop={10}>
                        <Text style={styles.calNav}>‹</Text>
                      </Pressable>
                      <Text style={styles.calTitle}>
                        {new Date(calYear, calMonth - 1, 1).toLocaleString('en', { month: 'long' })} {calYear}
                      </Text>
                      <Pressable onPress={() => shiftCalendarMonth(1)} hitSlop={10}>
                        <Text style={styles.calNav}>›</Text>
                      </Pressable>
                    </View>
                    <View style={styles.calGrid}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <Text key={d} style={styles.calWeekday}>{d}</Text>
                      ))}
                      {Array.from({ length: new Date(calYear, calMonth - 1, 1).getDay() }).map((_, i) => (
                        <View key={`blank-${i}`} style={styles.calCell} />
                      ))}
                      {Array.from({ length: daysInMonth(calYear, calMonth) }).map((_, i) => {
                        const day = i + 1;
                        const iso = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const selected = dateText === iso;
                        const isToday = today === iso;
                        return (
                          <Pressable
                            key={day}
                            style={[styles.calCell, selected && styles.calCellOn, isToday && !selected && styles.calCellToday]}
                            onPress={() => pickCalendarDay(day)}
                          >
                            <Text style={[styles.calDay, selected && styles.calDayOn]}>{day}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable style={styles.secondaryBtn} onPress={() => setShowCalendar(false)}>
                      <Text style={styles.secondaryBtnText}>Close calendar</Text>
                    </Pressable>
                  </View>
                ) : null}
                {computed.dateISO ? (
                  <Text style={styles.body}>Selected: {computed.dateISO}.</Text>
                ) : (
                  <Text style={styles.body}>Tap the field above and pick a day from the calendar — no typing a date.</Text>
                )}
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={daysText}
                  onChangeText={(t) => { setDaysText(t); setError(''); }}
                  placeholder="30"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="number-pad"
                />
                <Text style={styles.body}>Or tap a suggestion:</Text>
                <View style={styles.chipRowWrap}>
                  {[7, 30, 90, 180, 365].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => { setDaysText(String(n)); setError(''); }}
                      style={[styles.chip, daysText.trim() === String(n) && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, daysText.trim() === String(n) && styles.chipTextOn]}>
                        {n === 365 ? '1 year' : `${n} days`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tileSticker: { fontSize: 26, marginBottom: 6 },
  tileText: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.onSurface, textAlign: 'center' },
  tileHint: { fontFamily: fonts.jakartaMedium, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  rowOn: { borderColor: colors.primary },
  rowText: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface },
  rowHint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 },
  inputText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 16 },
  inputPlaceholder: { color: colors.onSurfaceVariant },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  calCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, marginTop: 12 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calNav: { fontFamily: fonts.jakartaBold, fontSize: 24, color: colors.onSurface, paddingHorizontal: 8 },
  calTitle: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calWeekday: { width: '14.28%', textAlign: 'center', fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurfaceVariant, paddingVertical: 4 },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  calCellOn: { backgroundColor: colors.primary },
  calCellToday: { borderWidth: 1, borderColor: colors.primary },
  calDay: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface },
  calDayOn: { fontFamily: fonts.jakartaBold, color: colors.background },
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
