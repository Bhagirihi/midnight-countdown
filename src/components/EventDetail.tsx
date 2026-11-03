import { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, labelStyle } from '../lib/theme';
import { birthstone, countdownInfo, formatHumanDate, milestones, parseDate, todayISO, turningInfo, zodiacSign } from '../lib/dates';
import {
  MAX_STORY_PHOTOS, capPhotos, emptyGiftPlan, greetingTemplates, newId, remainingBudget, safeIcon, spentTotal,
  type CountdownEvent, type GiftPlan, type StoryEntry,
} from '../lib/events';
import { pickPhotos, pickSinglePhoto } from '../lib/photos';
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
  event, eventCount, stories, giftPlan, onBack, onEdit, onCustomize, onDelete, onAddStory, onDeleteStory, onSchedule, onSaveGiftPlan, onChangePhoto,
}: {
  event: CountdownEvent;
  eventCount: number;
  stories: StoryEntry[];
  giftPlan: GiftPlan;
  onBack: () => void;
  onEdit: () => void;
  onCustomize: () => void;
  onDelete: () => void;
  onAddStory: (text: string, dateISO: string, photoUris: string[]) => void;
  onDeleteStory: (id: string) => void;
  onSchedule: () => Promise<string>;
  onSaveGiftPlan: (plan: GiftPlan) => void;
  onChangePhoto: (uri: string | null) => void;
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

  const b = info.breakdown;
  const breakdownLine = event.type === 'countup'
    ? `${Math.abs(b.months)} months · ${b.daysAfterMonths} days · ${b.weeks} weeks`
    : `${Math.abs(info.daysDiff)} days · ${b.weeks} weeks · ${Math.abs(b.months)} months`;
  const nextMilestone = ms.find((m) => !m.reached) ?? [...ms].reverse().find((m) => m.reached) ?? null;
  const isDay = info.isToday && event.type === 'countdown';
  const tone = isDay
    ? colors.success
    : event.type === 'countup' || event.repeat !== 'none'
      ? colors.secondary
      : colors.primary;
  const when = event.type === 'countup'
    ? `Started ${formatHumanDate(event.dateISO, today)}`
    : formatHumanDate(info.targetISO, today);

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
      `Group gift plan — ${event.title} (${formatHumanDate(event.dateISO, today)})`,
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
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 }}
    >
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={8}><Text style={styles.back}>Back</Text></Pressable>
        <View style={styles.topActions}>
          <Pressable onPress={onEdit} hitSlop={8}><Text style={styles.topAction}>Edit</Text></Pressable>
          <Pressable
            onPress={() => Alert.alert('Delete event?', 'This also removes its story entries and gift plan.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ])}
            hitSlop={8}
          >
            <Text style={styles.topDelete}>Delete</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        {event.photoUri ? (
          <Image source={{ uri: event.photoUri }} style={styles.heroPhoto} resizeMode="cover" />
        ) : (
          <Pressable onPress={async () => {
            const uri = await pickSinglePhoto();
            if (uri) onChangePhoto(uri);
          }} hitSlop={8} style={styles.addPhoto}>
            <Text style={styles.smallBtnText}>Add photo</Text>
          </Pressable>
        )}
        <View style={styles.kickerRow}>
          {event.sticker ? (
            <Text style={styles.sticker}>{event.sticker}</Text>
          ) : (
            <Ionicons name={safeIcon(event.icon) as never} size={16} color={colors.onSurfaceVariant} />
          )}
          <Text style={styles.kicker}>{event.category}</Text>
        </View>
        <Text style={[styles.big, { fontFamily: FONT_FAMILY[event.font] ?? fonts.grotesk, color: tone }]}>
          {isDay ? 'Today' : info.label}
        </Text>
        <Text style={styles.title}>{event.title}</Text>
        {event.effect !== 'none' ? (
          <View style={[styles.effectRule, { backgroundColor: effectBorder(event.effect, event.color).borderColor }]} />
        ) : (
          <View style={styles.rule} />
        )}
        <Text style={styles.meta}>
          {when}
          {event.repeat !== 'none' ? `  ·  Repeats ${event.repeat}` : ''}
        </Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.id} style={styles.tabBtn} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabBtnText, tab === t.id && styles.tabBtnTextOn]} numberOfLines={1}>{t.label}</Text>
            <View style={[styles.tabMark, tab === t.id && styles.tabMarkOn]} />
          </Pressable>
        ))}
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {tab === 'overview' && (
      <>
      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Photo</Text>
        <Text style={styles.hint}>
          {event.photoUri ? 'Shown here and on Home.' : 'Add a picture for this day. It stays on this phone.'}
        </Text>
        <View style={styles.photoActions}>
          <Pressable
            onPress={async () => {
              const uri = await pickSinglePhoto();
              if (uri) onChangePhoto(uri);
            }}
            hitSlop={8}
          >
            <Text style={styles.smallBtnText}>{event.photoUri ? 'Change photo' : 'Add photo'}</Text>
          </Pressable>
          {event.photoUri ? (
            <Pressable onPress={() => onChangePhoto(null)} hitSlop={8}>
              <Text style={styles.removePhoto}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>This date</Text>
        <Text style={styles.rowText}>{breakdownLine}</Text>
        {turning ? <Text style={styles.banner}>{turning.label}</Text> : null}
        {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}
      </View>

      {nextMilestone ? (
        <View style={styles.giftCard}>
          <Text style={styles.giftTitle}>Next milestone</Text>
          <Text style={[styles.rowText, nextMilestone.reached && styles.reached]}>
            {nextMilestone.reached ? 'Reached' : nextMilestone.label}
          </Text>
          <Text style={styles.hint}>
            {formatHumanDate(nextMilestone.dateISO, today)}
            {nextMilestone.reached ? '' : nextMilestone.daysAway === 0 ? ' · today' : ` · in ${nextMilestone.daysAway} days`}
          </Text>
        </View>
      ) : null}

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Reminder</Text>
        <Text style={styles.hint}>Seven days, three days, the day before, and the day.</Text>
        <Pressable style={styles.primaryBtn} onPress={async () => setNotice(await onSchedule())}>
          <Text style={styles.primaryBtnText}>Remind me</Text>
        </Pressable>
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Share</Text>
        <Text style={styles.hint}>Send this countdown, then pick an app.</Text>
        <ShareCard compact event={event} label={isDay ? 'Today' : info.label} targetISO={info.targetISO} eventCount={eventCount} />
      </View>

      <Pressable style={styles.giftCard} onPress={onCustomize}>
        <View style={styles.cardRow}>
          <View style={styles.cardCopy}>
            <Text style={styles.giftTitle}>Look</Text>
            <Text style={styles.hint}>Colour, icon, sticker, and photo.</Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </View>
      </Pressable>

      {(event.contactPhone || event.contactEmail) ? (
        <View style={styles.giftCard}>
          <Text style={styles.giftTitle}>{event.contactName || 'Contact'}</Text>
          <View style={styles.contactList}>
            {event.contactPhone ? (
              <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${event.contactPhone}`)}>
                <Text style={styles.actionBtnText}>Call</Text>
              </Pressable>
            ) : null}
            {digits ? (
              <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`https://wa.me/${digits}`)}>
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </Pressable>
            ) : null}
            {event.contactEmail ? (
              <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${event.contactEmail}`)}>
                <Text style={styles.actionBtnText}>Email</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      </>)}

      {tab === 'gifts' && (
      <>
      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Wishlist</Text>
        <TextInput
          style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
          value={plan.wishlistNotes}
          onChangeText={(t) => updatePlan({ ...plan, wishlistNotes: t })}
          placeholder="Sizes, preferences, things they mentioned…"
          placeholderTextColor={colors.onSurfaceVariant}
          multiline
        />
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Budget</Text>
        <View style={styles.inlineRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={budgetText} onChangeText={setBudgetText} placeholder="0" placeholderTextColor={colors.onSurfaceVariant} keyboardType="decimal-pad" />
          <Pressable style={styles.smallBtn} onPress={() => updatePlan({ ...plan, budgetPlanned: Number(budgetText) || 0 })}>
            <Text style={styles.smallBtnText}>Save budget</Text>
          </Pressable>
        </View>
        <Text style={styles.rowText}>Planned: {plan.budgetPlanned} · Spent: {spentTotal(plan)} · Remaining: {remainingBudget(plan)}{remainingBudget(plan) < 0 ? ' (over budget)' : ''}</Text>
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Spent</Text>
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
          <Text key={s.id} style={styles.rowText}>{s.label} — {s.amount}</Text>
        ))}
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Ideas</Text>
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
            <Text style={styles.rowText}>{g.item}</Text>
            {g.notes ? <Text style={styles.hint}>{g.notes}</Text> : null}
            {g.link ? <Text style={styles.hint}>{g.link}</Text> : null}
            <Pressable onPress={() => updatePlan({ ...plan, ideas: plan.ideas.filter((x) => x.id !== g.id) })}>
              <Text style={styles.deleteText}>Remove idea</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Past gifts</Text>
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
          <Text key={g.id} style={styles.rowText}>{g.item} — {formatHumanDate(g.dateISO, today)}</Text>
        ))}
      </View>

      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>Group gift</Text>
        <Text style={styles.hint}>Saved on this phone. Share sends a text summary you choose.</Text>
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
          <Text key={c.id} style={styles.rowText}>{c.name}: {c.item} — {c.amount}</Text>
        ))}
        <Pressable style={styles.primaryBtn} onPress={shareGroupSummary}>
          <Text style={styles.primaryBtnText}>Share summary</Text>
        </Pressable>
      </View>

      {zodiac && stone ? (
        <View style={styles.giftCard}>
          <Text style={styles.giftTitle}>Just for fun</Text>
          <Text style={styles.rowText}>{zodiac.sign} ({zodiac.range}) · Birthstone: {stone}</Text>
        </View>
      ) : null}
      </>)}

      {tab === 'greetings' && (
      <>
      {greetingTemplates(event.category).map((t) => {
        const filled = t.replaceAll('{name}', person);
        return (
          <View key={t} style={styles.giftCard}>
            <Text style={styles.giftTitle}>Greeting</Text>
            <Text style={styles.rowText}>{filled}</Text>
            <Pressable style={styles.smallBtn} onPress={() => copyText(filled)}>
              <Text style={styles.smallBtnText}>Copy</Text>
            </Pressable>
          </View>
        );
      })}
      </>)}

      {tab === 'story' && (
      <>
      <View style={styles.giftCard}>
        <Text style={styles.giftTitle}>New entry</Text>
        <Text style={styles.hint}>Photos stay on this device.</Text>
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
        {stories.length === 0 ? <Text style={styles.hint}>No story entries yet for this event.</Text> : null}
      </View>

      {stories.slice().sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)).map((s) => (
            <View key={s.id} style={styles.giftCard}>
              <Text style={styles.storyDate}>{formatHumanDate(s.dateISO, today)}</Text>
              <Text style={styles.storyText}>{s.text}</Text>
              <View style={styles.photoRow}>
                {s.photoUris.map((u) => (
                  <Image key={u} source={{ uri: u }} style={styles.thumb} />
                ))}
              </View>
              <Pressable onPress={() => onDeleteStory(s.id)}><Text style={styles.deleteText}>Delete entry</Text></Pressable>
            </View>
      ))}
      </>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  topAction: { ...labelStyle, fontSize: 11, letterSpacing: 1.6, color: colors.primary },
  topDelete: { ...labelStyle, fontSize: 11, letterSpacing: 1.6, color: colors.error },
  back: { ...labelStyle, fontSize: 11, letterSpacing: 1.6, color: colors.onSurfaceVariant },
  hero: { marginTop: 28 },
  reached: { color: colors.success },
  heroPhoto: { width: '100%', height: 220, borderRadius: 12, marginBottom: 18, backgroundColor: colors.surface },
  addPhoto: { alignSelf: 'flex-start', marginBottom: 16 },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 },
  removePhoto: { ...labelStyle, fontSize: 11, letterSpacing: 1.6, color: colors.error },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sticker: { fontSize: 16 },
  kicker: { ...labelStyle, fontSize: 11, letterSpacing: 2.2, color: colors.onSurfaceVariant },
  big: { fontSize: 72, lineHeight: 76, letterSpacing: -2, marginTop: 8 },
  title: { fontFamily: fonts.grotesk, fontSize: 28, lineHeight: 34, color: colors.onSurface, marginTop: 4 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 16 },
  effectRule: { height: 2, marginTop: 16 },
  banner: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.accent, marginTop: 12 },
  meta: { fontFamily: fonts.mono, fontSize: 13, letterSpacing: 0.3, color: colors.onSurfaceVariant, marginTop: 12 },
  notes: { fontFamily: fonts.jakartaMedium, fontSize: 15, lineHeight: 22, color: colors.onSurface, marginTop: 10 },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginTop: 22,
  },
  tabBtn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    height: 44,
  },
  tabBtnText: { ...labelStyle, fontSize: 10, letterSpacing: 0.4, color: colors.onSurfaceVariant },
  tabBtnTextOn: { color: colors.onSurface },
  tabMark: { width: 16, height: 1, backgroundColor: 'transparent' },
  tabMarkOn: { backgroundColor: colors.accent },
  section: { marginTop: 8 },
  giftCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12,
  },
  giftTitle: { ...labelStyle, fontSize: 11, letterSpacing: 1.8, color: colors.accent },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1 },
  chevron: { fontFamily: fonts.jakartaMedium, fontSize: 18, color: colors.onSurfaceVariant },
  sectionTitle: { ...labelStyle, fontSize: 11, letterSpacing: 1.8, color: colors.accent, marginTop: 22, marginBottom: 4 },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, marginTop: 8, lineHeight: 22 },
  primaryBtn: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingHorizontal: 22,
  },
  primaryBtnText: { ...labelStyle, fontSize: 12, letterSpacing: 1.8, color: colors.onPrimary },
  secondaryBtn: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 6 },
  secondaryBtnText: { ...labelStyle, fontSize: 12, letterSpacing: 1.4, color: colors.onSurface },
  contactList: { marginTop: 4 },
  actionBtn: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  actionBtnText: { fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface },
  smallBtn: { marginTop: 10, alignSelf: 'flex-start' },
  smallBtnText: { ...labelStyle, fontSize: 11, letterSpacing: 1.6, color: colors.primary },
  inlineRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  miniCard: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 12 },
  notice: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.accent, marginTop: 12, lineHeight: 18 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  label: { ...labelStyle, fontSize: 11, letterSpacing: 1.4, color: colors.onSurfaceVariant, marginTop: 18 },
  input: {
    fontFamily: fonts.jakartaMedium, fontSize: 16, color: colors.onSurface,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  storyCard: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 14 },
  storyDate: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, color: colors.primary },
  storyText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, marginTop: 6, lineHeight: 22 },
  deleteText: { ...labelStyle, fontSize: 11, letterSpacing: 1.2, color: colors.error, marginTop: 10 },
});
