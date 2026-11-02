import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthChoice = 'guest' | 'local-email' | null;

const ONBOARDING_KEY = 'midnight:onboardingSeen';
const AUTH_CHOICE_KEY = 'midnight:authChoice';
const EMAIL_KEY = 'midnight:localEmail';

export async function loadProgress(): Promise<{
  onboardingSeen: boolean;
  authChoice: AuthChoice;
  localEmail: string | null;
}> {
  const [seen, choice, email] = await Promise.all([
    AsyncStorage.getItem(ONBOARDING_KEY),
    AsyncStorage.getItem(AUTH_CHOICE_KEY),
    AsyncStorage.getItem(EMAIL_KEY),
  ]);
  return {
    onboardingSeen: seen === '1',
    authChoice: choice === 'guest' || choice === 'local-email' ? choice : null,
    localEmail: email,
  };
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}

export async function setGuest(): Promise<void> {
  await AsyncStorage.setItem(AUTH_CHOICE_KEY, 'guest');
  await AsyncStorage.removeItem(EMAIL_KEY);
}

export async function setLocalEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_CHOICE_KEY, 'local-email');
  await AsyncStorage.setItem(EMAIL_KEY, email);
}

export async function replayOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_CHOICE_KEY);
  await AsyncStorage.removeItem(EMAIL_KEY);
}

/** Start from zero: deletes EVERYTHING this app stored on this device —
 *  events, stories, gift plans, comments, settings, widget snapshot,
 *  display name, app-lock, onboarding progress and sign-in choice.
 *  There is no cloud backup, so this cannot be undone. Only keys
 *  namespaced 'midnight:' are removed; nothing else on the device
 *  is touched. */
export async function resetAllData(): Promise<void> {
  const all = await AsyncStorage.getAllKeys();
  const ours = all.filter((k) => k.startsWith('midnight:'));
  if (ours.length > 0) await AsyncStorage.multiRemove(ours);
}
