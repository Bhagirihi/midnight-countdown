import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import StartupSplash from './src/components/StartupSplash';
import Onboarding from './src/components/Onboarding';
import AuthScreen from './src/components/AuthScreen';
import Home from './src/components/Home';
import { colors } from './src/lib/theme';
import {
  loadProgress,
  markOnboardingSeen,
  replayOnboarding,
  resetAllData,
  setGuest,
  setLocalEmail,
  signOut,
  type AuthChoice,
} from './src/lib/storage';

SplashScreen.preventAutoHideAsync();

type Screen = 'splash' | 'onboarding' | 'auth' | 'home';

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    SpaceGrotesk_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    JetBrainsMono_500Medium,
  });
  const [screen, setScreen] = useState<Screen>('splash');
  const [authChoice, setAuthChoice] = useState<AuthChoice>(null);
  const [localEmail, setLocalEmail] = useState<string | null>(null);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [nextScreen, setNextScreen] = useState<Screen | null>(null);

  // Drop the native splash as soon as this tree paints. Keeping it up for
  // the whole delay covers the branded splash, so the logo never appears.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    const fallback = setTimeout(() => {
      setNextScreen((current) => current ?? 'onboarding');
      setMinTimeElapsed(true);
    }, 8000);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  // Cold-start routing. The branded splash stays until both this and the
  // 2s timer above have finished. Root-mount only, so a resume does not
  // show the splash again.
  useEffect(() => {
    if (!fontsLoaded && !fontsError) return;
    let cancelled = false;
    loadProgress()
      .then((progress) => {
        if (cancelled) return;
        setAuthChoice(progress.authChoice);
        setLocalEmail(progress.localEmail);
        setNextScreen(
          !progress.onboardingSeen ? 'onboarding' : !progress.authChoice ? 'auth' : 'home',
        );
      })
      .catch(() => {
        if (!cancelled) setNextScreen('onboarding');
      });
    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, fontsError]);

  useEffect(() => {
    if (!minTimeElapsed || !nextScreen) return;
    setScreen((current) => (current === 'splash' ? nextScreen : current));
  }, [minTimeElapsed, nextScreen]);

  const goHomeAsGuest = useCallback(async () => {
    await setGuest();
    setAuthChoice('guest');
    setLocalEmail(null);
    setScreen('home');
  }, []);

  const goHomeWithEmail = useCallback(async (email: string) => {
    await setLocalEmail(email);
    setAuthChoice('local-email');
    setLocalEmail(email);
    setScreen('home');
  }, []);

  const finishOnboarding = useCallback(async () => {
    await markOnboardingSeen();
    setScreen(authChoice ? 'home' : 'auth');
  }, [authChoice]);

  const doReplayOnboarding = useCallback(async () => {
    await replayOnboarding();
    setScreen('onboarding');
  }, []);

  const doSignOut = useCallback(async () => {
    await signOut();
    setAuthChoice(null);
    setLocalEmail(null);
    setScreen('auth');
  }, []);

  const doResetFromZero = useCallback(async () => {
    await resetAllData();
    setAuthChoice(null);
    setLocalEmail(null);
    setScreen('onboarding');
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      {screen === 'splash' ? (
        <StartupSplash />
      ) : screen === 'onboarding' ? (
        <Onboarding onDone={finishOnboarding} />
      ) : screen === 'auth' ? (
        <AuthScreen onGuest={goHomeAsGuest} onLocalEmail={goHomeWithEmail} />
      ) : (
        <Home
          authLabel={authChoice === 'local-email' && localEmail ? localEmail.toUpperCase() : 'GUEST'}
          onReplayOnboarding={doReplayOnboarding}
          onSignOut={doSignOut}
          onResetFromZero={doResetFromZero}
        />
      )}
      </View>
    </SafeAreaProvider>
  );
}
