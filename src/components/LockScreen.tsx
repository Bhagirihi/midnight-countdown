import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, labelStyle } from '../lib/theme';
import { authenticateBiometric, biometricAvailable, verifyPin } from '../lib/applock';
import BrandMark from './BrandMark';

// Shown when app-lock is on and this session is still locked.
// Forgetting the PIN has no server reset: signing out clears the lock.
export default function LockScreen({
  pinHash, onUnlock, onSignOutAndClear,
}: {
  pinHash: string | null;
  onUnlock: () => void;
  onSignOutAndClear: () => void;
}) {
  const [bio, setBio] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    biometricAvailable().then(setBio).catch(() => setBio(false));
  }, []);

  const tryPin = () => {
    if (verifyPin(pin, pinHash)) {
      setError('');
      onUnlock();
    } else {
      setError('That PIN does not match.');
      setPin('');
    }
  };

  return (
    <View style={styles.wrap}>
      <BrandMark />
      <Text style={styles.heading}>Locked</Text>
      <Text style={styles.body}>Your countdowns stay on this phone.</Text>

      {bio ? (
        <Pressable
          style={styles.primaryBtn}
          onPress={async () => {
            if (await authenticateBiometric()) onUnlock();
            else setError('Biometric unlock was cancelled.');
          }}
        >
          <Text style={styles.primaryBtnText}>UNLOCK</Text>
        </Pressable>
      ) : null}

      {pinHash ? (
        <View style={styles.pinBlock}>
          <Text style={styles.label}>PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={(value) => { setPin(value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            placeholder="····"
            placeholderTextColor={colors.border}
            keyboardType="number-pad"
            secureTextEntry
            textAlign="center"
            onSubmitEditing={tryPin}
          />
          <View style={styles.rule} />
          <Pressable style={bio ? styles.textBtn : styles.primaryBtn} onPress={tryPin}>
            <Text style={bio ? styles.textBtnLabel : styles.primaryBtnText}>{bio ? 'Use PIN' : 'UNLOCK'}</Text>
          </Pressable>
        </View>
      ) : null}

      {!bio && !pinHash ? (
        <Text style={styles.body}>No unlock method is set. Sign out, then set a PIN in Settings.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={onSignOutAndClear} hitSlop={10} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out and clear lock</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 28, justifyContent: 'center' },
  heading: { fontFamily: fonts.grotesk, fontSize: 48, letterSpacing: -1, color: colors.onSurface, marginTop: 36, textAlign: 'center' },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurfaceVariant, marginTop: 10, lineHeight: 22, textAlign: 'center' },
  pinBlock: { marginTop: 28 },
  label: { ...labelStyle, fontSize: 11, letterSpacing: 2, color: colors.onSurfaceVariant, textAlign: 'center' },
  input: {
    fontFamily: fonts.mono, fontSize: 28, letterSpacing: 10, color: colors.onSurface,
    paddingVertical: 14,
  },
  rule: { height: 1, backgroundColor: colors.accent, marginHorizontal: 48 },
  primaryBtn: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
  },
  primaryBtnText: { ...labelStyle, fontSize: 12, letterSpacing: 2.2, color: colors.onPrimary },
  textBtn: { alignItems: 'center', marginTop: 18 },
  textBtnLabel: { ...labelStyle, fontSize: 12, letterSpacing: 1.8, color: colors.onSurface },
  signOut: { alignItems: 'center', marginTop: 28 },
  signOutText: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant },
  error: { color: colors.error, fontFamily: fonts.jakartaMedium, fontSize: 14, marginTop: 16, textAlign: 'center' },
});
