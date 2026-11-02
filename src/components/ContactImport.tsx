import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { loadContactsWithBirthday, type ImportedContact } from '../lib/contacts';
import { findDuplicateEvent, type CountdownEvent } from '../lib/events';

// Per-contact import with confirmation only. Never bulk-creates events:
// the user taps one contact, sees the duplicate warning if one applies,
// confirms, and only then does the editor open prefilled. Nothing is
// uploaded; the picked details are copied into a local event only.
export default function ContactImport({
  events, onBack, onPick,
}: {
  events: CountdownEvent[];
  onBack: () => void;
  onPick: (c: ImportedContact) => void;
}) {
  const [state, setState] = useState<'loading' | 'denied' | 'unavailable' | 'ready'>('loading');
  const [contacts, setContacts] = useState<ImportedContact[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContactsWithBirthday().then((r) => {
      setContacts(r.contacts);
      setError(r.error ?? '');
      setState(r.permission === 'granted' ? 'ready' : r.permission);
    });
  }, []);

  const pick = (c: ImportedContact) => {
    const dup = c.birthdayMonth && c.birthdayDay ? findDuplicateEvent(events, c.name, c.birthdayMonth, c.birthdayDay) : null;
    const proceed = () => onPick(c);
    if (dup) {
      Alert.alert(
        'Possible duplicate',
        `You already have "${dup.title}" on the same month/day. Importing this contact would create a second event for the same person/date.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Import anyway', onPress: proceed },
        ],
      );
    } else {
      Alert.alert(
        'Import this contact?',
        `${c.name}${c.birthdayISO ? ` — birthday ${c.birthdayISO}` : ''}${c.birthdayYearKnown ? '' : ' (year not on file — check the date in the editor)'}. This creates one local event; nothing is uploaded.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Import', onPress: proceed },
        ],
      );
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Pressable onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.heading}>Import from contacts</Text>
      <Text style={styles.hint}>
        Only contacts with a birthday on file are listed. Tap one, confirm,
        and the editor opens prefilled. Nothing is uploaded, and contacts
        are never imported in bulk. No Facebook or online contacts import
        exists in this app.
      </Text>
      {state === 'loading' ? <Text style={styles.hint}>Reading contacts…</Text> : null}
      {state === 'denied' ? (
        <View>
          <Text style={styles.body}>Contact permission was denied, so no contacts can be listed.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.primaryBtnText}>Open system settings</Text>
          </Pressable>
        </View>
      ) : null}
      {state === 'unavailable' ? (
        <Text style={styles.body}>Contacts could not be read on this device. {error}</Text>
      ) : null}
      {state === 'ready' && contacts.length === 0 ? (
        <Text style={styles.body}>No contacts with a birthday on file were found. Add a birthday to a contact, then come back here.</Text>
      ) : null}
      {contacts.map((c) => (
        <Pressable key={`${c.name}-${c.birthdayISO}`} style={styles.card} onPress={() => pick(c)}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.meta}>
            Birthday {c.birthdayISO}
            {c.birthdayYearKnown ? '' : ' · year not on file — check it'}
            {c.phone ? ` · ${c.phone}` : ''}
            {c.email ? ` · ${c.email}` : ''}
          </Text>
          <Text style={styles.tap}>Tap to import →</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  back: { color: colors.primary, fontFamily: fonts.jakartaBold, fontSize: 15, marginBottom: 12 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface, marginTop: 12, lineHeight: 21 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  name: { fontFamily: fonts.jakartaBold, fontSize: 16, color: colors.onSurface },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 },
  tap: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.primary, marginTop: 8 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
});
