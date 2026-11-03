// Optional device app-lock. LAZY imports only — expo-local-authentication
// is never statically imported, so Expo Go / devices without biometric
// hardware never pay an import cost or crash.
//
// Honesty: this lock is device-local only. The PIN is stored as a simple
// salted hash (never plaintext, never uploaded — there is no server), so
// it is a casual privacy screen, not bank-grade security. If the PIN is
// forgotten there is NO server reset: the only recovery is signing out,
// which clears the lock (events themselves stay on the device).
const SALT = 'midnight-lock-v1';

export function hashPin(pin: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const s = `${SALT}:${pin}`;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

export function verifyPin(pin: string, hash: string | null): boolean {
  if (!hash) return false;
  return hashPin(pin) === hash;
}

export async function biometricAvailable(): Promise<boolean> {
  try {
    const LA = await import('expo-local-authentication');
    const [hardware, enrolled] = await Promise.all([LA.hasHardwareAsync(), LA.isEnrolledAsync()]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/** Prompts the OS biometric / device-credential prompt. False on cancel/failure. */
export async function authenticateBiometric(): Promise<boolean> {
  try {
    const LA = await import('expo-local-authentication');
    const res = await LA.authenticateAsync({
      promptMessage: 'Unlock A Day Away',
      fallbackLabel: 'Use device PIN',
      cancelLabel: 'Cancel',
    });
    return res.success === true;
  } catch {
    return false;
  }
}
