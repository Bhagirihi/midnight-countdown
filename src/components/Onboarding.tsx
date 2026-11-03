import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, labelStyle } from '../lib/theme';
import BrandMark from './BrandMark';

// Single intro screen. No photo here: a photo belongs to an event, so
// it is asked only in the first-event wizard, as its last step, after
// the event itself is set up.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.column}>
        <View>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <BrandMark align="left" />
          </View>
          <Text style={styles.numeral}>D-13</Text>
          <Text style={styles.title}>The days that matter,{'\n'}counted.</Text>
        </View>
        <View>
          <Text style={styles.copy}>One date. A number you can keep.</Text>
          <Pressable style={styles.primary} onPress={onDone}>
            <Text style={styles.primaryText}>BEGIN</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  column: { flex: 1, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 52, height: 52, borderRadius: 14 },
  numeral: {
    fontFamily: fonts.grotesk,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -2,
    color: colors.primary,
    marginTop: 20,
  },
  title: {
    fontFamily: fonts.grotesk,
    fontSize: 26,
    lineHeight: 32,
    color: colors.onSurface,
    marginTop: 12,
  },
  copy: {
    fontFamily: fonts.jakartaMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 16,
  },
  primary: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...labelStyle, fontSize: 12, letterSpacing: 2.2, color: colors.onPrimary },
});
