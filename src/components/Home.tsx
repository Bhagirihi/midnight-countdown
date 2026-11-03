import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, labelStyle } from '../lib/theme';
import { countdownInfo, formatHumanDate, milestones, todayISO, turningInfo } from '../lib/dates';
import { wizardDraftToEventInput, type WizardDraft } from '../lib/wizard';
import { syncWidgets } from '../lib/widgetSync';
import type { WidgetVariant } from '../lib/widgets';
import {
  RECOMMENDED_EVENTS, capPhotos, emptyGiftPlan, exampleEvents, loadEvents, loadGiftPlans,
  loadSettings, loadStories, loadWidgetSnapshot, newId, saveEvents, saveGiftPlans,
  saveSettings, saveStories, writeWidgetSnapshot,
  type CountdownEvent, type GiftPlan, type Settings, type StoryEntry, type WidgetSnapshot,
} from '../lib/events';
import type { ImportedContact } from '../lib/contacts';
import type { ImportedCalendarEvent } from '../lib/calendarImport';
import { cancelReminders, scheduleReminders, sendImmediateNotification } from '../lib/reminders';
import EventEditor from './EventEditor';
import EventDetail, { effectBorder } from './EventDetail';
import SocialTab from './SocialTab';
import WidgetsTab from './WidgetsTab';
import SettingsTab from './SettingsTab';
import ProfileTab from './ProfileTab';
import ContactImport from './ContactImport';
import CalendarImport from './CalendarImport';
import LockScreen from './LockScreen';
import FirstEventWizard from './FirstEventWizard';

// Navigation: Home + Profile + Settings as bottom tabs. Social
// (Recommended Events) and Widgets were RELOCATED into Profile >
// Discover — not removed — and open as full sub-views with a back
// button. Add Event is never buried: a single floating + button,
// always on top of the list, plus the empty-state buttons.
type Tab = 'home' | 'profile' | 'settings';
type Filter = 'all' | 'upcoming' | 'counting' | 'repeats';
type EditorFrom = 'list' | 'detail' | 'contacts' | 'calendar' | 'social';
type ViewState = { kind: 'list' } | { kind: 'editor'; event: CountdownEvent | null; step?: number; from?: EditorFrom } | { kind: 'detail'; id: string } | { kind: 'contacts' } | { kind: 'calendar' } | { kind: 'social' } | { kind: 'widgets' };

function numeralColor(type: 'countdown' | 'countup', repeat: string, daysDiff: number, isToday: boolean): string {
  if (isToday) return colors.success;
  if (type === 'countdown' && daysDiff >= 0 && daysDiff <= 7) return colors.primary;
  if (type === 'countup' || repeat !== 'none') return colors.secondary;
  return colors.onSurface;
}

const FONT_FAMILY: Record<string, string> = {
  grotesk: fonts.grotesk,
  jakarta: fonts.jakartaBold,
  mono: fonts.mono,
};

