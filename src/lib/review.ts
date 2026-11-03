// In-app rating prompt — asked ONLY at a "right moment", never on
// first open, never after a failure, never on a nag loop.
//
// Right moments (callers in EventDetail):
//   - user just copied a greeting template (a delight moment: the app
//     just helped them say something nice)
//   - user just shared a group gift plan (same: the app just did
//     something useful for a real celebration)
//
// Gates, all of which must pass before the prompt shows:
//   - at least 3 events in the app (a real user, not a first-timer)
//   - at least 3 days since the first time a right moment happened
//     (firstSeen is set on the first right moment, so a brand-new
//     user can never be asked on day one)
//   - never asked in the last 90 days
//   - never asked more than twice in total
//   - user never tapped "Don't ask again"
//
// The prompt itself is a plain Alert that opens the Google Play
// listing (package com.adayaway.app). That link only resolves once
// the app is actually live on Play — until then the button opens a
// page that does not exist yet, which is why this is wired to
// success moments only and never blocks saving, copying or sharing.
// No new dependency: expo-store-review would need a dev build to
// test and adds a native module; a store link works in Expo Go too.
// State lives under the existing midnight: key prefix so Start
// from zero (which wipes midnight:* keys) also resets review state.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';

const KEY = 'midnight:review';
const MIN_EVENTS = 3;
const MIN_DAYS_SINCE_FIRST = 3;
const COOLDOWN_DAYS = 90;
const MAX_ASKS = 2;
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.adayaway.app';

type ReviewState = {
  firstSeen: string | null; // ISO date of the first right moment
  asks: number;
  lastAsked: string | null; // ISO date
  neverAsk: boolean;
};

async function loadState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ReviewState;
  } catch {
    // fall through to defaults
  }
  return { firstSeen: null, asks: 0, lastAsked: null, neverAsk: false };
}

async function saveState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // review state is best-effort; never break the feature that called us
  }
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

/** Call after a right moment (greeting copied / gift plan shared). Shows nothing unless every gate passes. */
export async function maybeAskForReview(eventCount: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const state = await loadState();
  if (state.neverAsk || state.asks >= MAX_ASKS) return;
  if (!state.firstSeen) {
    // First right moment ever: record it, do NOT ask yet. The user
    // becomes eligible only after MIN_DAYS_SINCE_FIRST days.
    await saveState({ ...state, firstSeen: today });
    return;
  }
  if (eventCount < MIN_EVENTS) return;
  if (daysBetween(state.firstSeen, today) < MIN_DAYS_SINCE_FIRST) return;
  if (state.lastAsked && daysBetween(state.lastAsked, today) < COOLDOWN_DAYS) return;

  await saveState({ ...state, asks: state.asks + 1, lastAsked: today });
  Alert.alert(
    'Enjoying A Day Away?',
    'If A Day Away helped you keep a big day in view, a rating on Google Play helps others find it.',
    [
      { text: 'Rate on Play', onPress: () => { void Linking.openURL(PLAY_URL); } },
      { text: 'Later', style: 'cancel' },
      {
        text: "Don't ask again",
        onPress: () => { void saveState({ ...state, asks: state.asks + 1, lastAsked: today, neverAsk: true }); },
      },
    ],
  );
}
