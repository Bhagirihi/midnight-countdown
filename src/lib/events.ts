import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, todayISO } from './dates';
import type { Repeat } from './dates';

export type EventType = 'countdown' | 'countup';
export type VisualEffect = 'none' | 'coral-aura' | 'periwinkle-glow';
export type FontChoice = 'grotesk' | 'jakarta' | 'mono';

export interface CountdownEvent {
  id: string;
  title: string;
  dateISO: string; // YYYY-MM-DD: target for countdowns, start for count-ups
  type: EventType;
  repeat: Repeat;
  category: string;
  color: string;
  icon: string; // Ionicons name
  sticker: string; // single emoji, may be ''
  font: FontChoice;
  effect: VisualEffect;
  photoUri: string | null; // device-local image-picker URI, or null
  createdAt: string;
  // Optional, all local-only. Older saved events simply lack these and
  // load with the defaults applied in normalizeEvent().
  relationship?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactPhotoUri?: string | null;
  notes?: string;
}

/** Normalises an event loaded from storage (older saves lack new fields). */
export function normalizeEvent(e: CountdownEvent): CountdownEvent {
  return {
    ...e,
    relationship: e.relationship ?? 'Other',
    contactName: e.contactName ?? null,
    contactPhone: e.contactPhone ?? null,
    contactEmail: e.contactEmail ?? null,
    contactPhotoUri: e.contactPhotoUri ?? null,
    notes: e.notes ?? '',
  };
}

export interface GiftIdea { id: string; item: string; notes: string; link: string }
export interface SpentEntry { id: string; label: string; amount: number }
export interface PastGift { id: string; item: string; dateISO: string }
export interface Contributor { id: string; name: string; item: string; amount: number }

export interface GiftPlan {
  eventId: string;
  ideas: GiftIdea[];
  wishlistNotes: string;
  budgetPlanned: number;
  spent: SpentEntry[];
  pastGifts: PastGift[];
  contributors: Contributor[];
}

export function emptyGiftPlan(eventId: string): GiftPlan {
  return { eventId, ideas: [], wishlistNotes: '', budgetPlanned: 0, spent: [], pastGifts: [], contributors: [] };
}

export function spentTotal(plan: GiftPlan): number {
  return plan.spent.reduce((s, e) => s + (Number.isFinite(e.amount) ? e.amount : 0), 0);
}

export function remainingBudget(plan: GiftPlan): number {
  return plan.budgetPlanned - spentTotal(plan);
}

export interface StoryEntry {
  id: string;
  eventId: string;
  dateISO: string;
  text: string;
  photoUris: string[]; // hard cap 8, enforced in addStoryEntry
}

export interface LocalComment {
  id: string;
  recommendedId: string;
  text: string;
  createdAt: string;
}

export interface Settings {
  remindersEnabled: boolean;
  milestoneNotifications: boolean;
  pinnedEventId: string | null;
  /** Which widget variant the user last chose in Widgets / wizard setup. */
  widgetVariant: 'small' | 'medium' | 'large' | 'list' | 'yearDots' | 'yearLock';
  displayName: string;
  appLockEnabled: boolean;
  /** Simple salted hash of the app PIN, never the PIN itself. Null = no PIN set. */
  appLockPinHash: string | null;
}

export const RELATIONSHIPS = ['Family', 'Friend', 'Work', 'Partner', 'Other'] as const;

export function greetingTemplates(category: string): string[] {
  const c = category.toLowerCase();
  if (c === 'birthday') return [
    'Happy Birthday, {name}! Wishing you a year full of good health, laughter, and everything you have been hoping for.',
    'Happy Birthday! Hope your day is as wonderful as you are — enjoy every moment of it.',
    'Wishing you the happiest of birthdays, {name}! May this year bring you closer to everything you love.',
  ];
  if (c === 'anniversary') return [
    'Happy Anniversary! Wishing you both many more years of love, laughter, and togetherness.',
    'Happy Anniversary, {name}! Your journey together is an inspiration — here is to many more beautiful years.',
    'Congratulations on another year together! Wishing you both endless happiness.',
  ];
  if (c === 'holiday') return [
    'Happy Holidays! Wishing you a joyful celebration filled with warmth, family, and good food.',
    'Wishing you a wonderful holiday season, {name} — may it bring you peace, joy, and great company.',
  ];
  return [
    'Thinking of you today, {name}! Hope this day brings you something to smile about.',
    'Wishing you all the best for today, {name} — enjoy it!',
  ];
}

