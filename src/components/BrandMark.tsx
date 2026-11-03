import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, labelStyle } from '../lib/theme';

export default function BrandMark({ align = 'center' }: { align?: 'center' | 'left' }) {
  return (
    <View style={[styles.wrap, align === 'left' && styles.left]}>
      <Text style={styles.word}>A DAY AWAY</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  left: { alignItems: 'flex-start' },
  word: { ...labelStyle, fontSize: 11, letterSpacing: 3.2, color: colors.onSurface },
  rule: { width: 28, height: 1, backgroundColor: colors.accent, marginTop: 10 },
});

export function Monogram({ letter, size = 72 }: { letter: string; size?: number }) {
  return (
    <View style={[mono.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[mono.letter, { fontSize: size * 0.38 }]}>{letter}</Text>
    </View>
  );
}

const mono = StyleSheet.create({
  ring: {
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontFamily: fonts.grotesk, color: colors.onSurface },
});
