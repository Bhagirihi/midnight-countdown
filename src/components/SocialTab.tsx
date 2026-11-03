import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { RECOMMENDED_EVENTS, type LocalComment } from '../lib/events';

export default function SocialTab({
  comments, onJoin, onAddComment, onBack,
}: {
  comments: LocalComment[];
  onJoin: (recId: string) => void;
  onAddComment: (recId: string, text: string) => void;
  onBack?: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {onBack ? (
        <Pressable onPress={onBack}><Text style={styles.back}>← Back to Profile</Text></Pressable>
      ) : null}
      <Text style={styles.heading}>Recommended Events</Text>
      <Text style={styles.banner}>
        Local demo — seeded examples only, no real users. Comments stay on
        this device.
      </Text>
      {RECOMMENDED_EVENTS.map((rec) => {
        const recComments = comments.filter((c) => c.recommendedId === rec.id);
        return (
          <View key={rec.id} style={styles.card}>
            <Text style={styles.title}>{rec.title}</Text>
            <Text style={styles.meta}>{rec.category} · Example</Text>
            <Text style={styles.body}>{rec.description}</Text>
            <Pressable style={styles.joinBtn} onPress={() => onJoin(rec.id)}>
              <Text style={styles.joinText}>Join — add as my own event</Text>
            </Pressable>
            <Text style={styles.sub}>Comments (local only)</Text>
            {recComments.length === 0 ? (
              <Text style={styles.hint}>No local comments yet. Be the first — on this device only.</Text>
            ) : (
              recComments.map((c) => (
                <Text key={c.id} style={styles.comment}>You (local) · {c.createdAt}: {c.text}</Text>
              ))
            )}
            <TextInput
              style={styles.input}
              value={drafts[rec.id] ?? ''}
              onChangeText={(t) => setDrafts((d) => ({ ...d, [rec.id]: t }))}
              placeholder="Write a local comment…"
              placeholderTextColor={colors.onSurfaceVariant}
            />
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                const t = (drafts[rec.id] ?? '').trim();
                if (!t) return;
                onAddComment(rec.id, t);
                setDrafts((d) => ({ ...d, [rec.id]: '' }));
              }}
            >
              <Text style={styles.secondaryText}>Post locally</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  back: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.primary, marginBottom: 8 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  banner: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.background, backgroundColor: colors.accent, borderRadius: 12, padding: 12, marginTop: 12, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginTop: 16 },
  title: { fontFamily: fonts.jakartaBold, fontSize: 18, color: colors.onSurface },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 20 },
  joinBtn: { backgroundColor: colors.secondary, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 12 },
  joinText: { color: colors.background, fontFamily: fonts.jakartaBold, fontSize: 14 },
  sub: { fontFamily: fonts.jakartaBold, fontSize: 13, color: colors.onSurface, marginTop: 16 },
  hint: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  comment: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 6, lineHeight: 20 },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 11, color: colors.onSurface, fontFamily: fonts.jakartaMedium, fontSize: 14, marginTop: 10 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 11, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: colors.onSurface, fontFamily: fonts.jakartaBold, fontSize: 14 },
});
