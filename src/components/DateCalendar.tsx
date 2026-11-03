import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';
import { daysInMonth } from '../lib/dates';

export default function DateCalendar({
  year, month, selectedISO, today, onPrev, onNext, onPick,
}: {
  year: number;
  month: number;
  selectedISO: string;
  today: string;
  onPrev: () => void;
  onNext: () => void;
  onPick: (iso: string) => void;
}) {
  const title = `${new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' })} ${year}`;
  const blanks = new Date(year, month - 1, 1).getDay();
  const days = daysInMonth(year, month);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={onPrev} hitSlop={10}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onNext} hitSlop={10}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <Text key={d} style={styles.weekday}>{d}</Text>
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const selected = selectedISO === iso;
          const isToday = today === iso;
          return (
            <Pressable
              key={day}
              style={[styles.cell, selected && styles.cellOn, isToday && !selected && styles.cellToday]}
              onPress={() => onPick(iso)}
            >
              <Text style={[styles.day, selected && styles.dayOn]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nav: { fontFamily: fonts.jakartaBold, fontSize: 24, color: colors.onSurface, paddingHorizontal: 8 },
  title: { fontFamily: fonts.jakartaBold, fontSize: 15, color: colors.onSurface },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.28%', textAlign: 'center', fontFamily: fonts.jakartaBold, fontSize: 12, color: colors.onSurfaceVariant, paddingVertical: 4 },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellOn: { backgroundColor: colors.primary },
  cellToday: { borderWidth: 1, borderColor: colors.primary },
  day: { fontFamily: fonts.jakartaMedium, fontSize: 14, color: colors.onSurface },
  dayOn: { fontFamily: fonts.jakartaBold, color: colors.background },
});
