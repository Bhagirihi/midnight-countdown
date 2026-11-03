// Year-left widget — the lock-screen text from the reference
// screenshot: "92 days left / 75% completed / 2026".
// Isolated 'widget' runtime — see MidnightSmall.tsx for the rules:
// props only, via updateSnapshot (src/lib/widgets.ts yearProgress).
// Platform truth, stated in the app's Widgets screen too:
// - iPhone: this is a real Lock Screen widget — register it with the
//   accessoryRectangular family in app.json and add it from the
//   lock screen (long-press lock screen → Customize → Add Widgets).
// - Stock Android phones: no third-party lock-screen widgets since
//   Android 5, so on Android this same widget is a compact 2×1
//   home-screen widget. Samsung phones can place it on the lock
//   screen via Good Lock → LockStar.
// Like the dot widget, it refreshes when the app pushes a snapshot,
// not on its own at midnight.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type Props = { year: number; totalDays: number; elapsed: number; daysLeft: number; percent: number };

const MidnightYearLock = (props: Props) => {
  'widget';
  return (
    <Column modifiers={[background('#0F0F11'), paddingAll(12)]}>
      <Text color="#FAFAFA" style={{ fontSize: 16, fontWeight: '700' }}>{props.daysLeft} days left</Text>
      <Text color="#A1A1AA" style={{ fontSize: 13 }}>{props.percent}% completed</Text>
      <Text color="#A1A1AA" style={{ fontSize: 13 }}>{props.year}</Text>
    </Column>
  );
};

export default createWidget('MidnightYearLock', MidnightYearLock, { year: 2026, totalDays: 365, elapsed: 0, daysLeft: 365, percent: 0 });