export default function Home({
  authLabel, onReplayOnboarding, onSignOut, onResetFromZero,
}: {
  authLabel: string;
  onReplayOnboarding: () => void;
  onSignOut: () => void;
  onResetFromZero: () => void;
}) {
  const [events, setEvents] = useState<CountdownEvent[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({ remindersEnabled: true, milestoneNotifications: false, pinnedEventId: null, widgetVariant: 'medium', displayName: '', appLockEnabled: false, appLockPinHash: null });
  const [giftPlans, setGiftPlans] = useState<GiftPlan[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [snapshot, setSnapshot] = useState<WidgetSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [view, setView] = useState<ViewState>({ kind: 'list' });
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  // First-event wizard: shown on first Home load with 0 events, and
  // re-offered from the empty state after a Skip. Session-only: a
  // Skip never persists a flag that would hide the empty-state offer.
  const [showWizard, setShowWizard] = useState(false);
  const wizardFinishing = useRef(false);
  const editorBackRef = useRef<(() => boolean) | null>(null);
  const wizardBackRef = useRef<(() => boolean) | null>(null);

  const today = todayISO();

  // Android back and the browser back button follow the on-screen Back
  // path: a step inside the editor or wizard, then the screen you opened
  // this one from. At Home the press is left to the system.
  const hardwareBack = useCallback((): 'handled' | 'root' | 'exit' => {
    if (loaded && settings.appLockEnabled && !unlocked) return 'handled';
    if (showWizard) {
      if (wizardBackRef.current?.()) return 'handled';
      setShowWizard(false);
      return 'root';
    }
    if (view.kind === 'editor') {
      if (editorBackRef.current?.()) return 'handled';
      if (view.from === 'detail' && view.event) setView({ kind: 'detail', id: view.event.id });
      else if (view.from === 'contacts') setView({ kind: 'contacts' });
      else if (view.from === 'calendar') setView({ kind: 'calendar' });
      else if (view.from === 'social') setView({ kind: 'social' });
      else setView({ kind: 'list' });
      return view.from && view.from !== 'list' ? 'handled' : 'root';
    }
    if (view.kind === 'detail' || view.kind === 'contacts' || view.kind === 'calendar') {
      setView({ kind: 'list' });
      return tab === 'home' ? 'root' : 'handled';
    }
    if (view.kind === 'social' || view.kind === 'widgets') {
      setView({ kind: 'list' });
      setTab('settings');
      return 'handled';
    }
    if (tab !== 'home') {
      setTab('home');
      return 'root';
    }
    return 'exit';
  }, [loaded, settings.appLockEnabled, unlocked, showWizard, view, tab]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const atRoot = view.kind === 'list' && tab === 'home' && !showWizard && !(loaded && settings.appLockEnabled && !unlocked);
      if (!atRoot && window.history.state?.midnightBack !== 1) {
        window.history.pushState({ midnightBack: 1 }, '');
      }
      const onPop = () => {
        if (hardwareBack() === 'handled') window.history.pushState({ midnightBack: 1 }, '');
      };
      window.addEventListener('popstate', onPop);
      return () => window.removeEventListener('popstate', onPop);
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => hardwareBack() !== 'exit');
    return () => sub.remove();
  }, [hardwareBack, view.kind, tab, showWizard, loaded, settings.appLockEnabled, unlocked]);

  const refreshSnapshot = useCallback(async (list: CountdownEvent[], s: Settings, storyList: StoryEntry[]) => {
    const snap = await writeWidgetSnapshot(list, s.pinnedEventId, (e) => {
      const info = countdownInfo(e.dateISO, e.type, e.repeat, today);
      return { label: info.label, dateISO: info.targetISO };
    }, (e) => {
      const nextMilestone = milestones(e.dateISO, e.type, e.repeat, today).find((m) => m.daysAway >= 0);
      const nextStory = storyList
        .filter((st) => st.eventId === e.id && st.dateISO >= today)
        .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1))[0];
      return { milestoneLabel: nextMilestone ? nextMilestone.label : null, storyDateISO: nextStory ? nextStory.dateISO : null };
    });
    setSnapshot(snap);
    // Best effort only: in Expo Go this returns updated:false and the
    // app carries on. In a dev build it pushes real snapshot props
    // into all four widget definitions.
    await syncWidgets(snap);
  }, [today]);

  useEffect(() => {
    (async () => {
      const [ev, st, se, snap, gp] = await Promise.all([
        loadEvents(), loadStories(), loadSettings(), loadWidgetSnapshot(), loadGiftPlans(),
      ]);
      setEvents(ev); setStories(st); setSettings(se); setSnapshot(snap); setGiftPlans(gp);
      setLoaded(true);
      if (ev.length === 0) {
        setShowWizard(true);
      } else {
        await refreshSnapshot(ev, se, st);
      }
    })();
  }, [refreshSnapshot]);

  const persistEvents = async (list: CountdownEvent[]) => {
    setEvents(list);
    await saveEvents(list);
    await refreshSnapshot(list, settings, stories);
  };

  // Wizard Finish — the ONLY place a wizard event is created, guarded
  // so a double-tap or a back/forward pass can never duplicate it.
  const finishWizard = async (draft: WizardDraft) => {
    if (wizardFinishing.current) return;
    wizardFinishing.current = true;
    const input = wizardDraftToEventInput(draft, today);
    const event: CountdownEvent = {
      id: newId(), ...input, font: 'grotesk', effect: 'none',
      relationship: 'Other', contactName: null, contactPhone: null, contactEmail: null, contactPhotoUri: null, notes: '',
    };
    const list = [...events, event];
    const s = { ...settings, widgetVariant: draft.widgetVariant, pinnedEventId: event.id };
    setSettings(s);
    await saveSettings(s);
    setEvents(list);
    await saveEvents(list);
    await refreshSnapshot(list, s, stories);
    if (settings.remindersEnabled) {
      await scheduleReminders(event, today, settings.milestoneNotifications);
    }
    await sendImmediateNotification(
      'Event added',
      `${event.title} is now counting. We'll remind you at D-7, D-3, D-1 and on the day.`,
    );
    setShowWizard(false);
    setTab('home');
    setView({ kind: 'list' });
  };

  const persistGiftPlan = async (plan: GiftPlan) => {
    const list = giftPlans.some((p) => p.eventId === plan.eventId)
      ? giftPlans.map((p) => (p.eventId === plan.eventId ? plan : p))
      : [...giftPlans, plan];
    setGiftPlans(list);
    await saveGiftPlans(list);
  };


  const renderEvent = ({ e, info }: { e: CountdownEvent; info: ReturnType<typeof countdownInfo> }) => {
    const turning = turningInfo(e.dateISO, e.category, e.repeat, today);
    const tone = numeralColor(e.type, e.repeat, info.daysDiff, info.isToday);
    const when = e.type === 'countup' ? `Since ${formatHumanDate(e.dateISO, today)}` : formatHumanDate(info.targetISO, today);
    const label = info.isToday && e.type === 'countdown' ? 'Today' : info.label;
    const isNext = nextUp?.e.id === e.id;
    return (
      <Pressable
        key={e.id}
        onPress={() => setView({ kind: 'detail', id: e.id })}
        style={[styles.eventCard, e.effect !== 'none' ? effectBorder(e.effect, e.color) : null]}
      >
        <View style={styles.eventCardBody}>
          {e.photoUri ? (
            <Image source={{ uri: e.photoUri }} style={styles.cardThumb} resizeMode="cover" />
          ) : null}
          <View style={styles.rowCardCopy}>
            {isNext ? <Text style={styles.nextMark}>NEXT</Text> : null}
            <Text style={styles.eventCardTitle} numberOfLines={1}>{e.title}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>{when} · {e.category}</Text>
            {turning ? <Text style={styles.cardBanner}>{turning.label}</Text> : null}
          </View>
          <Text style={[styles.eventCardBig, { color: tone, fontFamily: FONT_FAMILY[e.font] ?? fonts.grotesk }]}>
            {label}
          </Text>
        </View>
      </Pressable>
    );
  };

  const findOn = events.length > 5;
  const filtered = useMemo(() => {
    const q = findOn ? query.trim().toLowerCase() : '';
    const active = findOn ? filter : 'all';
    const withInfo = events.map((e) => ({ e, info: countdownInfo(e.dateISO, e.type, e.repeat, today) }));
    const kept = withInfo.filter(({ e, info }) => {
      if (q && !e.title.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
      if (active === 'upcoming') return e.type === 'countdown' && info.daysDiff >= 0;
      if (active === 'counting') return e.type === 'countup';
      if (active === 'repeats') return e.repeat !== 'none';
      return true;
    });
    // Upcoming first (by target), then past, each by date.
    kept.sort((a, b) => {
      const aPast = a.e.type === 'countdown' && a.info.daysDiff < 0 ? 1 : 0;
      const bPast = b.e.type === 'countdown' && b.info.daysDiff < 0 ? 1 : 0;
      if (aPast !== bPast) return aPast - bPast;
      return a.info.targetISO < b.info.targetISO ? -1 : 1;
    });
    return kept;
  }, [events, filter, query, today, findOn]);

  const nextUp = useMemo(() => {
    if (findOn && (filter !== 'all' || query.trim())) return null;
    return filtered
      .filter(({ e, info }) => e.type === 'countdown' && info.daysDiff >= 0)
      .sort((a, b) => a.info.daysDiff - b.info.daysDiff)[0] ?? null;
  }, [filtered, filter, query, findOn]);
  // App-lock gate: enforced inside Home so the splash/onboarding/auth
  // flow in App.tsx is untouched. Unlocking lasts for this session only.
  if (loaded && settings.appLockEnabled && !unlocked) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <LockScreen
          pinHash={settings.appLockPinHash}
          onUnlock={() => setUnlocked(true)}
          onSignOutAndClear={async () => {
            const s = { ...settings, appLockEnabled: false, appLockPinHash: null };
            setSettings(s);
            await saveSettings(s);
            onSignOut();
          }}
        />
      </SafeAreaView>
    );
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.wrap}>
        <Text style={styles.loading}>Loading your countdowns…</Text>
      </SafeAreaView>
    );
  }

  // First-event wizard replaces the empty Home (never an empty list
  // with no path forward). Skip creates nothing and lands on Home.
  if (showWizard && events.length === 0) {
    return (
      <FirstEventWizard
        onFinish={finishWizard}
        onSkip={() => setShowWizard(false)}
        onBindBack={(fn) => { wizardBackRef.current = fn; }}
      />
    );
  }

  // --- Sub-views (editor / detail) replace the tab bar while open ---
  if (view.kind === 'editor') {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <EventEditor
          eventsForDedupe={events}
          initial={view.event}
          startStep={view.step}
          onBindBack={(fn) => { editorBackRef.current = fn; }}
          onCancel={() => {
            if (view.from === 'detail' && view.event) setView({ kind: 'detail', id: view.event.id });
            else if (view.from === 'contacts') setView({ kind: 'contacts' });
            else if (view.from === 'calendar') setView({ kind: 'calendar' });
            else if (view.from === 'social') setView({ kind: 'social' });
            else setView({ kind: 'list' });
          }}
          onSave={async (saved) => {
            // Not just !view.event: contact/calendar imports open the
            // editor with a prefilled draft that is not in the list yet.
            // Append in that case — the old map-only branch silently
            // dropped imported events (their id was not in the list).
            const isNew = !events.some((e) => e.id === saved.id);
            const list = isNew
              ? [...events, saved]
              : events.map((e) => (e.id === saved.id ? saved : e));
            await persistEvents(list);
            if (settings.remindersEnabled) {
              // All types: scheduleReminders itself decides (count-ups
              // only get reminders when milestone notifications are on).
              await scheduleReminders(saved, today, settings.milestoneNotifications);
            }
            if (isNew) {
              await sendImmediateNotification(
                'Event added',
                `${saved.title} is now counting. We'll remind you at D-7, D-3, D-1 and on the day.`,
              );
            }
            setView({ kind: 'detail', id: saved.id });
          }}
        />
      </SafeAreaView>
    );
  }

  if (view.kind === 'detail') {
    const event = events.find((e) => e.id === view.id);
    if (!event) {
      setView({ kind: 'list' });
      return null;
    }
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <EventDetail
          event={event}
          eventCount={events.length}
          stories={stories.filter((s) => s.eventId === event.id)}
          giftPlan={giftPlans.find((p) => p.eventId === event.id) ?? emptyGiftPlan(event.id)}
          onSaveGiftPlan={persistGiftPlan}
          onBack={() => setView({ kind: 'list' })}
          onEdit={() => setView({ kind: 'editor', event, step: 1, from: 'detail' })}
          onCustomize={() => setView({ kind: 'editor', event, step: 3, from: 'detail' })}
          onChangePhoto={async (uri) => {
            await persistEvents(events.map((e) => (e.id === event.id ? { ...e, photoUri: uri } : e)));
          }}
          onDelete={async () => {
            const list = events.filter((e) => e.id !== event.id);
            await persistEvents(list);
            const keptStories = stories.filter((s) => s.eventId !== event.id);
            setStories(keptStories);
            await saveStories(keptStories);
            const keptPlans = giftPlans.filter((p) => p.eventId !== event.id);
            setGiftPlans(keptPlans);
            await saveGiftPlans(keptPlans);
            await cancelReminders(event.id);
            setView({ kind: 'list' });
          }}
          onAddStory={async (text, dateISO, photoUris) => {
            const entry: StoryEntry = { id: newId(), eventId: event.id, dateISO, text, photoUris: capPhotos(photoUris) };
            const list = [...stories, entry];
            setStories(list);
            await saveStories(list);
          }}
          onDeleteStory={async (id) => {
            const list = stories.filter((s) => s.id !== id);
            setStories(list);
            await saveStories(list);
          }}
          onSchedule={async () => {
            const res = await scheduleReminders(event, today, settings.milestoneNotifications);
            return res.note;
          }}
        />
      </SafeAreaView>
    );
  }

  if (view.kind === 'contacts') {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <ContactImport
          events={events}
          onBack={() => setView({ kind: 'list' })}
          onPick={(c: ImportedContact) => {
            setView({
              kind: 'editor',
              from: 'contacts',
              event: {
                id: newId(), title: c.name, dateISO: c.birthdayISO ?? today, type: 'countdown',
                repeat: 'yearly', category: 'Birthday', color: '#F7A5A5', icon: 'gift', sticker: '🎂',
                font: 'grotesk', effect: 'none', photoUri: null, createdAt: today,
                relationship: 'Other', contactName: c.name, contactPhone: c.phone,
                contactEmail: c.email, contactPhotoUri: c.imageUri, notes: c.birthdayYearKnown ? '' : 'Year not on file in contacts — check the date.',
              },
            });
          }}
        />
      </SafeAreaView>
    );
  }

  if (view.kind === 'calendar') {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <CalendarImport
          onBack={() => setView({ kind: 'list' })}
          onPick={(e: ImportedCalendarEvent) => {
            setView({
              kind: 'editor',
              from: 'calendar',
              event: {
                id: newId(), title: e.title, dateISO: e.dateISO, type: 'countdown',
                repeat: 'none', category: 'Custom', color: '#8E99F3', icon: 'calendar', sticker: '',
                font: 'grotesk', effect: 'none', photoUri: null, createdAt: today,
                relationship: 'Other', contactName: null, contactPhone: null,
                contactEmail: null, contactPhotoUri: null, notes: 'Imported from a device calendar event.',
              },
            });
          }}
        />
      </SafeAreaView>
    );
  }

  // Relocated Discover sections: full sub-views with a back button,
  // reached from Profile > Discover. Tab bar is hidden while open.
  if (view.kind === 'social') {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <SocialTab
          onBack={() => { setView({ kind: 'list' }); setTab('settings'); }}
          onUse={(recId) => {
            const rec = RECOMMENDED_EVENTS.find((r) => r.id === recId);
            if (!rec) return;
            setView({
              kind: 'editor',
              from: 'social',
              event: {
                id: newId(), title: rec.title, dateISO: today, type: 'countdown', repeat: 'none',
                category: rec.category, color: '#8E99F3', icon: 'star', sticker: '', font: 'grotesk',
                effect: 'none', photoUri: null, createdAt: today,
              },
            });
          }}
        />
      </SafeAreaView>
    );
  }

  if (view.kind === 'widgets') {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <WidgetsTab
          events={events}
          settings={settings}
          snapshot={snapshot}
          onBack={() => { setView({ kind: 'list' }); setTab('settings'); }}
          onPin={async (id) => {
            const s = { ...settings, pinnedEventId: id };
            setSettings(s);
            await saveSettings(s);
            await refreshSnapshot(events, s, stories);
          }}
          onVariant={async (v: WidgetVariant) => {
            const s = { ...settings, widgetVariant: v };
            setSettings(s);
            await saveSettings(s);
            if (snapshot) await syncWidgets(snapshot);
          }}
        />
      </SafeAreaView>
    );
  }

  // (Joining a recommended event is handled inline in the 'social'
  // sub-view above, with the same prefill: template title/category,
  // user picks their own date. Nothing there claims a real event date.)
  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      {tab === 'home' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 }}>
          <View style={styles.headerRow}>
            <Text style={styles.dateLine}>{formatHumanDate(today).toUpperCase()}</Text>
            <Pressable style={styles.monogram} onPress={() => { setTab('profile'); setView({ kind: 'list' }); }} hitSlop={8}>
              <Text style={styles.monogramText}>{(settings.displayName.trim() || 'G').slice(0, 1).toUpperCase()}</Text>
            </Pressable>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.heading}>A Day Away</Text>
            <Pressable onPress={() => setView({ kind: 'editor', event: null, from: 'list' })} hitSlop={8}>
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>

          {findOn ? (
            <>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search events or categories…"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <View style={styles.row}>
                {(['all', 'upcoming', 'counting', 'repeats'] as Filter[]).map((f) => (
                  <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipOn]}>
                    <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>
                      {f === 'all' ? 'All' : f === 'upcoming' ? 'Upcoming' : f === 'counting' ? 'Counting up' : 'Repeats'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing yet.</Text>
              <Text style={styles.emptyText}>A birthday, a trip, a day you are counting toward.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => setShowWizard(true)}>
                <Text style={styles.primaryBtnText}>BEGIN</Text>
              </Pressable>
              <View style={styles.emptyLinks}>
                <Pressable onPress={async () => {
                  const added = exampleEvents(today);
                  await persistEvents(added);
                  await sendImmediateNotification('Example events added', `${added.length} example events are now counting.`);
                }}>
                  <Text style={styles.emptyLink}>Examples</Text>
                </Pressable>
                <Text style={styles.emptyDot}>·</Text>
                <Pressable onPress={() => setView({ kind: 'contacts' })}>
                  <Text style={styles.emptyLink}>Contacts</Text>
                </Pressable>
                <Text style={styles.emptyDot}>·</Text>
                <Pressable onPress={() => setView({ kind: 'calendar' })}>
                  <Text style={styles.emptyLink}>Calendar</Text>
                </Pressable>
              </View>
            </View>
          ) : filtered.length === 0 ? (
            <Text style={styles.hint}>Nothing matches this filter / search.</Text>
          ) : filter === 'all' && !query.trim() ? (
            <>
              {([
                { title: 'This week', items: filtered.filter(({ e, info }) => e.type === 'countdown' && info.daysDiff >= 0 && info.daysDiff <= 7) },
                { title: 'This month', items: filtered.filter(({ e, info }) => e.type === 'countdown' && info.daysDiff > 7 && info.daysDiff <= 30) },
                { title: 'Later', items: filtered.filter(({ e, info }) => e.type === 'countdown' && info.daysDiff > 30) },
                { title: 'Counting up', items: filtered.filter(({ e }) => e.type === 'countup') },
                { title: 'Past', items: filtered.filter(({ e, info }) => e.type === 'countdown' && info.daysDiff < 0) },
              ] as const).map((bucket) => bucket.items.length === 0 ? null : (
                <View key={bucket.title}>
                  <Text style={styles.bucketTitle}>{bucket.title}</Text>
                  <View style={styles.cardStack}>{bucket.items.map(renderEvent)}</View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.cardStack}>{filtered.map(renderEvent)}</View>
          )}

        </ScrollView>
      ) : tab === 'profile' ? (
        <ProfileTab
          settings={settings}
          authLabel={authLabel}
          onToggle={async (patch) => {
            const s = { ...settings, ...patch };
            setSettings(s);
            await saveSettings(s);
          }}
          onReplayOnboarding={onReplayOnboarding}
          onSignOut={onSignOut}
          onResetFromZero={onResetFromZero}
        />
      ) : (
        <SettingsTab
          settings={settings}
          authLabel={authLabel}
          onToggle={async (patch) => {
            const s = { ...settings, ...patch };
            setSettings(s);
            await saveSettings(s);
          }}
          onOpenSocial={() => setView({ kind: 'social' })}
          onOpenWidgets={() => setView({ kind: 'widgets' })}
        />
      )}

      <View style={styles.tabBar}>
        {([
          { key: 'home', label: 'Home' },
          { key: 'profile', label: 'Profile' },
          { key: 'settings', label: 'Settings' },
        ] as const).map((t) => (
          <Pressable key={t.key} onPress={() => { setTab(t.key); setView({ kind: 'list' }); }} style={styles.tabBtn}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelOn]}>{t.label}</Text>
            <View style={[styles.tabMark, tab === t.key && styles.tabMarkOn]} />
          </Pressable>
        ))}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  loading: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLine: { ...labelStyle, fontSize: 11, letterSpacing: 1.8, color: colors.onSurfaceVariant },
  monogram: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  monogramText: { fontFamily: fonts.grotesk, fontSize: 14, color: colors.onSurface },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.grotesk, fontSize: 34, letterSpacing: -0.6, color: colors.onSurface, marginTop: 10 },
  addText: { ...labelStyle, fontSize: 12, letterSpacing: 1.8, color: colors.primary, marginBottom: 6 },
  cardStack: { gap: 8, marginTop: 18 },
  eventCard: {
    backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  eventCardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  eventCardTitle: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface },
  eventCardBig: { fontFamily: fonts.grotesk, fontSize: 22, lineHeight: 26, letterSpacing: -0.4, textAlign: 'right' },
  nextMark: { ...labelStyle, fontSize: 10, letterSpacing: 1.6, color: colors.primary, marginBottom: 2 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  search: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 13 },
  chipTextOn: { color: colors.background, fontFamily: fonts.jakartaBold },
  empty: { marginTop: 48 },
  emptyTitle: { fontFamily: fonts.grotesk, fontSize: 32, color: colors.onSurface },
  emptyText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurfaceVariant, lineHeight: 22, marginTop: 8 },
  emptyLinks: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  emptyLink: { ...labelStyle, fontSize: 11, letterSpacing: 1.4, color: colors.accent },
  emptyDot: { color: colors.onSurfaceVariant, fontSize: 14 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 16, lineHeight: 20 },
  rowCardCopy: { flex: 1 },
  cardThumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.surfaceAlt },
  cardMeta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 3 },
  cardBanner: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.accent, marginTop: 4 },
  bucketTitle: { ...labelStyle, fontSize: 11, letterSpacing: 1.8, color: colors.onSurfaceVariant, marginTop: 28 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 26, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 22, paddingHorizontal: 28, alignSelf: 'flex-start' },
  primaryBtnText: { ...labelStyle, fontSize: 12, letterSpacing: 2.2, color: colors.onPrimary },
  tabBar: { zIndex: 2, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background, paddingTop: 10, paddingBottom: 6 },
  tabBtn: { flex: 1, alignItems: 'center', gap: 6 },
  tabLabel: { ...labelStyle, fontSize: 11, letterSpacing: 1.2, color: colors.onSurfaceVariant },
  tabLabelOn: { color: colors.onSurface },
  tabMark: { width: 16, height: 1, backgroundColor: 'transparent' },
  tabMarkOn: { backgroundColor: colors.accent },
});
