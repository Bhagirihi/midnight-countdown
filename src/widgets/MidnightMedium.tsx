// Android home-screen widget: Medium 2x1. Isolated 'widget' runtime —
// see MidnightSmall.tsx for the rules. Props only, via updateSnapshot.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type Props = { title: string; label: string; dateISO: string };

const MidnightMedium = (props: Props) => {
  'widget';
  return (
    <Column modifiers={[background('#0F0F11'), paddingAll(12)]}>
      <Text color="#F7A5A5" style={{ fontSize: 28, fontWeight: '700' }}>{props.label}</Text>
      <Text color="#FAFAFA" style={{ fontSize: 15, fontWeight: '700' }}>{props.title}</Text>
      <Text color="#A1A1AA" style={{ fontSize: 12 }}>{props.dateISO}</Text>
    </Column>
  );
};

export default createWidget('MidnightMedium', MidnightMedium, { title: 'No event yet', label: 'Add an event', dateISO: '' });
