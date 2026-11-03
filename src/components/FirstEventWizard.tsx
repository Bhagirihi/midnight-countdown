// First-event wizard — shown after auth ONLY when the user has 0
// events, and re-offered from the Home empty state. Skippable at every
// step, and Skip creates nothing. Four steps: preset, name, date, photo.
// The photo is optional. Notifications and widgets are offered later,
// once an event exists. Home creates the event exactly once, in its
// guarded Finish handler.
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../lib/theme';
import { formatHumanDate, parseDate, todayISO } from '../lib/dates';
import {
  WIZARD_PRESETS, wizardDateFromDate, wizardDateFromDays,
  type WizardDraft, type WizardPreset,
} from '../lib/wizard';
import { pickSinglePhoto } from '../lib/photos';
import DateCalendar from './DateCalendar';

export default function FirstEventWizard({
  initialPhoto = null, onFinish, onSkip, onBindBack,
}: {
  initialPhoto?: string | null;
  onFinish: (draft: WizardDraft) => void;
  onSkip: () => void;
  onBindBack?: (fn: (() => boolean) | null) => void;
}) {
  const today = todayISO();
  const [step, setStep] = useState(1);
  const [preset, setPreset] = useState<WizardPreset>(WIZARD_PRESETS[0]);
  const [title, setTitle] = useState(WIZARD_PRESETS[0].prefillTitle);
  const [mode, setMode] = useState<'date' | 'days'>('date');
  const [dateText, setDateText] = useState('');
  const [daysText, setDaysText] = useState('30');
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhoto);
  const [error, setError] = useState('');
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

  useEffect(() => {
    onBindBack?.(() => {
      if (step > 1) { setError(''); setStep(step - 1); return true; }
      return false;
    });
    return () => onBindBack?.(null);
  }, [onBindBack, step]);

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
    if (!title.trim() || !computed.dateISO) {
      setError(computed.error ?? 'Pick a date before continuing. Nothing was created.');
      return;
    }
    setError('');
    setStep(4);
  };

  const finish = () => {
    if (!title.trim() || !computed.dateISO) {
      setError(computed.error ?? 'Pick a date before creating the event. Nothing was created.');
      return;
    }
    onFinish({
      preset,
      title: title.trim(),
      dateISO: computed.dateISO,
      photoUri,
      widgetVariant: 'medium',
    });
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>SET UP YOUR FIRST EVENT · STEP {step} OF 4</Text>
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
            <Text style={styles.body}>Pick a date, or say how many days away it is.</Text>
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
                    {dateText ? formatHumanDate(dateText, today) : 'Pick a date — tap to open calendar'}
                  </Text>
                </Pressable>
                {showCalendar ? (
                  <DateCalendar
                    year={calYear}
                    month={calMonth}
                    selectedISO={dateText}
                    today={today}
                    onPrev={() => shiftCalendarMonth(-1)}
                    onNext={() => shiftCalendarMonth(1)}
                    onPick={(iso) => {
                      const day = Number(iso.slice(8, 10));
                      pickCalendarDay(day);
                    }}
                  />
                ) : null}
                {computed.dateISO ? (
                  <Text style={styles.body}>Selected: {formatHumanDate(computed.dateISO, today)}.</Text>
                ) : null}
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
                    ? `In ${daysText.trim()} days = ${formatHumanDate(computed.dateISO, today)}.`
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
            <Text style={styles.heading}>Add a photo?</Text>
            <Text style={styles.body}>Optional. It shows on the event and on Home. You can skip this.</Text>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            ) : null}
            <Pressable
              style={styles.secondaryBtn}
              onPress={async () => {
                const uri = await pickSinglePhoto();
                if (uri) setPhotoUri(uri);
              }}
            >
              <Text style={styles.secondaryBtnText}>{photoUri ? 'Change photo' : 'Add photo'}</Text>
            </Pressable>
            {photoUri ? (
              <Pressable style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.secondaryBtnText}>Remove</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.primaryBtn} onPress={finish}>
              <Text style={styles.primaryBtnText}>Create event</Text>
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
          <Text style={styles.skipLine}>Skip setup — nothing will be created</Text>
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
  photo: { width: '100%', height: 180, borderRadius: 16, marginTop: 16, backgroundColor: colors.surface },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  banner: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.background, backgroundColor: colors.accent, borderRadius: 12, padding: 12, marginTop: 16, lineHeight: 18 },
  error: { color: colors.error, fontFamily: fonts.jakartaMedium, fontSize: 14, marginTop: 14 },
  skipLine: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
