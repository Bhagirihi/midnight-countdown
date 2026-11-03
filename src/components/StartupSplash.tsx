import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, labelStyle } from '../lib/theme';

// Branded splash shown on every cold start. The parent (App.tsx) decides
// when to hide it: fonts/stores ready AND >= 2s elapsed, 5s fallback.
// It lives only in the root mount, so resuming from background never
// re-shows it.
export default function StartupSplash() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Image source={require('../../assets/icon.png')} style={styles.icon} />
        <Text style={styles.name}>A DAY{'\n'}AWAY</Text>
        <Text style={styles.mono}>D-7 / D-3 / D-1</Text>
      </View>
      <Text style={styles.foot}>EVERY DAY, COUNTED</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  icon: { width: 120, height: 120, borderRadius: 28 },
  name: {
    fontFamily: fonts.grotesk,
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: -0.75,
    color: colors.onSurface,
    textAlign: 'center',
  },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.primary },
  foot: { ...labelStyle, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center', paddingBottom: 32 },
});
