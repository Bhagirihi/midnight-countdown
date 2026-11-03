import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, labelStyle, radii, spacing } from '../lib/theme';

// NOTE ON ICONS: Solar -bold is a web Iconify set and is not available as a
// React Native icon font, so the closest @expo/vector-icons (Ionicons)
// equivalents are used and the substitution is stated, not hidden.
const SLIDES = [
  {
    kicker: 'COUNT EVERY DAY',
    numeral: 'D-13',
    numeralColor: colors.primary,
    icon: 'timer-outline' as const,
    title: 'D-Day, exactly',
    body: 'Count down to the big day by days, weeks, or months — or count up from the day it all started.',
    mono: 'D-13 / D-12 / D-11',
  },
  {
    kicker: 'NEVER MISS IT',
    numeral: 'D-7',
    numeralColor: colors.secondary,
    icon: 'notifications-outline' as const,
    title: 'Widgets & reminders',
    body: 'Pin a countdown to your home screen (dev build for widgets) and get reminded at the moments that matter.',
    mono: 'D-7 / D-3 / D-1',
  },
  {
    kicker: 'MAKE IT YOURS',
    numeral: 'D-100',
    numeralColor: colors.accent,
    icon: 'color-palette-outline' as const,
    title: 'Customise & story',
    body: 'Style each event your way and keep the journey in a story, up to 8 photos per moment.',
    mono: '100 DAYS / 1 YEAR',
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.skipSpacer} />
        <Pressable onPress={onDone} hitSlop={12}>
          <Text style={styles.skip}>SKIP</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={[styles.tile, { backgroundColor: slide.numeralColor + '1A', borderColor: slide.numeralColor + '33' }]}>
          <Ionicons name={slide.icon} size={28} color={slide.numeralColor} />
        </View>
        <Text style={styles.kicker}>{slide.kicker}</Text>
        <Text style={[styles.numeral, { color: slide.numeralColor }]}>{slide.numeral}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <Text style={styles.mono}>{slide.mono}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={styles.primary}
          onPress={() => (last ? onDone() : setIndex(index + 1))}
        >
          <Text style={styles.primaryText}>{last ? 'GET STARTED' : 'NEXT'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.gutter },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  skipSpacer: { width: 40 },
  skip: { ...labelStyle, fontSize: 12, color: colors.accent },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.cardPadding,
    justifyContent: 'center',
    gap: 12,
  },
  tile: {
    width: 56, height: 56, borderRadius: radii.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  kicker: { ...labelStyle, fontSize: 12, color: colors.onSurfaceVariant },
  numeral: { fontFamily: fonts.grotesk, fontSize: 64, lineHeight: 64, letterSpacing: -1.28 },
  title: { fontFamily: fonts.grotesk, fontSize: 24, lineHeight: 26, color: colors.onSurface },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, lineHeight: 21, color: colors.onSurfaceVariant },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.onSurfaceVariant },
  note: { fontFamily: fonts.jakartaMedium, fontSize: 12, lineHeight: 17, color: colors.onSurfaceVariant, opacity: 0.85 },
  footer: { paddingVertical: 20, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  primary: {
    height: 48, borderRadius: radii.full, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    // Coral aura only: RN shadow props, not CSS. No elevation shadows elsewhere.
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 0,
  },
  primaryText: { ...labelStyle, fontSize: 12, color: colors.onPrimary },
});
