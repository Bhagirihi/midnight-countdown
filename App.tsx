import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  loadProgress,
  markOnboardingSeen,
  replayOnboarding,
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
  const startedAt = useRef(Date.now());
  const splashDone = useRef(false);

  // Cold-start routing + splash gating, run once on mount.
  // Splash hides only when: fonts settled AND stored progress loaded AND
  // >= 1.2s elapsed. A 5s fallback guarantees it can never hang the app.
  // This state lives in the root mount only, so resuming from background
  // never re-shows the splash.
  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => finish('onboarding'), 5000);
    async function finish(fallbackScreen: Screen) {
      if (splashDone.current || cancelled) return;
      splashDone.current = true;
      clearTimeout(fallback);
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Native splash already hidden — in-app splash still unmounts below.
      }
      setScreen((current) => (current === 'splash' ? fallbackScreen : current));
    }
    async function boot() {
      const progress = await loadProgress();
      if (cancelled) return;
      setAuthChoice(progress.authChoice);
      setLocalEmail(progress.localEmail);
      const next: Screen = !progress.onboardingSeen
        ? 'onboarding'
        : !progress.authChoice
          ? 'auth'
          : 'home';
      const wait = Math.max(0, 1200 - (Date.now() - startedAt.current));
      setTimeout(() => finish(next), wait);
    }
    // Wait for fonts to settle (success or error) before routing, so the
    // splash never hands off to a screen rendering in fallback fonts.
    if (fontsLoaded || fontsError) {
      boot().catch(() => finish('onboarding'));
    }
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [fontsLoaded, fontsError]);

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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
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
        />
      )}
      {/* Keep a mounted View so the tree never renders empty during transitions. */}
      <View style={{ height: 0 }} />
    </SafeAreaProvider>
  );
}
