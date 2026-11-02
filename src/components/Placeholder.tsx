import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, labelStyle, radii, spacing } from '../lib/theme';

// Minimal placeholder — deliberately NOT a dashboard. No invented events,
// dates, or user data: it says plainly what is not built yet and lets the
// demo loop cleanly via Replay onboarding / Sign out.
export default function Placeholder({
  authLabel,
  onReplayOnboarding,
  onSignOut,
}: {
  authLabel: string;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
}) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.kicker}>SIGNED IN AS {authLabel}</Text>
        <Text style={styles.title}>YOU&apos;RE IN</Text>
        <Text style={styles.body}>
          This build stops here on purpose. Dashboard, widgets, and story
          are next steps — they are not built yet, and nothing on this
          screen pretends otherwise.
        </Text>
        <View style={styles.nextRow}>
          <Text style={styles.nextKicker}>NEXT STEPS</Text>
          <Text style={styles.nextItem}>• Dashboard with countdown tiles</Text>
          <Text style={styles.nextItem}>• Home & lock screen widgets</Text>
          <Text style={styles.nextItem}>• Story: moments per date</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.secondary} onPress={onReplayOnboarding}>
          <Text style={styles.secondaryText}>REPLAY ONBOARDING</Text>
        </Pressable>
        <Pressable onPress={onSignOut} hitSlop={12}>
          <Text style={styles.signOut}>SIGN OUT</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.gutter },
  card: {
    flex: 1, justifyContent: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl,
    padding: spacing.cardPadding, gap: 14, marginTop: 20,
  },
  kicker: { ...labelStyle, fontSize: 12, color: colors.onSurfaceVariant },
  title: { fontFamily: fonts.grotesk, fontSize: 36, lineHeight: 36, letterSpacing: -0.72, color: colors.onSurface },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, lineHeight: 21, color: colors.onSurfaceVariant },
  nextRow: { gap: 6, marginTop: 8 },
  nextKicker: { ...labelStyle, fontSize: 12, color: colors.accent },
  nextItem: { fontFamily: fonts.jakartaMedium, fontSize: 14, lineHeight: 21, color: colors.onSurface },
  footer: { paddingVertical: 20, gap: 12 },
  secondary: {
    height: 48, borderRadius: radii.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { ...labelStyle, fontSize: 12, color: colors.onSurface },
  signOut: { ...labelStyle, fontSize: 12, color: colors.error, textAlign: 'center', paddingVertical: 4 },
});
