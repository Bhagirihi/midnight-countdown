import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../lib/theme';
import { countdownInfo, milestones, todayISO, turningInfo } from '../lib/dates';
import { wizardDraftToEventInput, type WizardDraft } from '../lib/wizard';
import { syncWidgets } from '../lib/widgetSync';
import type { WidgetVariant } from '../lib/widgets';
import {
  RECOMMENDED_EVENTS, capPhotos, emptyGiftPlan, exampleEvents, loadComments, loadEvents, loadGiftPlans,
  loadSettings, loadStories, loadWidgetSnapshot, newId, saveComments, saveEvents, saveGiftPlans,
  saveSettings, saveStories, writeWidgetSnapshot,
  type CountdownEvent, type GiftPlan, type LocalComment, type Settings, type StoryEntry, type WidgetSnapshot,
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
type ViewState = { kind: 'list' } | { kind: 'editor'; event: CountdownEvent | null } | { kind: 'detail'; id: string } | { kind: 'contacts' } | { kind: 'calendar' } | { kind: 'social' } | { kind: 'widgets' };

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
  const [comments, setComments] = useState<LocalComment[]>([]);
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

  const today = todayISO();

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
      const [ev, st, cm, se, snap, gp] = await Promise.all([
        loadEvents(), loadStories(), loadComments(), loadSettings(), loadWidgetSnapshot(), loadGiftPlans(),
      ]);
      setEvents(ev); setStories(st); setComments(cm); setSettings(se); setSnapshot(snap); setGiftPlans(gp);
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
      id: newId(), ...input, font: 'grotesk', effect: 'none', photoUri: null,
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


  const insets = useSafeAreaInsets();

  // Shared event card, used by both the bucket grid and the filtered
  // grid — one card definition, so a change lands everywhere.
  const renderCard = ({ e, info }: { e: CountdownEvent; info: ReturnType<typeof countdownInfo> }) => {
    const turning = turningInfo(e.dateISO, e.category, e.repeat, today);
    return (
      <Pressable key={e.id} onPress={() => setView({ kind: 'detail', id: e.id })} style={[styles.card, effectBorder(e.effect, e.color)]}>
        <View style={styles.cardRow}>
          <Ionicons name={e.icon as never} size={20} color={e.color} />
          {e.sticker ? <Text style={styles.sticker}>{e.sticker}</Text> : null}
          <Text style={styles.cardCategory} numberOfLines={1}>{e.category.toUpperCase()}{e.repeat !== 'none' ? ` · ${e.repeat}` : ''}</Text>
        </View>
        <Text style={[styles.cardBig, { fontFamily: FONT_FAMILY[e.font] ?? fonts.grotesk }]}>{info.label}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{e.title}</Text>
        {turning ? <Text style={styles.cardBanner}>🎉 {turning.label}</Text> : null}
        <Text style={styles.cardMeta}>{e.type === 'countup' ? `Since ${e.dateISO}` : info.targetISO}{info.isToday ? ' · Today!' : ''}</Text>
      </Pressable>
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withInfo = events.map((e) => ({ e, info: countdownInfo(e.dateISO, e.type, e.repeat, today) }));
    const kept = withInfo.filter(({ e, info }) => {
      if (q && !e.title.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
      if (filter === 'upcoming') return e.type === 'countdown' && info.daysDiff >= 0;
      if (filter === 'counting') return e.type === 'countup';
      if (filter === 'repeats') return e.repeat !== 'none';
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
  }, [events, filter, query, today]);
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
          onCancel={() => setView({ kind: 'list' })}
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
          stories={stories.filter((s) => s.eventId === event.id)}
          giftPlan={giftPlans.find((p) => p.eventId === event.id) ?? emptyGiftPlan(event.id)}
          onSaveGiftPlan={persistGiftPlan}
          onBack={() => setView({ kind: 'list' })}
          onEdit={() => setView({ kind: 'editor', event })}
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
              event: {
                id: newId(), title: c.name, dateISO: c.birthdayISO ?? today, type: 'countdown',
                repeat: 'yearly', category: 'Birthday', color: '#F7A5A5', icon: 'cake', sticker: '🎂',
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
          comments={comments}
          onBack={() => { setView({ kind: 'list' }); setTab('settings'); }}
          onJoin={(recId) => {
            const rec = RECOMMENDED_EVENTS.find((r) => r.id === recId);
            if (!rec) return;
            setView({
              kind: 'editor',
              event: {
                id: newId(), title: rec.title, dateISO: today, type: 'countdown', repeat: 'none',
                category: rec.category, color: '#8E99F3', icon: 'star', sticker: '', font: 'grotesk',
                effect: 'none', photoUri: null, createdAt: today,
              },
            });
          }}
          onAddComment={async (recId, text) => {
            const c: LocalComment = { id: newId(), recommendedId: recId, text, createdAt: today };
            const list = [...comments, c];
            setComments(list);
            await saveComments(list);
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
          <Text style={styles.greeting}>MIDNIGHT COUNTDOWN</Text>
          {/* Dashboard top shows a Profile icon (not the settings gear):
              tapping it opens the Profile tab. Settings still has its
              own footer tab, so nothing is lost. */}
          <View style={styles.headerRow}>
            <Text style={[styles.heading, { flex: 1 }]}>Your countdowns</Text>
            <Pressable style={styles.gearBtn} onPress={() => { setTab('profile'); setView({ kind: 'list' }); }} hitSlop={8}>
              <Ionicons name="person-circle-outline" size={28} color={colors.onSurface} />
            </Pressable>
          </View>
          <Text style={styles.meta}>{authLabel} · {events.length} event{events.length === 1 ? '' : 's'} · offline, on this device</Text>
          {/* The big header "+ Add event" button is gone — the floating
              button below is now the single way to add, so the list
              itself gets the freed vertical space. */}

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

          {events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No events yet. Run the 5-step first-event setup, add one directly, or try clearly labelled examples you can delete.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => setShowWizard(true)}>
                <Text style={styles.primaryBtnText}>Set up my first event (5 steps)</Text>
              </Pressable>
              <Pressable
                style={styles.primaryBtn}
                onPress={async () => {
                  const added = exampleEvents(today);
                  await persistEvents(added);
                  // One summary notification for the batch, not one per event.
                  await sendImmediateNotification('Example events added', `${added.length} example events are now counting.`);
                }}
              >
                <Text style={styles.primaryBtnText}>Add example events</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => setView({ kind: 'contacts' })}>
                <Text style={styles.primaryBtnText}>Import from contacts</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => setView({ kind: 'calendar' })}>
                <Text style={styles.primaryBtnText}>Import from device calendar</Text>
              </Pressable>
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
                  <View style={styles.grid}>{bucket.items.map(renderCard)}</View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.grid}>{filtered.map(renderCard)}</View>
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
          { key: 'home', label: 'Home', icon: 'home' },
          { key: 'profile', label: 'Profile', icon: 'person' },
          { key: 'settings', label: 'Settings', icon: 'settings-outline' },
        ] as const).map((t) => (
          <Pressable key={t.key} onPress={() => { setTab(t.key); setView({ kind: 'list' }); }} style={styles.tabBtn}>
            <Ionicons name={t.icon as never} size={22} color={tab === t.key ? colors.primary : colors.onSurfaceVariant} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* True floating Add button: rendered AFTER the tab bar so it
          paints on top of it, absolutely positioned above it. Bottom
          = bottom inset + tab-bar height (~52) + 16 gap, so it can
          never be painted under the tab bar (the old bottom: 76 bug)
          and the list scrolls underneath it. */}
      {tab === 'home' && view.kind === 'list' ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 68, right: 16 }]}
          onPress={() => setView({ kind: 'editor', event: null })}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  loading: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, padding: 16 },
  greeting: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.primary, letterSpacing: 1.4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gearBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface, marginTop: 4 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  search: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 13 },
  chipTextOn: { color: colors.background, fontFamily: fonts.jakartaBold },
  empty: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginTop: 16 },
  emptyText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, lineHeight: 21 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurfaceVariant, marginTop: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  card: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 12, marginTop: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sticker: { fontSize: 16 },
  cardCategory: { fontFamily: fonts.jakartaBold, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1, flexShrink: 1 },
  cardBig: { fontSize: 28, color: colors.onSurface, marginTop: 6 },
  cardTitle: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.onSurface, marginTop: 2, lineHeight: 19 },
  cardMeta: { fontFamily: fonts.jakartaMedium, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
  cardBanner: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.accent, marginTop: 4 },
  bucketTitle: { fontFamily: fonts.grotesk, fontSize: 18, color: colors.onSurface, marginTop: 20 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, paddingVertical: 8 },
  tabBtn: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontFamily: fonts.jakartaMedium, fontSize: 11, color: colors.onSurfaceVariant },
  tabLabelOn: { color: colors.primary, fontFamily: fonts.jakartaBold },
  fab: {
    position: 'absolute', zIndex: 10,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  fabText: { fontFamily: fonts.grotesk, fontSize: 30, color: colors.background, lineHeight: 32 },
});
