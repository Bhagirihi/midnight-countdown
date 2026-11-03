import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, labelStyle } from '../lib/theme';
import BrandMark from './BrandMark';

// Email is optional and stays on this device. There is no server account.
// Google and Apple stay out until a provider is actually connected.
export default function AuthScreen({
  onGuest,
  onLocalEmail,
}: {
  onGuest: () => void;
  onLocalEmail: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);

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
      <View style={styles.column}>
      <View>
        <BrandMark align="left" />
        <Text style={styles.title}>Your days,{'\n'}kept.</Text>
      </View>
      <View>
      <Text style={styles.copy}>Private to this phone. Nothing to create.</Text>

      <Pressable style={styles.primary} onPress={onGuest}>
        <Text style={styles.primaryText}>BEGIN</Text>
      </Pressable>

      {showEmail ? (
        <View style={styles.emailBlock}>
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
            autoFocus
          />
          <View style={styles.inputRule} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={continueEmail} hitSlop={8}>
            <Text style={styles.link}>Save email</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setShowEmail(true)} hitSlop={12} style={styles.linkWrap}>
          <Text style={styles.link}>Add an email for this phone</Text>
        </Pressable>
      )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  column: { flex: 1, justifyContent: 'space-between' },
  title: { fontFamily: fonts.grotesk, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: colors.onSurface, marginTop: 36 },
  copy: { fontFamily: fonts.jakartaMedium, fontSize: 15, lineHeight: 22, color: colors.onSurfaceVariant, marginBottom: 16 },
  primary: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { ...labelStyle, fontSize: 12, letterSpacing: 2.2, color: colors.onPrimary },
  emailBlock: { marginTop: 22 },
  input: {
    fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface,
    paddingVertical: 12,
  },
  inputRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.accent },
  error: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.error, marginTop: 8 },
  linkWrap: { alignItems: 'center', paddingTop: 18 },
  link: {
    ...labelStyle, fontSize: 11, letterSpacing: 1.6, color: colors.accent,
    textAlign: 'center', marginTop: 16,
  },
});
