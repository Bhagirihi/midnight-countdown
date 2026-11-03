// Shareable countdown card — an image of this event that the user
// can send via WhatsApp or any other messaging app from their device.
//
// How it works: the card is a plain View (so its preview renders
// everywhere, including Expo Go). At share time, react-native-view-shot
// is lazily imported and captures that View to a PNG file, and
// expo-sharing opens the device's native share sheet — WhatsApp,
// Telegram, Messages, email, anything installed — with the image
// attached. The user picks the app and the recipient; nothing is
// sent automatically and no contact is contacted by the app itself.
//
// Both native modules stay lazily imported: a top-level import would
// crash Expo Go, which does not carry them. In Expo Go (or any build
// where capture is unavailable) sharing falls back to the same
// plain-text summary, and the button says so — the feature never
// silently does nothing.
// A successful image share is a "right moment" for the rating prompt
// (see src/lib/review.ts), same as copying a greeting.
import { useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../lib/theme';
import { safeIcon, type CountdownEvent } from '../lib/events';
import { maybeAskForReview } from '../lib/review';

export default function ShareCard({
  event, label, targetISO, eventCount,
}: {
  event: CountdownEvent;
  label: string; // e.g. "D-42" or "Day 12"
  targetISO: string;
  eventCount: number;
}) {
  // any: react-native-view-shot's captureRef wants a native view ref, and
  // the RN 19 View component type does not satisfy it directly.
  const cardRef = useRef<any>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const shareText = `${label} — ${event.title} (${targetISO}) · A Day Away`;

  const shareCard = async () => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      // Capture the card View to a PNG. Lazy import: Expo Go has no
      // view-shot, so this throws there and we fall back to text.
      const { captureRef } = await import('react-native-view-shot');
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.9 });
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share countdown card' });
      } else {
        await Share.share({ url: uri, message: shareText });
      }
      setNote('Card shared — pick WhatsApp or any app from the share sheet.');
      await maybeAskForReview(eventCount);
    } catch {
      // No capture available (Expo Go, or a build without the native
      // module): share the same information as text instead of failing.
      try {
        await Share.share({ message: shareText });
        setNote('Card image needs a dev build — shared as text instead.');
      } catch {
        setNote('Sharing is not available on this device.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Share card</Text>
      <Text style={styles.hint}>Tap Share card, then pick WhatsApp or any app.</Text>
      <View ref={cardRef} collapsable={false} style={[styles.card, { borderColor: event.color }]}>
        <View style={styles.cardTop}>
          <Ionicons name={safeIcon(event.icon) as never} size={28} color={event.color} />
          {event.sticker ? <Text style={styles.sticker}>{event.sticker}</Text> : null}
        </View>
        <Text style={styles.big}>{label}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.date}>{event.type === 'countup' ? `Started ${event.dateISO}` : targetISO}</Text>
        <Text style={styles.footer}>A DAY AWAY · Every day that matters, counted down.</Text>
      </View>
      <Pressable style={styles.btn} onPress={shareCard} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Preparing card…' : 'Share card'}</Text>
      </Pressable>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  sectionTitle: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 16, marginBottom: 8 },
  hint: { color: colors.onSurfaceVariant, fontFamily: fonts.jakartaMedium, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 20,
    padding: 24,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sticker: { fontSize: 24 },
  big: { color: colors.onSurface, fontFamily: fonts.grotesk, fontSize: 56, lineHeight: 60 },
  title: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 22, marginTop: 8 },
  date: { color: colors.onSurfaceVariant, fontFamily: fonts.mono, fontSize: 14, marginTop: 6 },
  footer: { color: colors.onSurfaceVariant, fontFamily: fonts.jakartaBold, fontSize: 11, letterSpacing: 1.2, marginTop: 20 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  btnText: { color: colors.onPrimary, fontFamily: fonts.jakartaBold, fontSize: 15 },
  note: { color: colors.onSurfaceVariant, fontFamily: fonts.jakartaMedium, fontSize: 13, marginTop: 8 },
});
