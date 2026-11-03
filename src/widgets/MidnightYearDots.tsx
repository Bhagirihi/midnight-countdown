// Android home-screen widget: Year dots 2×2 — the dot widget from
// the reference screenshot. Isolated 'widget' runtime — see
// MidnightSmall.tsx for the rules: props only, via updateSnapshot.
// One dot per day of the year: dim dots are days already passed,
// bright dots are the days still left. Underneath, the year and
// "N days left", exactly like the screenshot's "2026 / 92 days left".
// Props are computed by the app (src/lib/widgets.ts yearProgress)
// at snapshot-push time — the widget does not re-compute on its own
// at midnight, it refreshes when the app is opened or an event is
// pinned/saved.
import { Box, Column, FlowRow, Text } from '@expo/ui/jetpack-compose';
import { background, clip, padding, paddingAll, Shapes, size } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type Props = { year: number; totalDays: number; elapsed: number; daysLeft: number; percent: number };

const MidnightYearDots = (props: Props) => {
  'widget';
  const dots = [];
  for (let i = 0; i < props.totalDays; i++) {
    const passed = i < props.elapsed;
    dots.push(
      <Box key={i} modifiers={[paddingAll(2)]}>
        <Box modifiers={[size(5, 5), clip(Shapes.Circle), background(passed ? '#3F3F46' : '#FAFAFA')]} />
      </Box>,
    );
  }
  return (
    <Column modifiers={[background('#0F0F11'), paddingAll(12)]}>
      <FlowRow>{dots}</FlowRow>
      <Box modifiers={[padding(0, 8, 0, 0)]}>
        <Column>
          <Text color="#FAFAFA" style={{ fontSize: 14, fontWeight: '700' }}>{props.year}</Text>
          <Text color="#A1A1AA" style={{ fontSize: 13 }}>{props.daysLeft} days left</Text>
        </Column>
      </Box>
    </Column>
  );
};

export default createWidget('MidnightYearDots', MidnightYearDots, { year: 2026, totalDays: 365, elapsed: 0, daysLeft: 365, percent: 0 });
