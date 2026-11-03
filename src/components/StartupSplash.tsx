import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import BrandMark from './BrandMark';

// Branded splash on every cold start. It fills the screen on its own so a
// short parent cannot collapse it, and App.tsx keeps it up for 2 seconds.
export default function StartupSplash() {
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Image source={require('../../assets/icon.png')} style={styles.icon} accessibilityLabel="A Day Away" />
        <View style={styles.mark}>
          <BrandMark />
        </View>
      </View>
      <Text style={styles.foot}>EVERY DAY, COUNTED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    zIndex: 20,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 168, height: 168, borderRadius: 40 },
  mark: { marginTop: 28 },
  foot: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2.4,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingBottom: 36,
  },
});
