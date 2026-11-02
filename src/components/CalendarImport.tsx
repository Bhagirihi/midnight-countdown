import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { loadDeviceCalendarEvents, type ImportedCalendarEvent } from '../lib/calendarImport';

// Device calendars only — not Google Calendar sync, not Facebook.
// Per-event confirmation, same dedupe warning as contacts.
export default function CalendarImport({
  onBack, onPick,
}: {
  onBack: () => void;
  onPick: (e: ImportedCalendarEvent) => void;
}) {
  const [state, setState] = useState<'loading' | 'denied' | 'unavailable' | 'ready'>('loading');
  const [events, setEvents] = useState<ImportedCalendarEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeviceCalendarEvents().then((r) => {
      setEvents(r.events);
      setError(r.error ?? '');
      setState(r.permission === 'granted' ? 'ready' : r.permission);
    });
  }, []);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Pressable onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.heading}>Import from device calendar</Text>
      <Text style={styles.hint}>
        Events from the next 12 months on this device's calendars. Tap one
        to confirm it as a local countdown. This is not Google Calendar
        sync — nothing is uploaded and no online calendar is read.
      </Text>
      {state === 'loading' ? <Text style={styles.hint}>Reading device calendars…</Text> : null}
      {state === 'denied' ? (
        <View>
          <Text style={styles.body}>Calendar permission was denied, so no calendar events can be listed.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.primaryBtnText}>Open system settings</Text>
          </Pressable>
        </View>
      ) : null}
      {state === 'unavailable' ? (
        <Text style={styles.body}>Device calendars could not be read on this device. {error}</Text>
      ) : null}
      {state === 'ready' && events.length === 0 ? (
        <Text style={styles.body}>No calendar events in the next 12 months were found.</Text>
      ) : null}
      {events.map((e) => (
        <Pressable
          key={`${e.title}-${e.dateISO}`}
          style={styles.card}
          onPress={() => Alert.alert('Import this calendar event?', `${e.title} — ${e.dateISO}. This creates one local countdown; nothing is uploaded.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Import', onPress: () => onPick(e) },
          ])}
        >
          <Text style={styles.name}>{e.title}</Text>
          <Text style={styles.meta}>{e.dateISO}</Text>
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
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  tap: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.primary, marginTop: 8 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 15 },
});
