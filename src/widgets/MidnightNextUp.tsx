// Android home-screen widget: Next-up list 4x2 (next 3 events).
// Isolated 'widget' runtime — see MidnightSmall.tsx for the rules.
// Props only, via updateSnapshot. Lists render from props.items;
// a widget cannot map over app state, so the app flattens the list
// into props before pushing it.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type Item = { title: string; label: string; dateISO: string };
type Props = { items: Item[] };

const MidnightNextUp = (props: Props) => {
  'widget';
  const first = props.items[0];
  const second = props.items[1];
  const third = props.items[2];
  return (
    <Column modifiers={[background('#0F0F11'), paddingAll(14)]}>
      <Text color="#FCE570" style={{ fontSize: 12, fontWeight: '700' }}>NEXT UP</Text>
      {first ? <Text color="#FAFAFA" style={{ fontSize: 14, fontWeight: '700' }}>{first.label} — {first.title}</Text> : null}
      {second ? <Text color="#FAFAFA" style={{ fontSize: 14 }}>{second.label} — {second.title}</Text> : null}
      {third ? <Text color="#FAFAFA" style={{ fontSize: 14 }}>{third.label} — {third.title}</Text> : null}
      {!first ? <Text color="#A1A1AA" style={{ fontSize: 13 }}>No events yet — add one in the app.</Text> : null}
    </Column>
  );
};

export default createWidget('MidnightNextUp', MidnightNextUp, { items: [] });
