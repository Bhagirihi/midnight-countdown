import { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../lib/theme';
import { birthstone, countdownInfo, milestones, parseDate, todayISO, turningInfo, zodiacSign } from '../lib/dates';
import {
  MAX_STORY_PHOTOS, capPhotos, emptyGiftPlan, greetingTemplates, newId, remainingBudget, safeIcon, spentTotal,
  type CountdownEvent, type GiftPlan, type StoryEntry,
} from '../lib/events';
import { pickPhotos } from '../lib/photos';
import { maybeAskForReview } from '../lib/review';
import ShareCard from './ShareCard';

const FONT_FAMILY: Record<string, string> = {
  grotesk: fonts.grotesk,
  jakarta: fonts.jakartaBold,
  mono: fonts.mono,
};

export function effectBorder(effect: string, color: string): { borderColor: string; borderWidth: number } {
  if (effect === 'coral-aura') return { borderColor: '#F7A5A5', borderWidth: 2 };
  if (effect === 'periwinkle-glow') return { borderColor: '#8E99F3', borderWidth: 2 };
  return { borderColor: color, borderWidth: 1 };
}

export default function EventDetail({
  event, eventCount, stories, giftPlan, onBack, onEdit, onDelete, onAddStory, onDeleteStory, onSchedule, onSaveGiftPlan,
}: {
  event: CountdownEvent;
  eventCount: number;
  stories: StoryEntry[];
  giftPlan: GiftPlan;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddStory: (text: string, dateISO: string, photoUris: string[]) => void;
  onDeleteStory: (id: string) => void;
  onSchedule: () => Promise<string>;
  onSaveGiftPlan: (plan: GiftPlan) => void;
}) {
  const today = todayISO();
  const info = countdownInfo(event.dateISO, event.type, event.repeat, today);
  const ms = milestones(event.dateISO, event.type, event.repeat, today);
  const turning = turningInfo(event.dateISO, event.category, event.repeat, today);
  const parsed = parseDate(event.dateISO);
  const zodiac = parsed ? zodiacSign(parsed.month, parsed.day) : null;
  const stone = parsed ? birthstone(parsed.month) : null;
  const [storyText, setStoryText] = useState('');
  const [storyDate, setStoryDate] = useState(today);
  const [storyPhotos, setStoryPhotos] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  // One screen, four tabs — the old layout stacked every section
  // (share, milestones, contact, gifts, group gifts, greetings,
  // fun facts, story) into a single endless scroll. Tabs keep every
  // feature, but only one group is on screen at a time.
  const [tab, setTab] = useState<'overview' | 'gifts' | 'greetings' | 'story'>('overview');
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'gifts', label: 'Gifts' },
    { id: 'greetings', label: 'Greetings' },
    { id: 'story', label: 'Story' },
  ] as const;
  const [plan, setPlan] = useState<GiftPlan>(giftPlan ?? emptyGiftPlan(event.id));
  const [ideaItem, setIdeaItem] = useState('');
  const [ideaNotes, setIdeaNotes] = useState('');
  const [ideaLink, setIdeaLink] = useState('');
  const [budgetText, setBudgetText] = useState(String(giftPlan?.budgetPlanned ?? 0));
  const [spentLabel, setSpentLabel] = useState('');
  const [spentAmount, setSpentAmount] = useState('');
  const [pastItem, setPastItem] = useState('');
  const [pastDate, setPastDate] = useState(today);
  const [contribName, setContribName] = useState('');
  const [contribItem, setContribItem] = useState('');
  const [contribAmount, setContribAmount] = useState('');

  const updatePlan = (next: GiftPlan) => {
    setPlan(next);
    onSaveGiftPlan(next);
  };

  const breakdownLine =
    event.type === 'countup'
      ? `${Math.abs(info.breakdown.months)} month(s), ${info.breakdown.daysAfterMonths} day(s) since start · ${info.breakdown.weeks} week(s)`
      : `${Math.abs(info.breakdown.months)} month(s), ${info.breakdown.daysAfterMonths} day(s) · ${info.breakdown.weeks} week(s), ${info.breakdown.daysAfterWeeks} day(s)`;

  const copyText = async (text: string) => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(text);
      setNotice('Copied to clipboard.');
      // Right moment: the app just helped the user say something nice.
      await maybeAskForReview(eventCount);
    } catch {
      setNotice('Copy is not available on this device. Long-press the text to copy it manually.');
    }
  };

  const person = event.contactName ?? event.title;
  const digits = (event.contactPhone ?? '').replace(/\D/g, '');
  const shareGroupSummary = async () => {
    const lines = [
      `Group gift plan — ${event.title} (${event.dateISO})`,
      `Local plan — not a live shared link or payment.`,
      '',
      ...plan.contributors.map((c) => `• ${c.name}: ${c.item} — ${c.amount}`),
      `Total pledged: ${plan.contributors.reduce((s, c) => s + c.amount, 0)}`,
    ];
    try {
      const result = await Share.share({ message: lines.join('\n') });
      // Right moment, but only if the user actually shared (not dismissed).
      if (result.action === Share.sharedAction) await maybeAskForReview(eventCount);
    } catch {
      setNotice('Sharing is not available on this device.');
    }
  };

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      stickyHeaderIndices={[2]}
    >
      <Pressable onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable>

      <View style={[styles.hero, effectBorder(event.effect, event.color)]}>
        {event.photoUri ? <Image source={{ uri: event.photoUri }} style={styles.heroPhoto} /> : null}
        <View style={styles.heroRow}>
          <Ionicons name={safeIcon(event.icon) as never} size={28} color={event.color} />
          {event.sticker ? <Text style={styles.sticker}>{event.sticker}</Text> : null}
        </View>
        <Text style={[styles.big, { fontFamily: FONT_FAMILY[event.font] ?? fonts.grotesk }]}>{info.label}</Text>
        <Text style={styles.title}>{event.title}</Text>
        {turning ? <Text style={styles.banner}>🎉 {turning.label} · {turning.nextISO}</Text> : null}
        <Text style={styles.meta}>
          {event.type === 'countup' ? `Started ${event.dateISO}` : `Target ${info.targetISO}`}
          {event.repeat !== 'none' ? ` · Repeats ${event.repeat}` : ''}
          {` · ${event.category}`}
          {event.relationship ? ` · ${event.relationship}` : ''}
        </Text>
        <Text style={styles.meta}>{breakdownLine}</Text>
        {event.notes ? <Text style={styles.meta}>Notes: {event.notes}</Text> : null}
        {info.isToday ? <Text style={styles.today}>Today is the day.</Text> : null}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.id} style={[styles.tabBtn, tab === t.id && styles.tabBtnOn]} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabBtnText, tab === t.id && styles.tabBtnTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {tab === 'overview' && (
      <>
      <ShareCard event={event} label={info.label} targetISO={info.targetISO} eventCount={eventCount} />

      {ms.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          {ms.map((m) => (
            <Text key={m.label + m.dateISO} style={styles.rowText}>
              {m.reached ? '✓ ' : '○ '}{m.label} — {m.dateISO}
              {m.reached ? ' (reached)' : m.daysAway === 0 ? ' (today)' : ` (in ${m.daysAway} days)`}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact &amp; quick actions</Text>
        {event.contactName ? (
          <Text style={styles.rowText}>
            {event.contactName}
            {event.contactPhone ? ` · ${event.contactPhone}` : ''}
            {event.contactEmail ? ` · ${event.contactEmail}` : ''}
          </Text>
        ) : (
          <Text style={styles.hint}>No contact linked. Edit this event and import a contact to enable call / WhatsApp / email shortcuts.</Text>
        )}
        <View style={styles.rowBtns}>
          <Pressable
            style={[styles.actionBtn, !event.contactPhone && styles.actionBtnDisabled]}
            disabled={!event.contactPhone}
            onPress={() => event.contactPhone && Linking.openURL(`tel:${event.contactPhone}`)}
          >
            <Text style={styles.actionBtnText}>Call</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, !digits && styles.actionBtnDisabled]}
            disabled={!digits}
            onPress={() => digits && Linking.openURL(`https://wa.me/${digits}`)}
          >
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, !event.contactEmail && styles.actionBtnDisabled]}
            disabled={!event.contactEmail}
            onPress={() => event.contactEmail && Linking.openURL(`mailto:${event.contactEmail}`)}
          >
            <Text style={styles.actionBtnText}>Email</Text>
          </Pressable>
        </View>
        {(!event.contactPhone || !event.contactEmail) ? (
          <Text style={styles.hint}>A shortcut is disabled when its phone number or email is missing — link a contact first. Nothing is sent until you tap an enabled shortcut.</Text>
        ) : null}
      </View>

      <View style={styles.rowBtns}>
        <Pressable style={styles.primaryBtn} onPress={onEdit}><Text style={styles.primaryBtnText}>Edit</Text></Pressable>
        <Pressable
          style={styles.dangerBtn}
          onPress={() => Alert.alert('Delete event?', 'This also removes its story entries and gift plan.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ])}
        >
          <Text style={styles.dangerBtnText}>Delete</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.secondaryBtn}
        onPress={async () => setNotice(await onSchedule())}
      >
        <Text style={styles.secondaryBtnText}>Schedule D-7 / D-3 / D-1 / day-of reminders</Text>
      </Pressable>
      <Text style={styles.hint}>Reminders need a dev build to actually fire. In Expo Go they may be scheduled but not delivered.</Text>

      {zodiac && stone ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Just for fun</Text>
          <Text style={styles.rowText}>⭐ {zodiac.sign} ({zodiac.range}) · Birthstone: {stone}</Text>
          <Text style={styles.hint}>Fun only — based on the event month/day. No personality traits are claimed as fact.</Text>
        </View>
      ) : null}
      </>)}

      {tab === 'gifts' && (
      <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gift planning — local only</Text>
        <Text style={styles.hint}>Ideas, wishlist notes, and a budget tracker for this person/event. No shopping checkout and no affiliate links — a link here is just text you saved.</Text>
        <Text style={styles.label}>Wishlist notes</Text>
        <TextInput
          style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
          value={plan.wishlistNotes}
          onChangeText={(t) => updatePlan({ ...plan, wishlistNotes: t })}
          placeholder="Sizes, preferences, things they mentioned…"
          placeholderTextColor={colors.onSurfaceVariant}
          multiline
        />
        <Text style={styles.label}>Planned budget</Text>
        <View style={styles.inlineRow}>
          <TextInput style={[styles.input, { flex: 1, marginTop: 0 }]} value={budgetText} onChangeText={setBudgetText} placeholder="0" placeholderTextColor={colors.onSurfaceVariant} keyboardType="decimal-pad" />
          <Pressable style={styles.smallBtn} onPress={() => updatePlan({ ...plan, budgetPlanned: Number(budgetText) || 0 })}>
            <Text style={styles.smallBtnText}>Save budget</Text>
          </Pressable>
        </View>
        <Text style={styles.rowText}>Planned: {plan.budgetPlanned} · Spent: {spentTotal(plan)} · Remaining: {remainingBudget(plan)}{remainingBudget(plan) < 0 ? ' (over budget)' : ''}</Text>
        <Text style={styles.label}>Add spent amount</Text>
        <TextInput style={styles.input} value={spentLabel} onChangeText={setSpentLabel} placeholder="What was it for?" placeholderTextColor={colors.onSurfaceVariant} />
        <TextInput style={styles.input} value={spentAmount} onChangeText={setSpentAmount} placeholder="Amount" placeholderTextColor={colors.onSurfaceVariant} keyboardType="decimal-pad" />
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            if (!spentLabel.trim() || !(Number(spentAmount) > 0)) { setNotice('Enter what the spending was for and an amount above zero.'); return; }
            updatePlan({ ...plan, spent: [...plan.spent, { id: newId(), label: spentLabel.trim(), amount: Number(spentAmount) }] });
            setSpentLabel(''); setSpentAmount(''); setNotice('');
          }}
        >
          <Text style={styles.secondaryBtnText}>Add spent entry</Text>
        </Pressable>
        {plan.spent.map((s) => (
          <Text key={s.id} style={styles.rowText}>• {s.label} — {s.amount}</Text>
        ))}
        <Text style={styles.label}>Gift idea</Text>
        <TextInput style={styles.input} value={ideaItem} onChangeText={setIdeaItem} placeholder="Gift idea" placeholderTextColor={colors.onSurfaceVariant} />
        <TextInput style={styles.input} value={ideaNotes} onChangeText={setIdeaNotes} placeholder="Notes (optional)" placeholderTextColor={colors.onSurfaceVariant} />
        <TextInput style={styles.input} value={ideaLink} onChangeText={setIdeaLink} placeholder="Link text (optional, saved as text only)" placeholderTextColor={colors.onSurfaceVariant} autoCapitalize="none" />
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            if (!ideaItem.trim()) { setNotice('Enter a gift idea first.'); return; }
            updatePlan({ ...plan, ideas: [...plan.ideas, { id: newId(), item: ideaItem.trim(), notes: ideaNotes.trim(), link: ideaLink.trim() }] });
            setIdeaItem(''); setIdeaNotes(''); setIdeaLink(''); setNotice('');
          }}
        >
          <Text style={styles.secondaryBtnText}>Add gift idea</Text>
        </Pressable>
        {plan.ideas.map((g) => (
          <View key={g.id} style={styles.miniCard}>
            <Text style={styles.rowText}>🎁 {g.item}</Text>
            {g.notes ? <Text style={styles.hint}>{g.notes}</Text> : null}
            {g.link ? <Text style={styles.hint}>Link (text only): {g.link}</Text> : null}
            <Pressable onPress={() => updatePlan({ ...plan, ideas: plan.ideas.filter((x) => x.id !== g.id) })}>
              <Text style={styles.deleteText}>Remove idea</Text>
            </Pressable>
          </View>
        ))}
        <Text style={styles.label}>Past gifts given</Text>
        <TextInput style={styles.input} value={pastItem} onChangeText={setPastItem} placeholder="What was given?" placeholderTextColor={colors.onSurfaceVariant} />
        <TextInput style={styles.input} value={pastDate} onChangeText={setPastDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.onSurfaceVariant} autoCapitalize="none" />
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            if (!pastItem.trim()) { setNotice('Enter what was given first.'); return; }
            updatePlan({ ...plan, pastGifts: [...plan.pastGifts, { id: newId(), item: pastItem.trim(), dateISO: pastDate.trim() || today }] });
            setPastItem(''); setNotice('');
          }}
        >
          <Text style={styles.secondaryBtnText}>Add past gift</Text>
        </Pressable>
        {plan.pastGifts.map((g) => (
          <Text key={g.id} style={styles.rowText}>• {g.item} — {g.dateISO}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group gift planning</Text>
        <Text style={styles.hint}>Local plan — not a live shared link or payment. Add who is contributing what, then share a plain-text summary yourself.</Text>
        <TextInput style={styles.input} value={contribName} onChangeText={setContribName} placeholder="Contributor name" placeholderTextColor={colors.onSurfaceVariant} />
        <TextInput style={styles.input} value={contribItem} onChangeText={setContribItem} placeholder="Item / contribution" placeholderTextColor={colors.onSurfaceVariant} />
        <TextInput style={styles.input} value={contribAmount} onChangeText={setContribAmount} placeholder="Amount" placeholderTextColor={colors.onSurfaceVariant} keyboardType="decimal-pad" />
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            if (!contribName.trim() || !contribItem.trim()) { setNotice('Enter a contributor name and what they are contributing.'); return; }
            updatePlan({ ...plan, contributors: [...plan.contributors, { id: newId(), name: contribName.trim(), item: contribItem.trim(), amount: Number(contribAmount) || 0 }] });
            setContribName(''); setContribItem(''); setContribAmount(''); setNotice('');
          }}
        >
          <Text style={styles.secondaryBtnText}>Add contributor</Text>
        </Pressable>
        {plan.contributors.map((c) => (
          <Text key={c.id} style={styles.rowText}>• {c.name}: {c.item} — {c.amount}</Text>
        ))}
        <Pressable style={styles.primaryBtn} onPress={shareGroupSummary}>
          <Text style={styles.primaryBtnText}>Share summary (plain text)</Text>
        </Pressable>
      </View>

      </>)}

      {tab === 'greetings' && (
      <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Greeting templates</Text>
        <Text style={styles.hint}>Tap Copy on any template — the message is copied, nothing is sent by the app.</Text>
        {greetingTemplates(event.category).map((t) => {
          const filled = t.replaceAll('{name}', person);
          return (
            <View key={t} style={styles.miniCard}>
              <Text style={styles.rowText}>{filled}</Text>
              <Pressable style={styles.smallBtn} onPress={() => copyText(filled)}>
                <Text style={styles.smallBtnText}>Copy</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      </>)}

      {tab === 'story' && (
      <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Story — mini-diary for this event</Text>
        <Text style={styles.hint}>One entry per date, with text and up to {MAX_STORY_PHOTOS} photos. Photos stay on this device only.</Text>
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={storyDate} onChangeText={setStoryDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.onSurfaceVariant} autoCapitalize="none" />
        <Text style={styles.label}>What happened?</Text>
        <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} value={storyText} onChangeText={setStoryText} placeholder="Log a moment on the journey…" placeholderTextColor={colors.onSurfaceVariant} multiline />
        <View style={styles.photoRow}>
          {storyPhotos.map((u) => (
            <Image key={u} source={{ uri: u }} style={styles.thumb} />
          ))}
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={async () => {
            const room = MAX_STORY_PHOTOS - storyPhotos.length;
            const picked = await pickPhotos(room);
            if (picked.length > 0) setStoryPhotos(capPhotos([...storyPhotos, ...picked]));
          }}
        >
          <Text style={styles.secondaryBtnText}>Add photos ({storyPhotos.length}/{MAX_STORY_PHOTOS})</Text>
        </Pressable>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (!storyText.trim()) { setNotice('Write something for the story entry first.'); return; }
            onAddStory(storyText.trim(), storyDate.trim() || today, storyPhotos);
            setStoryText(''); setStoryPhotos([]); setNotice('');
          }}
        >
          <Text style={styles.primaryBtnText}>Save story entry</Text>
        </Pressable>

        {stories.length === 0 ? (
          <Text style={styles.hint}>No story entries yet for this event.</Text>
        ) : (
          stories.slice().sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)).map((s) => (
            <View key={s.id} style={styles.storyCard}>
              <Text style={styles.storyDate}>{s.dateISO}</Text>
              <Text style={styles.storyText}>{s.text}</Text>
              <View style={styles.photoRow}>
                {s.photoUris.map((u) => (
                  <Image key={u} source={{ uri: u }} style={styles.thumb} />
                ))}
              </View>
              <Pressable onPress={() => onDeleteStory(s.id)}><Text style={styles.deleteText}>Delete entry</Text></Pressable>
            </View>
          ))
        )}
      </View>
      </>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  back: { color: colors.primary, fontFamily: fonts.jakartaBold, fontSize: 15, marginBottom: 12 },
  hero: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroPhoto: { width: '100%', height: 160, borderRadius: 16, marginBottom: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sticker: { fontSize: 26 },
  big: { fontSize: 56, color: colors.onSurface, marginTop: 8 },
  title: { fontFamily: fonts.jakartaBold, fontSize: 20, color: colors.onSurface, marginTop: 4 },
  banner: { fontFamily: fonts.jakartaBold, fontSize: 16, color: colors.accent, marginTop: 8 },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 },
  today: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.accent, marginTop: 8 },
  tabBar: { flexDirection: 'row', gap: 8, backgroundColor: colors.background, paddingVertical: 10, marginTop: 4 },
  tabBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  tabBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 13 },
  tabBtnTextOn: { color: colors.background },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: fonts.grotesk, fontSize: 20, color: colors.onSurface, marginBottom: 8 },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 6, lineHeight: 20 },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
  dangerBtn: { flex: 1, borderWidth: 1, borderColor: colors.error, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  dangerBtnText: { color: colors.error, fontFamily: fonts.jakartaBold, fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14, textAlign: 'center' },
  actionBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 8, alignSelf: 'flex-start' },
  smallBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 13 },
  inlineRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
  miniCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginTop: 10 },
  notice: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurface, marginTop: 10, lineHeight: 18 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 15, marginTop: 8 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  storyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginTop: 12 },
  storyDate: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.primary },
  storyText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, marginTop: 6, lineHeight: 21 },
  deleteText: { color: colors.error, fontFamily: fonts.jakartaBold, fontSize: 13, marginTop: 10 },
});
