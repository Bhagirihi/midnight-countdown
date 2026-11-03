import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { RECOMMENDED_EVENTS } from '../lib/events';

export default function SocialTab({
  onUse, onBack,
}: {
  onUse: (recId: string) => void;
  onBack?: () => void;
}) {
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {onBack ? (
        <Pressable onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable>
      ) : null}
      <Text style={styles.heading}>Templates</Text>
      <Text style={styles.bodyIntro}>Start from an example, then set your own date.</Text>
      {RECOMMENDED_EVENTS.map((rec) => (
        <View key={rec.id} style={styles.card}>
          <Text style={styles.title}>{rec.title}</Text>
          <Text style={styles.meta}>{rec.category}</Text>
          <Text style={styles.body}>{rec.description}</Text>
          <Pressable style={styles.joinBtn} onPress={() => onUse(rec.id)}>
            <Text style={styles.joinText}>Use this</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  back: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.primary, marginBottom: 8 },
  heading: { fontFamily: fonts.grotesk, fontSize: 28, color: colors.onSurface },
  bodyIntro: { fontFamily: fonts.jakartaMedium, fontSize: 15, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 21 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginTop: 16 },
  title: { fontFamily: fonts.jakartaBold, fontSize: 18, color: colors.onSurface },
  meta: { fontFamily: fonts.jakartaMedium, fontSize: 13, color: colors.secondary, marginTop: 4 },
  body: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface, marginTop: 8, lineHeight: 20 },
  joinBtn: { backgroundColor: colors.secondary, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 12 },
  joinText: { color: colors.onSecondary, fontFamily: fonts.jakartaBold, fontSize: 14 },
});
