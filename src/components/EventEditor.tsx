import { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../lib/theme';
import { countdownInfo, isValidDateISO, todayISO } from '../lib/dates';
import { loadContactsWithBirthday, type ImportedContact } from '../lib/contacts';
import { findDuplicateEvent } from '../lib/events';
import {
  CATEGORIES, EVENT_COLORS, EVENT_ICONS, EVENT_STICKERS, RELATIONSHIPS, newId, safeIcon,
  type CountdownEvent, type FontChoice, type VisualEffect,
} from '../lib/events';
import { pickSinglePhoto } from '../lib/photos';
import { effectBorder } from './EventDetail';

const FONT_OPTIONS: { key: FontChoice; label: string; family: string }[] = [
  { key: 'grotesk', label: 'Grotesk (display)', family: fonts.grotesk },
  { key: 'jakarta', label: 'Jakarta (clean)', family: fonts.jakartaBold },
  { key: 'mono', label: 'Mono (numbers)', family: fonts.mono },
];

const EFFECT_OPTIONS: { key: VisualEffect; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'coral-aura', label: 'Coral aura' },
  { key: 'periwinkle-glow', label: 'Periwinkle glow' },
];

export default function EventEditor({
  initial, onSave, onCancel, eventsForDedupe,
}: {
  initial: CountdownEvent | null;
  onSave: (e: CountdownEvent) => void;
  onCancel: () => void;
  eventsForDedupe?: CountdownEvent[];
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dateISO, setDateISO] = useState(initial?.dateISO ?? '');
  const [type, setType] = useState<'countdown' | 'countup'>(initial?.type ?? 'countdown');
  const [repeat, setRepeat] = useState<'none' | 'monthly' | 'yearly'>(initial?.repeat ?? 'none');
  const [category, setCategory] = useState(initial?.category ?? 'Personal');
  const [relationship, setRelationship] = useState(initial?.relationship ?? 'Other');
  const [contactName, setContactName] = useState<string | null>(initial?.contactName ?? null);
  const [contactPhone, setContactPhone] = useState<string | null>(initial?.contactPhone ?? null);
  const [contactEmail, setContactEmail] = useState<string | null>(initial?.contactEmail ?? null);
  const [contactPhotoUri, setContactPhotoUri] = useState<string | null>(initial?.contactPhotoUri ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [color, setColor] = useState(initial?.color ?? '#F7A5A5');
  const [icon, setIcon] = useState(initial?.icon ?? 'calendar');
  const [sticker, setSticker] = useState(initial?.sticker ?? '');
  const [font, setFont] = useState<FontChoice>(initial?.font ?? 'grotesk');
  const [effect, setEffect] = useState<VisualEffect>(initial?.effect ?? 'none');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [error, setError] = useState('');
  // 4-step split: the old editor stacked every field on one long
  // scroll (title/date/type/repeat/category/relationship/contact/
  // notes/colour/icon/sticker/font/effect/photo). Now Step 1 Basics,
  // Step 2 Who & what, Step 3 Look, Step 4 Review & save. All draft
  // state lives in this component, so Back/Next never loses a field.
  const [step, setStep] = useState(1);
  const stepTitles = ['Basics', 'Who & what', 'Look', 'Review & save'];
  const nextStep = () => {
    if (step === 1) {
      if (!title.trim()) { setError('Give the event a title.'); return; }
      if (!isValidDateISO(dateISO)) { setError('Date must be a real date as YYYY-MM-DD, e.g. 2026-12-25.'); return; }
    }
    setError('');
    setStep(step + 1);
  };
  const backStep = () => { setError(''); if (step > 1) setStep(step - 1); else onCancel(); };
  // Inline contact import: kept inside the editor so opening it never
  // discards a half-filled form (a separate import screen would unmount
  // the editor and lose the draft).
  const [showImport, setShowImport] = useState(false);
  const [importState, setImportState] = useState<'idle' | 'loading' | 'denied' | 'unavailable' | 'ready'>('idle');
  const [importContacts, setImportContacts] = useState<ImportedContact[]>([]);
  const [importError, setImportError] = useState('');

  const openImport = async () => {
    if (showImport) { setShowImport(false); return; }
    setShowImport(true);
    setImportState('loading');
    const r = await loadContactsWithBirthday();
    setImportContacts(r.contacts);
    setImportError(r.error ?? '');
    setImportState(r.permission === 'granted' ? 'ready' : r.permission);
  };

  const pickContact = (c: ImportedContact) => {
    const apply = () => {
      setTitle(c.name);
      if (c.birthdayISO) setDateISO(c.birthdayISO);
      setCategory('Birthday');
      setRepeat('yearly');
      setContactName(c.name);
      setContactPhone(c.phone);
      setContactEmail(c.email);
      setContactPhotoUri(c.imageUri);
      setShowImport(false);
    };
    const dup = c.birthdayMonth && c.birthdayDay && eventsForDedupe
      ? findDuplicateEvent(eventsForDedupe, c.name, c.birthdayMonth, c.birthdayDay) : null;
    if (dup) {
      Alert.alert('Possible duplicate', `You already have "${dup.title}" on the same month/day. Import anyway?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import anyway', onPress: apply },
      ]);
    } else {
      Alert.alert('Import this contact?', `${c.name}${c.birthdayISO ? ` — birthday ${c.birthdayISO}` : ''}${c.birthdayYearKnown ? '' : ' (year not on file — check the date)'}.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: apply },
      ]);
    }
  };

  const save = () => {
    if (!title.trim()) { setError('Give the event a title.'); return; }
    if (!isValidDateISO(dateISO)) { setError('Date must be a real date as YYYY-MM-DD, e.g. 2026-12-25.'); return; }
    setError('');
    onSave({
      id: initial?.id ?? newId(),
      title: title.trim(),
      dateISO: dateISO.trim(),
      type, repeat, category, color, icon, sticker, font, effect, photoUri,
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
      relationship, contactName, contactPhone, contactEmail, contactPhotoUri, notes: notes.trim(),
    });
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.kicker}>{initial ? 'EDIT EVENT' : 'NEW EVENT'} · STEP {step} OF 4</Text>
      <Text style={styles.heading}>{stepTitles[step - 1]}</Text>
      {step === 1 ? (
        <Text style={styles.hint}>
          {type === 'countdown'
            ? 'Countdown: the date you are counting down to.'
            : 'Day counting: the start date. Day 1 is the start date itself.'}
        </Text>
      ) : null}

      {step === 1 ? (<>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Trip to the Mountains" placeholderTextColor={colors.onSurfaceVariant} />

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={dateISO} onChangeText={setDateISO} placeholder="2026-12-25" placeholderTextColor={colors.onSurfaceVariant} autoCapitalize="none" />

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {(['countdown', 'countup'] as const).map((t) => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipOn]}>
              <Text style={[styles.chipText, type === t && styles.chipTextOn]}>{t === 'countdown' ? 'Countdown' : 'Day counting'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Repeat</Text>
        <View style={styles.row}>
          {(['none', 'monthly', 'yearly'] as const).map((r) => (
            <Pressable key={r} onPress={() => setRepeat(r)} style={[styles.chip, repeat === r && styles.chipOn]}>
              <Text style={[styles.chipText, repeat === r && styles.chipTextOn]}>{r === 'none' ? 'Once' : r === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
            </Pressable>
          ))}
        </View>
        {repeat === 'yearly' ? <Text style={styles.hint}>Feb 29 repeats on Feb 28 in non-leap years.</Text> : null}
        {repeat === 'monthly' ? <Text style={styles.hint}>Day 31 repeats on the last day of shorter months.</Text> : null}
      </>) : null}

      {step === 2 ? (<>
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Relationship</Text>
        <View style={styles.row}>
          {RELATIONSHIPS.map((r) => (
            <Pressable key={r} onPress={() => setRelationship(r)} style={[styles.chip, relationship === r && styles.chipOn]}>
              <Text style={[styles.chipText, relationship === r && styles.chipTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Linked contact (optional)</Text>
        {contactName ? (
          <Text style={styles.hint}>
            {contactName}
            {contactPhone ? ` · ${contactPhone}` : ''}
            {contactEmail ? ` · ${contactEmail}` : ''}
            {'\n'}Quick actions (call / WhatsApp / email) in Detail use this contact, only when a phone or email is present.
          </Text>
        ) : (
          <Text style={styles.hint}>Link a contact to enable call / WhatsApp / email shortcuts in Detail. Import copies one contact locally — nothing is uploaded.</Text>
        )}
        <View style={styles.row}>
          <Pressable style={styles.secondaryBtn} onPress={openImport}>
            <Text style={styles.secondaryBtnText}>{showImport ? 'Hide contacts' : 'Import from contacts'}</Text>
          </Pressable>
          {contactName ? (
            <Pressable style={styles.secondaryBtn} onPress={() => { setContactName(null); setContactPhone(null); setContactEmail(null); setContactPhotoUri(null); }}>
              <Text style={styles.secondaryBtnText}>Unlink contact</Text>
            </Pressable>
          ) : null}
        </View>
        {showImport ? (
          <View>
            {importState === 'loading' ? <Text style={styles.hint}>Reading contacts…</Text> : null}
            {importState === 'denied' ? (
              <>
                <Text style={styles.hint}>Contact permission was denied, so no contacts can be listed.</Text>
                <Pressable style={styles.secondaryBtn} onPress={() => Linking.openSettings()}>
                  <Text style={styles.secondaryBtnText}>Open system settings</Text>
                </Pressable>
              </>
            ) : null}
            {importState === 'unavailable' ? <Text style={styles.hint}>Contacts could not be read on this device. {importError}</Text> : null}
            {importState === 'ready' && importContacts.length === 0 ? (
              <Text style={styles.hint}>No contacts with a birthday on file were found.</Text>
            ) : null}
            {importContacts.map((c) => (
              <Pressable key={`${c.name}-${c.birthdayISO}`} style={styles.secondaryBtn} onPress={() => pickContact(c)}>
                <Text style={styles.secondaryBtnText}>{c.name} — {c.birthdayISO}{c.birthdayYearKnown ? '' : ' (year not on file)'}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="e.g. Likes dark chocolate, size M" placeholderTextColor={colors.onSurfaceVariant} multiline />
      </>) : null}

      {step === 3 ? (<>
        <Text style={styles.label}>Live preview — this is how the card looks</Text>
        <View style={[styles.previewCard, effectBorder(effect, color)]}>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.previewPhoto} /> : null}
          <View style={styles.row}>
            <Ionicons name={safeIcon(icon) as never} size={22} color={color} />
            {sticker ? <Text style={styles.stickerText}>{sticker}</Text> : null}
          </View>
          <Text style={[styles.previewBig, { fontFamily: FONT_OPTIONS.find((f) => f.key === font)?.family ?? fonts.grotesk }]}>
            {isValidDateISO(dateISO) ? countdownInfo(dateISO, type, repeat, todayISO()).label : '—'}
          </Text>
          <Text style={styles.previewTitle}>{title.trim() || 'Your event'}</Text>
          <Text style={styles.previewMeta}>{dateISO || 'Pick a date in Step 1'}</Text>
        </View>
        <Text style={styles.hint}>Change anything below and the preview above updates instantly — what you see here is what the Home card, widget and share card use.</Text>

        <Text style={styles.label}>Colour</Text>
        <View style={styles.row}>
          {EVENT_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]} />
          ))}
        </View>

        <Text style={styles.label}>Icon</Text>
        <View style={styles.row}>
          {EVENT_ICONS.map((n) => (
            <Pressable key={n} onPress={() => setIcon(n)} style={[styles.iconBtn, icon === n && styles.iconBtnOn]}>
              <Ionicons name={n as never} size={22} color={icon === n ? colors.background : colors.onSurface} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Sticker (optional)</Text>
        <View style={styles.row}>
          {EVENT_STICKERS.map((s) => (
            <Pressable key={s || 'none'} onPress={() => setSticker(s)} style={[styles.stickerBtn, sticker === s && styles.iconBtnOn]}>
              <Text style={styles.stickerText}>{s === '' ? '–' : s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Font for the big number</Text>
        <View style={styles.row}>
          {FONT_OPTIONS.map((f) => (
            <Pressable key={f.key} onPress={() => setFont(f.key)} style={[styles.chip, font === f.key && styles.chipOn]}>
              <Text style={[styles.chipText, { fontFamily: f.family }, font === f.key && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Visual effect (styling only, no animation)</Text>
        <View style={styles.row}>
          {EFFECT_OPTIONS.map((e) => (
            <Pressable key={e.key} onPress={() => setEffect(e.key)} style={[styles.chip, effect === e.key && styles.chipOn]}>
              <Text style={[styles.chipText, effect === e.key && styles.chipTextOn]}>{e.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Background photo (optional, from your device)</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : null}
        <View style={styles.row}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={async () => {
              const uri = await pickSinglePhoto();
              if (uri) setPhotoUri(uri);
            }}
          >
            <Text style={styles.secondaryBtnText}>{photoUri ? 'Change photo' : 'Pick a photo'}</Text>
          </Pressable>
          {photoUri ? (
            <Pressable style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
              <Text style={styles.secondaryBtnText}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.hint}>Photos stay on this device only. A picked photo may not survive an uninstall or reinstall.</Text>
      </>) : null}

      {step === 4 ? (<>
        <Text style={styles.hint}>Check everything, then save. Tap Back to change any step — nothing is lost.</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewBig}>{title.trim() || '(no title yet)'}</Text>
          <Text style={styles.reviewLine}>{dateISO} · {type === 'countdown' ? 'Countdown' : 'Day counting'} · {repeat === 'none' ? 'Once' : repeat}</Text>
          <Text style={styles.reviewLine}>{category} · {relationship}</Text>
          {contactName ? <Text style={styles.reviewLine}>Contact: {contactName}</Text> : null}
          {notes.trim() ? <Text style={styles.reviewLine}>Notes: {notes.trim()}</Text> : null}
          <View style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
            <Ionicons name={icon as never} size={22} color={color} />
            {sticker ? <Text style={styles.stickerText}>{sticker}</Text> : null}
            <Text style={styles.reviewLine}>{FONT_OPTIONS.find((f) => f.key === font)?.label} · {EFFECT_OPTIONS.find((e) => e.key === effect)?.label}</Text>
          </View>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <Text style={styles.reviewLine}>No background photo</Text>}
        </View>
      </>) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {step < 4 ? (
        <Pressable style={styles.primaryBtn} onPress={nextStep}>
          <Text style={styles.primaryBtnText}>Continue →</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.primaryBtn} onPress={save}>
          <Text style={styles.primaryBtnText}>Save event</Text>
        </Pressable>
      )}
      <Pressable style={styles.secondaryBtnFull} onPress={backStep}>
        <Text style={styles.secondaryBtnText}>{step > 1 ? '‹ Back' : 'Cancel'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  kicker: { fontFamily: fonts.jakartaBold, fontSize: 11, color: colors.primary, letterSpacing: 1.2 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface, marginTop: 4 },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  reviewBig: { fontFamily: fonts.grotesk, fontSize: 22, color: colors.onSurface },
  reviewLine: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 6, lineHeight: 20 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  label: { fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurface, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 20 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 16, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 14 },
  chipTextOn: { color: colors.background, fontFamily: fonts.jakartaBold },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.onSurface },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  stickerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stickerText: { fontSize: 20, color: colors.onSurface },
  photo: { width: '100%', height: 180, borderRadius: 16, marginTop: 8 },
  previewCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginTop: 8 },
  previewPhoto: { width: '100%', height: 120, borderRadius: 12, marginBottom: 12 },
  previewBig: { fontSize: 36, color: colors.onSurface, marginTop: 8 },
  previewTitle: { fontFamily: fonts.jakartaBold, fontSize: 16, color: colors.onSurface, marginTop: 4 },
  previewMeta: { fontFamily: fonts.jakartaMedium, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 16 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 },
  secondaryBtnFull: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  secondaryBtnText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
  error: { color: colors.error, fontFamily: fonts.jakartaMedium, fontSize: 14, marginTop: 16 },
});
