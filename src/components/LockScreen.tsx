import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { authenticateBiometric, biometricAvailable, verifyPin } from '../lib/applock';

// Shown instead of the app when app-lock is on and this session is not
// yet unlocked. Biometrics use the OS prompt (which falls back to the
// device PIN/passcode). The app PIN is an alternative, not a replacement
// for the device credential. There is no server reset: forgetting the
// PIN leaves only "Sign out & clear lock".
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
      setError('That PIN did not match. Try again, or sign out to clear the lock.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>MIDNIGHT COUNTDOWN</Text>
      <Text style={styles.heading}>App locked</Text>
      <Text style={styles.body}>
        Unlock with biometrics or your app PIN. This lock lives only on
        this device — there is no server reset if you forget the PIN.
      </Text>
      {bio ? (
        <Pressable
          style={styles.primaryBtn}
          onPress={async () => {
            if (await authenticateBiometric()) onUnlock();
            else setError('Biometric unlock was cancelled or failed. Try your app PIN, or sign out to clear the lock.');
          }}
        >
          <Text style={styles.primaryBtnText}>Unlock with biometrics</Text>
        </Pressable>
      ) : null}
      {pinHash ? (
        <>
          <Text style={styles.label}>App PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter your app PIN"
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="number-pad"
            secureTextEntry
            onSubmitEditing={tryPin}
          />
          <Pressable style={styles.primaryBtn} onPress={tryPin}>
            <Text style={styles.primaryBtnText}>Unlock with PIN</Text>
          </Pressable>
        </>
      ) : null}
      {!bio && !pinHash ? (
        <Text style={styles.body}>App-lock is on but no unlock method is set. Sign out to clear the lock, then set it up again in Profile.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.secondaryBtn} onPress={onSignOutAndClear}>
        <Text style={styles.secondaryBtnText}>Sign out &amp; clear lock</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center' },
  kicker: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.primary, letterSpacing: 1.4 },
  heading: { fontFamily: fonts.grotesk, fontSize: 32, color: colors.onSurface, marginTop: 8 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurfaceVariant, marginTop: 10, lineHeight: 21 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 20 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 16, marginTop: 8 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 16 },
  secondaryBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  error: { color: colors.error, fontFamily: fonts.jakartaMedium, fontSize: 14, marginTop: 14, lineHeight: 20 },
});
