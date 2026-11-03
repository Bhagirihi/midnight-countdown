import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, labelStyle, radii, spacing } from '../lib/theme';

// HONESTY RULES (load-bearing):
// - Google / Apple have NO provider configured in this app. Tapping them
//   shows an honest "not connected yet" alert and offers Guest — never a
//   fake sign-in, never a fake account.
// - Email sign-in is LOCAL ONLY: the address is stored on this device via
//   AsyncStorage. No server, no verification email, no cloud claim. The
//   screen carries that note in plain text.
export default function AuthScreen({
  onGuest,
  onLocalEmail,
}: {
  onGuest: () => void;
  onLocalEmail: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const notConnected = () => {
    Alert.alert(
      'Not connected yet',
      'Google / Apple sign-in is not connected in this build. Continue as a guest to try the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue as guest', onPress: onGuest },
      ],
    );
  };

  const continueEmail = () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    onLocalEmail(trimmed);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.kicker}>WELCOME BACK</Text>
        <Text style={styles.title}>LOGIN /{'\n'}SIGN UP</Text>
        <Text style={styles.body}>
          Or skip it — guest mode needs nothing.
        </Text>

        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={continueEmail}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={continueEmail}>
          <Text style={styles.primaryText}>CONTINUE</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={notConnected}>
          <Ionicons name="logo-google" size={18} color={colors.onSurface} />
          <Text style={styles.secondaryText}>CONTINUE WITH GOOGLE</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={notConnected}>
          <Ionicons name="logo-apple" size={18} color={colors.onSurface} />
          <Text style={styles.secondaryText}>CONTINUE WITH APPLE</Text>
        </Pressable>

        <Pressable onPress={onGuest} hitSlop={12}>
          <Text style={styles.guest}>CONTINUE AS GUEST</Text>
        </Pressable>

        <Text style={styles.note}>
          Email sign-in stays on this device. No server, no cloud sync.
          Google / Apple not connected yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.gutter, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.xl, padding: spacing.cardPadding, gap: 14,
  },
  kicker: { ...labelStyle, fontSize: 12, color: colors.onSurfaceVariant },
  title: { fontFamily: fonts.grotesk, fontSize: 30, lineHeight: 30, letterSpacing: -0.75, color: colors.onSurface },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, lineHeight: 21, color: colors.onSurfaceVariant },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 16, height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, height: '100%' },
  error: { fontFamily: fonts.jakartaMedium, fontSize: 12, color: colors.error },
  primary: {
    height: 48, borderRadius: radii.full, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 0,
  },
  primaryText: { ...labelStyle, fontSize: 12, color: colors.onPrimary },
  secondary: {
    height: 48, borderRadius: radii.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  secondaryText: { ...labelStyle, fontSize: 12, color: colors.onSurface },
  guest: { ...labelStyle, fontSize: 12, color: colors.accent, textAlign: 'center', paddingVertical: 4 },
  note: { fontFamily: fonts.jakartaMedium, fontSize: 12, lineHeight: 17, color: colors.onSurfaceVariant, textAlign: 'center' },
});
