// Widgets — now reached from Profile > Discover (the old bottom tab
// was removed to de-congest navigation). Nothing here pins anything
// in Expo Go: expo-widgets is not available there, and stock Android
// has not supported third-party lock-screen widgets since Android 5.
// What this screen DOES do: lets the user pick one of four real
// Android home-screen widget variants (definitions in src/widgets/,
// config in app.json), pin an event, and preview the snapshot those
// widgets read after a dev build (prebuild + rebuild).
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import type { CountdownEvent, Settings, WidgetSnapshot } from '../lib/events';
import { WIDGET_VARIANTS, type WidgetVariant } from '../lib/widgets';

export default function WidgetsTab({
  events, settings, snapshot, onPin, onVariant, onBack,
}: {
  events: CountdownEvent[];
  settings: Settings;
  snapshot: WidgetSnapshot | null;
  onPin: (id: string | null) => void;
  onVariant: (v: WidgetVariant) => void;
  onBack?: () => void;
}) {
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {onBack ? (
        <Pressable onPress={onBack}><Text style={styles.back}>← Back to Profile</Text></Pressable>
      ) : null}
      <Text style={styles.heading}>Widgets</Text>
      <Text style={styles.banner}>
        NOT A WORKING WIDGET IN EXPO GO. These Android home-screen
        widgets need a dev build (expo prebuild + rebuild) — in Expo Go
        nothing here pins to any screen. After a dev build, long-press
        your home screen → Widgets → Midnight Countdown to add one.
      </Text>
      <Text style={styles.banner2}>
        ANDROID LOCK SCREEN: stock Android has not supported
        third-party lock-screen widgets since Android 5. There is no
        Android lock-screen widget to offer here — lock-screen widgets
        are an iOS WidgetKit concept, not a stock-Android one.
      </Text>

      <Text style={styles.sub}>Choose a widget size</Text>
      {WIDGET_VARIANTS.map((v) => (
        <Pressable key={v.id} onPress={() => onVariant(v.id)} style={[styles.row, settings.widgetVariant === v.id && styles.rowOn]}>
          <Text style={styles.rowText}>{settings.widgetVariant === v.id ? '✓ ' : ''}{v.title}</Text>
          <Text style={styles.hint}>{v.shows}</Text>
          <Text style={styles.hint}>{v.androidHowTo}</Text>
        </Pressable>
      ))}

      <Text style={styles.sub}>Pin an event for the widget</Text>
      {events.length === 0 ? (
        <Text style={styles.hint}>Add an event first, then come back to pin it.</Text>
      ) : (
        events.map((e) => (
          <Pressable key={e.id} onPress={() => onPin(e.id)} style={[styles.row, settings.pinnedEventId === e.id && styles.rowOn]}>
            <Text style={styles.rowText}>{settings.pinnedEventId === e.id ? '📌 ' : ''}{e.title}</Text>
          </Pressable>
        ))
      )}
      {settings.pinnedEventId ? (
        <Pressable onPress={() => onPin(null)}><Text style={styles.clear}>Clear pinned event</Text></Pressable>
      ) : null}

      <Text style={styles.sub}>Widget snapshot (what the dev-build widget would read)</Text>
      {snapshot ? (
        <View style={styles.card}>
          <Text style={styles.body}>Updated: {snapshot.updatedAt}</Text>
          <Text style={styles.body}>Pinned: {snapshot.pinned ? `${snapshot.pinned.title} — ${snapshot.pinned.label}` : 'none'}</Text>
          {snapshot.pinned?.milestoneLabel ? <Text style={styles.body}>Next milestone: {snapshot.pinned.milestoneLabel}</Text> : null}
          {snapshot.pinned?.storyDateISO ? <Text style={styles.body}>Next story date: {snapshot.pinned.storyDateISO}</Text> : null}
          {snapshot.upcoming.map((u) => (
            <Text key={u.id} style={styles.body}>• {u.title} — {u.label} ({u.dateISO})</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>No snapshot yet — it is written when the home list loads.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  back: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.primary, marginBottom: 8 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  banner: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.background, backgroundColor: colors.accent, borderRadius: 12, padding: 12, marginTop: 12, lineHeight: 18 },
  banner2: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurface, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginTop: 10, lineHeight: 18 },
  sub: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface, marginTop: 22 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 21 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  row: { backgroundColor: colors.surface, borderRadius: 12, padding: 13, marginTop: 8, borderWidth: 1, borderColor: colors.border },
  rowOn: { borderColor: colors.primary },
  rowText: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurface },
  clear: { color: colors.primary, fontFamily: fonts.jakartaBold, fontSize: 14, marginTop: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginTop: 10 },
});