/** Warn (do not silently duplicate) when name + month/day already exists. */
export function findDuplicateEvent(
  events: CountdownEvent[],
  name: string,
  month: number,
  day: number,
): CountdownEvent | null {
  const norm = name.trim().toLowerCase();
  if (!norm) return null;
  for (const e of events) {
    const parts = e.dateISO.split('-');
    if (parts.length !== 3) continue;
    if (e.title.trim().toLowerCase() === norm && Number(parts[1]) === month && Number(parts[2]) === day) {
      return e;
    }
  }
  return null;
}

export const MAX_STORY_PHOTOS = 8;

export const EVENT_COLORS = [
  '#F7A5A5', // coral (Midnight primary)
  '#8E99F3', // periwinkle (Midnight secondary)
  '#FCE570', // butter (Midnight accent)
  '#4ADE80',
  '#38BDF8',
  '#C084FC',
  '#FB923C',
  '#F472B6',
] as const;

export const EVENT_ICONS = [
  'calendar', 'heart', 'gift', 'airplane', 'musical-notes', 'book',
  'fitness', 'leaf', 'star', 'cake', 'home', 'car',
  'trophy', 'moon', 'rocket', 'medkit',
] as const;

export const EVENT_STICKERS = ['', '🎉', '❤️', '✈️', '🎂', '🌸', '⭐', '🔥', '🎵', '📚', '💪', '🌙'] as const;

export const CATEGORIES = ['Personal', 'Birthday', 'Anniversary', 'Wedding', 'Holiday', 'Trip', 'Health', 'Work', 'Family', 'Custom', 'Other'] as const;

const EVENTS_KEY = 'midnight:events';
const STORIES_KEY = 'midnight:stories';
const COMMENTS_KEY = 'midnight:comments';
const SETTINGS_KEY = 'midnight:settings';
const WIDGET_KEY = 'midnight:widgetSnapshot';
const GIFTS_KEY = 'midnight:giftPlans';

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function saveList(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const loadEvents = async () => (await loadList<CountdownEvent>(EVENTS_KEY)).map(normalizeEvent);
export const saveEvents = (events: CountdownEvent[]) => saveList(EVENTS_KEY, events);
export const loadStories = () => loadList<StoryEntry>(STORIES_KEY);
export const saveStories = (stories: StoryEntry[]) => saveList(STORIES_KEY, stories);
export const loadComments = () => loadList<LocalComment>(COMMENTS_KEY);
export const saveComments = (comments: LocalComment[]) => saveList(COMMENTS_KEY, comments);
export const loadGiftPlans = () => loadList<GiftPlan>(GIFTS_KEY);
export const saveGiftPlans = (plans: GiftPlan[]) => saveList(GIFTS_KEY, plans);

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>;
      return {
        remindersEnabled: p.remindersEnabled !== false,
        milestoneNotifications: p.milestoneNotifications === true,
        pinnedEventId: p.pinnedEventId ?? null,
        widgetVariant: (['small', 'medium', 'large', 'list', 'yearDots', 'yearLock'] as const).includes(p.widgetVariant as never) ? (p.widgetVariant as Settings['widgetVariant']) : 'medium',
        displayName: p.displayName ?? '',
        appLockEnabled: p.appLockEnabled === true,
        appLockPinHash: p.appLockPinHash ?? null,
      };
    }
  } catch { /* fall through to defaults */ }
  return { remindersEnabled: true, milestoneNotifications: false, pinnedEventId: null, widgetVariant: 'medium', displayName: '', appLockEnabled: false, appLockPinHash: null };
}

export const saveSettings = (s: Settings) => AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

/** Enforces the 8-photo cap: extra URIs are dropped, never stored. */
export function capPhotos(uris: string[]): string[] {
  return uris.slice(0, MAX_STORY_PHOTOS);
}

/** Seed data starts empty by design. This inserts 2-3 clearly labelled
 *  EXAMPLE events only when the user taps "Add example events", and
 *  every one is deletable like any other event. Dates are relative to
 *  today so they never arrive already past. */
export function exampleEvents(today: string): CountdownEvent[] {
  const now = todayISO();
  const t = today || now;
  return [
    {
      id: newId(), title: 'EXAMPLE: Trip to the Mountains', dateISO: addDays(t, 30),
      type: 'countdown', repeat: 'none', category: 'Trip', color: '#8E99F3',
      icon: 'airplane', sticker: '✈️', font: 'grotesk', effect: 'periwinkle-glow',
      photoUri: null, createdAt: t,
    },
    {
      id: newId(), title: 'EXAMPLE: Reading Streak', dateISO: addDays(t, -42),
      type: 'countup', repeat: 'none', category: 'Personal', color: '#FCE570',
      icon: 'book', sticker: '📚', font: 'jakarta', effect: 'none',
      photoUri: null, createdAt: t,
    },
    {
      id: newId(), title: 'EXAMPLE: Monthly Book Club', dateISO: addDays(t, 12),
      type: 'countdown', repeat: 'monthly', category: 'Personal', color: '#F7A5A5',
      icon: 'book', sticker: '⭐', font: 'mono', effect: 'coral-aura',
      photoUri: null, createdAt: t,
    },
  ];
}

// ---- Recommended (social) events: SEEDED LOCAL TEMPLATES ONLY ----
// No real artists, venues, or dates. Joining one opens the editor
// prefilled with its title/category so the user picks their own date.
export interface RecommendedEvent {
  id: string;
  title: string;
  category: string;
  description: string;
}

export const RECOMMENDED_EVENTS: RecommendedEvent[] = [
  {
    id: 'rec-concert', title: 'Example: Summer Stadium Concert', category: 'Music',
    description: 'EXAMPLE ONLY — a placeholder for a big shared concert countdown. No real artist or date is attached; pick your own date when you join.',
  },
  {
    id: 'rec-album', title: 'Example: New Album Drop', category: 'Music',
    description: 'EXAMPLE ONLY — a placeholder for counting down to a shared album release. No real artist or date is attached; pick your own date when you join.',
  },
  {
    id: 'rec-film', title: 'Example: Global Film Premiere', category: 'Film',
    description: 'EXAMPLE ONLY — a placeholder for a shared premiere countdown. No real film or date is attached; pick your own date when you join.',
  },
];

// ---- Widget snapshot (data only, NOT a home-screen widget) ----
// Expo Go cannot run expo-widgets, so there is no working widget in
// this build. This JSON is what a future dev-build widget would read:
// the pinned event (or the next upcoming event) plus the next few.
export interface WidgetSnapshot {
  updatedAt: string;
  /** Pinned (or first) event, plus its next milestone and next story
   *  date when they exist — real data only, null when there is none.
   *  Older snapshots lack these fields; readers must treat them as
   *  possibly undefined. */
  pinned: { id: string; title: string; label: string; dateISO: string; color: string; milestoneLabel?: string | null; storyDateISO?: string | null } | null;
  upcoming: { id: string; title: string; label: string; dateISO: string; color: string }[];
}

export async function writeWidgetSnapshot(
  events: CountdownEvent[],
  pinnedId: string | null,
  labels: (e: CountdownEvent) => { label: string; dateISO: string },
  pinnedExtras?: (e: CountdownEvent) => { milestoneLabel: string | null; storyDateISO: string | null },
): Promise<WidgetSnapshot> {
  const toRow = (e: CountdownEvent) => {
    const l = labels(e);
    return { id: e.id, title: e.title, label: l.label, dateISO: l.dateISO, color: e.color };
  };
  const pinned = events.find((e) => e.id === pinnedId) ?? events[0] ?? null;
  const extras = pinned && pinnedExtras ? pinnedExtras(pinned) : { milestoneLabel: null, storyDateISO: null };
  const snapshot: WidgetSnapshot = {
    updatedAt: new Date().toISOString(),
    pinned: pinned ? { ...toRow(pinned), ...extras } : null,
    upcoming: events.slice(0, 5).map(toRow),
  };
  await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_KEY);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : null;
  } catch {
    return null;
  }
}
